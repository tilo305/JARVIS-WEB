/**
 * Wake Word Manager - Porcupine Integration
 * Manages Porcupine wake word detection and integrates with audio pipeline.
 * 
 * Compatibility: Fully compatible with Cartesia STT specifications (cArTeSiA dOcS.md):
 * - Uses 16kHz sample rate (matches Cartesia STT requirement)
 * - Uses pcm_s16le encoding (matches Cartesia STT requirement)
 * - Processes in parallel with STT pipeline (non-blocking)
 * 
 * @see wAkE wOrD dOcS.md, cArTeSiA dOcS.md
 */
import { Porcupine } from '@picovoice/porcupine-web';
import { DEBUG } from './debug.js';

export class WakeWordManager {
  constructor(options = {}) {
    this.accessKey = options.accessKey || '';
    this.keywordPaths = options.keywordPaths || [];
    this.sensitivities = options.sensitivities || [0.5];
    this.porcupine = null;
    this.wakeWordNode = null;
    this.audioContext = null;
    this.enabled = false;
    this.onWakeWordDetected = options.onWakeWordDetected || (() => {});
    this.onError = options.onError || (() => {});
    
    // Frame buffering for main-thread processing
    this._frameQueue = [];
    this._processingFrames = false;
    
    // Performance monitoring
    this._metrics = {
      detectionCount: 0,
      falseAlarmCount: 0,
      totalDetectionTime: 0,
      lastDetectionTime: 0,
      firstDetectionTime: null
    };
    
    // Cooldown period to prevent re-triggering (3 seconds default)
    this._cooldownMs = options.cooldownMs || 3000;
    this._lastDetectionTime = 0;
  }

  /**
   * Initialize Porcupine and AudioWorklet processor
   * Includes retry logic for transient failures (per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md)
   */
  async initialize(audioContext, mediaStream, audioWorkletBasePath, retryOptions = {}) {
    const maxRetries = retryOptions.maxRetries ?? 0; // Default: no retries
    const retryDelay = retryOptions.retryDelay ?? 1000; // Default: 1 second
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          DEBUG.trace(`WakeWordManager: Retry attempt ${attempt}/${maxRetries}`, {
            delay: retryDelay * attempt
          });
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
        
        return await this._initializeInternal(audioContext, mediaStream, audioWorkletBasePath);
      } catch (err) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = this._isRetryableError(err);
        
        if (isLastAttempt || !isRetryableError) {
          // Last attempt or non-retryable error - throw to be handled by caller
          throw err;
        }
        
        // Retryable error - log and continue to next attempt
        DEBUG.warn(`WakeWordManager: Initialization attempt ${attempt + 1} failed (retryable)`, {
          error: err.message,
          willRetry: !isLastAttempt,
          nextAttempt: attempt + 1
        });
      }
    }
  }

  /**
   * Check if error is retryable (transient failures)
   * @private
   */
  _isRetryableError(err) {
    const errMsg = err.message || '';
    // Retry on network errors, timeouts, and transient failures
    return errMsg.includes('timeout') ||
           errMsg.includes('network') ||
           errMsg.includes('fetch') ||
           errMsg.includes('ECONNRESET') ||
           errMsg.includes('ETIMEDOUT') ||
           errMsg.includes('temporarily unavailable');
  }

  /**
   * Internal initialization logic (separated for retry support)
   * @private
   */
  async _initializeInternal(audioContext, mediaStream, audioWorkletBasePath) {
    // Validate AccessKey (security best practice from wAkE wOrD dOcS.md Section 11)
    if (!this.accessKey || typeof this.accessKey !== 'string' || this.accessKey.trim().length === 0) {
      DEBUG.trace('WakeWordManager: No access key provided, skipping initialization');
      this.onError('Porcupine AccessKey is required. Get one from https://console.picovoice.ai/');
      return null;
    }
    
    // Security: Don't log full AccessKey, only prefix
    if (this.accessKey.length < 20) {
      DEBUG.error('WakeWordManager: AccessKey appears invalid (too short)', {
        length: this.accessKey.length
      });
      this.onError('Invalid AccessKey format. Please verify your AccessKey from Picovoice Console.');
      return null;
    }

    // Validate keyword paths
    DEBUG.trace('WakeWordManager: Checking keyword paths', {
      keywordPaths: this.keywordPaths,
      keywordPathsType: typeof this.keywordPaths,
      keywordPathsIsArray: Array.isArray(this.keywordPaths),
      keywordPathsLength: this.keywordPaths?.length,
      keywordPathsContents: this.keywordPaths ? this.keywordPaths.map(p => ({ value: String(p), type: typeof p })) : 'N/A'
    });
    
    if (!Array.isArray(this.keywordPaths) || this.keywordPaths.length === 0) {
      DEBUG.error('WakeWordManager: No keyword paths provided, skipping initialization', {
        keywordPaths: this.keywordPaths,
        keywordPathsType: typeof this.keywordPaths,
        keywordPathsIsArray: Array.isArray(this.keywordPaths)
      });
      this.onError('At least one wake word keyword file (.ppn) is required');
      return null;
    }

    // Validate sensitivities match keyword paths (auto-fix if possible per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md)
    if (this.sensitivities.length !== this.keywordPaths.length) {
      DEBUG.warn('WakeWordManager: Sensitivities array length mismatch - auto-fixing', {
        keywordCount: this.keywordPaths.length,
        sensitivityCount: this.sensitivities.length
      });
      
      // Auto-fix: pad or truncate sensitivities to match keyword paths
      if (this.sensitivities.length < this.keywordPaths.length) {
        // Pad with default sensitivity (0.5)
        while (this.sensitivities.length < this.keywordPaths.length) {
          this.sensitivities.push(0.5);
        }
        DEBUG.trace('WakeWordManager: Padded sensitivities array', {
          newLength: this.sensitivities.length
        });
      } else {
        // Truncate to match
        this.sensitivities = this.sensitivities.slice(0, this.keywordPaths.length);
        DEBUG.trace('WakeWordManager: Truncated sensitivities array', {
          newLength: this.sensitivities.length
        });
      }
    }

    // Validate sensitivity values
    for (let i = 0; i < this.sensitivities.length; i++) {
      const sens = this.sensitivities[i];
      if (typeof sens !== 'number' || sens < 0 || sens > 1) {
        DEBUG.error('WakeWordManager: Invalid sensitivity value', { index: i, value: sens });
        this.onError(`Sensitivity at index ${i} must be a number between 0.0 and 1.0`);
        return null;
      }
    }

    this.audioContext = audioContext;

    try {
      // Load Porcupine Web SDK
      DEBUG.trace('WakeWordManager: Initializing Porcupine...', {
        accessKey: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing',
        keywordCount: this.keywordPaths.length,
        sensitivities: this.sensitivities
      });
      
      // Add progress logging for slow initialization (helps debug timeout issues)
      const initStartTime = performance.now();

      // Built-in Porcupine keywords (from error message: Alexa, Americano, Blueberry, Bumblebee, Computer, Grapefruit, Grasshopper, Hey Google, Hey Siri, Jarvis, Okay Google, Picovoice, Porcupine, Terminator)
      const BUILT_IN_KEYWORDS = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 'Okay Google', 'Picovoice', 'Porcupine', 'Terminator'];
      
      // Validate keyword paths - Porcupine Web expects:
      // 1. Built-in keyword names (strings like "Jarvis")
      // 2. Custom keyword file URLs (must be valid .ppn files)
      // 3. Base64-encoded .ppn files
      const validatedPaths = [];
      const validatedSensitivities = [];
      
      DEBUG.trace('WakeWordManager: Starting keyword validation', {
        keywordPaths: this.keywordPaths,
        keywordPathsLength: this.keywordPaths.length,
        sensitivities: this.sensitivities,
        sensitivitiesLength: this.sensitivities.length
      });
      
      for (let i = 0; i < this.keywordPaths.length; i++) {
        const path = this.keywordPaths[i];
        
        DEBUG.trace(`WakeWordManager: Processing keyword ${i + 1}/${this.keywordPaths.length}`, {
          path,
          pathType: typeof path,
          pathLength: path?.length
        });
        
        // Skip empty or invalid paths
        if (!path || typeof path !== 'string' || path.trim().length === 0) {
          DEBUG.warn('WakeWordManager: Skipping empty or invalid keyword path', { index: i, path });
          continue;
        }
        
        const trimmedPath = path.trim();
        let validatedPath = trimmedPath;
        
        // Check if it's a built-in keyword name (case-insensitive)
        // CRITICAL: This check MUST happen BEFORE any async file existence checks
        // CRITICAL: Built-in keywords should NEVER go through file existence checks
        const normalizedPath = trimmedPath.toLowerCase();
        const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalizedPath);
        
        DEBUG.trace('WakeWordManager: Built-in keyword check', {
          original: path,
          trimmed: trimmedPath,
          normalized: normalizedPath,
          builtInMatch: builtInMatch || 'NOT FOUND',
          builtInKeywordsList: BUILT_IN_KEYWORDS.map(k => k.toLowerCase())
        });
        
        if (builtInMatch) {
          DEBUG.trace('WakeWordManager: Using built-in keyword', { 
            original: path, 
            normalized: builtInMatch,
            index: i,
            validatedPathsLength: validatedPaths.length,
            beforePush: validatedPaths.slice() // Copy for debugging
          });
          validatedPaths.push(builtInMatch); // Use the properly capitalized version
          validatedSensitivities.push(this.sensitivities[i] ?? 0.5);
          DEBUG.trace('WakeWordManager: Added built-in keyword to validatedPaths', {
            keyword: builtInMatch,
            validatedPathsLength: validatedPaths.length,
            validatedPaths: validatedPaths.slice(), // Copy for debugging
            validatedSensitivitiesLength: validatedSensitivities.length,
            validatedPathsContents: validatedPaths.map(p => String(p))
          });
          // CRITICAL: Skip file existence check for built-in keywords - they don't need files
          continue;
        } else {
          DEBUG.trace('WakeWordManager: Not a built-in keyword, will check file existence', {
            path: trimmedPath,
            normalized: normalizedPath,
            builtInKeywords: BUILT_IN_KEYWORDS.map(k => k.toLowerCase()),
            willCheckFile: true
          });
        }
        
        // If it's already a full URL, use it as-is
        if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
          validatedPath = trimmedPath;
        } else if (trimmedPath.startsWith('./') || trimmedPath.startsWith('/')) {
          // Remove leading ./ or /
          const cleanPath = trimmedPath.replace(/^\.?\//, '');
          // Convert to absolute URL from current origin
          validatedPath = new URL(cleanPath, window.location.origin).href;
        } else {
          // Assume relative path from root
          validatedPath = new URL(trimmedPath, window.location.origin).href;
        }
        
        // Verify the file exists (for custom keywords)
        // Add timeout to prevent hanging on slow networks (per cArTeSiA dOcS.md timeout best practices)
        let fileExists = false;
        try {
          // Only check local paths (same origin), skip external URLs and built-in keywords
          if (validatedPath.startsWith(window.location.origin)) {
            // Add timeout to HEAD request to prevent hanging (1 second max per file - optimized per WAKE-WORD-TIMEOUT-RESEARCH.md)
            const fetchController = new AbortController();
            const fetchTimeout = setTimeout(() => fetchController.abort(), 1000);
            try {
              const response = await fetch(validatedPath, { 
                method: 'HEAD',
                signal: fetchController.signal
              });
              clearTimeout(fetchTimeout);
              fileExists = response.ok;
              
              if (!fileExists) {
                DEBUG.warn('WakeWordManager: Keyword file not found, attempting fallback to built-in keyword', {
                  path: validatedPath,
                  originalPath: path,
                  status: response.status,
                  statusText: response.statusText
                });
                
                // Try to extract keyword name from path for fallback
                // e.g., "keywords/jarvis_en_wasm_v3_0_0.ppn" -> "jarvis" -> "Jarvis"
                const pathLower = path.toLowerCase();
                const keywordMatch = pathLower.match(/(jarvis|computer|alexa|hey\s+google|hey\s+siri|okay\s+google|picovoice|porcupine|terminator)/);
                if (keywordMatch) {
                  const keywordName = keywordMatch[1].replace(/\s+/g, ' ');
                  // Capitalize properly
                  const builtInKeyword = keywordName.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                  
                  if (BUILT_IN_KEYWORDS.includes(builtInKeyword)) {
                    DEBUG.trace('WakeWordManager: Using built-in keyword as fallback', { 
                      original: path, 
                      fallback: builtInKeyword 
                    });
                    validatedPaths.push(builtInKeyword);
                    validatedSensitivities.push(this.sensitivities[i]);
                    continue;
                  }
                }
                
                // If no fallback found, use "Jarvis" as default fallback
                DEBUG.warn('WakeWordManager: No matching built-in keyword found, using "Jarvis" as fallback', {
                  original: path
                });
                validatedPaths.push('Jarvis');
                validatedSensitivities.push(this.sensitivities[i]);
                continue;
              }
              DEBUG.trace('WakeWordManager: Keyword file verified', { path: validatedPath });
            } catch (fetchTimeoutErr) {
              clearTimeout(fetchTimeout);
              if (fetchTimeoutErr.name === 'AbortError') {
                DEBUG.warn('WakeWordManager: File validation timeout, attempting fallback', {
                  path: validatedPath,
                  originalPath: path
                });
                // Fall through to fallback logic below
                fileExists = false;
              } else {
                throw fetchTimeoutErr;
              }
            }
          } else {
            // External URL - assume it exists (can't verify without CORS)
            fileExists = true;
          }
        } catch (fetchErr) {
          // If HEAD request fails, try fallback
          DEBUG.warn('WakeWordManager: Could not verify keyword file, attempting fallback', {
            path: validatedPath,
            error: fetchErr.message
          });
          
          // Try fallback to built-in keyword
          const pathLower = path.toLowerCase();
          const keywordMatch = pathLower.match(/(jarvis|computer|alexa|hey\s+google|hey\s+siri|okay\s+google|picovoice|porcupine|terminator)/);
          if (keywordMatch) {
            const keywordName = keywordMatch[1].replace(/\s+/g, ' ');
            const builtInKeyword = keywordName.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            if (BUILT_IN_KEYWORDS.includes(builtInKeyword)) {
              DEBUG.trace('WakeWordManager: Using built-in keyword as fallback (fetch failed)', { 
                original: path, 
                fallback: builtInKeyword 
              });
              validatedPaths.push(builtInKeyword);
              validatedSensitivities.push(this.sensitivities[i]);
              continue;
            }
          }
          
          // Default fallback to "Jarvis"
          DEBUG.warn('WakeWordManager: Using "Jarvis" as default fallback', { original: path });
          validatedPaths.push('Jarvis');
          validatedSensitivities.push(this.sensitivities[i]);
          continue;
        }
        
        // File exists or is external URL - use the validated path
        validatedPaths.push(validatedPath);
        validatedSensitivities.push(this.sensitivities[i]);
      }

      DEBUG.trace('WakeWordManager: Validated keyword paths', {
        original: this.keywordPaths,
        validated: validatedPaths,
        validatedLength: validatedPaths.length,
        originalSensitivities: this.sensitivities,
        validatedSensitivities: validatedSensitivities,
        validatedSensitivitiesLength: validatedSensitivities.length
      });
      
      // CRITICAL DEBUG: Log if validatedPaths is empty after validation
      if (validatedPaths.length === 0) {
        DEBUG.error('WakeWordManager: validatedPaths is EMPTY after validation loop!', {
          originalPaths: this.keywordPaths,
          originalPathsLength: this.keywordPaths.length,
          builtInKeywords: BUILT_IN_KEYWORDS,
          firstPath: this.keywordPaths[0],
          firstPathType: typeof this.keywordPaths[0],
          firstPathTrimmed: this.keywordPaths[0]?.trim(),
          firstPathLower: this.keywordPaths[0]?.toLowerCase()
        });
      }
      
      // CRITICAL: Ensure validatedPaths is not empty before proceeding
      // If validation failed but we have original paths, try to use built-in keywords as fallback
      if (!Array.isArray(validatedPaths) || validatedPaths.length === 0) {
        DEBUG.warn('WakeWordManager: No valid keywords after validation, attempting fallback to built-in keywords', {
          original: this.keywordPaths,
          validated: validatedPaths
        });
        
        // Try to extract built-in keywords from original paths as last resort
        for (let i = 0; i < this.keywordPaths.length; i++) {
          const path = String(this.keywordPaths[i] || '').trim().toLowerCase();
          const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === path);
          if (builtInMatch) {
            validatedPaths.push(builtInMatch);
            validatedSensitivities.push(this.sensitivities[i] || 0.5);
            DEBUG.trace('WakeWordManager: Fallback to built-in keyword', { 
              original: this.keywordPaths[i], 
              fallback: builtInMatch 
            });
          }
        }
        
        // If still empty, use 'Jarvis' as default fallback
        if (validatedPaths.length === 0) {
          DEBUG.warn('WakeWordManager: Using "Jarvis" as default fallback keyword');
          validatedPaths.push('Jarvis');
          validatedSensitivities.push(this.sensitivities[0] || 0.5);
        }
      }
      
      // Ensure all validated paths are non-empty strings
      const filteredPaths = validatedPaths.filter(path => path && typeof path === 'string' && path.trim().length > 0);
      if (filteredPaths.length === 0) {
        DEBUG.error('WakeWordManager: All keywords filtered out (empty or invalid)', {
          original: this.keywordPaths,
          validated: validatedPaths
        });
        this.onError('All wake word keywords were invalid or empty. Please check your keyword configuration.');
        return null;
      }
      
      // Update validated paths and sensitivities to match filtered paths
      const filteredSensitivities = [];
      for (let i = 0; i < validatedPaths.length; i++) {
        if (validatedPaths[i] && typeof validatedPaths[i] === 'string' && validatedPaths[i].trim().length > 0) {
          filteredSensitivities.push(validatedSensitivities[i]);
        }
      }
      
      // Update sensitivities to match validated paths
      this.sensitivities = filteredSensitivities;
      
      // CRITICAL: Ensure finalKeywords is a valid, non-empty array
      // Filter out any undefined, null, or empty string values
      let finalKeywords = filteredPaths.filter(k => k != null && typeof k === 'string' && k.trim().length > 0);
      
      DEBUG.trace('WakeWordManager: After filtering', {
        filteredPaths,
        filteredPathsLength: filteredPaths.length,
        finalKeywords,
        finalKeywordsLength: finalKeywords.length,
        finalKeywordsIsArray: Array.isArray(finalKeywords)
      });
      
      // If finalKeywords is still empty after all filtering, use "Jarvis" as absolute fallback
      if (!Array.isArray(finalKeywords) || finalKeywords.length === 0) {
        DEBUG.error('WakeWordManager: finalKeywords is empty after all validation, using "Jarvis" as absolute fallback', {
          original: this.keywordPaths,
          originalLength: this.keywordPaths.length,
          validated: validatedPaths,
          validatedLength: validatedPaths.length,
          filtered: filteredPaths,
          filteredLength: filteredPaths.length,
          finalKeywords,
          finalKeywordsType: typeof finalKeywords,
          finalKeywordsIsArray: Array.isArray(finalKeywords)
        });
        finalKeywords = ['Jarvis'];
        // Ensure we have a matching sensitivity
        if (this.sensitivities.length === 0) {
          this.sensitivities = [0.5];
        } else {
          // Use first sensitivity or default
          this.sensitivities = [this.sensitivities[0] || 0.5];
        }
        DEBUG.trace('WakeWordManager: Applied fallback to "Jarvis"', {
          finalKeywords,
          sensitivities: this.sensitivities
        });
      }

      DEBUG.trace('WakeWordManager: Creating Porcupine instance', {
        accessKeyPrefix: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing',
        keywordCount: finalKeywords.length,
        keywords: finalKeywords,
        sensitivities: this.sensitivities
      });

      // Ensure sensitivities array matches validated paths length
      if (this.sensitivities.length !== finalKeywords.length) {
        DEBUG.error('WakeWordManager: Sensitivities length mismatch after validation', {
          pathsLength: finalKeywords.length,
          sensitivitiesLength: this.sensitivities.length
        });
        // Fix the mismatch by padding or truncating sensitivities
        if (this.sensitivities.length < finalKeywords.length) {
          // Pad with default sensitivity
          while (this.sensitivities.length < finalKeywords.length) {
            this.sensitivities.push(0.5);
          }
        } else if (this.sensitivities.length > finalKeywords.length) {
          // Truncate to match
          this.sensitivities = this.sensitivities.slice(0, finalKeywords.length);
        }
        DEBUG.trace('WakeWordManager: Fixed sensitivities array length mismatch', {
          pathsLength: finalKeywords.length,
          sensitivitiesLength: this.sensitivities.length
        });
      }

      // Porcupine.create() can take time - add timeout wrapper per cArTeSiA dOcS.md timeout practices
      const porcupineInitStartTime = performance.now();
      let porcupineInitTime = 0; // Declare in broader scope for later use
      DEBUG.trace('WakeWordManager: Creating Porcupine instance (this may take 10-30 seconds on first load or slow networks)...');
      
      // Add timeout to Porcupine.create() to prevent indefinite hanging
      // Increased to 30 seconds per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md for slow networks + first-time downloads
      const porcupineTimeout = 30000; // 30 seconds max for Porcupine initialization (increased from 20s)
      
      // Add progress logging for slow initialization
      const progressInterval = setInterval(() => {
        const elapsed = (performance.now() - porcupineInitStartTime) / 1000;
        DEBUG.trace(`WakeWordManager: Porcupine initialization in progress... (${elapsed.toFixed(1)}s)`);
      }, 3000);
      
      // CRITICAL: Ensure keywords array is properly formatted before passing to Porcupine
      // Porcupine Web SDK v4.0.0 requires keywords to be a non-empty array of strings
      if (!Array.isArray(finalKeywords) || finalKeywords.length === 0 || finalKeywords.some(k => !k || typeof k !== 'string' || k.trim().length === 0)) {
        clearInterval(progressInterval);
        const error = new Error('The keywords argument is undefined / empty');
        DEBUG.error('WakeWordManager: Invalid keywords array passed to Porcupine.create()', {
          keywords: finalKeywords,
          type: typeof finalKeywords,
          isArray: Array.isArray(finalKeywords),
          length: finalKeywords?.length,
          hasInvalidEntries: finalKeywords?.some(k => !k || typeof k !== 'string' || k.trim().length === 0)
        });
        this.onError('Wake word initialization failed: The keywords argument is undefined / empty');
        throw error;
      }
      
      // CRITICAL: Final validation - ensure all keywords are valid non-empty strings
      // (This is a safety check even though finalKeywords should already be validated)
      DEBUG.trace('WakeWordManager: Before final keyword filtering', {
        finalKeywords,
        finalKeywordsLength: finalKeywords.length,
        finalKeywordsType: typeof finalKeywords,
        finalKeywordsIsArray: Array.isArray(finalKeywords),
        finalKeywordsContents: finalKeywords.map(k => ({ value: k, type: typeof k, length: k?.length }))
      });
      
      const validKeywords = finalKeywords.filter(k => k && typeof k === 'string' && k.trim().length > 0);
      
      DEBUG.trace('WakeWordManager: After final keyword filtering', {
        validKeywords,
        validKeywordsLength: validKeywords.length,
        validKeywordsType: typeof validKeywords,
        validKeywordsIsArray: Array.isArray(validKeywords),
        validKeywordsContents: validKeywords.map(k => ({ value: k, type: typeof k, length: k?.length }))
      });
      
      if (validKeywords.length === 0) {
        clearInterval(progressInterval);
        const error = new Error('The keywords argument is undefined / empty');
        DEBUG.error('WakeWordManager: All keywords are empty or invalid', {
          originalKeywords: finalKeywords,
          originalKeywordsLength: finalKeywords.length,
          validKeywords: validKeywords,
          validKeywordsLength: validKeywords.length,
          originalPaths: this.keywordPaths,
          originalPathsLength: this.keywordPaths.length,
          validatedPaths: validatedPaths,
          validatedPathsLength: validatedPaths.length,
          filteredPaths: filteredPaths,
          filteredPathsLength: filteredPaths.length
        });
        throw error;
      }
      
      // Update sensitivities to match valid keywords (map from original finalKeywords indices)
      const validSensitivities = [];
      for (let i = 0; i < finalKeywords.length; i++) {
        const keyword = finalKeywords[i];
        if (keyword && typeof keyword === 'string' && keyword.trim().length > 0) {
          // Use the sensitivity at the same index, or default to 0.5
          validSensitivities.push(this.sensitivities[i] ?? 0.5);
        }
      }
      
      // Ensure validSensitivities length matches validKeywords length
      if (validSensitivities.length !== validKeywords.length) {
        DEBUG.warn('WakeWordManager: Sensitivities length mismatch after final filtering', {
          keywordsLength: validKeywords.length,
          sensitivitiesLength: validSensitivities.length
        });
        // Fix by padding or truncating
        while (validSensitivities.length < validKeywords.length) {
          validSensitivities.push(0.5);
        }
        if (validSensitivities.length > validKeywords.length) {
          validSensitivities.splice(validKeywords.length);
        }
      }
      
      // CRITICAL SAFEGUARD: Ensure validKeywords is NEVER empty before calling Porcupine
      // This is the absolute last check - if we get here with empty keywords, something is very wrong
      if (!Array.isArray(validKeywords) || validKeywords.length === 0) {
        clearInterval(progressInterval);
        DEBUG.error('WakeWordManager: CRITICAL - validKeywords is empty right before Porcupine.create()!', {
          validKeywords,
          validKeywordsType: typeof validKeywords,
          validKeywordsIsArray: Array.isArray(validKeywords),
          validKeywordsLength: validKeywords?.length,
          finalKeywords,
          finalKeywordsLength: finalKeywords?.length,
          filteredPaths,
          filteredPathsLength: filteredPaths?.length,
          validatedPaths,
          validatedPathsLength: validatedPaths?.length,
          originalPaths: this.keywordPaths,
          originalPathsLength: this.keywordPaths?.length
        });
        // ABSOLUTE FALLBACK: Use 'Jarvis' as last resort
        const emergencyKeywords = ['Jarvis'];
        const emergencySensitivities = [0.5];
        DEBUG.warn('WakeWordManager: Using emergency fallback - forcing "Jarvis" keyword', {
          emergencyKeywords,
          emergencySensitivities,
          validKeywordsBefore: validKeywords,
          validKeywordsBeforeLength: validKeywords?.length
        });
        // Replace arrays completely to ensure they're valid
        validKeywords.splice(0, validKeywords.length, ...emergencyKeywords);
        validSensitivities.splice(0, validSensitivities.length, ...emergencySensitivities);
        DEBUG.trace('WakeWordManager: Emergency fallback applied', {
          validKeywordsAfter: validKeywords,
          validKeywordsAfterLength: validKeywords.length,
          validSensitivitiesAfter: validSensitivities,
          validSensitivitiesAfterLength: validSensitivities.length
        });
      }
      
      // Porcupine Web SDK v4.0.0 requires an options object
      // CRITICAL DEBUG: Log exactly what we're passing to Porcupine
      DEBUG.trace('WakeWordManager: About to call Porcupine.create()', {
        accessKeyPrefix: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing',
        accessKeyLength: this.accessKey?.length,
        keywords: validKeywords,
        keywordsLength: validKeywords.length,
        keywordsType: typeof validKeywords,
        keywordsIsArray: Array.isArray(validKeywords),
        keywordsContents: validKeywords.map(k => ({ value: String(k), type: typeof k })),
        sensitivities: validSensitivities,
        sensitivitiesLength: validSensitivities.length
      });
      
      // FINAL VALIDATION: Double-check keywords are valid before Porcupine.create()
      if (!Array.isArray(validKeywords) || validKeywords.length === 0) {
        clearInterval(progressInterval);
        const error = new Error('The keywords argument is undefined / empty');
        DEBUG.error('WakeWordManager: FATAL - validKeywords is still empty after emergency fallback!', {
          validKeywords,
          originalPaths: this.keywordPaths
        });
        throw error;
      }
      
      const porcupinePromise = Porcupine.create({
        accessKey: this.accessKey,
        keywords: validKeywords,
        sensitivities: validSensitivities
      });
      
      const porcupineTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Porcupine.create() timeout after ${porcupineTimeout}ms - check network connection and keyword files`));
        }, porcupineTimeout);
      });
      
      try {
        this.porcupine = await Promise.race([porcupinePromise, porcupineTimeoutPromise]);
        clearInterval(progressInterval);
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
      
      porcupineInitTime = performance.now() - porcupineInitStartTime;
      DEBUG.trace('WakeWordManager: Porcupine initialized', {
        sampleRate: this.porcupine.sampleRate,
        frameLength: this.porcupine.frameLength,
        version: this.porcupine.version,
        initTimeMs: porcupineInitTime.toFixed(2)
      });

      // Load AudioWorklet processor - use same base path as STT processor
      // Add timeout to prevent hanging (per cArTeSiA dOcS.md timeout best practices)
      try {
        const basePath = audioWorkletBasePath || './audio/';
        const wakeWordPath = basePath.endsWith('/') 
          ? `${basePath}wake-word-processor.js`
          : `${basePath}/wake-word-processor.js`;
        DEBUG.trace('WakeWordManager: Loading AudioWorklet processor', { path: wakeWordPath });
        
        // Add timeout to AudioWorklet loading (15 seconds max - increased per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md for slow networks)
        const workletTimeout = 15000; // Increased from 10s to 15s for slow networks
        // Use absolute URL for AudioWorklet path to avoid path resolution issues
        const absoluteWorkletPath = wakeWordPath.startsWith('http://') || wakeWordPath.startsWith('https://')
          ? wakeWordPath
          : new URL(wakeWordPath, window.location.origin).href;
        
        DEBUG.trace('WakeWordManager: Loading AudioWorklet processor with absolute path', { 
          original: wakeWordPath,
          absolute: absoluteWorkletPath 
        });
        
        const workletPromise = audioContext.audioWorklet.addModule(absoluteWorkletPath);
        const workletTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`AudioWorklet loading timeout after ${workletTimeout}ms - check file path: ${absoluteWorkletPath}. ` +
              `Ensure the file exists at public/audio/wake-word-processor.js or verify the audioWorkletBasePath configuration.`));
          }, workletTimeout);
        });
        
        await Promise.race([workletPromise, workletTimeoutPromise]);
        DEBUG.trace('WakeWordManager: AudioWorklet processor loaded successfully');
      } catch (err) {
        DEBUG.error('WakeWordManager: Failed to load AudioWorklet processor', err);
        // Fallback: process on main thread with buffered frames
        return this._initializeMainThreadProcessing(mediaStream);
      }

      // Create AudioWorkletNode
      this.wakeWordNode = new AudioWorkletNode(audioContext, 'wake-word-processor');
      
      // Configure processor
      this.wakeWordNode.port.postMessage({
        type: 'config',
        frameLength: this.porcupine.frameLength,
        enabled: this.enabled
      });

      // Handle messages from processor
      this.wakeWordNode.port.onmessage = (e) => {
        if (e.data.type === 'audioFrame') {
          this._processFrame(new Int16Array(e.data.frame));
        } else if (e.data.type === 'error') {
          DEBUG.error('WakeWordManager: Processor error', e.data.error);
          this.onError(e.data.error);
        } else if (e.data.type === 'debug') {
          DEBUG.trace('WakeWordManager: Processor debug', e.data.message);
        }
      };

      // Connect to audio source
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(this.wakeWordNode);

      DEBUG.trace('WakeWordManager: AudioWorklet setup complete');
      
      const totalInitTime = performance.now() - initStartTime;
      DEBUG.trace('WakeWordManager: Initialization complete', {
        totalTimeMs: totalInitTime.toFixed(2),
        porcupineInitTimeMs: porcupineInitTime.toFixed(2)
      });
      
      return {
        node: this.wakeWordNode,
        frameLength: this.porcupine.frameLength,
        sampleRate: this.porcupine.sampleRate
      };
    } catch (err) {
      DEBUG.error('WakeWordManager: Initialization failed', {
        error: err,
        message: err.message,
        stack: err.stack,
        keywordPaths: this.keywordPaths,
        accessKeyPrefix: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing'
      });
      
      // Provide more helpful error messages based on error type (per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md)
      let errorMessage = `Wake word initialization failed: ${err.message}`;
      let recoverySuggestion = '';
      
      // Check for specific error patterns
      const errMsg = err.message || '';
      
      if (errMsg.includes('does not map to list of built-in keywords')) {
        // This error occurs when Porcupine can't load a custom .ppn file and tries to match the URL as a built-in keyword
        errorMessage = `Wake word keyword file not found or invalid. The system attempted to use built-in keywords as fallback, but initialization still failed.`;
        recoverySuggestion = `Please ensure the .ppn file exists in public/keywords/ directory, or use a built-in keyword name (e.g., "Jarvis", "Computer"). ` +
          `Checked paths: ${this.keywordPaths.join(', ')}. ` +
          `Built-in keywords available: Jarvis, Computer, Alexa, Hey Google, Hey Siri, Okay Google, Picovoice, Porcupine, Terminator, Americano, Blueberry, Bumblebee, Grapefruit, Grasshopper.`;
      } else if (errMsg.includes('404') || errMsg.includes('Not Found')) {
        errorMessage = `Wake word keyword file not found (404).`;
        recoverySuggestion = `Please ensure the .ppn file exists in public/keywords/ directory. Checked paths: ${this.keywordPaths.join(', ')}. ` +
          `Alternatively, you can use a built-in keyword like "Jarvis" or "Computer" instead of a file path. ` +
          `Built-in keywords initialize faster (3-5 seconds) and don't require file downloads.`;
      } else if (errMsg.includes('AccessKey') || errMsg.includes('authentication') || errMsg.includes('Invalid')) {
        errorMessage = `Invalid Picovoice AccessKey.`;
        recoverySuggestion = `Please verify your AccessKey from https://console.picovoice.ai/. ` +
          `Ensure the AccessKey is correct, not expired, and matches the account that created the wake word (if using custom keywords). ` +
          `AccessKey should be at least 20 characters long.`;
      } else if (errMsg.includes('CORS')) {
        errorMessage = `CORS error loading keyword file.`;
        recoverySuggestion = `Ensure the file is served from the same origin or has proper CORS headers. ` +
          `For local development, place .ppn files in public/keywords/ directory. ` +
          `Alternatively, use a built-in keyword to avoid CORS issues.`;
      } else if (errMsg.includes('network') || errMsg.includes('timeout') || errMsg.includes('fetch')) {
        // Check if it's specifically a timeout error for more specific messaging
        if (errMsg.includes('timeout')) {
          errorMessage = `Wake word initialization timeout.`;
          recoverySuggestion = `Initialization took longer than expected (30 seconds). This can happen on slow networks or first-time downloads. ` +
            `Try using a built-in keyword like "Jarvis" for faster initialization (3-5 seconds). ` +
            `If using custom keyword files, ensure they are small and accessible. ` +
            `Check your network connection and try again.`;
        } else {
          errorMessage = `Network error during wake word initialization.`;
          recoverySuggestion = `Check your internet connection and try again. ` +
            `If using custom keyword files, ensure they are accessible. ` +
            `Consider using built-in keywords (e.g., "Jarvis") for faster initialization without network dependencies. ` +
            `If the issue persists, the initialization may have timed out - try again or increase the timeout.`;
        }
      } else if (errMsg.includes('keywords argument is undefined') || errMsg.includes('keywords argument is empty')) {
        errorMessage = `No valid wake word keywords provided.`;
        recoverySuggestion = `Please provide at least one wake word keyword. ` +
          `You can use a built-in keyword (e.g., "Jarvis", "Computer") or provide a path to a custom .ppn file. ` +
          `Built-in keywords: Jarvis, Computer, Alexa, Hey Google, Hey Siri, Okay Google, Picovoice, Porcupine, Terminator, Americano, Blueberry, Bumblebee, Grapefruit, Grasshopper.`;
      }
      
      const fullErrorMessage = recoverySuggestion 
        ? `${errorMessage} ${recoverySuggestion}`
        : errorMessage;
      
      DEBUG.error('WakeWordManager: Initialization failed with detailed error', {
        error: err.message,
        errorType: err.constructor.name,
        recoverySuggestion,
        keywordPaths: this.keywordPaths,
        accessKeyPrefix: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing',
        browser: navigator.userAgent,
        isSecureContext: window.isSecureContext
      });
      
      this.onError(fullErrorMessage);
      return null;
    }
  }

  /**
   * Fallback: Initialize main-thread processing (if AudioWorklet unavailable)
   * Note: This uses the existing audioContext to avoid creating multiple contexts
   */
  _initializeMainThreadProcessing(mediaStream) {
    DEBUG.trace('WakeWordManager: Using main-thread processing fallback');
    
    if (!this.audioContext) {
      DEBUG.error('WakeWordManager: Cannot use fallback - no audioContext available');
      return null;
    }
    
    // Use existing audioContext instead of creating a new one
    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (!this.enabled || !this.porcupine) return;
      
      const input = e.inputBuffer.getChannelData(0);
      // Resample from context sample rate to 16kHz if needed
      const resampled = this._resampleTo16k(input, this.audioContext.sampleRate);
      const int16 = this._float32ToInt16(resampled);
      
      // Buffer and process frames
      for (let i = 0; i < int16.length; i++) {
        this._frameQueue.push(int16[i]);
      }
      
      this._processBufferedFrames();
    };
    
    source.connect(processor);
    processor.connect(this.audioContext.destination);
    
    this._scriptProcessor = processor;
    return { node: processor, frameLength: this.porcupine.frameLength, sampleRate: 16000 };
  }

  /**
   * Resample Float32 audio to 16kHz
   */
  _resampleTo16k(float32Array, sourceSampleRate) {
    const targetSampleRate = 16000;
    const ratio = sourceSampleRate / targetSampleRate;
    const outLength = Math.floor(float32Array.length / ratio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * ratio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;
      const nextIdx = Math.min(idx + 1, float32Array.length - 1);
      out[i] = float32Array[idx] * (1 - frac) + float32Array[nextIdx] * frac;
    }
    return out;
  }

  /**
   * Convert Float32 to Int16
   */
  _float32ToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  /**
   * Process a single frame with Porcupine
   */
  _processFrame(frame) {
    if (!this.porcupine || !this.enabled) {
      return;
    }

    // Validate frame is Int16Array
    if (!(frame instanceof Int16Array)) {
      DEBUG.error('WakeWordManager: Invalid frame type', { type: frame?.constructor?.name });
      return;
    }

    // Validate frame length (per PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md)
    if (!this.porcupine || !this.porcupine.frameLength) {
      DEBUG.error('WakeWordManager: Porcupine not initialized or frameLength not available');
      return;
    }
    
    // Check frame length matches Porcupine's expected frame length
    if (frame.length !== this.porcupine.frameLength) {
      DEBUG.trace('WakeWordManager: Frame length mismatch - skipping frame', {
        expected: this.porcupine.frameLength,
        actual: frame.length,
        difference: Math.abs(frame.length - this.porcupine.frameLength)
      });
      // Don't process invalid frames - this prevents Porcupine errors
      return;
    }

    // Check cooldown period to prevent re-triggering
    const now = Date.now();
    if (now - this._lastDetectionTime < this._cooldownMs) {
      DEBUG.trace('WakeWordManager: Wake word detected but in cooldown period', {
        timeSinceLastDetection: now - this._lastDetectionTime,
        cooldownMs: this._cooldownMs
      });
      return;
    }

    try {
      const detectionStartTime = performance.now();
      const keywordIndex = this.porcupine.process(frame);
      
      if (keywordIndex >= 0) {
        const detectionLatency = performance.now() - detectionStartTime;
        this._lastDetectionTime = now;
        
        // Update metrics
        this._metrics.detectionCount++;
        this._metrics.totalDetectionTime += detectionLatency;
        if (this._metrics.firstDetectionTime === null) {
          this._metrics.firstDetectionTime = now;
        }
        this._metrics.lastDetectionTime = now;
        
        DEBUG.trace('WakeWordManager: Wake word detected!', { 
          keywordIndex,
          latency: `${detectionLatency.toFixed(2)}ms`,
          totalDetections: this._metrics.detectionCount
        });
        
        this.onWakeWordDetected(keywordIndex);
      }
    } catch (err) {
      DEBUG.error('WakeWordManager: Porcupine process error', err);
      this.onError(`Wake word processing error: ${err.message}`);
    }
  }

  /**
   * Process buffered frames (for main-thread fallback)
   */
  _processBufferedFrames() {
    if (this._processingFrames || !this.porcupine) return;
    
    const frameLength = this.porcupine.frameLength;
    while (this._frameQueue.length >= frameLength) {
      this._processingFrames = true;
      const frame = new Int16Array(frameLength);
      for (let i = 0; i < frameLength; i++) {
        frame[i] = this._frameQueue.shift();
      }
      this._processFrame(frame);
      this._processingFrames = false;
    }
  }

  /**
   * Enable/disable wake word detection
   */
  setEnabled(enabled) {
    const wasEnabled = this.enabled;
    this.enabled = enabled;
    if (this.wakeWordNode) {
      this.wakeWordNode.port.postMessage({ type: 'enable', enabled });
      DEBUG.trace('WakeWordManager: setEnabled', { 
        enabled, 
        wasEnabled,
        hasNode: !!this.wakeWordNode,
        hasPorcupine: !!this.porcupine
      });
    } else {
      DEBUG.trace('WakeWordManager: setEnabled called but no wakeWordNode', { enabled });
    }
    DEBUG.trace('WakeWordManager: Enabled', enabled);
  }

  /**
   * Check if wake word detection is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const uptime = this._metrics.firstDetectionTime 
      ? Date.now() - this._metrics.firstDetectionTime 
      : 0;
    
    return {
      ...this._metrics,
      uptimeMs: uptime,
      avgDetectionLatency: this._metrics.detectionCount > 0
        ? this._metrics.totalDetectionTime / this._metrics.detectionCount
        : 0,
      detectionsPerHour: uptime > 0
        ? (this._metrics.detectionCount / (uptime / 3600000))
        : 0
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this._metrics = {
      detectionCount: 0,
      falseAlarmCount: 0,
      totalDetectionTime: 0,
      lastDetectionTime: 0,
      firstDetectionTime: null
    };
  }

  /**
   * Set cooldown period (in milliseconds)
   */
  setCooldownMs(cooldownMs) {
    if (typeof cooldownMs !== 'number' || cooldownMs < 0) {
      DEBUG.error('WakeWordManager: Invalid cooldown value', { cooldownMs });
      return;
    }
    this._cooldownMs = cooldownMs;
    DEBUG.trace('WakeWordManager: Cooldown period set', { cooldownMs });
  }

  /**
   * Release Porcupine resources
   * Follows best practices from wAkE wOrD dOcS.md Section 19
   */
  async release() {
    // 1. Disable wake word detection
    this.setEnabled(false);
    
    // 2. Release Porcupine instance
    if (this.porcupine) {
      try {
        await this.porcupine.release();
        DEBUG.trace('WakeWordManager: Porcupine released');
      } catch (err) {
        DEBUG.error('WakeWordManager: Error releasing Porcupine', err);
      }
      this.porcupine = null;
    }
    
    // 3. Disconnect AudioWorklet node
    if (this.wakeWordNode) {
      try {
        // Remove message handler to prevent memory leaks
        this.wakeWordNode.port.onmessage = null;
        this.wakeWordNode.disconnect();
        this.wakeWordNode = null;
        DEBUG.trace('WakeWordManager: AudioWorklet node disconnected');
      } catch (err) {
        DEBUG.error('WakeWordManager: Error disconnecting wake word node', err);
      }
    }

    // 4. Disconnect ScriptProcessorNode (if used)
    if (this._scriptProcessor) {
      try {
        this._scriptProcessor.onaudioprocess = null;
        this._scriptProcessor.disconnect();
        this._scriptProcessor = null;
        DEBUG.trace('WakeWordManager: ScriptProcessorNode disconnected');
      } catch (err) {
        DEBUG.error('WakeWordManager: Error disconnecting script processor', err);
      }
    }

    // 5. Clear frame buffers
    this._frameQueue = [];
    this._processingFrames = false;
    
    // 6. Reset metrics
    this.resetMetrics();
    
    DEBUG.trace('WakeWordManager: All resources released');
  }
}
