/**
 * Type declarations for audio-utils.js
 */
export function floatTo16BitPCM(float32Array: Float32Array): Int16Array;
export function int16ToFloat32(int16Array: Int16Array): Float32Array;
export function float32ToInt16(float32Array: Float32Array): Int16Array;
export function decodeBase64PCM(base64: string): Int16Array;
