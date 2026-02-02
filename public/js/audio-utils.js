/**
 * Audio format conversion utilities for Cartesia integration
 * Float32 ↔ Int16, base64 decode for TTS chunks
 * @see aUdiO dOcS.md
 */

/**
 * Convert Float32Array (Web Audio -1 to 1) to Int16 PCM (Cartesia)
 */
export function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * Convert Int16 PCM to Float32Array (for Web Audio playback)
 */
export function int16ToFloat32(int16Array) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int = int16Array[i];
    float32Array[i] =
      int >= 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
  }
  return float32Array;
}

/**
 * Convert Float32Array (VAD output, -1 to 1) to Int16 PCM (Cartesia STT)
 * VAD produces 16kHz Float32; Cartesia expects 16kHz PCM s16le
 */
export function float32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * Decode base64 PCM chunk from Cartesia TTS to Int16Array
 */
export function decodeBase64PCM(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 1);
}
