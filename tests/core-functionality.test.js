/**
 * Core functionality tests for JARVIS-WEB.
 * @see jEsT dOcS.md — Project Test Structure
 */
import { describe, it, expect } from '@jest/globals';
import { CARTESIA_CONFIG, N8N_WEBHOOK_URL } from '../src/config.js';

describe('Core functionality', () => {
  describe('CARTESIA_CONFIG', () => {
    it('should export TTS endpoint and model', () => {
      expect(CARTESIA_CONFIG.TTS).toBeDefined();
      expect(CARTESIA_CONFIG.TTS.ENDPOINT).toContain('cartesia.ai');
      expect(CARTESIA_CONFIG.TTS.MODEL).toBeDefined();
    });

    it('should export STT endpoint and model', () => {
      expect(CARTESIA_CONFIG.STT).toBeDefined();
      expect(CARTESIA_CONFIG.STT.ENDPOINT).toContain('cartesia.ai');
      expect(CARTESIA_CONFIG.STT.MODEL).toBeDefined();
    });

    it('should have valid sample rates', () => {
      expect(CARTESIA_CONFIG.TTS.SAMPLE_RATE).toBeGreaterThan(0);
      expect(CARTESIA_CONFIG.STT.SAMPLE_RATE).toBe(16000);
    });

    it('should have WS settings for reconnection', () => {
      expect(CARTESIA_CONFIG.WS).toBeDefined();
      expect(CARTESIA_CONFIG.WS.RECONNECT_DELAY).toBeGreaterThan(0);
      expect(CARTESIA_CONFIG.WS.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    });
  });

  describe('N8N_WEBHOOK_URL', () => {
    it('should be a non-empty string', () => {
      expect(typeof N8N_WEBHOOK_URL).toBe('string');
      expect(N8N_WEBHOOK_URL.length).toBeGreaterThan(0);
    });

    it('should be a valid URL', () => {
      expect(() => new URL(N8N_WEBHOOK_URL)).not.toThrow();
    });
  });

  describe('Environment', () => {
    it('should run in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});
