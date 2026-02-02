/**
 * TTS Playback AudioWorklet Processor
 * Receives Int16 PCM at 8kHz from Cartesia, upsamples to context rate (48kHz),
 * converts to Float32, outputs gapless audio.
 * @see aUdiO dOcS.md
 */
const TTS_SAMPLE_RATE = 44100;

class TTSPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.upsampleRatio = sampleRate / TTS_SAMPLE_RATE;
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') {
        const samples = e.data.samples;
        if (Array.isArray(samples)) {
          this.buffer.push(...samples);
        } else if (samples instanceof Int16Array) {
          this.buffer.push(...Array.from(samples));
        }
      } else if (e.data.type === 'clear') {
        this.buffer = [];
      }
    };
  }

  int16ToFloat(s) {
    return s >= 0x8000 ? -(0x10000 - s) / 0x8000 : s / 0x7FFF;
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
