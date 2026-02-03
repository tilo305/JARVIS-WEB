/**
 * Unit tests for AudioWorklet processor files
 * Validates parse, registration, and constants.
 * Processors run in AudioWorkletGlobalScope; we stub globals for Node.
 */
const { readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');

const ROOT = join(__dirname, '../..');

describe('AudioWorklet processors', () => {
  const sandbox = () => {
    const registered = [];
    const ctx = vm.createContext({
      AudioWorkletProcessor: class {},
      registerProcessor: (name, processor) => registered.push({ name, processor }),
      sampleRate: 48000,
      globalThis: {},
      Math,
      Int16Array,
      Float32Array,
      Array,
      ArrayBuffer,
      Uint8Array,
      Object,
      Number,
      parseInt,
      parseFloat,
      JSON,
    });
    ctx.globalThis = ctx;
    return { ctx, registered };
  };

  describe('stt-capture-processor.js', () => {
    it('parses and registers as stt-capture-processor', () => {
      const code = readFileSync(join(ROOT, 'public/audio/stt-capture-processor.js'), 'utf8');
      const { ctx, registered } = sandbox();
      vm.runInContext(code, ctx);
      expect(registered).toHaveLength(1);
      expect(registered[0].name).toBe('stt-capture-processor');
      expect(registered[0].processor).toBeDefined();
    });

    it('exports expected constants via source', () => {
      const code = readFileSync(join(ROOT, 'public/audio/stt-capture-processor.js'), 'utf8');
      expect(code).toMatch(/SAMPLE_RATE_OUT\s*=\s*16000/);
      expect(code).toMatch(/CHUNK_MS\s*=\s*100/);
      expect(code).toMatch(/SAMPLES_PER_CHUNK/);
      expect(code).toMatch(/1600/); // 16000 * 100 / 1000
    });
  });

  describe('tts-playback-processor.js', () => {
    it('parses and registers as tts-playback-processor', () => {
      const code = readFileSync(join(ROOT, 'public/audio/tts-playback-processor.js'), 'utf8');
      const { ctx, registered } = sandbox();
      vm.runInContext(code, ctx);
      expect(registered).toHaveLength(1);
      expect(registered[0].name).toBe('tts-playback-processor');
      expect(registered[0].processor).toBeDefined();
    });

    it('exports expected constants via source', () => {
      const code = readFileSync(join(ROOT, 'public/audio/tts-playback-processor.js'), 'utf8');
      expect(code).toMatch(/TTS_SAMPLE_RATE\s*=\s*44100/);
    });

    it('handles clear message in onmessage', () => {
      const code = readFileSync(join(ROOT, 'public/audio/tts-playback-processor.js'), 'utf8');
      expect(code).toMatch(/type\s*===\s*['"]clear['"]/);
    });
  });
});
