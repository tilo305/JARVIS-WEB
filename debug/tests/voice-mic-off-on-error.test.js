/**
 * Regression tests: mic turns off when voice flow errors (TTS failure, onTranscript error).
 * Per zEn DeBuGgEr.md - debug folder tests.
 * Fixes: mic button never shuts off after TTS/voice errors.
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const APP_PATH = join(process.cwd(), 'public', 'js', 'app.js');

describe('voice mic-off-on-error', () => {
  it('TTS error catch must call stopSTT or syncMicButton to turn mic off', () => {
    const source = readFileSync(APP_PATH, 'utf8');
    const ttsCatchIdx = source.indexOf("DEBUG.error('TTS error in onTranscript'");
    expect(ttsCatchIdx).toBeGreaterThan(-1);
    const block = source.substring(ttsCatchIdx, ttsCatchIdx + 800);
    expect(block).toMatch(/bridge\.stopSTT\(\)/);
    expect(block).toMatch(/syncMicButton\s*\(\s*false/);
  });

  it('onTranscript top-level catch must stop STT or sync mic on error', () => {
    const source = readFileSync(APP_PATH, 'utf8');
    const catchIdx = source.indexOf("DEBUG.error('onTranscript error'");
    expect(catchIdx).toBeGreaterThan(-1);
    const block = source.substring(catchIdx, catchIdx + 500);
    expect(block).toMatch(/stopSTT|syncMicButton/);
  });
});
