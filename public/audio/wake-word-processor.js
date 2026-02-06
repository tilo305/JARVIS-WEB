/**
 * Wake Word AudioWorklet Processor
 * Shared by: (1) Porcupine on main thread (512-sample frames), (2) openWakeWord (1280-sample / 80ms frames).
 * Processes mic at 16kHz Int16 PCM; frame length is set via postMessage({ type: 'config', frameLength }).
 * Runs in parallel with STT capture; same MediaStream feeds both via separate AudioWorklet nodes.
 *
 * Compatibility: Aligned with cArTeSiA dOcS.md STT specs (16kHz, pcm_s16le).
 * @see aUdiO dOcS.md, wAkE wOrD dOcS.md, docs/OPENWAKEWORD.md
 */
const SAMPLE_RATE = 16000; // Match Cartesia STT pipeline (cArTeSiA dOcS.md: sample_rate: "16000")
const FRAME_LENGTH = 512;  // Default 32ms @ 16kHz; openWakeWord uses 1280 (80ms) via config from main thread

class WakeWordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
    this.contextSampleRate = ctxRate;
    this.resampleRatio = this.contextSampleRate / SAMPLE_RATE;
    this.buffer = [];
    this.frameLength = FRAME_LENGTH;
    this.enabled = false;
    this._disabledLogged = false;
    this._noInputLogged = false;
    this._frameCount = 0;
    
    // Handle messages from main thread
    this.port.onmessage = (e) => {
      if (e.data.type === 'config') {
        this.frameLength = e.data.frameLength || FRAME_LENGTH;
        this.enabled = e.data.enabled !== false;
        // Acknowledge so main thread can verify payloads are received
        this.port.postMessage({ type: 'configAck', frameLength: this.frameLength, enabled: this.enabled });
      } else if (e.data.type === 'enable') {
        this.enabled = e.data.enabled !== false;
      } else if (e.data.type === 'frame') {
        // Main thread sends pre-processed frames for Porcupine
        // This allows Porcupine to run on main thread (AudioWorklet can't access WebAssembly directly)
        this.port.postMessage({ type: 'processFrame', frame: e.data.frame });
      }
    };
  }

  floatToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  resampleTo16k(float32Array) {
    const outLength = Math.floor(float32Array.length / this.resampleRatio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * this.resampleRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;
      const nextIdx = Math.min(idx + 1, float32Array.length - 1);
      out[i] = float32Array[idx] * (1 - frac) + float32Array[nextIdx] * frac;
    }
    return out;
  }

  process(inputs, _outputs, _parameters) {
    if (!this.enabled) {
      // Log once when disabled to help debug
      if (!this._disabledLogged) {
        this.port.postMessage({ type: 'debug', message: 'Wake word processor disabled' });
        this._disabledLogged = true;
      }
      return true;
    }
    
    // Reset disabled log flag when enabled
    this._disabledLogged = false;
    
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      // Log once when no input to help debug
      if (!this._noInputLogged) {
        this.port.postMessage({ type: 'debug', message: 'Wake word processor: no audio input' });
        this._noInputLogged = true;
      }
      return true;
    }
    
    // Reset no input log flag when input is present
    this._noInputLogged = false;

    // Validate input is Float32Array
    if (!(input instanceof Float32Array)) {
      this.port.postMessage({ 
        type: 'error', 
        error: 'Invalid input type: expected Float32Array' 
      });
      return true;
    }

    // Validate frame length is reasonable (prevent buffer overflow)
    if (this.frameLength <= 0 || this.frameLength > 4096) {
      this.port.postMessage({ 
        type: 'error', 
        error: `Invalid frame length: ${this.frameLength}` 
      });
      return true;
    }

    const resampled = this.resampleTo16k(input);
    const int16 = this.floatToInt16(resampled);
    
    // Buffer until we have a full frame
    // Prevent buffer from growing too large (memory protection)
    const maxBufferSize = this.frameLength * 10; // Max 10 frames
    if (this.buffer.length > maxBufferSize) {
      // Drop oldest samples if buffer is too large
      this.buffer = this.buffer.slice(-maxBufferSize);
      this.port.postMessage({ 
        type: 'error', 
        error: 'Buffer overflow: dropping old samples' 
      });
    }
    
    for (let i = 0; i < int16.length; i++) {
      this.buffer.push(int16[i]);
    }

    // Send complete frames to main thread for Porcupine processing
    while (this.buffer.length >= this.frameLength) {
      const frame = new Int16Array(this.frameLength);
      for (let i = 0; i < this.frameLength; i++) {
        frame[i] = this.buffer.shift();
      }
      
      // Validate frame before sending
      if (frame.length !== this.frameLength) {
        this.port.postMessage({ 
          type: 'error', 
          error: `Frame length mismatch: expected ${this.frameLength}, got ${frame.length}` 
        });
        continue;
      }
      
      // Send frame to main thread (Porcupine runs on main thread)
      this._frameCount++;
      // Log first few frames to confirm audio is flowing
      if (this._frameCount <= 3) {
        this.port.postMessage({ 
          type: 'debug', 
          message: `Wake word processor: sending frame ${this._frameCount} (${frame.length} samples)` 
        });
      }
      
      this.port.postMessage({ 
        type: 'audioFrame', 
        frame: frame.buffer 
      }, [frame.buffer]);
    }
    
    return true;
  }
}

registerProcessor('wake-word-processor', WakeWordProcessor);
