/**
 * OpenWakeWord Manager - openWakeWord backend.
 * Same interface as WakeWordManager: initialize, setEnabled, onWakeWordDetected, getMetrics, release.
 * Uses AudioWorklet at 16 kHz Int16, 80 ms frames (1280 samples), streams to Python openWakeWord server via WebSocket.
 *
 * Compatible with aUdiO dOcS.md and cArTeSiA dOcS.md (16 kHz, pcm_s16le).
 * @see docs/OPENWAKEWORD.md
 */
import { OpenWakeWordClient } from './openwakeword-client.js';
import { DEBUG } from './debug.js';
import { logWakeWordError } from './wake-word-console.js';

/** 80 ms @ 16 kHz = 1280 samples (openWakeWord optimal frame size) */
const OPENWAKEWORD_FRAME_SAMPLES = 1280;

export class OpenWakeWordManager {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || '';
    this.onWakeWordDetected = options.onWakeWordDetected || (() => {});
    const userOnError = options.onError || (() => {});
    this.onError = (error, detail) => {
      logWakeWordError(error, detail);
      userOnError(error);
    };

    this.audioContext = null;
    this.wakeWordNode = null;
    this.client = null;
    this.enabled = false;
    this._cooldownMs = options.cooldownMs ?? 3000;
    this._lastDetectionTime = 0;
    this._metrics = {
      detectionCount: 0,
      totalDetectionTime: 0,
      lastDetectionTime: 0,
      firstDetectionTime: null,
    };
  }

  /**
   * Initialize: load AudioWorklet (same wake-word-processor, 1280-sample frames), connect WebSocket client.
   * @param {AudioContext} audioContext
   * @param {MediaStream} mediaStream
   * @param {string} [audioWorkletBasePath]
   * @returns {Promise<{ node: AudioWorkletNode, frameLength: number, sampleRate: number } | null>}
   */
  async initialize(audioContext, mediaStream, audioWorkletBasePath) {
    if (!this.wsUrl || typeof this.wsUrl !== 'string' || !this.wsUrl.trim()) {
      DEBUG.trace('OpenWakeWordManager: No wsUrl, skipping');
      this.onError('OpenWakeWord WebSocket URL is required (e.g. ws://localhost:8765/ws). Set OPENWAKEWORD_WS_URL.');
      return null;
    }

    this.audioContext = audioContext;

    const basePath = audioWorkletBasePath || './audio/';
    const workletPath = basePath.endsWith('/')
      ? `${basePath}wake-word-processor.js`
      : `${basePath}/wake-word-processor.js`;
    const absolutePath = workletPath.startsWith('http')
      ? workletPath
      : new URL(workletPath, window.location.origin).href;

    try {
      await audioContext.audioWorklet.addModule(absolutePath);
    } catch (err) {
      DEBUG.error('OpenWakeWordManager: Failed to load AudioWorklet', err);
      this.onError('Failed to load wake word processor: ' + (err?.message || String(err)));
      return null;
    }

    this.wakeWordNode = new AudioWorkletNode(audioContext, 'wake-word-processor');

    this.client = new OpenWakeWordClient({
      wsUrl: this.wsUrl,
      onActivation: (keywordIndex, modelName) => {
        const now = Date.now();
        if (now - this._lastDetectionTime < this._cooldownMs) {
          DEBUG.trace('OpenWakeWordManager: activation in cooldown');
          return;
        }
        this._lastDetectionTime = now;
        this._metrics.detectionCount++;
        this._metrics.lastDetectionTime = now;
        if (this._metrics.firstDetectionTime === null) {
          this._metrics.firstDetectionTime = now;
        }
        DEBUG.trace('OpenWakeWordManager: wake word detected', { keywordIndex, modelName });
        /* eslint-disable no-console -- payload verification: user confirms activation → bridge */
        if (typeof console !== 'undefined' && console.log) {
          console.log('[JARVIS OpenWakeWord] Wake word detected, triggering bridge (STT will start, speak to send payload to n8n)', {
            modelName,
            keywordIndex,
          });
        }
        /* eslint-enable no-console */
        this.onWakeWordDetected(keywordIndex);
      },
      onError: (error, detail) => {
        this.onError(error, detail);
      },
      onConnect: () => {
        DEBUG.trace('OpenWakeWordManager: WebSocket connected');
        this.client.sendSampleRate();
      },
      onDisconnect: () => {
        DEBUG.trace('OpenWakeWordManager: WebSocket disconnected');
      },
    });
    this.client.connect();

    this._framesForwarded = 0;
    this.wakeWordNode.port.onmessage = (e) => {
      if (e.data.type === 'audioFrame' && this.enabled && this.client) {
        const frame = new Int16Array(e.data.frame);
        if (frame.length === OPENWAKEWORD_FRAME_SAMPLES) {
          this.client.sendAudio(frame);
          this._framesForwarded++;
          if (this._framesForwarded <= 3) {
            /* eslint-disable no-console -- payload verification: user confirms mic→server flow */
            if (typeof console !== 'undefined' && console.log) {
              console.log('[JARVIS OpenWakeWord] Forwarding audio frame to client', {
                frame: this._framesForwarded,
                samples: frame.length,
              });
            }
            /* eslint-enable no-console */
          }
        } else {
          DEBUG.trace('OpenWakeWordManager: skipping frame (length %s)', frame.length);
        }
      } else if (e.data.type === 'error') {
        DEBUG.error('OpenWakeWordManager: processor error', e.data.error);
        this.onError(e.data.error);
      }
    };

    this.wakeWordNode.port.postMessage({
      type: 'config',
      frameLength: OPENWAKEWORD_FRAME_SAMPLES,
      enabled: this.enabled,
    });

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(this.wakeWordNode);

    DEBUG.trace('OpenWakeWordManager: initialized', { wsUrl: this.wsUrl, frameSamples: OPENWAKEWORD_FRAME_SAMPLES });
    return {
      node: this.wakeWordNode,
      frameLength: OPENWAKEWORD_FRAME_SAMPLES,
      sampleRate: 16000,
    };
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.wakeWordNode) {
      this.wakeWordNode.port.postMessage({ type: 'enable', enabled });
    }
    DEBUG.trace('OpenWakeWordManager: setEnabled', enabled);
  }

  isEnabled() {
    return this.enabled;
  }

  getMetrics() {
    if (!this.client || !this.enabled) return null;
    const uptime = this._metrics.firstDetectionTime
      ? Date.now() - this._metrics.firstDetectionTime
      : 0;
    return {
      ...this._metrics,
      uptimeMs: uptime,
      detectionsPerHour: uptime > 0
        ? (this._metrics.detectionCount / (uptime / 3600000))
        : 0,
    };
  }

  resetMetrics() {
    this._metrics = {
      detectionCount: 0,
      totalDetectionTime: 0,
      lastDetectionTime: 0,
      firstDetectionTime: null,
    };
  }

  setCooldownMs(ms) {
    if (typeof ms === 'number' && ms >= 0) this._cooldownMs = ms;
  }

  async release() {
    this.setEnabled(false);
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.wakeWordNode) {
      try {
        this.wakeWordNode.port.onmessage = null;
        this.wakeWordNode.disconnect();
      } catch (err) {
        void err;
      }
      this.wakeWordNode = null;
    }
    this.resetMetrics();
    DEBUG.trace('OpenWakeWordManager: released');
  }
}
