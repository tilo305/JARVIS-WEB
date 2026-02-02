/**
 * TTS Playback AudioWorklet Processor
 * Receives Int16 PCM at 44.1kHz from Cartesia, resamples to context rate (48kHz),
 * converts to Float32, outputs gapless audio.
 * @see aUdiO dOcS.md
 */
const TTS_SAMPLE_RATE = 44100;

class TTSPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
    this.upsampleRatio = ctxRate / TTS_SAMPLE_RATE;
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') {
        const samples = e.data.samples;
        if (Array.isArray(samples)) {
          this.buffer.push(...samples);
        } else if (samples instanceof Int16Array) {
          this.buffer.push(...Array.from(samples));
        } else if (samples instanceof ArrayBuffer) {
          const arr = new Int16Array(samples);
          this.buffer.push(...Array.from(arr));
        }
      } else if (e.data.type === 'clear') {
        this.buffer = [];
      }
    };
  }

  int16ToFloat(s) {
    // Standard Int16 PCM (-32768..32767) → Float32 (-1..1); handles both signed and unsigned
    const n = typeof s === 'number' && !Number.isNaN(s) ? s : 0;
    return n >= 0x8000 ? -(0x10000 - n) / 0x8000 : n / 0x7FFF;
  }

  process(inputs, outputs) {
    const output = outputs[0]?.[0];
    if (!output) return true;

    const blockSize = output.length;

    for (let i = 0; i < blockSize; i++) {
      const srcIdx = i / this.upsampleRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;

      if (idx < this.buffer.length) {
        const s0 = this.int16ToFloat(this.buffer[idx]);
        const s1 = idx + 1 < this.buffer.length
          ? this.int16ToFloat(this.buffer[idx + 1])
          : s0;
        output[i] = s0 * (1 - frac) + s1 * frac;
      } else {
        output[i] = 0;
      }
    }

    const consumed = Math.ceil((blockSize - 1) / this.upsampleRatio) + 1;
    if (consumed > 0 && this.buffer.length > 0) {
      this.buffer.splice(0, Math.min(consumed, this.buffer.length));
    }

    return true;
  }
}

registerProcessor('tts-playback-processor', TTSPlaybackProcessor);
