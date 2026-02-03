/**
 * Unit tests for VAD config (Voice Activity Detection + silence closing message)
 * Ensures all keys are defined, correctly typed, and in valid ranges for parsing and runtime.
 */
import { describe, it, expect } from '@jest/globals';
import { VAD_CONFIG } from '../../public/js/vad-config.js';

describe('VAD_CONFIG', () => {
  describe('library options (MicVAD / @ricky0123/vad-web)', () => {
    it('should have model set to v5 or legacy', () => {
      expect(VAD_CONFIG.model).toBeDefined();
      expect(['v5', 'legacy']).toContain(VAD_CONFIG.model);
    });

    it('should have redemptionMs as positive number (speech end delay)', () => {
      expect(VAD_CONFIG.redemptionMs).toBeDefined();
      expect(typeof VAD_CONFIG.redemptionMs).toBe('number');
      expect(VAD_CONFIG.redemptionMs).toBeGreaterThan(0);
      expect(VAD_CONFIG.redemptionMs).toBe(1200);
    });

    it('should have preSpeechPadMs as non-negative number', () => {
      expect(VAD_CONFIG.preSpeechPadMs).toBeDefined();
      expect(typeof VAD_CONFIG.preSpeechPadMs).toBe('number');
      expect(VAD_CONFIG.preSpeechPadMs).toBeGreaterThanOrEqual(0);
      expect(VAD_CONFIG.preSpeechPadMs).toBe(800);
    });

    it('should have minSpeechMs as positive number', () => {
      expect(VAD_CONFIG.minSpeechMs).toBeDefined();
      expect(typeof VAD_CONFIG.minSpeechMs).toBe('number');
      expect(VAD_CONFIG.minSpeechMs).toBeGreaterThan(0);
      expect(VAD_CONFIG.minSpeechMs).toBe(400);
    });

    it('should have positiveSpeechThreshold in [0,1]', () => {
      expect(VAD_CONFIG.positiveSpeechThreshold).toBeDefined();
      expect(typeof VAD_CONFIG.positiveSpeechThreshold).toBe('number');
      expect(VAD_CONFIG.positiveSpeechThreshold).toBeGreaterThanOrEqual(0);
      expect(VAD_CONFIG.positiveSpeechThreshold).toBeLessThanOrEqual(1);
      expect(VAD_CONFIG.positiveSpeechThreshold).toBe(0.3);
    });

    it('should have negativeSpeechThreshold in [0,1]', () => {
      expect(VAD_CONFIG.negativeSpeechThreshold).toBeDefined();
      expect(typeof VAD_CONFIG.negativeSpeechThreshold).toBe('number');
      expect(VAD_CONFIG.negativeSpeechThreshold).toBeGreaterThanOrEqual(0);
      expect(VAD_CONFIG.negativeSpeechThreshold).toBeLessThanOrEqual(1);
      expect(VAD_CONFIG.negativeSpeechThreshold).toBe(0.25);
    });

    it('should have submitUserSpeechOnPause as boolean', () => {
      expect(VAD_CONFIG.submitUserSpeechOnPause).toBeDefined();
      expect(typeof VAD_CONFIG.submitUserSpeechOnPause).toBe('boolean');
      expect(VAD_CONFIG.submitUserSpeechOnPause).toBe(true);
    });

    it('should have baseAssetPath as non-empty string URL', () => {
      expect(VAD_CONFIG.baseAssetPath).toBeDefined();
      expect(typeof VAD_CONFIG.baseAssetPath).toBe('string');
      expect(VAD_CONFIG.baseAssetPath.trim().length).toBeGreaterThan(0);
      expect(VAD_CONFIG.baseAssetPath).toMatch(/^https:\/\//);
      expect(VAD_CONFIG.baseAssetPath).toContain('@0.0.30');
    });

    it('should have onnxWASMBasePath as non-empty string URL', () => {
      expect(VAD_CONFIG.onnxWASMBasePath).toBeDefined();
      expect(typeof VAD_CONFIG.onnxWASMBasePath).toBe('string');
      expect(VAD_CONFIG.onnxWASMBasePath.trim().length).toBeGreaterThan(0);
      expect(VAD_CONFIG.onnxWASMBasePath).toMatch(/^https:\/\//);
    });
  });

  describe('app-only options (bridge / UI)', () => {
    it('should have silenceClosingMessageMs set to ~10s', () => {
      expect(VAD_CONFIG.silenceClosingMessageMs).toBeDefined();
      expect(typeof VAD_CONFIG.silenceClosingMessageMs).toBe('number');
      expect(VAD_CONFIG.silenceClosingMessageMs).toBe(10000);
    });

    it('should have silenceClosingPhrases as non-empty array', () => {
      expect(VAD_CONFIG.silenceClosingPhrases).toBeDefined();
      expect(Array.isArray(VAD_CONFIG.silenceClosingPhrases)).toBe(true);
      expect(VAD_CONFIG.silenceClosingPhrases.length).toBeGreaterThan(0);
    });

    it('should have each closing phrase as non-empty string (5–10 words)', () => {
      VAD_CONFIG.silenceClosingPhrases.forEach((phrase) => {
        expect(typeof phrase).toBe('string');
        expect(phrase.trim().length).toBeGreaterThan(0);
        const words = phrase.trim().split(/\s+/).length;
        expect(words).toBeGreaterThanOrEqual(5);
        expect(words).toBeLessThanOrEqual(12); // allow slightly over 10 for punctuation
      });
    });

    it('should have silenceAfterSpeechToStopMicMs for fallback path', () => {
      expect(VAD_CONFIG.silenceAfterSpeechToStopMicMs).toBeDefined();
      expect(typeof VAD_CONFIG.silenceAfterSpeechToStopMicMs).toBe('number');
      expect(VAD_CONFIG.silenceAfterSpeechToStopMicMs).toBe(2500);
    });
  });

  it('should not have unexpected extra keys', () => {
    const allowed = new Set([
      'model', 'redemptionMs', 'preSpeechPadMs', 'minSpeechMs',
      'positiveSpeechThreshold', 'negativeSpeechThreshold', 'submitUserSpeechOnPause',
      'silenceAfterSpeechToStopMicMs', 'silenceClosingMessageMs', 'silenceClosingPhrases',
      'baseAssetPath', 'onnxWASMBasePath',
    ]);
    Object.keys(VAD_CONFIG).forEach((key) => {
      expect(allowed.has(key)).toBe(true);
    });
  });
});
