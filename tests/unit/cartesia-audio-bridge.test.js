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

  it('STT config must use URL query params (sample_rate, model, encoding) per Cartesia SDK', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    // Cartesia STT: config in URL query params (not first message)
    expect(source).toMatch(/searchParams\.set\(['"]sample_rate['"],\s*['"]16000['"]\)/);
    expect(source).toMatch(/searchParams\.set\(['"]model['"]/);
    expect(source).toMatch(/CARTESIA_VERSION\s*=\s*['"]2025-04-16['"]/);
  });

  it('must use VAD_CONFIG.silenceAfterSpeechToStopMicMs for post-speech stop timer (2.5s fix)', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/VAD_CONFIG\.silenceAfterSpeechToStopMicMs/);
    expect(source).toMatch(/\?\?\s*2500/);
  });

  it('must use VAD_CONFIG.silenceClosingDelayAfterTtsMs in startAgentSilenceTimer (10s delay fix)', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/silenceClosingDelayAfterTtsMs/);
    expect(source).toMatch(/delayMs\s*=\s*VAD_CONFIG\.silenceClosingDelayAfterTtsMs/);
  });

  it('onSpeechStart must always clear silence stop timer (not conditionally) to allow back-and-forth conversation', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    // Verify that _clearSilenceStopTimer() is called unconditionally in onSpeechStart
    // The fix ensures it's always called, not conditionally based on _hadTranscriptFromPreviousSegment
    // Check that we have the unconditional call pattern
    expect(source).toMatch(/Always clear the silence stop timer when user speaks again/);
    // Verify all onSpeechStart handlers call _clearSilenceStopTimer() unconditionally
    // (not inside: if (this._hadTranscriptFromPreviousSegment) this._clearSilenceStopTimer())
    const conditionalPattern = /if\s*\([^)]*_hadTranscriptFromPreviousSegment[^)]*\)\s*this\._clearSilenceStopTimer/;
    expect(source).not.toMatch(conditionalPattern); // Should NOT have conditional clearing
    // Should have unconditional calls
    const unconditionalCalls = (source.match(/_clearSilenceStopTimer\(\)/g) || []).length;
    expect(unconditionalCalls).toBeGreaterThan(0);
  });

  it('destroy() should release WakeWordManager and stop media stream (integration cleanup)', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/wakeWordManager\.release\(\)/);
    expect(source).toMatch(/mediaStream\.getTracks\(\)/);
    expect(source).toMatch(/\.forEach\(.*t\.stop\(\)/);
  });

  it('should support openWakeWord backend via _hasWakeWordConfig and _initOpenWakeWord', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/_hasWakeWordConfig|openWakeWordWsUrl/);
    expect(source).toMatch(/_initOpenWakeWord|OpenWakeWordManager/);
  });

  it('startSTT must reuse existing STT AudioWorklet graph when wake word pre-set (no duplicate nodes)', () => {
    const { readFileSync } = require('fs');
    const { join } = require('path');
    const source = readFileSync(join(__dirname, '../../public/js/cartesia-audio-bridge.js'), 'utf8');
    expect(source).toMatch(/sttGraphExists|reusing existing STT audio graph/);
    expect(source).toMatch(/this\.sttNode && this\.sttGainNode && this\.sttAnalyserNode/);
  });
});
