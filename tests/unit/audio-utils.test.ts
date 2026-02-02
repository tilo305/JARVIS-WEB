/**
 * Unit tests for audio format conversion utilities
 */
import { describe, it, expect } from '@jest/globals';
import {
  floatTo16BitPCM,
  int16ToFloat32,
  float32ToInt16,
  decodeBase64PCM,
} from '../../public/js/audio-utils.js';

describe('audio-utils', () => {
  describe('floatTo16BitPCM', () => {
    it('should convert zero to zeros', () => {
      const input = new Float32Array([0, 0, 0]);
      const result = floatTo16BitPCM(input);
      expect(result).toBeInstanceOf(Int16Array);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
    });

    it('should convert 1.0 to 32767', () => {
      const input = new Float32Array([1.0]);
      const result = floatTo16BitPCM(input);
      expect(result[0]).toBe(32767);
    });

    it('should convert -1.0 to -32768', () => {
      const input = new Float32Array([-1.0]);
      const result = floatTo16BitPCM(input);
      expect(result[0]).toBe(-32768);
    });

    it('should clamp values outside [-1, 1]', () => {
      const input = new Float32Array([2.0, -2.0]);
      const result = floatTo16BitPCM(input);
      expect(result[0]).toBe(32767);
      expect(result[1]).toBe(-32768);
    });
  });

  describe('int16ToFloat32', () => {
    it('should convert 0 to 0', () => {
      const input = new Int16Array([0]);
      const result = int16ToFloat32(input);
      expect(result).toBeInstanceOf(Float32Array);
      expect(result[0]).toBeCloseTo(0);
    });

    it('should convert 32767 to ~1.0', () => {
      const input = new Int16Array([32767]);
      const result = int16ToFloat32(input);
      expect(result[0]).toBeCloseTo(1.0, 5);
    });

    it('should convert -32768 to ~-1.0', () => {
      const input = new Int16Array([-32768]);
      const result = int16ToFloat32(input);
      expect(result[0]).toBeCloseTo(-1.0, 2);
    });

    it('should round-trip correctly', () => {
      const original = new Float32Array([0.5, -0.25, 0.75]);
      const pcm = floatTo16BitPCM(original);
      const back = int16ToFloat32(pcm);
      expect(back[0]).toBeCloseTo(0.5, 3);
      expect(back[1]).toBeCloseTo(-0.25, 3);
      expect(back[2]).toBeCloseTo(0.75, 3);
    });
  });

  describe('float32ToInt16', () => {
    it('should behave like floatTo16BitPCM', () => {
      const input = new Float32Array([0.5]);
      const result = float32ToInt16(input);
      expect(result[0]).toBe(floatTo16BitPCM(input)[0]);
    });
  });

  describe('decodeBase64PCM', () => {
    it('should decode base64 to Int16Array', () => {
      const twoInt16Bytes = new Int16Array([256]);
      const bytes = new Uint8Array(twoInt16Bytes.buffer);
      const base64 = Buffer.from(bytes).toString('base64');
      const result = decodeBase64PCM(base64);
      expect(result).toBeInstanceOf(Int16Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should decode empty base64 to empty array', () => {
      const emptyBase64 = Buffer.from(new ArrayBuffer(0)).toString('base64');
      const result = decodeBase64PCM(emptyBase64);
      expect(result.length).toBe(0);
    });
  });
});
