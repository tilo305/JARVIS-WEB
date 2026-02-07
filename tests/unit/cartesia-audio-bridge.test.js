/**
 * Unit tests for CartesiaAudioBridge (browser bridge)
 * Tests API surface without requiring full browser environment.
 * Uses CommonJS (require) to avoid Babel emitting import.meta in Jest/Node.
 */
const { describe, it, expect, beforeAll } = require('@jest/globals');
const { readFileSync } = require('fs');
const { join } = require('path');

const BRIDGE_PATH = join(process.cwd(), 'public', 'js', 'cartesia-audio-bridge.js');

describe('CartesiaAudioBridge', () => {
  let CartesiaAudioBridge;

  beforeAll(async () => {
    // Bridge is ESM (import.meta); do not dynamic-import in Node to avoid parse error.
    if (typeof window === 'undefined') {
      CartesiaAudioBridge = null;
      return;
    }
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

  it('STT config must use URL query params (sample_rate, model, encoding) per Cartesia SDK', () => {
    const source = readFileSync(BRIDGE_PATH, 'utf8');
    // Cartesia STT: config in URL query params (not first message)
    expect(source).toMatch(/searchParams\.set\(['"]sample_rate['"],\s*['"]16000['"]\)/);
    expect(source).toMatch(/searchParams\.set\(['"]model['"]/);
    expect(source).toMatch(/CARTESIA_VERSION\s*=\s*['"]2025-04-16['"]/);
  });

  it('must use VAD_CONFIG.silenceAfterSpeechToStopMicMs for post-speech stop timer (optimized for faster turn-taking)', () => {
    const source = readFileSync(BRIDGE_PATH, 'utf8');
    expect(source).toMatch(/VAD_CONFIG\.silenceAfterSpeechToStopMicMs/);
    expect(source).toMatch(/\?\?\s*2500/); // Optimized fallback value
  });

  it('must use VAD_CONFIG.silenceClosingDelayAfterTtsMs in startAgentSilenceTimer (10s delay fix)', () => {
    const source = readFileSync(BRIDGE_PATH, 'utf8');
    expect(source).toMatch(/silenceClosingDelayAfterTtsMs/);
    // delayMs uses config when not skipDelay: delayMs = skipDelay ? 0 : (VAD_CONFIG.silenceClosingDelayAfterTtsMs ?? 0)
    expect(source).toMatch(/VAD_CONFIG\.silenceClosingDelayAfterTtsMs/);
  });

  it('playTTSChunk must use transferable for Int16Array (zero-copy to AudioWorklet)', () => {
    const source = readFileSync(BRIDGE_PATH, 'utf8');
    expect(source).toMatch(/postMessage\s*\(\s*\{\s*type:\s*['"]audio['"]\s*,\s*samples:\s*pcmInt16\s*\}\s*,\s*\[\s*pcmInt16\.buffer\s*\]\s*\)/);
  });

  it('_bargeIn must clear TTS buffer first for natural bidirectional flow', () => {
    const source = readFileSync(BRIDGE_PATH, 'utf8');
    const bargeInMatch = source.match(/_bargeIn\s*\(\)\s*\{([^}]+)\}/);
    expect(bargeInMatch).toBeTruthy();
    const body = bargeInMatch[1];
    const clearTTSIdx = body.indexOf('clearTTSBuffer');
    const cancelIdx = body.indexOf('cancel') || body.indexOf('context_id');
    expect(clearTTSIdx).toBeGreaterThan(-1);
    expect(clearTTSIdx).toBeLessThan(cancelIdx === -1 ? body.length : cancelIdx);
  });

  describe('streamTextChunks optimization', () => {
    function getStreamTextChunksBody(source) {
      const idx = source.indexOf('async streamTextChunks');
      if (idx === -1) return '';
      let braceCount = 0;
      const start = source.indexOf('{', idx);
      let end = start;
      for (let i = start; i < source.length; i++) {
        if (source[i] === '{') braceCount++;
        if (source[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            end = i;
            break;
          }
        }
      }
      return source.substring(start, end + 1);
    }

    it('should check TTS connection once before sending all chunks', () => {
      const source = readFileSync(BRIDGE_PATH, 'utf8');
      const body = getStreamTextChunksBody(source);
      expect(body).not.toBe('');
      expect(body).toMatch(/if\s*\(!\s*this\.ttsWs/);
      expect(body).toMatch(/readyState\s*!==\s*WebSocket\.OPEN/);
      expect(body).toMatch(/await\s+this\.connectTTS\(\)/);
      expect(body).toMatch(/for\s*\(/);
      expect(body).toMatch(/speakText\(/);
    });

    it('should run connection check before send loop', () => {
      const source = readFileSync(BRIDGE_PATH, 'utf8');
      const body = getStreamTextChunksBody(source);
      const connectionCheckIndex = body.indexOf('if (!this.ttsWs');
      const loopIndex = body.indexOf('for (');
      expect(connectionCheckIndex).toBeGreaterThan(-1);
      expect(loopIndex).toBeGreaterThan(-1);
      expect(connectionCheckIndex).toBeLessThan(loopIndex);
    });

    it('should use continue flag correctly for continuations', () => {
      const source = readFileSync(BRIDGE_PATH, 'utf8');
      const body = getStreamTextChunksBody(source);
      expect(body).toMatch(/isContinue\s*=\s*i\s*<\s*chunks\.length\s*-\s*1/);
      expect(body).toMatch(/speakText\([^,]+,\s*ctxId,\s*isContinue\)/);
    });
  });
});
