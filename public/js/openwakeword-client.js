/**
 * openWakeWord WebSocket client.
 * Connects to Python openWakeWord server, sends 16 kHz 16-bit PCM (80 ms chunks),
 * receives activations and invokes callbacks. Handles reconnect, errors, and timeouts.
 *
 * Protocol (aligned with openWakeWord examples/web):
 * - First message to server: TEXT = sample rate (e.g. "16000")
 * - Then: BINARY = Int16 PCM chunks (1280 samples = 80 ms @ 16 kHz)
 * - Server → client: JSON { "loaded_models": [...] } on connect; { "activations": ["hey jarvis"] } on detection
 *
 * @see aUdiO dOcS.md (16 kHz, pcm_s16le), cArTeSiA dOcS.md
 */
import { DEBUG } from './debug.js';

const SAMPLE_RATE = 16000;
const RECONNECT_DELAY_MS = 2000;
const RECONNECT_MAX_ATTEMPTS = 10;

/**
 * @typedef {Object} OpenWakeWordClientOptions
 * @property {string} wsUrl - WebSocket URL (e.g. ws://localhost:8765/ws)
 * @property {(keywordIndex: number, modelName?: string) => void} [onActivation]
 * @property {(error: string, detail?: unknown) => void} [onError]
 * @property {() => void} [onConnect]
 * @property {() => void} [onDisconnect]
 */

export class OpenWakeWordClient {
  /**
   * @param {OpenWakeWordClientOptions} options
   */
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || '';
    this.onActivation = options.onActivation || (() => {});
    this.onError = options.onError || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});

    /** @type {WebSocket | null} */
    this._ws = null;
    this._sampleRateSent = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._pingTimer = null;
    this._closed = false;
    this._loadedModels = [];
    this._audioChunksSent = 0;
  }

  connect() {
    if (this._closed || !this.wsUrl) return;
    try {
      this._ws = new WebSocket(this.wsUrl);
    } catch (e) {
      DEBUG.error('OpenWakeWordClient: WebSocket constructor failed', e);
      this.onError('WebSocket failed: ' + (e?.message || String(e)), e);
      this._scheduleReconnect();
      return;
    }
    this._ws.binaryType = 'arraybuffer';
    this._ws.onopen = () => this._handleOpen();
    this._ws.onmessage = (e) => this._handleMessage(e);
    this._ws.onerror = (e) => this._handleError(e);
    this._ws.onclose = (e) => this._handleClose(e);
  }

  _handleOpen() {
    this._sampleRateSent = false;
    this._audioChunksSent = 0;
    this._reconnectAttempts = 0;
    this.onConnect();
    DEBUG.trace('OpenWakeWordClient: connected', { url: this.wsUrl });
    /* eslint-disable no-console -- payload verification: user confirms connection */
    if (typeof console !== 'undefined' && console.log) {
      console.log('[JARVIS OpenWakeWord] WebSocket connected, will send sample rate then audio', { url: this.wsUrl });
    }
    /* eslint-enable no-console */
  }

  _handleMessage(event) {
    if (typeof event.data === 'string') {
      try {
        const payload = JSON.parse(event.data);
        if (Array.isArray(payload.loaded_models)) {
          this._loadedModels = payload.loaded_models;
          DEBUG.trace('OpenWakeWordClient: loaded_models', this._loadedModels);
          /* eslint-disable no-console -- payload verification: user confirms server handshake */
          if (typeof console !== 'undefined' && console.log) {
            console.log('[JARVIS OpenWakeWord] Received loaded_models from server', { loaded_models: this._loadedModels });
          }
          /* eslint-enable no-console */
        }
        if (Array.isArray(payload.activations) && payload.activations.length > 0) {
          const modelName = payload.activations[0];
          const keywordIndex = this._loadedModels.indexOf(modelName);
          /* eslint-disable no-console -- payload verification: user confirms activations received */
          console.log('[JARVIS OpenWakeWord] Received activation from server', { activations: payload.activations, modelName });
          /* eslint-enable no-console */
          this.onActivation(keywordIndex >= 0 ? keywordIndex : 0, modelName);
        }
      } catch (e) {
        DEBUG.warn('OpenWakeWordClient: invalid JSON', event.data, e);
      }
      return;
    }
    DEBUG.trace('OpenWakeWordClient: unexpected text/binary message (server may send only JSON)');
  }

  _handleError(event) {
    DEBUG.warn('OpenWakeWordClient: WebSocket error', event);
    this.onError('WebSocket error');
  }

  _handleClose(event) {
    this._ws = null;
    this._sampleRateSent = false;
    this.onDisconnect();
    DEBUG.trace('OpenWakeWordClient: closed', { code: event.code, reason: event.reason });
    if (!this._closed && this._reconnectAttempts < RECONNECT_MAX_ATTEMPTS) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this._reconnectTimer || this._closed) return;
    this._reconnectAttempts++;
    DEBUG.trace('OpenWakeWordClient: reconnecting', {
      attempt: this._reconnectAttempts,
      max: RECONNECT_MAX_ATTEMPTS,
      delayMs: RECONNECT_DELAY_MS,
    });
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  /**
   * Send sample rate (must be called once after connect before sending audio).
   */
  sendSampleRate() {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return false;
    this._ws.send(String(SAMPLE_RATE));
    this._sampleRateSent = true;
    /* eslint-disable no-console -- payload verification: user confirms sample rate sent */
    if (typeof console !== 'undefined' && console.log) {
      console.log('[JARVIS OpenWakeWord] Sent sample rate payload', { sampleRate: SAMPLE_RATE });
    }
    /* eslint-enable no-console */
    return true;
  }

  /**
   * Send one chunk of 16-bit PCM (e.g. 1280 samples = 80 ms @ 16 kHz).
   * @param {ArrayBuffer | Int16Array} chunk - 16-bit PCM data
   * @returns {boolean} true if sent
   */
  sendAudio(chunk) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return false;
    if (!this._sampleRateSent) {
      this.sendSampleRate();
    }
    const buf = chunk instanceof Int16Array ? chunk.buffer : chunk;
    this._ws.send(buf);
    this._audioChunksSent++;
    if (this._audioChunksSent <= 3) {
      /* eslint-disable-next-line no-console -- payload verification: user confirms audio is being sent */
      console.log('[JARVIS OpenWakeWord] Sending audio payload to server', {
        chunk: this._audioChunksSent,
        bytes: buf?.byteLength ?? 0,
        samples: buf ? buf.byteLength / 2 : 0,
      });
    }
    return true;
  }

  isConnected() {
    return !!this._ws && this._ws.readyState === WebSocket.OPEN;
  }

  close() {
    this._closed = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._ws) {
      try {
        this._ws.close(1000, 'client close');
      } catch (err) {
        void err;
      }
      this._ws = null;
    }
    this._sampleRateSent = false;
    this._reconnectAttempts = RECONNECT_MAX_ATTEMPTS;
    DEBUG.trace('OpenWakeWordClient: closed by client');
  }
}
