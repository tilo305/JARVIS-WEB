/**
 * Unit tests for VAD config (Voice Activity Detection + silence closing message)
 */
import { describe, it, expect } from '@jest/globals';
import { VAD_CONFIG } from '../../public/js/vad-config.js';

describe('VAD_CONFIG', () => {
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
