/**
 * Unit tests for the Copy log button and console error/warning capture.
 * Logic lives in public/js/error-capture.js (loaded by index.html); UI in public/index.html.
 * Ensures both errors and warnings are captured and copyable (per zEn DeBuGgEr.md).
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');
const INDEX_HTML = join(ROOT, 'public/index.html');
const ERROR_CAPTURE_JS = join(ROOT, 'public/js/error-capture.js');

describe('Copy log capture (public/index.html)', () => {
  let html;
  let errorCapture;
  beforeAll(() => {
    html = readFileSync(INDEX_HTML, 'utf8');
    errorCapture = readFileSync(ERROR_CAPTURE_JS, 'utf8');
  });

  it('has error log capture system', () => {
    expect(html).toMatch(/Error Log Capture|error-capture\.js/);
    expect(html).toMatch(/errors and warnings/i);
  });

  it('captures both console.error and console.warn', () => {
    const combined = html + errorCapture;
    expect(combined).toMatch(/console\.error\s*=\s*function/);
    expect(combined).toMatch(/console\.warn\s*=\s*function/);
    expect(combined).toMatch(/formatLogEntry\s*\(\s*['"]ERROR['"]\s*,/);
    expect(combined).toMatch(/formatLogEntry\s*\(\s*['"]WARN['"]\s*,/);
  });

  it('uses formatLogEntry and captureLogEntry for capture', () => {
    expect(errorCapture).toMatch(/function formatLogEntry/);
    expect(errorCapture).toMatch(/function captureLogEntry/);
    expect(errorCapture).toMatch(/captureLogEntry\(/);
  });

  it('exposes __JARVIS_CAPTURED_LOGS for debugging', () => {
    expect(errorCapture).toMatch(/window\.__JARVIS_CAPTURED_LOGS\s*=/);
  });

  it('Copy log button mentions errors', () => {
    expect(html).toMatch(/Copy error logs/);
  });

  it('copied text header mentions errors/warnings', () => {
    expect(html).toMatch(/JARVIS Error.*Warning Log/i);
    expect(html).toMatch(/No logs captured yet.*[Ee]rrors and warnings/i);
  });

  it('limits stored entries to prevent unbounded growth', () => {
    expect(errorCapture).toMatch(/capturedEntrySet\.size\s*>\s*\d+/);
  });
});
