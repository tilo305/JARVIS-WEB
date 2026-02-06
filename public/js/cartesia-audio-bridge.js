/**
 * Cartesia Audio Bridge - Live Real-Time Bidirectional Flow
 * Optimal latency: VAD-gated streaming STT, sonic-turbo TTS, barge-in support
 *
 * AudioWorklet pipeline (integrated, bridged, connected):
 * - Mic: one getUserMedia MediaStream → same AudioContext for all capture.
 * - Wake word: MediaStream → wake-word-processor.js (AudioWorklet) → 16kHz Int16 frames
 *   → OpenWakeWordManager → WebSocket → Python openWakeWord server → onWakeWordDetected → UI + STT activation.
 * - STT: MediaStream → stt-capture-processor.js (AudioWorklet) → 16kHz Int16 chunks
 *   → _sendChunkToSTT() → Cartesia STT WebSocket → onTranscript → app.js → n8n backend.
 * - TTS: Cartesia TTS WebSocket → playTTSChunk() → tts-playback-processor.js (AudioWorklet) → destination.
 * - VAD (MicVAD): getStream() = same mediaStream; gates _sttStreaming and onSpeechStart/End.
 * - Paths: audioWorkletBasePath from app (e.g. /audio/) for all processor modules.
 * @see aUdiO dOcS.md, cArTeSiA dOcS.md, docs/OPENWAKEWORD.md, wAkE wOrD dOcS.md
 */
import { decodeBase64PCM } from './audio-utils.js';
import { MicVAD } from '@ricky0123/vad-web';
import { VAD_CONFIG } from './vad-config.js';
import { OpenWakeWordManager } from './openwakeword-manager.js';
import { DEBUG } from './debug.js';
import { logWakeWordError } from './wake-word-console.js';

const CARTESIA_VERSION = '2025-04-16'; // Must match src/config.ts API_VERSION
const DEFAULT_API_KEY = '';
const DEFAULT_VOICE_ID = '95131c95-525c-463b-893d-803bafdf93c4';
const STT_CHUNK_MS = 100;

const TTS_ENDPOINT = 'wss://api.cartesia.ai/tts/websocket';
const STT_ENDPOINT = 'wss://api.cartesia.ai/stt/websocket';

export class CartesiaAudioBridge {
  constructor(options = {}) {
    this.options = options;
    this.apiKey = options.apiKey ?? DEFAULT_API_KEY;
    this.voiceId = options.voiceId || DEFAULT_VOICE_ID;
    this.language = options.language || 'en';
    /** sonic-turbo: 40ms first byte; sonic-3: 90ms (more emotive, better quality) */
    this.ttsModel = options.ttsModel || 'sonic-3';

    this.audioContext = null;
    this.sttNode = null;
    this.sttGainNode = null;
    this.sttAnalyserNode = null;
    this.mediaStream = null;
    this.sttWs = null;
    this.ttsWs = null;
    this.vad = null;
    this.wakeWordManager = null;
    this._wakeWordActive = false;
    this._lastWakeWordDetectionTime = 0; // Cooldown period tracking
    this._wakeWordCooldownMs = 3000; // 3 seconds cooldown (per wAkE wOrD dOcS.md)
    /** Single-flight: avoid concurrent init attempts */
    this._initWakeWordPromise = null;
    this.contextIdCounter = 0;
    this._ttsDoneResolvers = new Map();
    this._ttsConnectPromise = null;
    this._sttConnectPromise = null;
    this._sttStreaming = false;
    this._preSpeechBuffer = [];
    this._preSpeechMaxChunks = Math.ceil((VAD_CONFIG.preSpeechPadMs || 800) / STT_CHUNK_MS);

    this.onTranscript = options.onTranscript || (() => {});
    this.onTTSChunk = options.onTTSChunk || (() => {});
    this.onError = options.onError || (() => {});
    this.onSpeechStart = options.onSpeechStart || (() => {});
    this.onSpeechEnd = options.onSpeechEnd || (() => {});
    this.onVADMisfire = options.onVADMisfire || (() => {});
    /** Called when wake word is detected (if wake word is enabled) */
    this.onWakeWordDetected = options.onWakeWordDetected || (() => {});
    /** Called when STT is stopped (user or programmatic) so UI can sync mic button */
    this.onSTTStopped = options.onSTTStopped || (() => {});
    /** Called when STT becomes active (either immediately or after wake word detection) */
    this.onSTTStarted = options.onSTTStarted || (() => {});
    /** Partial transcript (live real-time) */
    this.onPartialTranscript = options.onPartialTranscript || (() => {});
    /** Called once per ~10s silence with a British closing phrase; then bridge goes INACTIVE */
    this.onSilenceClosingMessage = options.onSilenceClosingMessage || (() => {});
    /** True while mic is on and STT pipeline is active */
    this._sttActive = false;
    /** Timer: auto-stop mic after silence following speech end (VAD-driven) */
    this._silenceStopTimer = null;
    /** Timer: ~10s silence → single closing message then INACTIVE (fires once per timeout) */
    this._silenceClosingTimer = null;
    /** Timer: delay after TTS before starting the 10s countdown (playback drain) */
    this._silenceClosingDelayTimer = null;
    /** Pending final transcript: buffer until silence-after-speech timer fires, then send to agent */
    this._pendingFinalTranscript = null;
    /** Last transcript text (partial or final) — fallback when final arrives late or never */
    this._lastTranscriptText = '';
    /** True if we received any transcript in the current speech segment (so we only clear the silence stop timer on new speech that follows real speech, not noise) */
    this._hadTranscriptFromPreviousSegment = false;
    /** Timer: force-stop mic after maxListeningMs so it always stops even if onSpeechEnd never fires */
    this._maxListeningTimer = null;
    /** Input gain for mic (1 = normal; >1 boost for quiet mics). Applied before STT. */
    this._inputGain = Math.max(0.5, Math.min(3, Number(options.inputGain) || 1));
    /** Level meter: interval and callback for UI */
    this._levelMeterInterval = null;
    this._levelMeterCallback = null;
    /** Audio recording: buffer for capturing audio chunks during STT */
    this._recordedAudioChunks = [];
    this._isRecordingAudio = false;
    /** Counter for tracking chunks sent to STT (for debugging VAD payload flow) */
    this._sttChunkSendCount = 0;
  }

  /** Set mic input gain (0.5–3). Use when STT is active to boost quiet mics. */
  setInputGain(value) {
    const g = Math.max(0.5, Math.min(3, Number(value) || 1));
    this._inputGain = g;
    if (this.sttGainNode) this.sttGainNode.gain.value = g;
  }

  /** Current input gain (0.5–3). */
  getInputGain() {
    return this._inputGain;
  }

  /** Start reporting mic input level (0–1) to callback. Call stopLevelMeter when STT stops. */
  startLevelMeter(callback) {
    this.stopLevelMeter();
    if (!this.sttAnalyserNode || typeof callback !== 'function') return;
    this._levelMeterCallback = callback;
    const data = new Float32Array(this.sttAnalyserNode.fftSize);
    this._levelMeterInterval = setInterval(() => {
      if (!this.sttAnalyserNode || !this._levelMeterCallback) return;
      this.sttAnalyserNode.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 4);
      this._levelMeterCallback(level);
    }, 80);
  }

  stopLevelMeter() {
    if (this._levelMeterInterval) {
      clearInterval(this._levelMeterInterval);
      this._levelMeterInterval = null;
    }
    this._levelMeterCallback = null;
  }

  /**
   * Get recorded audio chunks as base64 string.
   * Returns null if no audio was recorded or if audio is too large.
   * @returns {string|null} Base64 encoded PCM audio data (pcm_s16le @ 16kHz)
   */
  getRecordedAudioBase64() {
    if (!this._recordedAudioChunks || this._recordedAudioChunks.length === 0) {
      return null;
    }
    // Calculate total size and validate chunks
    let totalSize = 0;
    for (const chunk of this._recordedAudioChunks) {
      if (!(chunk instanceof Uint8Array)) {
        DEBUG.error('Invalid audio chunk type', { type: typeof chunk, isUint8Array: chunk instanceof Uint8Array });
        return null;
      }
      totalSize += chunk.length;
    }
    if (totalSize === 0) return null;
    // Limit audio size to prevent huge payloads (15MB binary = ~20MB base64)
    const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15 MB
    if (totalSize > MAX_AUDIO_SIZE) {
      DEBUG.error('Recorded audio too large', { size: totalSize, max: MAX_AUDIO_SIZE });
      return null;
    }
    // Combine all chunks into a single Uint8Array
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of this._recordedAudioChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    // Convert to base64 - use efficient method for large arrays
    // Build binary string in chunks to avoid stack overflow
    try {
      const CHUNK_SIZE = 0x8000; // 32KB chunks - safe for apply()
      const chunks = [];
      for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
        const end = Math.min(i + CHUNK_SIZE, combined.length);
        const chunk = combined.subarray(i, end);
        // Convert chunk to array for apply() - chunk size is safe (32KB max)
        const chunkArray = Array.from(chunk);
        chunks.push(String.fromCharCode.apply(null, chunkArray));
      }
      const binary = chunks.join('');
      return btoa(binary);
    } catch {
      // Fallback: if apply() fails, use byte-by-byte method (slower but always works)
      try {
        let binary = '';
        for (let i = 0; i < combined.length; i++) {
          binary += String.fromCharCode(combined[i]);
        }
        return btoa(binary);
      } catch (fallbackErr) {
        DEBUG.error('Failed to encode audio to base64', { error: fallbackErr, size: totalSize });
        return null;
      }
    }
  }

  /**
   * Clear recorded audio chunks.
   */
  clearRecordedAudio() {
    this._recordedAudioChunks = [];
  }

  /** Whether the mic/STT pipeline is currently running (for UI sync) */
  isSTTActive() {
    return this._sttActive === true;
  }

  /** Whether wake word detection is enabled and waiting for wake word */
  isWakeWordWaiting() {
    return this.options.wakeWordEnabled && 
           this.wakeWordManager && 
           this.wakeWordManager.isEnabled() && 
           !this._wakeWordActive && 
           !this._sttActive;
  }

  /** Whether wake word detection is enabled */
  isWakeWordEnabled() {
    return this.options.wakeWordEnabled && 
           this.wakeWordManager && 
           this.wakeWordManager.isEnabled();
  }

  /**
   * Get wake word performance metrics (per wAkE wOrD dOcS.md Section 10)
   * @returns {Object|null} Metrics object or null if wake word not initialized
   */
  getWakeWordMetrics() {
    if (!this.wakeWordManager) {
      return null;
    }
    return this.wakeWordManager.getMetrics();
  }

  /**
   * Reset wake word performance metrics
   */
  resetWakeWordMetrics() {
    if (this.wakeWordManager) {
      this.wakeWordManager.resetMetrics();
    }
  }

  /**
   * Set wake word cooldown period (in milliseconds)
   * Prevents re-triggering within the specified time window
   * @param {number} cooldownMs Cooldown period in milliseconds (default: 3000)
   */
  setWakeWordCooldown(cooldownMs) {
    if (typeof cooldownMs !== 'number' || cooldownMs < 0) {
      DEBUG.error('Invalid wake word cooldown value', { cooldownMs });
      return;
    }
    this._wakeWordCooldownMs = cooldownMs;
    if (this.wakeWordManager) {
      this.wakeWordManager.setCooldownMs(cooldownMs);
    }
    DEBUG.trace('Wake word cooldown period set', { cooldownMs });
  }

  /**
   * Start the 10s "agent silence" timer. Call when the agent finishes speaking (TTS done).
   * Waits silenceClosingDelayAfterTtsMs first (so playback can finish), then after 10s of
   * no user speech fires onSilenceClosingMessage with a phrase, then stopSTT.
   * Cleared automatically on user speech (onSpeechStart) or stopSTT.
   */
  startAgentSilenceTimer() {
    const closingMs = VAD_CONFIG.silenceClosingMessageMs ?? 0;
    const delayMs = VAD_CONFIG.silenceClosingDelayAfterTtsMs ?? 0;
    const phrases = VAD_CONFIG.silenceClosingPhrases;
    if (closingMs <= 0 || !Array.isArray(phrases) || phrases.length === 0) return;
    this._clearSilenceClosingTimer();
    const startCountdown = () => {
      this._silenceClosingTimer = setTimeout(() => {
        this._silenceClosingTimer = null;
        const validPhrases = phrases.filter((p) => typeof p === 'string' && p.trim().length > 0);
        const phrase = validPhrases.length > 0
          ? validPhrases[Math.floor(Math.random() * validPhrases.length)].trim()
          : '';
        DEBUG.trace('10s after agent spoke: firing onSilenceClosingMessage', { phrase });
        try {
          if (phrase) this.onSilenceClosingMessage(phrase);
        } finally {
          this.stopSTT();
        }
      }, closingMs);
    };
    if (delayMs > 0) {
      this._silenceClosingDelayTimer = setTimeout(() => {
        this._silenceClosingDelayTimer = null;
        startCountdown();
      }, delayMs);
    } else {
      startCountdown();
    }
  }

  /**
   * Check if the browser can record audio (secure context + mediaDevices + getUserMedia).
   * @returns {{ supported: boolean, message?: string }}
   */
  static checkRecordingSupport() {
    if (typeof navigator === 'undefined') {
      return { supported: false, message: 'Not in a browser environment.' };
    }
    if (typeof window === 'undefined' || !window.isSecureContext) {
      return {
        supported: false,
        message: 'Microphone requires HTTPS or localhost. Open this page over HTTPS or run locally.',
      };
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      return {
        supported: false,
        message: 'This browser does not support microphone access. Try Chrome, Firefox, or Edge.',
      };
    }
    return { supported: true };
  }

  /**
   * Get a user-friendly error message for getUserMedia failures.
   * @param {DOMException|Error} err
   * @returns {string}
   */
  static getMicrophoneErrorMessage(err) {
    if (!err) return 'Microphone error.';
    const name = err.name || '';
    const msg = err.message || '';
    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone access was denied. Please allow microphone permission and try again.';
      case 'NotFoundError':
        return 'No microphone found. Connect a microphone and try again.';
      case 'NotSupportedError':
      case 'SecurityError':
        return 'Microphone is not available. Use HTTPS or localhost.';
      case 'AbortError':
        return 'Microphone access was aborted.';
      case 'NotReadableError':
        return 'Microphone is in use by another app. Close other apps using the mic and try again.';
      case 'OverconstrainedError':
        return 'Microphone does not meet requirements. Try a different device or browser.';
      default:
        return msg || 'Microphone error. Please check permissions and try again.';
    }
  }

  /**
   * Initialize wake word for always-listening mode (independent of STT)
   * This allows wake word to be active even when STT is not running
   */
  /**
   * Initialize wake word detection for always-listening mode
   * @returns {Promise<{success: boolean, reason?: string}>} Promise that always resolves with result
   */
  /** True when openWakeWord is configured. */
  _hasWakeWordConfig() {
    return !!(this.options.useOpenWakeWord && this.options.openWakeWordWsUrl);
  }

  async initWakeWord() {
    if (!this.options.wakeWordEnabled || !this._hasWakeWordConfig()) {
      return { success: false, reason: 'Wake word not enabled or missing config (set VITE_USE_OPENWAKEWORD=true and VITE_OPENWAKEWORD_WS_URL)' };
    }
    if (this.wakeWordManager) {
      DEBUG.trace('Wake word already initialized, ensuring it\'s enabled');
      // Re-enable wake word if it was disabled (e.g., after STT stopped)
      if (!this.wakeWordManager.isEnabled()) {
        this.wakeWordManager.setEnabled(true);
        DEBUG.trace('Wake word re-enabled for always-listening mode');
      }
      return { success: true, reason: 'Already initialized' };
    }

    // Single-flight: if init is already in progress, wait for it
    if (this._initWakeWordPromise) {
      try {
        return await this._initWakeWordPromise;
      } catch (e) {
        return { success: false, reason: e?.message || String(e) };
      }
    }

    const internalPromise = this._initOpenWakeWord();
    this._initWakeWordPromise = internalPromise;
    internalPromise.catch(() => {}).finally(() => { this._initWakeWordPromise = null; });

    try {
      return await internalPromise;
    } catch (err) {
      const errorMsg = err?.message || String(err) || 'Unknown error';
      DEBUG.error('Wake word initialization failed', err);
      if (this.options.wakeWordEnabled) {
        const msg = `Wake word unavailable: ${errorMsg}. You can still use the microphone button to activate.`;
        logWakeWordError(msg, err);
        this.onError(msg);
      }
      return { success: false, reason: errorMsg, gracefulDegradation: true };
    }
  }

  /**
   * Request microphone permission and start wake word only (no STT until "Jarvis" is said).
   * Call this from a user gesture (e.g. "Start listening" button) when on-load init failed due to permission.
   * After this succeeds, wake word listens with no further clicks; saying the wake word activates STT.
   * @returns {Promise<{success: boolean, reason?: string}>}
   */
  async ensureWakeWordListening() {
    if (!this.options.wakeWordEnabled || !this._hasWakeWordConfig()) {
      return { success: false, reason: 'Wake word not enabled or missing config (set VITE_USE_OPENWAKEWORD=true and VITE_OPENWAKEWORD_WS_URL)' };
    }
    if (this.wakeWordManager && this.wakeWordManager.isEnabled()) {
      return { success: true, reason: 'Already listening' };
    }
    // Create AudioContext BEFORE any await — user gesture must be in the call stack.
    // Otherwise: "The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture."
    if (!this.audioContext || this.audioContext.state === 'closed') {
      await this.init();
    }
    if (!this.mediaStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.mediaStream = stream;
        DEBUG.trace('ensureWakeWordListening: getUserMedia OK');
      } catch (gumErr) {
        DEBUG.error('ensureWakeWordListening: getUserMedia failed', gumErr);
        const msg = CartesiaAudioBridge.getMicrophoneErrorMessage(gumErr);
        return { success: false, reason: msg };
      }
    }
    return await this.initWakeWord();
  }

  /**
   * Initialize wake word using openWakeWord backend (Python WebSocket server).
   * @private
   * @returns {Promise<{success: boolean, reason?: string}>}
   */
  async _initOpenWakeWord() {
    await this.init();
    if (!this.mediaStream) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        DEBUG.trace('initWakeWord (openWakeWord): getUserMedia OK');
      } catch (gumErr) {
        DEBUG.error('initWakeWord (openWakeWord): getUserMedia failed', gumErr);
        const msg = CartesiaAudioBridge.getMicrophoneErrorMessage(gumErr);
        return { success: false, reason: `Microphone permission needed: ${msg}` };
      }
    }
    this.wakeWordManager = new OpenWakeWordManager({
      wsUrl: this.options.openWakeWordWsUrl,
      cooldownMs: this._wakeWordCooldownMs,
      onWakeWordDetected: (keywordIndex) => this._onWakeWordDetected(keywordIndex),
      onError: (error) => {
        // The manager already logs via logWakeWordError, so we don't log again here
        // This prevents duplicate error messages in the console
        // We just notify the bridge so it can update UI state
        if (this.options.wakeWordEnabled) {
          this.onError(error);
        }
      },
    });
    const result = await this.wakeWordManager.initialize(
      this.audioContext,
      this.mediaStream,
      this.options.audioWorkletBasePath
    );
    if (!result) {
      return { success: false, reason: 'OpenWakeWord initialization returned null' };
    }
    this.wakeWordManager.setEnabled(true);
    DEBUG.trace('Wake word initialized (openWakeWord)');
    // OPTIMIZATION: Pre-connect STT WebSocket for minimal latency
    if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN) {
      try {
        await this.connectSTTWebSocket();
        DEBUG.trace('Wake word: STT WebSocket pre-connected');
      } catch (err) {
        DEBUG.warn('Wake word: STT pre-connect failed (will retry on detection)', err);
      }
    }
    // OPTIMIZATION: Pre-connect TTS WebSocket for optimal bidirectional flow latency
    // This ensures TTS is ready immediately when transcript is received, reducing end-to-end latency
    // Note: We only pre-connect the WebSocket here; audio graph setup happens in connectTTS() when needed
    if (this.apiKey && (!this.ttsWs || this.ttsWs.readyState !== WebSocket.OPEN)) {
      // Skip if already connecting (avoid race condition with connectTTS())
      if (this.ttsWs && this.ttsWs.readyState === WebSocket.CONNECTING) {
        DEBUG.trace('Wake word: TTS WebSocket already connecting, skipping pre-connect');
      } else if (this._ttsConnectPromise) {
        DEBUG.trace('Wake word: TTS connection promise exists, skipping pre-connect');
      } else {
        try {
          // Use a lightweight pre-connection that just establishes the WebSocket
          // The full connectTTS() will handle audio graph setup when TTS is actually needed
          const url = new URL(TTS_ENDPOINT);
          url.searchParams.set('api_key', this.apiKey);
          url.searchParams.set('cartesia_version', CARTESIA_VERSION);
          
          // Clean up existing connection if any
          if (this.ttsWs) {
            try {
              this.ttsWs.onopen = null;
              this.ttsWs.onerror = null;
              this.ttsWs.onclose = null;
              this.ttsWs.onmessage = null;
              if (this.ttsWs.readyState !== WebSocket.CLOSED) {
                this.ttsWs.close(1000, 'reconnect');
              }
            } catch {
              // Ignore cleanup errors
            }
          }
          
          this.ttsWs = new WebSocket(url.toString());
          this.ttsWs.binaryType = 'arraybuffer';
          
          // Set up basic message handler (will be replaced by full handler in connectTTS() when audio graph is set up)
          // Mark it so connectTTS() knows to replace it
          this.ttsWs.onmessage = function preConnectHandler(e) {
            try {
              if (typeof e.data === 'string') {
                const msg = JSON.parse(e.data);
                if (msg.type === 'error') {
                  DEBUG.error('TTS WebSocket error message (pre-connect)', msg);
                }
              }
            } catch (err) {
              // Ignore parsing errors during pre-connect - full handler will be set in connectTTS()
              DEBUG.trace('TTS WebSocket message during pre-connect (will be handled by connectTTS)', { error: err });
            }
          };
          // Mark the handler so connectTTS() can detect and replace it
          this.ttsWs.onmessage._isPreConnectHandler = true;
          
          // Create promise to track connection state (prevents race conditions with connectTTS())
          this._ttsConnectPromise = new Promise((resolve, reject) => {
            let settled = false;
            const timeout = setTimeout(() => {
              if (!settled && this.ttsWs && this.ttsWs.readyState !== WebSocket.OPEN) {
                settled = true;
                this._ttsConnectPromise = null;
                reject(new Error('TTS WebSocket pre-connect timeout'));
              }
            }, 5000);
            
            this.ttsWs.onopen = () => {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                this._ttsConnectPromise = null; // Clear promise on success
                DEBUG.trace('Wake word: TTS WebSocket pre-connected for optimal bidirectional latency');
                resolve();
              }
            };
            
            this.ttsWs.onerror = () => {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                this._ttsConnectPromise = null; // Clear promise on error
                reject(new Error('TTS WebSocket pre-connect failed'));
              }
            };
            
            this.ttsWs.onclose = (ev) => {
              if (!settled) {
                settled = true;
                clearTimeout(timeout);
                this._ttsConnectPromise = null; // Clear promise on close
                if (ev.code !== 1000) {
                  reject(new Error(`TTS WebSocket closed during pre-connect (code: ${ev.code})`));
                } else {
                  resolve(); // Normal closure
                }
              }
            };
          });
          
          // Wait for connection (non-blocking - don't fail wake word init if this fails)
          await this._ttsConnectPromise.catch((err) => {
            // Clear promise on error so connectTTS() can retry
            this._ttsConnectPromise = null;
            throw err;
          });
        } catch (err) {
          DEBUG.warn('Wake word: TTS pre-connect failed (will retry when needed)', err);
          // Don't fail wake word init if TTS pre-connect fails - connectTTS() will handle it on demand
          // This is non-critical since TTS is only needed after STT completes
          this._ttsConnectPromise = null; // Ensure promise is cleared
        }
      }
    }
    if (!this.sttNode && this.mediaStream && this.audioContext) {
      try {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.sttGainNode = this.audioContext.createGain();
        this.sttGainNode.gain.value = this._inputGain;
        this.sttAnalyserNode = this.audioContext.createAnalyser();
        this.sttAnalyserNode.fftSize = 256;
        const basePath = this.options.audioWorkletBasePath || './audio/';
        const processorPath = basePath.endsWith('/') ? `${basePath}stt-capture-processor.js` : `${basePath}/stt-capture-processor.js`;
        const absolutePath = processorPath.startsWith('http') ? processorPath : new URL(processorPath, window.location.origin).href;
        await this.audioContext.audioWorklet.addModule(absolutePath);
        this.sttNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
        source.connect(this.sttGainNode);
        this.sttGainNode.connect(this.sttNode);
        this.sttGainNode.connect(this.sttAnalyserNode);
        this._preSpeechBuffer = [];
        this._sttStreaming = false;
        let _preSetupChunkCount = 0;
        this.sttNode.port.onmessage = (e) => {
          try {
            if (!e?.data || e.data.type !== 'audio' || !e.data.data) return;
            _preSetupChunkCount++;
            const buf = e.data.data;
            if (!(buf instanceof ArrayBuffer)) return;
            if (_preSetupChunkCount <= 3 || _preSetupChunkCount % 50 === 0) {
              DEBUG.trace('VAD: Audio chunk received (pre-setup)', { 
                chunk: _preSetupChunkCount, 
                size: buf.byteLength,
                streaming: this._sttStreaming,
                bufferSize: this._preSpeechBuffer.length 
              });
            }
            if (this._isRecordingAudio) {
              try { this._recordedAudioChunks.push(new Uint8Array(buf)); } catch (err) { void err; }
            }
            if (this._sttStreaming) {
              this._sendChunkToSTT(buf);
            } else {
              this._preSpeechBuffer.push(buf);
              if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) this._preSpeechBuffer.shift();
            }
          } catch (err) {
            DEBUG.error('STT processor message (openWakeWord pre-set)', { error: err });
          }
        };
        this.sttNode.port.onerror = (err) => {
          DEBUG.error('STT AudioWorklet processor error (openWakeWord pre-set)', { error: err });
        };
        DEBUG.trace('Wake word: STT audio graph and handler pre-set');
      } catch (err) {
        DEBUG.warn('Wake word: STT graph pre-setup failed', err);
      }
    }
    // OPTIMIZATION: Pre-start VAD for low latency
    if (!this.vad && this.mediaStream) {
      try {
        const vadOptions = {
          model: VAD_CONFIG.model,
          redemptionMs: VAD_CONFIG.redemptionMs,
          preSpeechPadMs: VAD_CONFIG.preSpeechPadMs,
          minSpeechMs: VAD_CONFIG.minSpeechMs,
          positiveSpeechThreshold: VAD_CONFIG.positiveSpeechThreshold,
          negativeSpeechThreshold: VAD_CONFIG.negativeSpeechThreshold,
          submitUserSpeechOnPause: VAD_CONFIG.submitUserSpeechOnPause,
          baseAssetPath: VAD_CONFIG.baseAssetPath,
          onnxWASMBasePath: VAD_CONFIG.onnxWASMBasePath,
          getStream: () => {
            const stream = Promise.resolve(this.mediaStream);
            DEBUG.trace('VAD getStream() called', { 
              hasStream: !!this.mediaStream, 
              streamId: this.mediaStream?.id,
              tracks: this.mediaStream?.getTracks()?.length 
            });
            return stream;
          },
          onSpeechStart: () => {
            if (this._sttActive) {
              DEBUG.trace('VAD onSpeechStart (wake word pre-setup) - enabling STT streaming');
              // Always clear the silence stop timer when user speaks again - this allows conversations to go back and forth
              this._clearSilenceStopTimer();
              this._hadTranscriptFromPreviousSegment = false;
              this._clearMaxListeningTimer();
              this._recordedAudioChunks = [];
              this._isRecordingAudio = true;
              this._sttChunkSendCount = 0; // Reset chunk counter for new speech segment
              this._sttStreaming = true;
              this._flushPreSpeechBuffer();
              this.onSpeechStart();
            }
          },
          onSpeechEnd: async () => {
            if (this._sttActive) {
              DEBUG.trace('VAD onSpeechEnd (wake word pre-setup) - sending finalize', {
                chunksSent: this._sttChunkSendCount
              });
              this._sttStreaming = false;
              this._isRecordingAudio = false;
              this.onSpeechEnd();
              if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
                try {
                  this.sttWs.send('finalize');
                  DEBUG.trace('VAD: Sent finalize to STT (wake word pre-setup)', { totalChunksSent: this._sttChunkSendCount });
                } catch (err) {
                  DEBUG.error('Error sending finalize to STT', err);
                }
              }
              const silenceMs = VAD_CONFIG.silenceAfterSpeechToStopMicMs ?? 2500;
              this._silenceStopTimer = setTimeout(() => {
                this._silenceStopTimer = null;
                this._stopSTTAndSendTranscript();
              }, silenceMs);
            }
          },
          onVADMisfire: () => {
            if (this._sttActive) {
              this.onVADMisfire();
            }
          },
        };
        this.vad = await MicVAD.new(vadOptions);
        await this.vad.start();
        DEBUG.trace('Wake word (openWakeWord): VAD pre-started for low latency');
      } catch (err) {
        DEBUG.warn('Wake word (openWakeWord): Failed to pre-start VAD (will start on detection)', err);
      }
    }
    return { success: true };
  }

  async init() {
    if (this.audioContext) {
      // If AudioContext exists but is suspended, resume it
      if (this.audioContext.state === 'suspended') {
        DEBUG.trace('AudioContext is suspended, resuming...');
        try {
          await this.audioContext.resume();
          DEBUG.trace('AudioContext resumed successfully', { state: this.audioContext.state });
        } catch (err) {
          DEBUG.error('Failed to resume AudioContext', { error: err });
          throw new Error(`Failed to resume AudioContext: ${err.message || err}. AudioContext must be resumed after a user gesture.`);
        }
      }
      // If TTS node doesn't exist but AudioContext does, create it
      if (!this.ttsNode && this.audioContext.state === 'running') {
        DEBUG.trace('AudioContext exists but TTS node missing, creating TTS node...');
        try {
          const basePath = this.options.audioWorkletBasePath || './audio/';
          const ttsPath = basePath.endsWith('/') 
            ? `${basePath}tts-playback-processor.js`
            : `${basePath}/tts-playback-processor.js`;
          const ttsAbsolute = ttsPath.startsWith('http') ? ttsPath : new URL(ttsPath, window.location.origin).href;
          try {
            await this.audioContext.audioWorklet.addModule(ttsAbsolute);
          } catch (err) {
            if (err.message && !err.message.includes('already been added')) {
              throw err;
            }
            DEBUG.trace('TTS processor already loaded, continuing...');
          }
          this.ttsNode = new AudioWorkletNode(this.audioContext, 'tts-playback-processor');
          this.ttsNode.connect(this.audioContext.destination);
          DEBUG.trace('TTS AudioWorkletNode created and connected to destination');
          this.ttsNode.port.onerror = (err) => {
            DEBUG.error('TTS AudioWorklet processor error', { error: err });
            this.onError('TTS AudioWorklet processor error. Check console for details.');
          };
        } catch (err) {
          DEBUG.error('Failed to create TTS AudioWorkletNode', { error: err });
          throw new Error(`Failed to create TTS AudioWorkletNode. ${err.message || err}`);
        }
      }
      return this.audioContext;
    }
    
    // Check AudioWorklet support
    if (!window.AudioWorkletNode) {
      throw new Error('AudioWorklet is not supported in this browser. Use Chrome, Firefox, Edge, or Safari 14.1+.');
    }
    
    try {
      this.audioContext = new AudioContext();
      DEBUG.trace('AudioContext created', { state: this.audioContext.state });
      if (this.audioContext.state === 'suspended') {
        DEBUG.trace('AudioContext is suspended, resuming...');
        await this.audioContext.resume();
        DEBUG.trace('AudioContext resumed', { state: this.audioContext.state });
      }
      DEBUG.trace('AudioContext created', { state: this.audioContext.state, sampleRate: this.audioContext.sampleRate });
      
      // Resolve AudioWorklet module paths (use absolute URL for reliable loading)
      let basePath = this.options.audioWorkletBasePath || './audio/';
      if (!basePath.endsWith('/')) {
        basePath += '/';
      }
      const sttPath = `${basePath}stt-capture-processor.js`;
      const ttsPath = `${basePath}tts-playback-processor.js`;
      const sttAbsolute = sttPath.startsWith('http') ? sttPath : new URL(sttPath, window.location.origin).href;
      const ttsAbsolute = ttsPath.startsWith('http') ? ttsPath : new URL(ttsPath, window.location.origin).href;
      DEBUG.trace('Loading AudioWorklet modules', { sttPath: sttAbsolute, ttsPath: ttsAbsolute });
      // Load STT processor
      try {
        await this.audioContext.audioWorklet.addModule(sttAbsolute);
        DEBUG.trace('STT capture processor loaded successfully');
      } catch (err) {
        DEBUG.error('Failed to load STT processor', { path: sttPath, error: err });
        throw new Error(`Failed to load STT AudioWorklet processor from ${sttAbsolute}. Check that the file exists and is accessible. ${err.message || err}`);
      }
      // Load TTS processor
      try {
        await this.audioContext.audioWorklet.addModule(ttsAbsolute);
        DEBUG.trace('TTS playback processor loaded successfully');
      } catch (err) {
        DEBUG.error('Failed to load TTS processor', { path: ttsPath, error: err });
        throw new Error(`Failed to load TTS AudioWorklet processor from ${ttsAbsolute}. Check that the file exists and is accessible. ${err.message || err}`);
      }
      
      // Create and connect TTS node
      try {
        this.ttsNode = new AudioWorkletNode(this.audioContext, 'tts-playback-processor');
        this.ttsNode.connect(this.audioContext.destination);
        DEBUG.trace('TTS AudioWorkletNode created and connected to destination');
        
        // Handle TTS processor errors
        this.ttsNode.port.onerror = (err) => {
          DEBUG.error('TTS AudioWorklet processor error', { error: err });
          this.onError('TTS AudioWorklet processor error. Check console for details.');
        };
      } catch (err) {
        DEBUG.error('Failed to create TTS AudioWorkletNode', { error: err });
        throw new Error(`Failed to create TTS AudioWorkletNode. Ensure processors are loaded. ${err.message || err}`);
      }
      
      return this.audioContext;
    } catch (err) {
      // Cleanup on failure
      if (this.audioContext) {
        try {
          await this.audioContext.close();
        } catch {
          // Ignore cleanup errors
        }
        this.audioContext = null;
      }
      throw err;
    }
  }

  async connectSTTWebSocket() {
    // Already connected
    if (this.sttWs?.readyState === WebSocket.OPEN) return Promise.resolve();
    // Connection in progress: wait for it instead of rejecting
    if (this.sttWs?.readyState === WebSocket.CONNECTING && this._sttConnectPromise) {
      return this._sttConnectPromise;
    }

    // Cartesia STT: config via URL query params (not first message). @cartesia/cartesia-js SDK style.
    const url = new URL(STT_ENDPOINT);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('cartesia_version', CARTESIA_VERSION);
    url.searchParams.set('model', 'ink-whisper');
    url.searchParams.set('encoding', 'pcm_s16le');
    url.searchParams.set('sample_rate', '16000');
    url.searchParams.set('language', this.language);
    url.searchParams.set('min_volume', '0.0');
    url.searchParams.set('max_silence_duration_secs', '4.0');
    DEBUG.trace('STT WebSocket connecting', { url: STT_ENDPOINT });
    
    // Clean up existing connection if any
    if (this.sttWs) {
      try {
        this.sttWs.onopen = null;
        this.sttWs.onerror = null;
        this.sttWs.onclose = null;
        this.sttWs.onmessage = null;
        if (this.sttWs.readyState !== WebSocket.CLOSED) {
          this.sttWs.close(1000, 'reconnect');
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    
    let connectPromise;
    connectPromise = new Promise((resolve, reject) => {
      this._sttConnectPromise = connectPromise;
      this.sttWs = new WebSocket(url.toString());
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled && this.sttWs && this.sttWs.readyState !== WebSocket.OPEN) {
          settled = true;
          this._sttConnectPromise = null;
          try {
            this.sttWs.close();
          } catch {
            // Ignore close errors
          }
          reject(new Error('STT WebSocket connection timeout'));
        }
      }, 180000); // 3 minutes

      const settle = (fn) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this._sttConnectPromise = null;
          fn();
        }
      };

      this.sttWs.onopen = () => {
        settle(() => {
          DEBUG.trace('STT WebSocket open');
          /* eslint-disable no-console */
          if (typeof console !== 'undefined' && console.log) {
            console.log('[JARVIS] STT WebSocket connected successfully');
          }
          /* eslint-enable no-console */
          resolve();
        });
      };
      this.sttWs.onmessage = (e) => {
        if (typeof e.data !== 'string') return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'transcript') {
            const text = (msg.text != null ? String(msg.text) : '').trim();
            if (text) {
              this._lastTranscriptText = text;
              this._hadTranscriptFromPreviousSegment = true;
            }
            DEBUG.trace('STT transcript', { text: text.slice(0, 50), is_final: msg.is_final });
            this.onPartialTranscript(msg.text, msg.is_final);
            if (msg.is_final && text) {
              this._pendingFinalTranscript = { text, request_id: msg.request_id || '' };
              /* eslint-disable no-console -- pipeline diagnostic: transcript ready */
              if (typeof console !== 'undefined' && console.log) {
                console.log('[JARVIS Wake Word] STT final transcript received — will send to agent when mic stops', { preview: text.slice(0, 60) });
              }
              /* eslint-enable no-console */
            }
          } else if (msg.type === 'error' || msg.error) {
            const sttErr = msg.error ?? msg.message ?? (typeof msg === 'string' ? msg : JSON.stringify(msg));
            DEBUG.error('STT server error', sttErr, msg);
            try {
              this.onError(typeof sttErr === 'string' ? sttErr : 'STT error. Check API key and Cartesia status.');
            } catch { /* ignore */ }
          } else if (DEBUG.enabled) {
            DEBUG.trace('STT message', { type: msg.type });
          }
        } catch { /* ignore */ }
      };
      this.sttWs.onerror = (err) => {
        settle(() => {
          DEBUG.error('STT WebSocket error', err);
          /* eslint-disable no-console */
          if (typeof console !== 'undefined' && console.error) {
            console.error('[JARVIS] STT WebSocket connection error', err);
          }
          /* eslint-enable no-console */
          reject(new Error('STT WebSocket connection failed. Please check your API key and internet connection.'));
        });
      };
      this.sttWs.onclose = (ev) => {
        if (!settled) {
          clearTimeout(timeout);
          // If connection closed before opening (unexpected close), reject the promise
          // This is a safety check - onerror should fire first, but browsers can be inconsistent
          if (ev && ev.code !== 1000 && ev.code !== 1001) {
            // Not a normal close (1000) or going away (1001) - likely an error
            settled = true;
            this._sttConnectPromise = null;
            reject(new Error(`STT WebSocket closed unexpectedly (code: ${ev.code}, reason: ${ev.reason || 'none'})`));
          }
        }
        DEBUG.trace('STT WebSocket closed', { code: ev?.code, reason: ev?.reason });
      };
    });
    return connectPromise;
  }

  _sendChunkToSTT(arrayBuffer) {
    // Verify STT node exists (safeguard)
    if (!this.sttNode && this._sttActive) {
      DEBUG.error('_sendChunkToSTT: STT node not initialized but STT is active');
      this.onError('STT audio node not available. Please try clicking the mic button again.');
      return;
    }
    if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN || !this._sttStreaming) {
      if (this._sttStreaming && (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN)) {
        DEBUG.warn('STT WebSocket not open, cannot send chunk', { 
          hasWs: !!this.sttWs, 
          readyState: this.sttWs?.readyState 
        });
        // Attempt to reconnect if connection was lost
        if (this.sttWs && this.sttWs.readyState === WebSocket.CLOSED && this._sttActive) {
          DEBUG.trace('STT WebSocket closed, attempting reconnection...');
          this.connectSTTWebSocket().catch((err) => {
            DEBUG.error('STT WebSocket reconnection failed', err);
            this.onError('STT connection lost. Please try again.');
          });
        }
      }
      return;
    }
    // MDN: bufferedAmount = bytes not yet transmitted; apply backpressure to avoid memory/CPU issues
    const backpressureLimit = 256 * 1024; // 256 KB
    if (this.sttWs.bufferedAmount > backpressureLimit) {
      DEBUG.trace('STT backpressure: skipping chunk (bufferedAmount)', this.sttWs.bufferedAmount);
      return;
    }
    try {
      this._sttChunkSendCount++;
      if (this._sttChunkSendCount <= 3 || this._sttChunkSendCount % 50 === 0) {
        DEBUG.trace('VAD: Sending chunk to STT WebSocket', { 
          chunk: this._sttChunkSendCount, 
          size: arrayBuffer.byteLength,
          bufferedAmount: this.sttWs.bufferedAmount 
        });
      }
      this.sttWs.send(arrayBuffer);
    } catch (err) {
      DEBUG.error('Error sending STT chunk', { error: err, readyState: this.sttWs?.readyState });
      // If send fails, the WebSocket is likely closed - stop streaming
      this._sttStreaming = false;
      // Attempt to reconnect if connection was lost
      if (this.sttWs && this.sttWs.readyState === WebSocket.CLOSED && this._sttActive) {
        DEBUG.trace('STT WebSocket send failed, attempting reconnection...');
        this.connectSTTWebSocket().catch((reconnectErr) => {
          DEBUG.error('STT WebSocket reconnection failed', reconnectErr);
          this.onError('STT connection lost. Please try again.');
        });
      }
    }
  }

  _flushPreSpeechBuffer() {
    const bufferSize = this._preSpeechBuffer.length;
    if (bufferSize > 0) {
      DEBUG.trace('VAD: Flushing pre-speech buffer', { 
        chunks: bufferSize,
        totalBytes: this._preSpeechBuffer.reduce((sum, buf) => sum + (buf.byteLength || 0), 0)
      });
    }
    for (const buf of this._preSpeechBuffer) {
      // Record pre-speech buffer chunks if recording is enabled
      if (this._isRecordingAudio && buf instanceof ArrayBuffer) {
        try {
          this._recordedAudioChunks.push(new Uint8Array(buf));
        } catch (err) {
          DEBUG.error('Failed to record pre-speech audio chunk', { error: err });
        }
      }
      this._sendChunkToSTT(buf);
    }
    this._preSpeechBuffer = [];
  }

  /**
   * @param {Object} [options]
   * @param {boolean} [options.skipWakeWordWait] - If true, start listening immediately (e.g. when user clicked mic button). Otherwise when wake word is enabled we wait for wake word before activating STT.
   */
  async startSTT(options = {}) {
    if (this._sttActive) return;
    if (!this.apiKey) throw new Error('CARTESIA_API_KEY is required.');

    const support = CartesiaAudioBridge.checkRecordingSupport();
    if (!support.supported) throw new Error(support.message);
    DEBUG.trace('startSTT: recording support OK');

    try {
      await this.init();
      DEBUG.trace('startSTT: init OK');
      await this.connectSTTWebSocket();
      DEBUG.trace('startSTT: STT WebSocket connected');

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (gumErr) {
        DEBUG.error('getUserMedia failed', gumErr);
        throw new Error(CartesiaAudioBridge.getMicrophoneErrorMessage(gumErr));
      }
      this.mediaStream = stream;
      DEBUG.trace('startSTT: getUserMedia OK, stream tracks:', stream.getTracks().length);

      // Initialize wake word with the SAME stream as mic (same entry point as mic: one gesture, one stream).
      // initWakeWord() is the single code path; it uses this.mediaStream we just set.
      if (this.options.wakeWordEnabled && this._hasWakeWordConfig()) {
        try {
          const result = await this.initWakeWord();
          if (result?.success) {
            DEBUG.trace('startSTT: Wake word initialized/re-enabled with mic stream');
          } else if (result?.reason) {
            DEBUG.trace('startSTT: Wake word init failed (STT continues without)', { reason: result.reason });
          }
        } catch (wakeWordErr) {
          DEBUG.error('Wake word initialization failed in startSTT', wakeWordErr);
          if (this.options.wakeWordEnabled) {
            const msg = `Wake word initialization failed: ${wakeWordErr?.message || wakeWordErr}. You can still use the mic button to talk.`;
            logWakeWordError(msg, wakeWordErr);
            this.onError(msg);
          }
        }
      }

      // Reuse existing STT AudioWorklet graph when wake word pre-set it (same mic stream, no duplicate nodes)
      const sttGraphExists = this.sttNode && this.sttGainNode && this.sttAnalyserNode;
      if (!sttGraphExists) {
        const source = this.audioContext.createMediaStreamSource(stream);
        this.sttGainNode = this.audioContext.createGain();
        this.sttAnalyserNode = this.audioContext.createAnalyser();
        this.sttAnalyserNode.fftSize = 256;
        this.sttAnalyserNode.smoothingTimeConstant = 0.5;

        this.sttGainNode.gain.value = this._inputGain;
        try {
          this.sttNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
          DEBUG.trace('STT AudioWorkletNode created successfully');
        } catch (err) {
          DEBUG.error('Failed to create STT AudioWorkletNode', { error: err });
          throw new Error(`Failed to create STT AudioWorkletNode. Ensure AudioWorklet processors are loaded. ${err.message || err}`);
        }
        try {
          source.connect(this.sttGainNode);
          this.sttGainNode.connect(this.sttNode);
          this.sttGainNode.connect(this.sttAnalyserNode);
          DEBUG.trace('STT audio graph connected: source -> gain -> sttNode, gain -> analyser');
        } catch (err) {
          DEBUG.error('Failed to connect STT audio graph', { error: err });
          throw new Error(`Failed to connect STT audio graph. ${err.message || err}`);
        }
        let _audioChunkCount = 0;
        this.sttNode.port.onmessage = (e) => {
          try {
            if (!e || !e.data || e.data.type !== 'audio' || !e.data.data) return;
            _audioChunkCount++;
            const buf = e.data.data;
            if (!(buf instanceof ArrayBuffer)) {
              DEBUG.error('STT processor sent invalid data type', { type: typeof buf, isArrayBuffer: buf instanceof ArrayBuffer });
              return;
            }
            if (_audioChunkCount <= 3 || _audioChunkCount % 50 === 0) {
              DEBUG.trace('VAD: Audio chunk received', { 
                chunk: _audioChunkCount, 
                size: buf.byteLength,
                streaming: this._sttStreaming,
                bufferSize: this._preSpeechBuffer.length 
              });
            }
            if (this._isRecordingAudio) {
              try {
                this._recordedAudioChunks.push(new Uint8Array(buf));
              } catch (err) {
                DEBUG.error('Failed to record audio chunk', { error: err });
              }
            }
            if (this._sttStreaming) {
              this._sendChunkToSTT(buf);
            } else {
              this._preSpeechBuffer.push(buf);
              if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) {
                this._preSpeechBuffer.shift();
              }
            }
          } catch (err) {
            DEBUG.error('Error handling STT AudioWorklet message', { error: err, data: e?.data });
          }
        };
        this.sttNode.port.onerror = (err) => {
          DEBUG.error('STT AudioWorklet processor error', { error: err });
          this.onError('STT AudioWorklet processor error. Check console for details.');
        };
      } else {
        this.sttGainNode.gain.value = this._inputGain;
        if (this.sttAnalyserNode) this.sttAnalyserNode.smoothingTimeConstant = 0.5;
        DEBUG.trace('startSTT: reusing existing STT audio graph (AudioWorklet + wake word pre-setup)');
      }

      this._preSpeechBuffer = [];
      this._sttStreaming = false;

      // Only pass MicVAD-supported options; app-only (silenceClosing*, silenceAfterSpeechToStopMicMs) stay in VAD_CONFIG for bridge use
      const vadOptions = {
        model: VAD_CONFIG.model,
        redemptionMs: VAD_CONFIG.redemptionMs,
        preSpeechPadMs: VAD_CONFIG.preSpeechPadMs,
        minSpeechMs: VAD_CONFIG.minSpeechMs,
        positiveSpeechThreshold: VAD_CONFIG.positiveSpeechThreshold,
        negativeSpeechThreshold: VAD_CONFIG.negativeSpeechThreshold,
        submitUserSpeechOnPause: VAD_CONFIG.submitUserSpeechOnPause,
        baseAssetPath: VAD_CONFIG.baseAssetPath,
        onnxWASMBasePath: VAD_CONFIG.onnxWASMBasePath,
        getStream: () => {
          const streamPromise = Promise.resolve(stream);
          DEBUG.trace('VAD getStream() called (startSTT)', { 
            hasStream: !!stream, 
            streamId: stream?.id,
            tracks: stream?.getTracks()?.length 
          });
          return streamPromise;
        },
        onSpeechStart: () => {
          DEBUG.trace('VAD onSpeechStart - enabling STT streaming');
          // Always clear the silence stop timer when user speaks again - this allows conversations to go back and forth
          this._clearSilenceStopTimer();
          this._hadTranscriptFromPreviousSegment = false;
          this._clearSilenceClosingTimer();
          this._pendingFinalTranscript = null;
          this._lastTranscriptText = '';
          // Start recording audio for this speech segment
          // Clear previous recording and start new one
          this._recordedAudioChunks = [];
          this._isRecordingAudio = true;
          this._sttChunkSendCount = 0; // Reset chunk counter for new speech segment
          this.onSpeechStart();
          this._bargeIn();
          this._sttStreaming = true;
          // Flush pre-speech buffer (will also record those chunks if recording is enabled)
          this._flushPreSpeechBuffer();
        },
        onSpeechEnd: () => {
          DEBUG.trace('VAD onSpeechEnd - sending finalize, starting silence-after-speech mic stop timer', {
            chunksSent: this._sttChunkSendCount
          });
          this.onSpeechEnd();
          this._sttStreaming = false;
          // Stop recording audio when speech ends
          this._isRecordingAudio = false;
          this._pendingFinalTranscript = null;
          if (this.sttWs?.readyState === WebSocket.OPEN) {
            try {
              this.sttWs.send('finalize');
              DEBUG.trace('VAD: Sent finalize to STT', { totalChunksSent: this._sttChunkSendCount });
            } catch (err) {
              DEBUG.error('Error sending finalize to STT', { error: err });
            }
          }
          const stopMs = VAD_CONFIG.silenceAfterSpeechToStopMicMs ?? 2500;
          this._clearSilenceStopTimer();
          if (stopMs > 0) {
            this._silenceStopTimer = setTimeout(() => {
              this._silenceStopTimer = null;
              this._stopSTTAndSendTranscript();
            }, stopMs);
          }
        },
        onVADMisfire: () => this.onVADMisfire(),
      };

      try {
        // Clean up existing VAD instance if present (e.g., from wake word pre-start)
        if (this.vad) {
          try {
            this.vad.pause();
            if (typeof this.vad.destroy === 'function') {
              this.vad.destroy();
            }
          } catch (cleanupErr) {
            DEBUG.warn('Error cleaning up existing VAD before creating new instance', cleanupErr);
          }
          this.vad = null;
        }
        this.vad = await MicVAD.new(vadOptions);
        if (!this.vad) {
          throw new Error('VAD initialization returned null');
        }
        this.vad.start();
        DEBUG.trace('startSTT: VAD started successfully');
      } catch (vadErr) {
        DEBUG.error('VAD initialization failed', vadErr);
        // Clean up partial state before throwing
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((t) => t.stop());
          this.mediaStream = null;
        }
        if (this.sttNode) {
          this.sttNode.disconnect();
          this.sttNode = null;
        }
        if (this.sttGainNode) {
          this.sttGainNode.disconnect();
          this.sttGainNode = null;
        }
        if (this.sttAnalyserNode) {
          this.sttAnalyserNode.disconnect();
          this.sttAnalyserNode = null;
        }
        if (this.sttWs) {
          try { this.sttWs.close(); } catch { /* ignore */ }
          this.sttWs = null;
        }
        throw new Error(`VAD initialization failed: ${vadErr?.message || vadErr}`);
      }
      // If user explicitly started STT (e.g. mic button), skip wake-word wait and listen immediately.
      // Otherwise when wake word is enabled, wait for wake word before activating STT.
      const skipWakeWordWait = options.skipWakeWordWait === true;
      if (!skipWakeWordWait && this.options.wakeWordEnabled && this.wakeWordManager && this.wakeWordManager.isEnabled()) {
        DEBUG.trace('startSTT: Wake word enabled and active, waiting for wake word before activating STT');
        // Don't activate STT yet - wait for wake word to trigger it
        this._wakeWordActive = false;
        // Ensure wake word is enabled
        this.wakeWordManager.setEnabled(true);
      } else {
        // Normal flow: activate STT immediately (wake word not enabled or not active)
        // Disable wake word during STT to prevent re-triggering
        if (this.wakeWordManager && this.wakeWordManager.isEnabled()) {
          this.wakeWordManager.setEnabled(false);
          DEBUG.trace('startSTT: Wake word disabled during STT to prevent re-triggering');
        }
        
        this._sttActive = true;
        this._hadTranscriptFromPreviousSegment = false;
        const maxMs = VAD_CONFIG.maxListeningMs ?? 0;
        if (maxMs > 0) {
          this._maxListeningTimer = setTimeout(() => {
            this._maxListeningTimer = null;
            DEBUG.trace('Max listening time reached - stopping mic');
            this._stopSTTAndSendTranscript();
          }, maxMs);
        }
        DEBUG.trace('startSTT: VAD started, pipeline active');
        // Notify that STT is now active
        this.onSTTStarted();
      }
    } catch (err) {
      // Log with serializable details (Error/DOMException stringify to {} in capture tools)
      const details = err instanceof Error
        ? { message: err.message, name: err.name, code: err?.code, stack: err?.stack?.slice?.(0, 300) }
        : { value: String(err) };
      DEBUG.error('startSTT failed', details);
      this.stopSTT();
      throw err;
    }
  }

  /**
   * Handle wake word detection - activate STT pipeline
   * Implements cooldown period to prevent re-triggering
   */
  async _onWakeWordDetected(keywordIndex) {
    // Check cooldown period to prevent re-triggering (per best practices)
    const now = Date.now();
    if (now - this._lastWakeWordDetectionTime < this._wakeWordCooldownMs) {
      DEBUG.trace('Wake word detected but in cooldown period', { 
        keywordIndex,
        timeSinceLastDetection: now - this._lastWakeWordDetectionTime,
        cooldownMs: this._wakeWordCooldownMs
      });
      return;
    }
    
    if (this._wakeWordActive) {
      DEBUG.trace('Wake word detected but already active', { keywordIndex });
      return;
    }
    
    DEBUG.trace('Wake word detected! Activating STT pipeline (optimized)', { keywordIndex });
    /* eslint-disable no-console -- pipeline diagnostic: STT activation */
    if (typeof console !== 'undefined' && console.log) {
      console.log('[JARVIS Wake Word] Wake word triggered — activating STT pipeline');
    }
    /* eslint-enable no-console */
    this._lastWakeWordDetectionTime = now;
    this._wakeWordActive = true;
    this.onWakeWordDetected(keywordIndex);
    
    // OPTIMIZED: Everything should already be pre-setup, just activate immediately
    if (!this._sttActive) {
      try {
        // Ensure STT WebSocket is connected (should already be pre-connected)
        if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN) {
          DEBUG.trace('Wake word: STT WebSocket not pre-connected, connecting now (fallback)...');
          await this.connectSTTWebSocket();
        }
        
        // Ensure audio graph is set up (should already be pre-setup)
        if (!this.sttNode) {
          DEBUG.trace('Wake word: STT audio graph not pre-setup, setting up now (fallback)...');
          // Fallback: setup audio graph if pre-setup failed
          if (!this.mediaStream) {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
            this.mediaStream = stream;
          }
          
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.sttGainNode = this.audioContext.createGain();
          this.sttGainNode.gain.value = this._inputGain;
          this.sttAnalyserNode = this.audioContext.createAnalyser();
          this.sttAnalyserNode.fftSize = 256;
          
          const basePath = this.options.audioWorkletBasePath || './audio/';
          const processorPath = basePath.endsWith('/') 
            ? `${basePath}stt-capture-processor.js`
            : `${basePath}/stt-capture-processor.js`;
          const sttAbsolute = processorPath.startsWith('http') ? processorPath : new URL(processorPath, window.location.origin).href;
          try {
            await this.audioContext.audioWorklet.addModule(sttAbsolute);
          } catch (err) {
            if (err.message && !err.message.includes('already been added')) {
              throw err;
            }
          }
          this.sttNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
          source.connect(this.sttGainNode);
          this.sttGainNode.connect(this.sttNode);
          this.sttGainNode.connect(this.sttAnalyserNode);
          let _wakeWordChunkCount = 0;
          this.sttNode.port.onmessage = (e) => {
            try {
              if (!e || !e.data || e.data.type !== 'audio' || !e.data.data) return;
              _wakeWordChunkCount++;
              const buf = e.data.data;
              if (!(buf instanceof ArrayBuffer)) {
                DEBUG.error('STT processor sent invalid data type', { type: typeof buf, isArrayBuffer: buf instanceof ArrayBuffer });
                return;
              }
              if (_wakeWordChunkCount <= 3 || _wakeWordChunkCount % 50 === 0) {
                DEBUG.trace('VAD: Audio chunk received (wake word fallback)', { 
                  chunk: _wakeWordChunkCount, 
                  size: buf.byteLength,
                  streaming: this._sttStreaming,
                  bufferSize: this._preSpeechBuffer.length 
                });
              }
              if (this._isRecordingAudio) {
                try {
                  this._recordedAudioChunks.push(new Uint8Array(buf));
                } catch (err) {
                  DEBUG.error('Failed to record audio chunk', { error: err });
                }
              }
              if (this._sttStreaming) {
                this._sendChunkToSTT(buf);
              } else {
                this._preSpeechBuffer.push(buf);
                if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) {
                  this._preSpeechBuffer.shift();
                }
              }
            } catch (err) {
              DEBUG.error('Error handling STT AudioWorklet message', { error: err, data: e?.data });
            }
          };
          
          this.sttNode.port.onerror = (err) => {
            DEBUG.error('STT AudioWorklet processor error', { error: err });
            this.onError('STT AudioWorklet processor error. Check console for details.');
          };
        }
        
        // Ensure VAD is started (should already be pre-started)
        if (!this.vad) {
          DEBUG.trace('Wake word: VAD not pre-started, starting now (fallback)...');
          const vadOptions = {
            model: VAD_CONFIG.model,
            redemptionMs: VAD_CONFIG.redemptionMs,
            preSpeechPadMs: VAD_CONFIG.preSpeechPadMs,
            minSpeechMs: VAD_CONFIG.minSpeechMs,
            positiveSpeechThreshold: VAD_CONFIG.positiveSpeechThreshold,
            negativeSpeechThreshold: VAD_CONFIG.negativeSpeechThreshold,
            submitUserSpeechOnPause: VAD_CONFIG.submitUserSpeechOnPause,
            baseAssetPath: VAD_CONFIG.baseAssetPath,
            onnxWASMBasePath: VAD_CONFIG.onnxWASMBasePath,
            getStream: () => {
            const stream = Promise.resolve(this.mediaStream);
            DEBUG.trace('VAD getStream() called', { 
              hasStream: !!this.mediaStream, 
              streamId: this.mediaStream?.id,
              tracks: this.mediaStream?.getTracks()?.length 
            });
            return stream;
          },
            onSpeechStart: () => {
              DEBUG.trace('VAD onSpeechStart (wake word fallback) - enabling STT streaming');
              // Always clear the silence stop timer when user speaks again - this allows conversations to go back and forth
              this._clearSilenceStopTimer();
              this._hadTranscriptFromPreviousSegment = false;
              this._clearMaxListeningTimer();
              this._recordedAudioChunks = [];
              this._isRecordingAudio = true;
              this._sttChunkSendCount = 0; // Reset chunk counter for new speech segment
              this._sttStreaming = true;
              this._flushPreSpeechBuffer();
              this.onSpeechStart();
            },
            onSpeechEnd: async () => {
              DEBUG.trace('VAD onSpeechEnd (wake word fallback) - sending finalize', {
                chunksSent: this._sttChunkSendCount
              });
              this._sttStreaming = false;
              this._isRecordingAudio = false;
              this.onSpeechEnd();
              if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
                try {
                  this.sttWs.send('finalize');
                  DEBUG.trace('VAD: Sent finalize to STT (wake word fallback)', { totalChunksSent: this._sttChunkSendCount });
                } catch (err) {
                  DEBUG.error('Error sending finalize to STT', err);
                }
              }
              const silenceMs = VAD_CONFIG.silenceAfterSpeechToStopMicMs ?? 2500;
              this._silenceStopTimer = setTimeout(() => {
                this._silenceStopTimer = null;
                this._stopSTTAndSendTranscript();
              }, silenceMs);
            },
            onVADMisfire: () => {
              this.onVADMisfire();
            },
          };
          
          this.vad = await MicVAD.new(vadOptions);
          await this.vad.start();
        }
        
        // OPTIMIZED: Activate STT pipeline immediately (everything is pre-setup)
        this._sttActive = true;
        this._hadTranscriptFromPreviousSegment = false;
        
        // OPTIMIZED: Flush pre-speech buffer immediately (captures audio during wake word detection)
        // This ensures we don't lose any audio that occurred during the wake word detection
        this._flushPreSpeechBuffer();
        
        // OPTIMIZED: Start streaming immediately (VAD will gate if no speech detected)
        // This allows immediate capture without waiting for VAD detection
        this._sttStreaming = true;
        
        const maxMs = VAD_CONFIG.maxListeningMs ?? 0;
        if (maxMs > 0) {
          this._maxListeningTimer = setTimeout(() => {
            this._maxListeningTimer = null;
            DEBUG.trace('Max listening time reached - stopping mic');
            this._stopSTTAndSendTranscript();
          }, maxMs);
        }
        
        DEBUG.trace('STT pipeline activated after wake word (optimized)', { 
          sttActive: this._sttActive,
          vadStarted: !!this.vad,
          sttWsReady: this.sttWs?.readyState === WebSocket.OPEN,
          preSpeechBufferSize: this._preSpeechBuffer.length,
          immediateStreaming: true
        });
        /* eslint-disable no-console -- pipeline diagnostic: STT ready */
        if (typeof console !== 'undefined' && console.log) {
          console.log('[JARVIS Wake Word] STT active — say your command, then wait for silence to send to agent');
        }
        /* eslint-enable no-console */
        // Disable wake word during STT to prevent re-triggering
        if (this.wakeWordManager) {
          this.wakeWordManager.setEnabled(false);
          DEBUG.trace('Wake word disabled during STT to prevent re-triggering');
        }
        
        // Notify that STT is now active (for UI to update mic button state)
        this.onSTTStarted();
      } catch (err) {
        DEBUG.error('Failed to activate STT pipeline after wake word', err);
        const msg = `Failed to start listening after wake word: ${err.message}`;
        logWakeWordError(msg, err);
        this.onError(msg);
        this._wakeWordActive = false;
        // Re-enable wake word if activation failed
        if (this.wakeWordManager) {
          this.wakeWordManager.setEnabled(true);
        }
      }
    }
  }

  _clearSilenceStopTimer() {
    if (this._silenceStopTimer) {
      clearTimeout(this._silenceStopTimer);
      this._silenceStopTimer = null;
    }
  }

  _clearMaxListeningTimer() {
    if (this._maxListeningTimer) {
      clearTimeout(this._maxListeningTimer);
      this._maxListeningTimer = null;
    }
  }

  /** Stop STT and send any buffered transcript to the agent (used by silence-after-speech timer and max-listening timer). */
  _stopSTTAndSendTranscript() {
    const pending = this._pendingFinalTranscript;
    this._pendingFinalTranscript = null;
    const fallback = (this._lastTranscriptText || '').trim();
    this._lastTranscriptText = '';
    this._hadTranscriptFromPreviousSegment = false;
    const wasWakeWordTriggered = this._wakeWordActive;
    this.stopSTT();
    const textToSend = (pending && String(pending.text || '').trim()) || fallback || '';
    if (textToSend) {
      DEBUG.trace('Stopping mic - sending transcript to agent', { 
        fromFinal: !!pending, 
        preview: textToSend.slice(0, 50),
        wakeWordTriggered: wasWakeWordTriggered,
        willSendPayload: true
      });
      /* eslint-disable no-console -- pipeline diagnostic: sending to agent */
      if (typeof console !== 'undefined' && console.log) {
        console.log('[JARVIS Wake Word] Sending transcript to agent', { preview: textToSend.slice(0, 50) });
      }
      /* eslint-enable no-console */
      this.onTranscript(textToSend, true, pending?.request_id || '');
    } else {
      DEBUG.trace('Stopping mic - no transcript to send', { wakeWordTriggered: wasWakeWordTriggered });
      /* eslint-disable no-console -- pipeline diagnostic: no transcript after wake word */
      if (wasWakeWordTriggered && typeof console !== 'undefined' && console.warn) {
        console.warn('[JARVIS Wake Word] Wake word fired but no transcript to send — try speaking clearly after "Jarvis"');
      }
      /* eslint-enable no-console */
    }
  }

  _clearSilenceClosingTimer() {
    if (this._silenceClosingTimer) {
      clearTimeout(this._silenceClosingTimer);
      this._silenceClosingTimer = null;
    }
    if (this._silenceClosingDelayTimer) {
      clearTimeout(this._silenceClosingDelayTimer);
      this._silenceClosingDelayTimer = null;
    }
  }

  _bargeIn() {
    this.clearTTSBuffer();
    const ctxIds = [...this._ttsDoneResolvers.keys()];
    ctxIds.forEach((id) => {
      this.cancelTTS(id);
      const r = this._ttsDoneResolvers.get(id);
      if (r) r.reject(new Error('Barge-in: user spoke'));
      this._ttsDoneResolvers.delete(id);
    });
  }

  stopSTT() {
    this._clearSilenceStopTimer();
    this._clearMaxListeningTimer();
    this._clearSilenceClosingTimer();
    this._pendingFinalTranscript = null;
    this._lastTranscriptText = '';
    this._hadTranscriptFromPreviousSegment = false;
    // Stop recording audio
    this._isRecordingAudio = false;
    const wasActive = this._sttActive;
    this._sttActive = false;
    if (this.vad) {
      try {
        // Pause VAD to stop processing
        this.vad.pause();
        // Some VAD implementations may need explicit cleanup
        if (typeof this.vad.destroy === 'function') {
          this.vad.destroy();
        }
      } catch (vadErr) {
        DEBUG.error('Error stopping VAD', vadErr);
      } finally {
        this.vad = null;
      }
    }
    this._sttStreaming = false;
    this._preSpeechBuffer = [];
    // Only stop media stream tracks if wake word is not enabled (for always-listening)
    // If wake word is enabled, keep the stream alive for always-listening mode
    if (this.mediaStream && !this.options.wakeWordEnabled) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    } else if (this.mediaStream && this.options.wakeWordEnabled) {
      DEBUG.trace('stopSTT: Keeping media stream alive for wake word always-listening');
    }
    this.stopLevelMeter();
    // Disconnect audio nodes in reverse order of connection
    if (this.sttNode) {
      try {
        this.sttNode.disconnect();
        this.sttNode.port.onmessage = null;
        this.sttNode.port.onerror = null;
      } catch (err) {
        DEBUG.error('Error disconnecting STT node', { error: err });
      }
      this.sttNode = null;
    }
    if (this.sttAnalyserNode) {
      try {
        this.sttAnalyserNode.disconnect();
      } catch (err) {
        DEBUG.error('Error disconnecting analyser node', { error: err });
      }
      this.sttAnalyserNode = null;
    }
    if (this.sttGainNode) {
      try {
        this.sttGainNode.disconnect();
      } catch (err) {
        DEBUG.error('Error disconnecting gain node', { error: err });
      }
      this.sttGainNode = null;
    }
    if (this.sttWs) {
      try {
        // Remove all listeners
        this.sttWs.onopen = null;
        this.sttWs.onerror = null;
        this.sttWs.onclose = null;
        this.sttWs.onmessage = null;
        // Send done message if open
        if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
          try { 
            this.sttWs.send('done'); 
          } catch { 
            // Ignore send errors
          }
        }
        // Close with normal code 1000 so server can distinguish from errors (MDN WebSocket close)
        if (this.sttWs && this.sttWs.readyState !== WebSocket.CLOSED) {
          this.sttWs.close(1000, 'client disconnect');
        }
      } catch (err) {
        DEBUG.error('Error disconnecting STT WebSocket', err);
      } finally {
        this._sttConnectPromise = null;
        this.sttWs = null;
      }
    }
    // Clean up wake word manager only if wake word is not enabled for always-listening
    // If wake word is enabled, keep it running for always-listening mode
    if (this.wakeWordManager && !this.options.wakeWordEnabled) {
      try {
        this.wakeWordManager.release();
      } catch (err) {
        DEBUG.error('Error releasing wake word manager', err);
      } finally {
        this.wakeWordManager = null;
      }
    } else if (this.wakeWordManager && this.options.wakeWordEnabled) {
      // Keep wake word listening for always-listening mode
      // Re-enable it if it was disabled during STT cleanup
      DEBUG.trace('stopSTT: Keeping wake word active for always-listening mode');
      // Ensure wake word is still enabled after STT stops
      if (!this.wakeWordManager.isEnabled()) {
        this.wakeWordManager.setEnabled(true);
        DEBUG.trace('stopSTT: Re-enabled wake word for always-listening');
      }
      // Keep media stream alive for wake word (don't stop tracks)
      // Only stop tracks if we're completely shutting down (not just stopping STT)
    }
    this._wakeWordActive = false;
    if (wasActive) this.onSTTStopped();
  }

  async connectTTS() {
    if (!this.apiKey) throw new Error('CARTESIA_API_KEY is required.');
    await this.init();
    // Ensure TTS node exists after init (safeguard for edge cases)
    if (!this.ttsNode && this.audioContext && this.audioContext.state === 'running') {
      try {
        const basePath = this.options.audioWorkletBasePath || './audio/';
        const ttsPath = basePath.endsWith('/') 
          ? `${basePath}tts-playback-processor.js`
          : `${basePath}/tts-playback-processor.js`;
        const ttsAbsolute = ttsPath.startsWith('http') ? ttsPath : new URL(ttsPath, window.location.origin).href;
        try {
          await this.audioContext.audioWorklet.addModule(ttsAbsolute);
        } catch (err) {
          if (err.message && !err.message.includes('already been added')) {
            throw err;
          }
          DEBUG.trace('TTS processor already loaded, continuing...');
        }
        this.ttsNode = new AudioWorkletNode(this.audioContext, 'tts-playback-processor');
        this.ttsNode.connect(this.audioContext.destination);
        DEBUG.trace('TTS AudioWorkletNode created and connected in connectTTS (safeguard)');
        this.ttsNode.port.onerror = (err) => {
          DEBUG.error('TTS AudioWorklet processor error', { error: err });
          this.onError('TTS AudioWorklet processor error. Check console for details.');
        };
      } catch (err) {
        DEBUG.error('Failed to create TTS AudioWorkletNode in connectTTS', { error: err });
        throw new Error(`Failed to create TTS AudioWorkletNode. ${err.message || err}`);
      }
    }
    // If WebSocket is already open, ensure message handler is set up, then return
    if (this.ttsWs?.readyState === WebSocket.OPEN) {
      // Ensure message handler is set up (may have been set by pre-connection with basic handler)
      if (!this.ttsWs.onmessage || this.ttsWs.onmessage._isPreConnectHandler) {
        this.ttsWs.onmessage = (e) => {
          if (typeof e.data !== 'string') return;
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chunk' && msg.data) {
              const pcm = decodeBase64PCM(msg.data);
              this.playTTSChunk(pcm);
              this.onTTSChunk(msg);
            } else if (msg.type === 'done' && msg.context_id) {
              const r = this._ttsDoneResolvers.get(msg.context_id);
              if (r) {
                this._ttsDoneResolvers.delete(msg.context_id);
                r.resolve();
              }
            } else if ((msg.type === 'error' || msg.error) && msg.context_id) {
              const r = this._ttsDoneResolvers.get(msg.context_id);
              if (r) {
                this._ttsDoneResolvers.delete(msg.context_id);
                r.reject(new Error(msg.error || 'TTS error'));
              }
              this.onError(msg.error || 'TTS error');
            }
          } catch (err) {
            DEBUG.error('Error parsing TTS WebSocket message', { error: err });
            this.onError(typeof err === 'string' ? err : (err?.message || 'TTS message parse error'));
          }
        };
        DEBUG.trace('TTS WebSocket message handler set up (was pre-connected)');
      }
      return Promise.resolve(); // Already connected and handler set up
    }
    if (this._ttsConnectPromise) return this._ttsConnectPromise;

    // Prevent multiple simultaneous connection attempts
    if (this.ttsWs && (this.ttsWs.readyState === WebSocket.CONNECTING || this.ttsWs.readyState === WebSocket.OPEN)) {
      if (this.ttsWs.readyState === WebSocket.OPEN) {
        return Promise.resolve(); // Already connected
      }
      return Promise.reject(new Error('TTS WebSocket connection already in progress'));
    }

    const url = new URL(TTS_ENDPOINT);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('cartesia_version', CARTESIA_VERSION);
    
    // Clean up existing connection if any
    if (this.ttsWs) {
      try {
        this.ttsWs.onopen = null;
        this.ttsWs.onerror = null;
        this.ttsWs.onclose = null;
        this.ttsWs.onmessage = null;
        if (this.ttsWs.readyState !== WebSocket.CLOSED) {
          this.ttsWs.close(1000, 'reconnect');
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    
    this.ttsWs = new WebSocket(url.toString());

    this._ttsConnectPromise = new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled && this.ttsWs && this.ttsWs.readyState !== WebSocket.OPEN) {
          settled = true;
          this._ttsConnectPromise = null;
          try {
            this.ttsWs.close();
          } catch {
            // Ignore close errors
          }
          reject(new Error('TTS WebSocket connection timeout'));
        }
      }, 180000); // 3 minutes

      const settle = (fn) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this._ttsConnectPromise = null;
          fn();
        }
      };

      this.ttsWs.onopen = () => {
        settle(() => {
          DEBUG.trace('TTS WebSocket open');
          /* eslint-disable no-console */
          if (typeof console !== 'undefined' && console.log) {
            console.log('[JARVIS] TTS WebSocket connected successfully');
          }
          /* eslint-enable no-console */
          resolve();
        });
      };
      this.ttsWs.onerror = (err) => {
        settle(() => {
          DEBUG.error('TTS WebSocket error', err);
          /* eslint-disable no-console */
          if (typeof console !== 'undefined' && console.error) {
            console.error('[JARVIS] TTS WebSocket connection error', err);
          }
          /* eslint-enable no-console */
          reject(new Error('TTS WebSocket connection failed. Please check your API key and internet connection.'));
        });
      };
      this.ttsWs.onclose = (ev) => { 
        if (!settled) {
          clearTimeout(timeout);
          this._ttsConnectPromise = null;
          // If connection closed before opening (unexpected close), reject the promise
          // This is a safety check - onerror should fire first, but browsers can be inconsistent
          if (ev && ev.code !== 1000 && ev.code !== 1001) {
            // Not a normal close (1000) or going away (1001) - likely an error
            settled = true;
            reject(new Error(`TTS WebSocket closed unexpectedly (code: ${ev.code}, reason: ${ev.reason || 'none'})`));
          }
        }
      };
      this.ttsWs.onmessage = (e) => {
        if (typeof e.data !== 'string') return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'chunk' && msg.data) {
            const pcm = decodeBase64PCM(msg.data);
            this.playTTSChunk(pcm);
            this.onTTSChunk(msg);
          } else if (msg.type === 'done' && msg.context_id) {
            const r = this._ttsDoneResolvers.get(msg.context_id);
            if (r) {
              this._ttsDoneResolvers.delete(msg.context_id);
              r.resolve();
            }
          } else if ((msg.type === 'error' || msg.error) && msg.context_id) {
            const r = this._ttsDoneResolvers.get(msg.context_id);
            if (r) {
              this._ttsDoneResolvers.delete(msg.context_id);
              r.reject(new Error(msg.error || 'TTS error'));
            }
            this.onError(msg.error || 'TTS error');
          }
        } catch (err) {
          DEBUG.error('Error parsing TTS WebSocket message', { error: err });
          this.onError(typeof err === 'string' ? err : (err?.message || 'TTS message parse error'));
        }
      };
    });
    return this._ttsConnectPromise;
  }

  playTTSChunk(pcmInt16) {
    if (!this.ttsNode) {
      DEBUG.error('playTTSChunk: TTS node not initialized');
      // Don't attempt recovery here - it's async and would cause issues
      // The node should be created in connectTTS() before speakText() is called
      this.onError('TTS node not available. Please try again.');
      return;
    }
    try {
      if (!(pcmInt16 instanceof Int16Array) && !Array.isArray(pcmInt16)) {
        DEBUG.error('playTTSChunk: invalid data type', { type: typeof pcmInt16, isInt16Array: pcmInt16 instanceof Int16Array });
        return;
      }
      const samples = pcmInt16 instanceof Int16Array ? Array.from(pcmInt16) : pcmInt16;
      this.ttsNode.port.postMessage({ type: 'audio', samples });
    } catch (err) {
      DEBUG.error('Error sending TTS chunk to AudioWorklet', { error: err });
      this.onError('TTS playback error. Check console for details.');
    }
  }

  clearTTSBuffer() {
    if (!this.ttsNode) return;
    try {
      this.ttsNode.port.postMessage({ type: 'clear' });
    } catch (err) {
      DEBUG.error('Error clearing TTS buffer', { error: err });
    }
  }
  
  /**
   * Verify AudioWorklet initialization status
   * @returns {{ initialized: boolean, audioContext: boolean, sttProcessor: boolean, ttsProcessor: boolean, ttsNode: boolean, message?: string }}
   */
  verifyAudioWorkletInit() {
    const result = {
      initialized: false,
      audioContext: !!this.audioContext,
      sttProcessor: false,
      ttsProcessor: false,
      ttsNode: !!this.ttsNode,
    };
    
    if (!this.audioContext) {
      result.message = 'AudioContext not initialized';
      return result;
    }
    
    // Check if processors are registered (by attempting to create nodes)
    try {
      // Note: We can't directly check if processors are registered without creating nodes
      // But if nodes can be created, processors are loaded
      if (this.ttsNode) {
        result.ttsProcessor = true;
      }
      // For STT, we check if we can create a node (but don't keep it)
      try {
        const testNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
        testNode.disconnect();
        result.sttProcessor = true;
      } catch {
        result.sttProcessor = false;
        result.message = 'STT processor not loaded';
      }
    } catch (err) {
      result.message = `Verification error: ${err.message || err}`;
    }
    
    result.initialized = result.audioContext && result.sttProcessor && result.ttsProcessor && result.ttsNode;
    return result;
  }

  async speakText(transcript, contextId = null, isContinue = false) {
    // Ensure TTS WebSocket is connected
    try {
      await this.connectTTS();
    } catch (connectErr) {
      DEBUG.error('TTS WebSocket connection failed in speakText', connectErr);
      throw new Error(`Failed to connect TTS WebSocket: ${connectErr?.message || connectErr}`);
    }
    
    const ctxId = contextId || `ctx_${++this.contextIdCounter}_${Date.now()}`;

    // Check WebSocket readyState before sending
    if (!this.ttsWs || this.ttsWs.readyState !== WebSocket.OPEN) {
      const state = this.ttsWs?.readyState ?? 'null';
      const stateNames = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' };
      DEBUG.error('TTS WebSocket not open before sending', { 
        readyState: state, 
        stateName: stateNames[state] || 'UNKNOWN',
        hasWs: !!this.ttsWs 
      });
      throw new Error(`TTS WebSocket not open (readyState: ${stateNames[state] || state})`);
    }

    try {
      this.ttsWs.send(
        JSON.stringify({
          model_id: this.ttsModel,
          transcript,
          voice: { mode: 'id', id: this.voiceId },
          language: this.language,
          context_id: ctxId,
          output_format: {
            container: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: 44100,
          },
          add_timestamps: true,
          continue: isContinue,
          max_buffer_delay_ms: 0,
        })
      );
    } catch (err) {
      DEBUG.error('Error sending TTS request', { error: err, readyState: this.ttsWs?.readyState });
      throw new Error(`Failed to send TTS request: ${err.message || err}`);
    }

    if (isContinue) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this._ttsDoneResolvers.set(ctxId, { resolve, reject });
    });
  }

  async streamTextChunks(chunks, contextId = null) {
    const ctxId = contextId || `ctx_${++this.contextIdCounter}_${Date.now()}`;
    for (let i = 0; i < chunks.length; i++) {
      await this.speakText(chunks[i], ctxId, i < chunks.length - 1);
    }
    return ctxId;
  }

  cancelTTS(contextId) {
    if (this.ttsWs?.readyState === WebSocket.OPEN) {
      try {
        this.ttsWs.send(JSON.stringify({ context_id: contextId, cancel: true }));
      } catch (err) {
        DEBUG.error('Error sending TTS cancel', { error: err, contextId });
      }
    }
    this.clearTTSBuffer();
  }

  disconnectTTS() {
    this._ttsDoneResolvers.forEach(({ reject }) => reject(new Error('TTS disconnected')));
    this._ttsDoneResolvers.clear();
    this._ttsConnectPromise = null;
    if (this.ttsWs) {
      try {
        // Remove all listeners
        this.ttsWs.onopen = null;
        this.ttsWs.onerror = null;
        this.ttsWs.onclose = null;
        this.ttsWs.onmessage = null;
        // Close with normal code 1000 (MDN WebSocket close)
        if (this.ttsWs.readyState !== WebSocket.CLOSED) {
          this.ttsWs.close(1000, 'client disconnect');
        }
      } catch (err) {
        DEBUG.error('Error disconnecting TTS WebSocket', err);
      } finally {
        this.ttsWs = null;
      }
    }
  }

  /**
   * Close all WebSocket connections for bfcache (back/forward cache) compatibility.
   * MDN: "Having an open WebSocket connection may prevent the browser adding your page to the bfcache.
   * It's good practice to close your connection when the user has finished with your page" (pagehide).
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#working_with_the_bfcache
   */
  closeAllWebSocketsForBfcache() {
    this._sttStreaming = false;
    this.disconnectTTS();
    if (this.sttWs) {
      try {
        this.sttWs.onopen = null;
        this.sttWs.onerror = null;
        this.sttWs.onclose = null;
        this.sttWs.onmessage = null;
        if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
          try {
            this.sttWs.send('done');
          } catch {
            // ignore
          }
        }
        if (this.sttWs && this.sttWs.readyState !== WebSocket.CLOSED) {
          this.sttWs.close(1000, 'pagehide');
        }
      } catch (err) {
        DEBUG.error('Error closing STT WebSocket for bfcache', err);
      } finally {
        this.sttWs = null;
      }
    }
    if (this.wakeWordManager && typeof this.wakeWordManager.release === 'function') {
      this.wakeWordManager.release().catch((err) => {
        DEBUG.error('Error releasing wake word for bfcache', err);
      });
      this.wakeWordManager = null;
    }
    DEBUG.trace('closeAllWebSocketsForBfcache: all WebSockets closed');
  }

  destroy() {
    this.stopSTT();
    this.disconnectTTS();
    if (this.ttsNode) {
      try {
        this.ttsNode.disconnect();
        this.ttsNode.port.onerror = null;
      } catch (err) {
        DEBUG.error('Error disconnecting TTS node in destroy', { error: err });
      }
      this.ttsNode = null;
    }
    if (this.wakeWordManager && typeof this.wakeWordManager.release === 'function') {
      this.wakeWordManager.release().catch((err) => {
        DEBUG.error('Error releasing WakeWordManager in destroy', { error: err });
      });
      this.wakeWordManager = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        DEBUG.error('Error stopping media stream tracks in destroy', { error: err });
      }
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (err) {
        DEBUG.error('Error closing AudioContext', { error: err });
      }
      this.audioContext = null;
    }
  }
}
