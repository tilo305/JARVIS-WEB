/**
 * STT Capture AudioWorklet Processor
 * Captures microphone audio, resamples 48kHz→16kHz, converts Float32→Int16,
 * buffers ~100ms chunks for optimal Cartesia STT latency.
 * @see aUdiO dOcS.md
 */
const SAMPLE_RATE_OUT = 16000;
const CHUNK_MS = 100;
const SAMPLES_PER_CHUNK = Math.floor((SAMPLE_RATE_OUT * CHUNK_MS) / 1000);

class STTCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.contextSampleRate = sampleRate;
    this.resampleRatio = this.contextSampleRate / SAMPLE_RATE_OUT;
    this.buffer = [];
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

  process(inputs, _outputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    const resampled = this.resampleTo16k(input);
    const int16 = this.floatToInt16(resampled);
    for (let i = 0; i < int16.length; i++) {
      this.buffer.push(int16[i]);
    }

    while (this.buffer.length >= SAMPLES_PER_CHUNK) {
      const chunk = new Int16Array(SAMPLES_PER_CHUNK);
      for (let i = 0; i < SAMPLES_PER_CHUNK; i++) {
        chunk[i] = this.buffer.shift();
      }
      this.port.postMessage({ type: 'audio', data: chunk.buffer }, [chunk.buffer]);
    }
    return true;
  }
}

registerProcessor('stt-capture-processor', STTCaptureProcessor);
