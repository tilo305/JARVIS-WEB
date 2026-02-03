/**
 * Cartesia Audio Bridge - Live Real-Time Bidirectional Flow
 * Optimal latency: VAD-gated streaming STT, sonic-turbo TTS, barge-in support
 * @see aUdiO dOcS.md, cArTeSiA dOcS.md, bOoK oN vOiCe BoT dEsIgN.md
 */
import { decodeBase64PCM } from './audio-utils.js';
import { MicVAD } from '@ricky0123/vad-web';
import { VAD_CONFIG } from './vad-config.js';
import { DEBUG } from './debug.js';

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
    /** sonic-turbo: 40ms first byte; sonic-3: 90ms (more emotive) */
    this.ttsModel = options.ttsModel || 'sonic-turbo';

    this.audioContext = null;
    this.sttNode = null;
    this.sttGainNode = null;
    this.sttAnalyserNode = null;
    this.mediaStream = null;
    this.sttWs = null;
    this.ttsWs = null;
    this.vad = null;
    this.contextIdCounter = 0;
    this._ttsDoneResolvers = new Map();
    this._ttsConnectPromise = null;
    this._sttStreaming = false;
    this._preSpeechBuffer = [];
    this._preSpeechMaxChunks = Math.ceil((VAD_CONFIG.preSpeechPadMs || 800) / STT_CHUNK_MS);

    this.onTranscript = options.onTranscript || (() => {});
    this.onTTSChunk = options.onTTSChunk || (() => {});
    this.onError = options.onError || (() => {});
    this.onSpeechStart = options.onSpeechStart || (() => {});
    this.onSpeechEnd = options.onSpeechEnd || (() => {});
    this.onVADMisfire = options.onVADMisfire || (() => {});
    /** Called when STT is stopped (user or programmatic) so UI can sync mic button */
    this.onSTTStopped = options.onSTTStopped || (() => {});
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

  /** Whether the mic/STT pipeline is currently running (for UI sync) */
  isSTTActive() {
    return this._sttActive === true;
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

  async init() {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    const basePath = this.options.audioWorkletBasePath || './audio/';
    await this.audioContext.audioWorklet.addModule(`${basePath}stt-capture-processor.js`);
    await this.audioContext.audioWorklet.addModule(`${basePath}tts-playback-processor.js`);
    this.ttsNode = new AudioWorkletNode(this.audioContext, 'tts-playback-processor');
    this.ttsNode.connect(this.audioContext.destination);
    return this.audioContext;
  }

  async connectSTTWebSocket() {
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
    this.sttWs = new WebSocket(url.toString());
    return new Promise((resolve, reject) => {
      this.sttWs.onopen = () => {
        DEBUG.trace('STT WebSocket open');
        resolve();
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
      this.sttWs.onerror = () => {
        DEBUG.error('STT WebSocket error');
        reject(new Error('STT WebSocket error'));
      };
      this.sttWs.onclose = (ev) => {
        DEBUG.trace('STT WebSocket closed', { code: ev.code, reason: ev.reason });
      };
    });
  }

  _sendChunkToSTT(arrayBuffer) {
    if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN || !this._sttStreaming) return;
    this.sttWs.send(arrayBuffer);
  }

  _flushPreSpeechBuffer() {
    for (const buf of this._preSpeechBuffer) {
      this._sendChunkToSTT(buf);
    }
    this._preSpeechBuffer = [];
  }

  async startSTT() {
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

      const source = this.audioContext.createMediaStreamSource(stream);
      this.sttGainNode = this.audioContext.createGain();
      this.sttGainNode.gain.value = this._inputGain;
      this.sttAnalyserNode = this.audioContext.createAnalyser();
      this.sttAnalyserNode.fftSize = 256;
      this.sttAnalyserNode.smoothingTimeConstant = 0.5;
      this.sttNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
      source.connect(this.sttGainNode);
      this.sttGainNode.connect(this.sttNode);
      this.sttGainNode.connect(this.sttAnalyserNode);

      this._preSpeechBuffer = [];
      this._sttStreaming = false;

      let _audioChunkCount = 0;
      this.sttNode.port.onmessage = (e) => {
        if (e.data.type !== 'audio' || !e.data.data) return;
        _audioChunkCount++;
        if (DEBUG.enabled && _audioChunkCount <= 3) {
          DEBUG.trace('stt-capture: audio chunk received', { chunk: _audioChunkCount, streaming: this._sttStreaming });
        }
        const buf = e.data.data;
        if (this._sttStreaming) {
          this._sendChunkToSTT(buf);
        } else {
          this._preSpeechBuffer.push(buf);
          if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) {
            this._preSpeechBuffer.shift();
          }
        }
      };

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
        getStream: () => Promise.resolve(stream),
        onSpeechStart: () => {
          DEBUG.trace('VAD onSpeechStart - enabling STT streaming');
          // Only clear the silence stop timer if we had real speech in the previous segment; otherwise noise can keep resetting it and the mic never stops
          if (this._hadTranscriptFromPreviousSegment) this._clearSilenceStopTimer();
          this._hadTranscriptFromPreviousSegment = false;
          this._clearSilenceClosingTimer();
          this._pendingFinalTranscript = null;
          this._lastTranscriptText = '';
          this.onSpeechStart();
          this._bargeIn();
          this._sttStreaming = true;
          this._flushPreSpeechBuffer();
        },
        onSpeechEnd: () => {
          DEBUG.trace('VAD onSpeechEnd - sending finalize, starting silence-after-speech mic stop timer');
          this.onSpeechEnd();
          this._sttStreaming = false;
          this._pendingFinalTranscript = null;
          if (this.sttWs?.readyState === WebSocket.OPEN) this.sttWs.send('finalize');
          const stopMs = VAD_CONFIG.silenceAfterSpeechToStopMicMs ?? 3500;
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

      this.vad = await MicVAD.new(vadOptions);
      this.vad.start();
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
    } catch (err) {
      DEBUG.error('startSTT failed', err);
      this.stopSTT();
      throw err;
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
    this.stopSTT();
    const textToSend = (pending && String(pending.text || '').trim()) || fallback || '';
    if (textToSend) {
      DEBUG.trace('Stopping mic - sending transcript to agent', { fromFinal: !!pending, preview: textToSend.slice(0, 50) });
      this.onTranscript(textToSend, true, pending?.request_id || '');
    } else {
      DEBUG.trace('Stopping mic - no transcript to send');
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
    const wasActive = this._sttActive;
    this._sttActive = false;
    if (this.vad) {
      this.vad.pause();
      this.vad = null;
    }
    this._sttStreaming = false;
    this._preSpeechBuffer = [];
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.stopLevelMeter();
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
      if (this.sttWs.readyState === WebSocket.OPEN) {
        try { this.sttWs.send('done'); } catch { /* ignore */ }
      }
      this.sttWs.close();
      this.sttWs = null;
    }
    if (wasActive) this.onSTTStopped();
  }

  async connectTTS() {
    if (!this.apiKey) throw new Error('CARTESIA_API_KEY is required.');
    await this.init();
    if (this.ttsWs?.readyState === WebSocket.OPEN) return;
    if (this._ttsConnectPromise) return this._ttsConnectPromise;

    const url = new URL(TTS_ENDPOINT);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('cartesia_version', CARTESIA_VERSION);
    this.ttsWs = new WebSocket(url.toString());

    this._ttsConnectPromise = new Promise((resolve, reject) => {
      this.ttsWs.onopen = () => {
        this._ttsConnectPromise = null;
        resolve();
      };
      this.ttsWs.onerror = () => {
        this._ttsConnectPromise = null;
        reject(new Error('TTS WebSocket error'));
      };
      this.ttsWs.onclose = () => { this._ttsConnectPromise = null; };
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
        } catch (err) { this.onError(err); }
      };
    });
    return this._ttsConnectPromise;
  }

  playTTSChunk(pcmInt16) {
    if (this.ttsNode) {
      this.ttsNode.port.postMessage({ type: 'audio', samples: Array.from(pcmInt16) });
    }
  }

  clearTTSBuffer() {
    if (this.ttsNode) this.ttsNode.port.postMessage({ type: 'clear' });
  }

  async speakText(transcript, contextId = null, isContinue = false) {
    await this.connectTTS();
    const ctxId = contextId || `ctx_${++this.contextIdCounter}_${Date.now()}`;

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
      this.ttsWs.send(JSON.stringify({ context_id: contextId, cancel: true }));
    }
    this.clearTTSBuffer();
  }

  disconnectTTS() {
    this._ttsDoneResolvers.forEach(({ reject }) => reject(new Error('TTS disconnected')));
    this._ttsDoneResolvers.clear();
    this._ttsConnectPromise = null;
    if (this.ttsWs) {
      this.ttsWs.close();
      this.ttsWs = null;
    }
  }

  destroy() {
    this.stopSTT();
    this.disconnectTTS();
    if (this.ttsNode) {
      this.ttsNode.disconnect();
      this.ttsNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
