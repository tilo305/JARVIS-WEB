/**
 * TTS Playback AudioWorklet Processor
 * Receives Int16 PCM at 44.1kHz from Cartesia, resamples to context rate (48kHz),
 * converts to Float32, outputs gapless audio.
 * Optimized for minimal latency: efficient ring buffer, optimized conversions.
 * @see aUdiO dOcS.md
 */
const TTS_SAMPLE_RATE = 44100;
const INITIAL_BUFFER_SIZE = 8192; // Pre-allocate buffer to reduce allocations

class TTSPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
    this.upsampleRatio = ctxRate / TTS_SAMPLE_RATE;
    
    // Use TypedArray for efficient buffering (O(1) access, no splice overhead)
    this.buffer = new Int16Array(INITIAL_BUFFER_SIZE);
    this.bufferLength = 0;
    this.bufferStart = 0; // Ring buffer start index
    
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') {
        const samples = e.data.samples;
        if (samples == null) return;
        
        // Efficiently handle different input types
        let int16Samples;
        if (samples instanceof Int16Array) {
          int16Samples = samples;
        } else if (samples instanceof ArrayBuffer) {
          int16Samples = new Int16Array(samples);
        } else if (ArrayBuffer.isView(samples)) {
          int16Samples = new Int16Array(samples.buffer, samples.byteOffset, samples.byteLength / 2);
        } else if (Array.isArray(samples)) {
          // Fallback for arrays (less efficient but supported)
          int16Samples = new Int16Array(samples);
        } else {
          return;
        }
        
        this.appendSamples(int16Samples);
      } else if (e.data.type === 'clear') {
        this.bufferLength = 0;
        this.bufferStart = 0;
      }
    };
  }

  /**
   * Efficiently append samples to ring buffer
   */
  appendSamples(samples) {
    const neededLength = this.bufferLength + samples.length;
    
    // Grow buffer if needed (amortized O(1))
    if (neededLength > this.buffer.length) {
      const newSize = Math.max(neededLength, this.buffer.length * 2);
      const newBuffer = new Int16Array(newSize);
      
      // Copy existing data (handle ring buffer wrap)
      // Check if data wraps around the buffer
      const endPos = (this.bufferStart + this.bufferLength) % this.buffer.length;
      const wraps = endPos < this.bufferStart || (this.bufferStart + this.bufferLength > this.buffer.length);
      
      if (!wraps && this.bufferLength > 0) {
        // No wrap - single contiguous copy
        newBuffer.set(this.buffer.subarray(this.bufferStart, this.bufferStart + this.bufferLength), 0);
      } else if (this.bufferLength > 0) {
        // Wrapped - two copies
        const firstPart = this.buffer.length - this.bufferStart;
        newBuffer.set(this.buffer.subarray(this.bufferStart), 0);
        if (this.bufferLength > firstPart) {
          newBuffer.set(this.buffer.subarray(0, this.bufferLength - firstPart), firstPart);
        }
      }
      
      this.buffer = newBuffer;
      this.bufferStart = 0;
    }
    
    // Append new samples (handle wrap)
    const writePos = (this.bufferStart + this.bufferLength) % this.buffer.length;
    const spaceToEnd = this.buffer.length - writePos;
    
    if (samples.length <= spaceToEnd) {
      // Single write - no wrap
      this.buffer.set(samples, writePos);
    } else {
      // Wrapped write - split across buffer boundary
      this.buffer.set(samples.subarray(0, spaceToEnd), writePos);
      this.buffer.set(samples.subarray(spaceToEnd), 0);
    }
    
    this.bufferLength += samples.length;
  }

  /**
   * Optimized Int16 to Float32 conversion (inlined for performance)
   */
  int16ToFloat(s) {
    // Fast path: standard signed Int16 conversion
    return s / 0x7FFF;
  }

  /**
   * Get sample from ring buffer (handles wrap)
   */
  getSample(index) {
    if (index >= this.bufferLength) return 0;
    const pos = (this.bufferStart + index) % this.buffer.length;
    return this.buffer[pos];
  }

  process(inputs, outputs, _parameters) {
    const output = outputs[0]?.[0];
    if (!output) return true;

    const blockSize = output.length;
    const invRatio = 1 / this.upsampleRatio;

    // Optimized resampling with ring buffer access
    for (let i = 0; i < blockSize; i++) {
      const srcIdx = i * invRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;

      if (idx < this.bufferLength) {
        const s0 = this.int16ToFloat(this.getSample(idx));
        const s1 = idx + 1 < this.bufferLength
          ? this.int16ToFloat(this.getSample(idx + 1))
          : s0;
        output[i] = s0 * (1 - frac) + s1 * frac;
      } else {
        output[i] = 0;
      }
    }

    // Efficiently consume samples (update ring buffer pointers)
    const hadSamples = this.bufferLength > 0;
    const consumed = Math.ceil((blockSize - 1) * invRatio) + 1;
    if (consumed > 0 && this.bufferLength > 0) {
      const toConsume = Math.min(consumed, this.bufferLength);
      this.bufferStart = (this.bufferStart + toConsume) % this.buffer.length;
      this.bufferLength -= toConsume;
    }
    // Notify when playback buffer drains so 10s silence timer starts after agent stops speaking
    if (hadSamples && this.bufferLength === 0) {
      this.port.postMessage({ type: 'bufferEmpty' });
    }

    return true;
  }
}

registerProcessor('tts-playback-processor', TTSPlaybackProcessor);
