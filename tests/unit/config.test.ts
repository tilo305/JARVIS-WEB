/**
 * Unit tests for Cartesia API configuration
 */
import { describe, it, expect } from '@jest/globals';
import { CARTESIA_CONFIG, N8N_WEBHOOK_URL } from '../../src/config.js';

describe('N8N_WEBHOOK_URL', () => {
  it('should be defined and valid URL', () => {
    expect(N8N_WEBHOOK_URL).toBeDefined();
    expect(typeof N8N_WEBHOOK_URL).toBe('string');
    expect(N8N_WEBHOOK_URL).toMatch(/^https:\/\/.+\/webhook\/[a-f0-9-]+$/);
  });
});

describe('CARTESIA_CONFIG', () => {
  describe('root config', () => {
    it('should have API_KEY', () => {
      expect(CARTESIA_CONFIG.API_KEY).toBeDefined();
      expect(typeof CARTESIA_CONFIG.API_KEY).toBe('string');
    });

    it('should have VOICE_ID', () => {
      expect(CARTESIA_CONFIG.VOICE_ID).toBeDefined();
      expect(typeof CARTESIA_CONFIG.VOICE_ID).toBe('string');
    });

    it('should have API_VERSION', () => {
      expect(CARTESIA_CONFIG.API_VERSION).toBeDefined();
      expect(CARTESIA_CONFIG.API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('TTS config', () => {
    it('should have valid TTS endpoint', () => {
      expect(CARTESIA_CONFIG.TTS.ENDPOINT).toMatch(/^wss?:\/\//);
    });

    it('should have TTS model', () => {
      expect(CARTESIA_CONFIG.TTS.MODEL).toBeDefined();
      expect(typeof CARTESIA_CONFIG.TTS.MODEL).toBe('string');
    });

    it('should have sample rate 44100', () => {
      expect(CARTESIA_CONFIG.TTS.SAMPLE_RATE).toBe(44100);
    });

    it('should have PCM encoding', () => {
      expect(CARTESIA_CONFIG.TTS.ENCODING).toBe('pcm_s16le');
    });
  });

  describe('STT config', () => {
    it('should have valid STT endpoint', () => {
      expect(CARTESIA_CONFIG.STT.ENDPOINT).toMatch(/^wss?:\/\//);
    });

    it('should have STT model', () => {
      expect(CARTESIA_CONFIG.STT.MODEL).toBeDefined();
    });

    it('should have sample rate 16000', () => {
      expect(CARTESIA_CONFIG.STT.SAMPLE_RATE).toBe(16000);
    });
  });

  describe('WebSocket config', () => {
    it('should have reconnect settings', () => {
      expect(CARTESIA_CONFIG.WS.RECONNECT_DELAY).toBeGreaterThan(0);
      expect(CARTESIA_CONFIG.WS.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    });

    it('should have timeout', () => {
      expect(CARTESIA_CONFIG.WS.TIMEOUT_MS).toBeGreaterThan(0);
    });
  });
});
