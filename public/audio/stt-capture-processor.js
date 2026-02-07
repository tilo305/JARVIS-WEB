/**
 * STT Capture AudioWorklet Processor
 * Captures microphone audio, resamples 48kHz→16kHz, converts Float32→Int16,
 * buffers ~100ms chunks for optimal Cartesia STT latency (balanced; ~100ms recommended).
 * For ultra-low latency, CHUNK_MS can be reduced to 50 (more messages, slightly higher CPU).
 * Optimized for minimal latency: zero-copy transfers, efficient buffering.
 * @see aUdiO dOcS.md
 */
const SAMPLE_RATE_OUT = 16000;
const CHUNK_MS = 100; // 100ms = Cartesia-recommended; 50ms = ultra-low latency option
const SAMPLES_PER_CHUNK = Math.floor((SAMPLE_RATE_OUT * CHUNK_MS) / 1000);

class STTCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // AudioWorkletGlobalScope.sampleRate; fallback for edge cases
    const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
    this.contextSampleRate = ctxRate;
    this.resampleRatio = this.contextSampleRate / SAMPLE_RATE_OUT;
    // Use TypedArray for efficient buffering (O(1) access, no splice overhead)
    this.buffer = new Int16Array(SAMPLES_PER_CHUNK * 2); // Pre-allocate 2x chunk size
    this.bufferLength = 0;
  }

  /**
   * Combined resample and convert in single pass for optimal performance
   * Directly converts Float32 → Int16 while resampling, avoiding intermediate allocations
   */
  resampleAndConvertToInt16(float32Array) {
    const outLength = Math.floor(float32Array.length / this.resampleRatio);
    const int16 = new Int16Array(outLength);
    
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * this.resampleRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;
      const nextIdx = Math.min(idx + 1, float32Array.length - 1);
      
      // Linear interpolation
      const s = float32Array[idx] * (1 - frac) + float32Array[nextIdx] * frac;
      // Clamp and convert to Int16 in one step
      const clamped = Math.max(-1, Math.min(1, s));
      int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }
    
    return int16;
  }

  process(inputs, _outputs, _parameters) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    // Combined resample + convert in single pass (reduces allocations)
    const int16Chunk = this.resampleAndConvertToInt16(input);
    
    // Efficiently append to buffer (grow if needed)
    const neededLength = this.bufferLength + int16Chunk.length;
    if (neededLength > this.buffer.length) {
      // Grow buffer by 2x when needed (amortized O(1) growth)
      const newBuffer = new Int16Array(Math.max(neededLength, this.buffer.length * 2));
      newBuffer.set(this.buffer.subarray(0, this.bufferLength), 0);
      this.buffer = newBuffer;
    }
    
    // Append new chunk
    this.buffer.set(int16Chunk, this.bufferLength);
    this.bufferLength += int16Chunk.length;

    // Send complete chunks immediately (zero-copy via transferable)
    while (this.bufferLength >= SAMPLES_PER_CHUNK) {
      // Create chunk view (zero-copy)
      const chunk = this.buffer.subarray(0, SAMPLES_PER_CHUNK);
      // Create new ArrayBuffer for transfer (required for transferable)
      const chunkBuffer = new Int16Array(SAMPLES_PER_CHUNK);
      chunkBuffer.set(chunk);
      
      // Send with transferable ArrayBuffer for zero-copy transfer
      this.port.postMessage({ type: 'audio', data: chunkBuffer.buffer }, [chunkBuffer.buffer]);
      
      // Efficiently shift buffer (copy remaining data)
      const remaining = this.bufferLength - SAMPLES_PER_CHUNK;
      if (remaining > 0) {
        this.buffer.copyWithin(0, SAMPLES_PER_CHUNK, this.bufferLength);
      }
      this.bufferLength = remaining;
    }
    
    return true;
  }
}

registerProcessor('stt-capture-processor', STTCaptureProcessor);
