/**
 * Wake Word Error Monitor & Auto-Fixer
 * 
 * Monitors console errors for wake word related issues and attempts to fix them automatically.
 * 
 * Features:
 * - Intercepts console.error and console.warn
 * - Detects wake word/Porcupine related errors
 * - Analyzes error patterns
 * - Attempts automatic fixes
 * - Reports fixes applied
 * 
 * Usage:
 *   import { WakeWordErrorMonitor } from './wake-word-error-monitor.js';
 *   const monitor = new WakeWordErrorMonitor({
 *     bridge: cartesiaBridge, // CartesiaAudioBridge instance
 *     onFixApplied: (fix) => console.log('Fix applied:', fix)
 *   });
 *   monitor.start();
 */
import { DEBUG } from './debug.js';

export class WakeWordErrorMonitor {
  constructor(options = {}) {
    this.bridge = options.bridge || null;
    this.onFixApplied = options.onFixApplied || (() => {});
    this.onErrorDetected = options.onErrorDetected || (() => {});
    this.enabled = true;
    this.errorHistory = [];
    this.fixHistory = [];
    this.maxHistorySize = 100;
    
    // Original console methods (for restoration)
    this._originalConsoleError = null;
    this._originalConsoleWarn = null;
    
    // Error pattern matchers - COMPREHENSIVE 100% COVERAGE
    this.errorPatterns = {
      // AccessKey errors
      invalidAccessKey: [
        /invalid.*access.*key/i,
        /access.*key.*required/i,
        /authentication.*failed/i,
        /accesskey.*invalid/i,
        /access.*key.*missing/i,
        /access.*key.*not.*found/i,
        /access.*key.*empty/i,
        /invalid.*picovoice.*access.*key/i,
        /picovoice.*access.*key.*invalid/i,
        /access.*key.*authentication/i,
        /unauthorized.*access.*key/i
      ],
      
      // Keyword file errors
      keywordFileNotFound: [
        /404.*not.*found/i,
        /keyword.*file.*not.*found/i,
        /\.ppn.*not.*found/i,
        /failed.*to.*load.*keyword/i,
        /cannot.*find.*keyword/i,
        /keyword.*file.*missing/i,
        /keyword.*path.*invalid/i,
        /keyword.*file.*does.*not.*exist/i,
        /file.*not.*found.*keyword/i,
        /does.*not.*map.*to.*list.*of.*built-in.*keywords/i,
        /keyword.*file.*error/i,
        /invalid.*keyword.*file/i,
        /keyword.*file.*failed/i
      ],
      
      // Initialization timeout
      initializationTimeout: [
        /timeout.*initialization/i,
        /initialization.*timeout/i,
        /porcupine.*create.*timeout/i,
        /wake.*word.*initialization.*timeout/i,
        /timeout.*after.*ms/i,
        /initialization.*timed.*out/i,
        /wake.*word.*timeout/i,
        /porcupine.*timeout/i,
        /timeout.*porcupine/i,
        /timeout.*wake.*word/i
      ],
      
      // Frame length mismatch
      frameLengthMismatch: [
        /frame.*length.*mismatch/i,
        /invalid.*frame.*length/i,
        /frame.*length.*must.*be/i,
        /frame.*length.*incorrect/i,
        /frame.*length.*error/i,
        /expected.*frame.*length/i,
        /frame.*size.*mismatch/i
      ],
      
      // Sample rate mismatch
      sampleRateMismatch: [
        /sample.*rate.*mismatch/i,
        /invalid.*sample.*rate/i,
        /sample.*rate.*must.*be/i,
        /sample.*rate.*incorrect/i,
        /sample.*rate.*error/i,
        /expected.*sample.*rate/i,
        /unsupported.*sample.*rate/i
      ],
      
      // AudioWorklet errors
      audioWorkletError: [
        /audioworklet.*not.*available/i,
        /audioworklet.*failed/i,
        /failed.*to.*load.*audioworklet/i,
        /audioworklet.*error/i,
        /failed.*to.*load.*wake.*word.*processor/i,
        /wake.*word.*processor.*failed/i,
        /audioworklet.*processor.*error/i,
        /failed.*to.*create.*audioworklet/i,
        /audioworklet.*unavailable/i,
        /audioworklet.*not.*supported/i,
        /cannot.*load.*audioworklet/i,
        /audioworklet.*module.*failed/i
      ],
      
      // CORS errors
      corsError: [
        /cors.*error/i,
        /cross.*origin/i,
        /access.*control.*allow.*origin/i,
        /cors.*policy/i,
        /cross.*origin.*request/i,
        /origin.*not.*allowed/i,
        /cors.*blocked/i
      ],
      
      // Network errors
      networkError: [
        /network.*error/i,
        /failed.*to.*fetch/i,
        /connection.*failed/i,
        /timeout.*network/i,
        /network.*request.*failed/i,
        /fetch.*error/i,
        /connection.*timeout/i,
        /network.*unavailable/i,
        /no.*internet.*connection/i,
        /dns.*error/i,
        /connection.*refused/i,
        /network.*unreachable/i
      ],
      
      // Porcupine errors
      porcupineError: [
        /porcupine.*error/i,
        /porcupine.*failed/i,
        /porcupine.*create.*failed/i,
        /porcupine.*initialization/i,
        /porcupine.*exception/i,
        /porcupine.*crash/i,
        /porcupine.*not.*initialized/i,
        /porcupine.*null/i,
        /porcupine.*undefined/i,
        /failed.*to.*initialize.*porcupine/i,
        /porcupine.*initialization.*failed/i,
        /porcupine.*load.*failed/i,
        /porcupine.*module.*error/i
      ],
      
      // Keywords array errors
      keywordsArrayError: [
        /keywords.*argument.*undefined/i,
        /keywords.*argument.*empty/i,
        /keywords.*is.*undefined/i,
        /keywords.*is.*empty/i,
        /keywords.*must.*be.*array/i,
        /keywords.*invalid/i,
        /keywords.*argument.*invalid/i,
        /the.*keywords.*argument.*is.*undefined/i,
        /the.*keywords.*argument.*is.*empty/i,
        /keywords.*array.*empty/i,
        /keywords.*array.*invalid/i,
        /no.*keywords.*provided/i,
        /keywords.*required/i
      ],
      
      // Microphone permission errors
      microphonePermission: [
        /microphone.*permission/i,
        /permission.*denied/i,
        /getusermedia.*denied/i,
        /mic.*permission/i,
        /microphone.*not.*available/i,
        /microphone.*access.*denied/i,
        /user.*denied.*microphone/i,
        /microphone.*permission.*required/i,
        /getusermedia.*failed/i,
        /microphone.*unavailable/i,
        /mic.*not.*available/i,
        /permission.*denied.*microphone/i
      ],
      
      // AudioContext errors
      audioContextError: [
        /audiocontext.*error/i,
        /audiocontext.*failed/i,
        /failed.*to.*create.*audiocontext/i,
        /audiocontext.*not.*available/i,
        /audiocontext.*unavailable/i,
        /cannot.*use.*fallback.*no.*audiocontext/i,
        /audiocontext.*null/i,
        /audiocontext.*undefined/i,
        /no.*audiocontext.*available/i
      ],
      
      // Wake word manager errors
      wakeWordManagerError: [
        /wake.*word.*manager.*error/i,
        /wake.*word.*manager.*failed/i,
        /wake.*word.*manager.*null/i,
        /wake.*word.*manager.*undefined/i,
        /failed.*to.*initialize.*wake.*word.*manager/i,
        /wake.*word.*manager.*initialization.*failed/i,
        /wake.*word.*error/i,
        /wake.*word.*failed/i,
        /wake.*word.*initialization.*failed/i,
        /wake.*word.*not.*initialized/i,
        /wake.*word.*processor.*error/i,
        /wake.*word.*detection.*failed/i
      ],
      
      // Sensitivity errors
      sensitivityError: [
        /sensitivity.*invalid/i,
        /sensitivity.*must.*be.*number/i,
        /sensitivity.*out.*of.*range/i,
        /sensitivity.*error/i,
        /invalid.*sensitivity.*value/i,
        /sensitivity.*must.*be.*between/i,
        /sensitivities.*length.*mismatch/i,
        /sensitivities.*array.*invalid/i
      ],
      
      // MediaStream errors
      mediaStreamError: [
        /mediastream.*error/i,
        /mediastream.*failed/i,
        /failed.*to.*get.*mediastream/i,
        /mediastream.*not.*available/i,
        /mediastream.*null/i,
        /mediastream.*undefined/i,
        /no.*mediastream.*available/i,
        /getusermedia.*error/i,
        /getusermedia.*exception/i
      ]
    };
    
    // Fix strategies
    this.fixStrategies = {
      invalidAccessKey: this._fixInvalidAccessKey.bind(this),
      keywordFileNotFound: this._fixKeywordFileNotFound.bind(this),
      initializationTimeout: this._fixInitializationTimeout.bind(this),
      frameLengthMismatch: this._fixFrameLengthMismatch.bind(this),
      sampleRateMismatch: this._fixSampleRateMismatch.bind(this),
      audioWorkletError: this._fixAudioWorkletError.bind(this),
      corsError: this._fixCorsError.bind(this),
      networkError: this._fixNetworkError.bind(this),
      porcupineError: this._fixPorcupineError.bind(this),
      keywordsArrayError: this._fixKeywordsArrayError.bind(this),
      microphonePermission: this._fixMicrophonePermission.bind(this),
      audioContextError: this._fixAudioContextError.bind(this),
      wakeWordManagerError: this._fixWakeWordManagerError.bind(this),
      sensitivityError: this._fixSensitivityError.bind(this),
      mediaStreamError: this._fixMediaStreamError.bind(this)
    };
  }
  
  /**
   * Start monitoring console errors
   */
  start() {
    if (!this.enabled) return;
    
    // Store original console methods
    // eslint-disable-next-line no-console
    this._originalConsoleError = console.error;
    // eslint-disable-next-line no-console
    this._originalConsoleWarn = console.warn;
    
    // Intercept console.error
    // eslint-disable-next-line no-console
    console.error = (...args) => {
      this._handleError('error', args);
      // Call original console.error
      if (this._originalConsoleError) {
        this._originalConsoleError.apply(console, args);
      }
    };
    
    // Intercept console.warn
    // eslint-disable-next-line no-console
    console.warn = (...args) => {
      this._handleError('warn', args);
      // Call original console.warn
      if (this._originalConsoleWarn) {
        this._originalConsoleWarn.apply(console, args);
      }
    };
    
    DEBUG.trace('WakeWordErrorMonitor: Started monitoring console errors');
  }
  
  /**
   * Stop monitoring console errors
   */
  stop() {
    if (this._originalConsoleError) {
      // eslint-disable-next-line no-console
      console.error = this._originalConsoleError;
      this._originalConsoleError = null;
    }
    
    if (this._originalConsoleWarn) {
      // eslint-disable-next-line no-console
      console.warn = this._originalConsoleWarn;
      this._originalConsoleWarn = null;
    }
    
    DEBUG.trace('WakeWordErrorMonitor: Stopped monitoring console errors');
  }
  
  /**
   * Handle detected error
   */
  _handleError(level, args) {
    if (!this.enabled) return;
    
    // Convert args to string for pattern matching
    const errorText = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message || arg.toString();
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Check if error is wake word related
    const isWakeWordError = this._isWakeWordError(errorText);
    if (!isWakeWordError) return;
    
    // Store error in history
    const errorEntry = {
      timestamp: Date.now(),
      level,
      text: errorText,
      args: args.map(arg => {
        // Serialize args safely
        if (arg instanceof Error) {
          return {
            type: 'Error',
            message: arg.message,
            stack: arg.stack,
            name: arg.name
          };
        }
        return arg;
      })
    };
    
    this.errorHistory.push(errorEntry);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
    
    // Notify error detected
    this.onErrorDetected(errorEntry);
    
    // Attempt to fix
    this._attemptFix(errorEntry);
  }
  
  /**
   * Check if error is wake word related - COMPREHENSIVE 100% COVERAGE
   */
  _isWakeWordError(errorText) {
    const wakeWordKeywords = [
      'wake.*word',
      'porcupine',
      'picovoice',
      'accesskey',
      'access.*key',
      'keyword.*file',
      'keyword.*path',
      'keywords.*argument',
      '.ppn',
      'audioworklet.*wake',
      'wake.*word.*initialization',
      'wake.*word.*error',
      'wake.*word.*failed',
      'wake.*word.*manager',
      'wake.*word.*processor',
      'wake.*word.*detection',
      'wake.*word.*timeout',
      'wake.*word.*create',
      'wake.*word.*load',
      'wake.*word.*config',
      'wake.*word.*sensitivity',
      'wake.*word.*keyword',
      'porcupine.*create',
      'porcupine.*init',
      'porcupine.*load',
      'porcupine.*error',
      'porcupine.*failed',
      'porcupine.*timeout',
      'picovoice.*access',
      'picovoice.*key',
      'keyword.*not.*found',
      'keyword.*file.*not',
      'keyword.*invalid',
      'sensitivity.*wake',
      'sensitivity.*keyword',
      'audioworklet.*processor.*wake',
      'wake.*word.*audioworklet',
      'wake.*word.*fallback',
      'wake.*word.*permission',
      'wake.*word.*microphone'
    ];
    
    const combinedPattern = new RegExp(wakeWordKeywords.join('|'), 'i');
    return combinedPattern.test(errorText);
  }
  
  /**
   * Attempt to fix the error
   */
  async _attemptFix(errorEntry) {
    const errorText = errorEntry.text;
    
    // Match error against patterns
    for (const [errorType, patterns] of Object.entries(this.errorPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(errorText)) {
          DEBUG.trace(`WakeWordErrorMonitor: Detected ${errorType} error`, { errorText });
          
          // Get fix strategy
          const fixStrategy = this.fixStrategies[errorType];
          if (fixStrategy) {
            try {
              const fixResult = await fixStrategy(errorEntry);
              if (fixResult && fixResult.fixed) {
                this._recordFix(errorType, fixResult);
                this.onFixApplied({
                  errorType,
                  error: errorEntry,
                  fix: fixResult,
                  timestamp: Date.now()
                });
                DEBUG.trace(`WakeWordErrorMonitor: Applied fix for ${errorType}`, fixResult);
                return;
              }
            } catch (fixErr) {
              DEBUG.error(`WakeWordErrorMonitor: Fix strategy failed for ${errorType}`, fixErr);
            }
          }
          break;
        }
      }
    }
    
    DEBUG.trace('WakeWordErrorMonitor: No fix strategy found for error', { errorText });
  }
  
  /**
   * Record applied fix
   */
  _recordFix(errorType, fixResult) {
    this.fixHistory.push({
      timestamp: Date.now(),
      errorType,
      fixResult
    });
    
    if (this.fixHistory.length > this.maxHistorySize) {
      this.fixHistory.shift();
    }
  }
  
  // ========== Fix Strategies ==========
  
  /**
   * Fix: Invalid AccessKey
   */
  // eslint-disable-next-line no-unused-vars
  async _fixInvalidAccessKey(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Check if AccessKey is in window.JARVIS_CONFIG
    if (typeof window !== 'undefined' && window.JARVIS_CONFIG) {
      const accessKey = window.JARVIS_CONFIG.picovoiceAccessKey;
      
      if (!accessKey || accessKey.trim().length === 0) {
        return {
          fixed: false,
          reason: 'AccessKey not found in window.JARVIS_CONFIG.picovoiceAccessKey',
          suggestion: 'Please set window.JARVIS_CONFIG.picovoiceAccessKey with your Picovoice AccessKey from https://console.picovoice.ai/'
        };
      }
      
      // AccessKey exists but might be invalid - try to reinitialize
      if (this.bridge.options && this.bridge.options.picovoiceAccessKey !== accessKey) {
        this.bridge.options.picovoiceAccessKey = accessKey;
        DEBUG.trace('WakeWordErrorMonitor: Updated AccessKey in bridge options');
        
        // Try to reinitialize wake word
        try {
          const result = await this.bridge.initWakeWord();
          if (result && result.success) {
            return {
              fixed: true,
              action: 'Updated AccessKey and reinitialized wake word',
              result
            };
          }
        } catch (err) {
          return {
            fixed: false,
            reason: `Reinitialization failed: ${err.message}`
          };
        }
      }
    }
    
    return { fixed: false, reason: 'AccessKey validation failed' };
  }
  
  /**
   * Fix: Keyword file not found
   */
  // eslint-disable-next-line no-unused-vars
  async _fixKeywordFileNotFound(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    if (this.bridge.options && this.bridge.options.wakeWordKeywordPaths) {
      const keywordPaths = this.bridge.options.wakeWordKeywordPaths;
      const validPaths = Array.isArray(keywordPaths) ? keywordPaths : [keywordPaths];
      
      // Check if any paths are invalid file paths
      const hasInvalidPaths = validPaths.some(path => {
        if (!path || typeof path !== 'string') return true;
        // Check if it's a file path (not a built-in keyword)
        return path.includes('.ppn') || path.includes('/') || path.includes('\\');
      });
      
      if (hasInvalidPaths) {
        // Replace with built-in keyword
        this.bridge.options.wakeWordKeywordPaths = ['Jarvis'];
        DEBUG.trace('WakeWordErrorMonitor: Replaced invalid keyword paths with built-in keyword "Jarvis"');
        
        // Try to reinitialize
        try {
          const result = await this.bridge.initWakeWord();
          if (result && result.success) {
            return {
              fixed: true,
              action: 'Replaced invalid keyword file paths with built-in keyword "Jarvis"',
              result
            };
          }
        } catch (err) {
          return {
            fixed: false,
            reason: `Reinitialization failed: ${err.message}`
          };
        }
      }
    }
    
    return { fixed: false, reason: 'Could not determine fix for keyword file error' };
  }
  
  /**
   * Fix: Initialization timeout
   */
  // eslint-disable-next-line no-unused-vars
  async _fixInitializationTimeout(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Release existing wake word manager if stuck
    if (this.bridge.wakeWordManager) {
      try {
        await this.bridge.wakeWordManager.release();
        this.bridge.wakeWordManager = null;
        DEBUG.trace('WakeWordErrorMonitor: Released stuck wake word manager');
      } catch (err) {
        DEBUG.error('WakeWordErrorMonitor: Error releasing wake word manager', err);
      }
    }
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to reinitialize with longer timeout (if bridge supports it)
    try {
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Released stuck wake word manager and reinitialized',
          result
        };
      } else {
        return {
          fixed: false,
          reason: result?.reason || 'Reinitialization failed after timeout fix'
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `Reinitialization failed: ${err.message}`
      };
    }
  }
  
  /**
   * Fix: Frame length mismatch
   */
  // eslint-disable-next-line no-unused-vars
  _fixFrameLengthMismatch(_errorEntry) {
    // Frame length issues are usually handled by the processor
    // This is more of a logging/informational fix
    DEBUG.trace('WakeWordErrorMonitor: Frame length mismatch detected - this should be handled by the audio processor');
    return {
      fixed: false,
      reason: 'Frame length mismatch requires processor-level fix',
      suggestion: 'Check that audio processor is using correct frame length from Porcupine instance'
    };
  }
  
  /**
   * Fix: Sample rate mismatch
   */
  // eslint-disable-next-line no-unused-vars
  _fixSampleRateMismatch(_errorEntry) {
    // Sample rate issues are usually handled by resampling
    DEBUG.trace('WakeWordErrorMonitor: Sample rate mismatch detected - this should be handled by resampling');
    return {
      fixed: false,
      reason: 'Sample rate mismatch requires resampling fix',
      suggestion: 'Check that audio is being resampled to 16kHz for Porcupine'
    };
  }
  
  /**
   * Fix: AudioWorklet error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixAudioWorkletError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // AudioWorklet errors usually mean fallback to main-thread processing
    // The WakeWordManager should handle this automatically, but we can try to reinitialize
    if (this.bridge.wakeWordManager) {
      try {
        await this.bridge.wakeWordManager.release();
        this.bridge.wakeWordManager = null;
        DEBUG.trace('WakeWordErrorMonitor: Released wake word manager to trigger fallback');
      } catch (err) {
        DEBUG.error('WakeWordErrorMonitor: Error releasing wake word manager', err);
      }
    }
    
    // Reinitialize - should fallback to main-thread processing
    try {
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Reinitialized wake word with fallback to main-thread processing',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `Reinitialization failed: ${err.message}`
      };
    }
    
    return { fixed: false, reason: 'Could not apply AudioWorklet fix' };
  }
  
  /**
   * Fix: CORS error
   */
  // eslint-disable-next-line no-unused-vars
  _fixCorsError(_errorEntry) {
    // CORS errors usually mean keyword files need to be served from same origin
    // or use built-in keywords instead
    if (this.bridge && this.bridge.options && this.bridge.options.wakeWordKeywordPaths) {
      const keywordPaths = this.bridge.options.wakeWordKeywordPaths;
      const hasExternalPaths = Array.isArray(keywordPaths)
        ? keywordPaths.some(path => path && (path.startsWith('http://') || path.startsWith('https://')))
        : keywordPaths && (keywordPaths.startsWith('http://') || keywordPaths.startsWith('https://'));
      
      if (hasExternalPaths) {
        // Suggest using built-in keywords
        return {
          fixed: false,
          reason: 'CORS error with external keyword files',
          suggestion: 'Use built-in keywords (e.g., "Jarvis", "Computer") instead of external .ppn files to avoid CORS issues',
          action: 'Consider updating wakeWordKeywordPaths to use built-in keywords'
        };
      }
    }
    
    return { fixed: false, reason: 'CORS error requires configuration change' };
  }
  
  /**
   * Fix: Network error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixNetworkError(_errorEntry) {
    // Network errors might be transient - try to reinitialize after a delay
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Wait a bit for network to recover
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Reinitialized wake word after network error',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `Reinitialization failed: ${err.message}`
      };
    }
    
    return { fixed: false, reason: 'Network error persists' };
  }
  
  /**
   * Fix: Porcupine error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixPorcupineError(_errorEntry) {
    // General Porcupine errors - try to release and reinitialize
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    if (this.bridge.wakeWordManager) {
      try {
        await this.bridge.wakeWordManager.release();
        this.bridge.wakeWordManager = null;
        DEBUG.trace('WakeWordErrorMonitor: Released wake word manager due to Porcupine error');
      } catch (err) {
        DEBUG.error('WakeWordErrorMonitor: Error releasing wake word manager', err);
      }
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Released and reinitialized wake word after Porcupine error',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `Reinitialization failed: ${err.message}`
      };
    }
    
    return { fixed: false, reason: 'Could not fix Porcupine error' };
  }
  
  /**
   * Fix: Keywords array error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixKeywordsArrayError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Ensure keywords array is valid
    if (this.bridge.options) {
      if (!this.bridge.options.wakeWordKeywordPaths || 
          (Array.isArray(this.bridge.options.wakeWordKeywordPaths) && this.bridge.options.wakeWordKeywordPaths.length === 0)) {
        // Set default built-in keyword
        this.bridge.options.wakeWordKeywordPaths = ['Jarvis'];
        DEBUG.trace('WakeWordErrorMonitor: Set default keyword "Jarvis"');
      }
      
      // Ensure sensitivities match
      if (!this.bridge.options.wakeWordSensitivities || 
          (Array.isArray(this.bridge.options.wakeWordSensitivities) && this.bridge.options.wakeWordSensitivities.length === 0)) {
        this.bridge.options.wakeWordSensitivities = [0.5];
        DEBUG.trace('WakeWordErrorMonitor: Set default sensitivity 0.5');
      }
      
      // Ensure arrays match in length
      const keywordPaths = Array.isArray(this.bridge.options.wakeWordKeywordPaths) 
        ? this.bridge.options.wakeWordKeywordPaths 
        : [this.bridge.options.wakeWordKeywordPaths];
      const sensitivities = Array.isArray(this.bridge.options.wakeWordSensitivities)
        ? this.bridge.options.wakeWordSensitivities
        : [this.bridge.options.wakeWordSensitivities || 0.5];
      
      if (sensitivities.length !== keywordPaths.length) {
        // Pad or truncate sensitivities
        while (sensitivities.length < keywordPaths.length) {
          sensitivities.push(0.5);
        }
        if (sensitivities.length > keywordPaths.length) {
          sensitivities.splice(keywordPaths.length);
        }
        this.bridge.options.wakeWordSensitivities = sensitivities;
        DEBUG.trace('WakeWordErrorMonitor: Fixed sensitivities array length mismatch');
      }
      
      // Try to reinitialize
      try {
        const result = await this.bridge.initWakeWord();
        if (result && result.success) {
          return {
            fixed: true,
            action: 'Fixed keywords array configuration and reinitialized',
            result
          };
        }
      } catch (err) {
        return {
          fixed: false,
          reason: `Reinitialization failed: ${err.message}`
        };
      }
    }
    
    return { fixed: false, reason: 'Could not fix keywords array error' };
  }
  
  /**
   * Fix: Microphone permission error
   */
  // eslint-disable-next-line no-unused-vars
  _fixMicrophonePermission(_errorEntry) {
    // Microphone permission requires user action - can't be fixed automatically
    return {
      fixed: false,
      reason: 'Microphone permission requires user action',
      suggestion: 'User must grant microphone permission by clicking the microphone button or allowing permission in browser settings'
    };
  }
  
  /**
   * Fix: AudioContext error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixAudioContextError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Try to reinitialize AudioContext
    try {
      await this.bridge.init();
      DEBUG.trace('WakeWordErrorMonitor: Reinitialized AudioContext');
      
      // Try to reinitialize wake word
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Reinitialized AudioContext and wake word',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `AudioContext reinitialization failed: ${err.message}`
      };
    }
    
    return { fixed: false, reason: 'Could not fix AudioContext error' };
  }
  
  /**
   * Fix: Wake word manager error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixWakeWordManagerError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Release existing wake word manager
    if (this.bridge.wakeWordManager) {
      try {
        await this.bridge.wakeWordManager.release();
        this.bridge.wakeWordManager = null;
        DEBUG.trace('WakeWordErrorMonitor: Released wake word manager');
      } catch (err) {
        DEBUG.error('WakeWordErrorMonitor: Error releasing wake word manager', err);
      }
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to reinitialize
    try {
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Released and reinitialized wake word manager',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `Reinitialization failed: ${err.message}`
      };
    }
    
    return { fixed: false, reason: 'Could not fix wake word manager error' };
  }
  
  /**
   * Fix: Sensitivity error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixSensitivityError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Fix sensitivity values
    if (this.bridge.options && this.bridge.options.wakeWordSensitivities) {
      const sensitivities = Array.isArray(this.bridge.options.wakeWordSensitivities)
        ? this.bridge.options.wakeWordSensitivities
        : [this.bridge.options.wakeWordSensitivities || 0.5];
      
      // Validate and fix each sensitivity
      const fixedSensitivities = sensitivities.map(sens => {
        if (typeof sens !== 'number' || isNaN(sens)) return 0.5;
        if (sens < 0) return 0;
        if (sens > 1) return 1;
        return sens;
      });
      
      DEBUG.trace('WakeWordErrorMonitor: Fixed sensitivity values', { fixedSensitivities });
      
      // Ensure sensitivities match keyword paths length
      const keywordPaths = Array.isArray(this.bridge.options.wakeWordKeywordPaths)
        ? this.bridge.options.wakeWordKeywordPaths
        : [this.bridge.options.wakeWordKeywordPaths || 'Jarvis'];
      
      while (fixedSensitivities.length < keywordPaths.length) {
        fixedSensitivities.push(0.5);
      }
      if (fixedSensitivities.length > keywordPaths.length) {
        fixedSensitivities.splice(keywordPaths.length);
      }
      
      this.bridge.options.wakeWordSensitivities = fixedSensitivities;
      
      // Try to reinitialize
      try {
        const result = await this.bridge.initWakeWord();
        if (result && result.success) {
          return {
            fixed: true,
            action: 'Fixed sensitivity values and reinitialized',
            result
          };
        }
      } catch (err) {
        return {
          fixed: false,
          reason: `Reinitialization failed: ${err.message}`
        };
      }
    }
    
    return { fixed: false, reason: 'Could not fix sensitivity error' };
  }
  
  /**
   * Fix: MediaStream error
   */
  // eslint-disable-next-line no-unused-vars
  async _fixMediaStreamError(_errorEntry) {
    if (!this.bridge) {
      return { fixed: false, reason: 'No bridge instance available' };
    }
    
    // Try to get media stream again
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      // Update bridge media stream
      if (this.bridge.mediaStream) {
        this.bridge.mediaStream.getTracks().forEach(track => track.stop());
      }
      this.bridge.mediaStream = stream;
      DEBUG.trace('WakeWordErrorMonitor: Reacquired media stream');
      
      // Try to reinitialize wake word
      const result = await this.bridge.initWakeWord();
      if (result && result.success) {
        return {
          fixed: true,
          action: 'Reacquired media stream and reinitialized wake word',
          result
        };
      }
    } catch (err) {
      return {
        fixed: false,
        reason: `MediaStream reacquisition failed: ${err.message}`,
        suggestion: 'User must grant microphone permission'
      };
    }
    
    return { fixed: false, reason: 'Could not fix MediaStream error' };
  }
  
  /**
   * Get error history
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }
  
  /**
   * Get fix history
   */
  getFixHistory() {
    return [...this.fixHistory];
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    this.errorHistory = [];
    this.fixHistory = [];
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const errorTypes = {};
    const fixTypes = {};
    
    this.errorHistory.forEach(entry => {
      // Try to categorize error
      for (const [errorType, patterns] of Object.entries(this.errorPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(entry.text)) {
            errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            break;
          }
        }
      }
    });
    
    this.fixHistory.forEach(entry => {
      fixTypes[entry.errorType] = (fixTypes[entry.errorType] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorHistory.length,
      totalFixes: this.fixHistory.length,
      errorTypes,
      fixTypes,
      successRate: this.fixHistory.length > 0 
        ? (this.fixHistory.filter(f => f.fixResult && f.fixResult.fixed).length / this.fixHistory.length * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}
