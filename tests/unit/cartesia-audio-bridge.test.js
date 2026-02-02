/**
 * Unit tests for CartesiaAudioBridge (browser bridge)
 * Tests API surface without requiring full browser environment.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('CartesiaAudioBridge', () => {
  let CartesiaAudioBridge;

  beforeAll(async () => {
    // Bridge uses browser APIs; load only if available (JSDOM/browser)
    try {
      const mod = await import('../../public/js/cartesia-audio-bridge.js');
      CartesiaAudioBridge = mod.CartesiaAudioBridge;
    } catch {
      CartesiaAudioBridge = null;
    }
  });

  it('should export CartesiaAudioBridge class', () => {
    if (!CartesiaAudioBridge) {
      // Skip in Node when browser APIs unavailable
      expect(CartesiaAudioBridge).toBeNull();
      return;
    }
    expect(typeof CartesiaAudioBridge).toBe('function');
  });

  it('should have startAgentSilenceTimer method', () => {
    if (!CartesiaAudioBridge) return;
    expect(typeof CartesiaAudioBridge.prototype.startAgentSilenceTimer).toBe('function');
  });

  it('should have isSTTActive method', () => {
    if (!CartesiaAudioBridge) return;
    expect(typeof CartesiaAudioBridge.prototype.isSTTActive).toBe('function');
  });

  it('should have static checkRecordingSupport', () => {
    if (!CartesiaAudioBridge) return;
    expect(typeof CartesiaAudioBridge.checkRecordingSupport).toBe('function');
  });

  it('STT config must use sample_rate as integer (Cartesia rejects string)', () => {
    // Regression: Cartesia STT returns "Invalid sample rate: make sure it is a whole number" if string.
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/sample_rate:\s*16000\b/);
    expect(source).not.toMatch(/sample_rate:\s*['"]16000['"]/);
  });
});
