/**
 * Voice pipeline integration tests for JARVIS-WEB.
 * Tests Cartesia STT/TTS pipeline structure and configuration.
 * @see jEsT dOcS.md — Project Test Structure
 */
import { describe, it, expect } from '@jest/globals';
import { CARTESIA_CONFIG } from '../../src/config.js';

describe('Voice pipeline (integration)', () => {
  describe('TTS pipeline config', () => {
    it('should have valid TTS WebSocket endpoint', () => {
      expect(CARTESIA_CONFIG.TTS.ENDPOINT).toMatch(/^wss:\/\//);
      expect(CARTESIA_CONFIG.TTS.ENDPOINT).toContain('tts');
    });

    it('should have PCM encoding for audio output', () => {
      expect(CARTESIA_CONFIG.TTS.ENCODING).toBe('pcm_s16le');
      expect(CARTESIA_CONFIG.TTS.SAMPLE_RATE).toBe(44100);
    });

    it('should have model and language', () => {
      expect(CARTESIA_CONFIG.TTS.MODEL).toBeTruthy();
      expect(CARTESIA_CONFIG.TTS.LANGUAGE).toBe('en');
    });
  });

  describe('STT pipeline config', () => {
    it('should have valid STT WebSocket endpoint', () => {
      expect(CARTESIA_CONFIG.STT.ENDPOINT).toMatch(/^wss:\/\//);
      expect(CARTESIA_CONFIG.STT.ENDPOINT).toContain('stt');
    });

    it('should have PCM encoding for audio input', () => {
      expect(CARTESIA_CONFIG.STT.ENCODING).toBe('pcm_s16le');
      expect(CARTESIA_CONFIG.STT.SAMPLE_RATE).toBe(16000);
    });

    it('should have VAD settings', () => {
      expect(CARTESIA_CONFIG.STT.MIN_VOLUME).toBeDefined();
      expect(CARTESIA_CONFIG.STT.MAX_SILENCE_DURATION_SECS).toBeDefined();
    });
  });

  describe('Pipeline consistency', () => {
    it('should use same API version for TTS and STT', () => {
      expect(CARTESIA_CONFIG.API_VERSION).toBeTruthy();
    });

    it('should have keep-alive for persistent connections', () => {
      expect(CARTESIA_CONFIG.WS.KEEP_ALIVE_INTERVAL_MS).toBeGreaterThan(0);
      expect(CARTESIA_CONFIG.WS.PERSIST_CONNECTIONS).toBe(true);
    });
  });
});
