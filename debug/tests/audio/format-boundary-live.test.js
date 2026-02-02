/**
 * LIVE Audio Format Boundary Tests (aUdiO dOcS.md)
 * Validates Float32 ↔ Int16 edge cases for Cartesia STT/TTS.
 * Per zEn DeBuGgEr.md - debug folder LIVE tests.
 */
import { describe, it, expect } from '@jest/globals';
import {
  floatTo16BitPCM,
  int16ToFloat32,
  float32ToInt16,
  decodeBase64PCM,
} from '../../../public/js/audio-utils.js';

describe('LIVE audio format boundary (aUdiO dOcS)', () => {
  describe('Float32 → Int16 boundary values', () => {
    it('should handle NaN and clamp to valid range', () => {
      const input = new Float32Array([NaN, Infinity, -Infinity]);
      const result = floatTo16BitPCM(input);
      expect(result[0]).toBeLessThanOrEqual(32767);
      expect(result[0]).toBeGreaterThanOrEqual(-32768);
      expect(result[1]).toBe(32767);
      expect(result[2]).toBe(-32768);
    });

    it('should handle very small floats near zero', () => {
      const input = new Float32Array([1e-10, -1e-10, 0.0001]);
      const result = floatTo16BitPCM(input);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
      expect(Math.abs(result[2])).toBeLessThanOrEqual(4); // ~0.0001 * 32767
    });

    it('should handle 1600 samples (100ms @ 16kHz STT chunk)', () => {
      const len = 1600;
      const input = new Float32Array(len);
      for (let i = 0; i < len; i++) input[i] = Math.sin((i / len) * Math.PI * 2);
      const result = floatTo16BitPCM(input);
      expect(result.length).toBe(len);
      expect(result).toBeInstanceOf(Int16Array);
      expect(result[0]).toBe(0);
      expect(result[len / 4]).toBeGreaterThan(0);
    });
  });

  describe('Int16 → Float32 boundary values', () => {
    it('should handle full range correctly', () => {
      const input = new Int16Array([0, 32767, -32768, 16383]);
      const result = int16ToFloat32(input);
      expect(result[0]).toBeCloseTo(0, 5);
      expect(result[1]).toBeCloseTo(1.0, 5);
      expect(result[2]).toBeCloseTo(-1.0, 2);
      expect(result[3]).toBeCloseTo(0.5, 3);
    });
  });

  describe('decodeBase64PCM (TTS chunks)', () => {
    it('should decode 8kHz TTS chunk (e.g. 80ms = 640 samples)', () => {
      const samples = 640;
      const arr = new Int16Array(samples);
      for (let i = 0; i < samples; i++) arr[i] = Math.floor(Math.sin(i * 0.01) * 10000);
      const bytes = new Uint8Array(arr.buffer);
      const base64 = Buffer.from(bytes).toString('base64');
      const decoded = decodeBase64PCM(base64);
      expect(decoded.length).toBe(samples);
      expect(decoded[0]).toBe(arr[0]);
    });
  });
});
