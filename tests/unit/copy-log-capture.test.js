/**
 * Unit tests for the Copy log button and console error/warning capture in public/index.html.
 * Ensures both errors and warnings are captured and copyable (per zEn DeBuGgEr.md).
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');
const INDEX_HTML = join(ROOT, 'public/index.html');

describe('Copy log capture (public/index.html)', () => {
  let html;
  beforeAll(() => {
    html = readFileSync(INDEX_HTML, 'utf8');
  });

  it('has console error + warning capture comment', () => {
    expect(html).toMatch(/Console error \+ warning capture/);
    expect(html).toMatch(/errors and warnings/);
  });

  it('captures both console.error and console.warn', () => {
    expect(html).toMatch(/console\.error\s*=\s*function/);
    expect(html).toMatch(/console\.warn\s*=\s*function/);
    expect(html).toMatch(/captureLogEntry\s*\(/);
    expect(html).toMatch(/formatLogEntry\s*\(\s*['"]ERROR['"]/);
    expect(html).toMatch(/formatLogEntry\s*\(\s*['"]WARN['"]/);
  });

  it('uses formatLogEntry for error and warn to capture message and stack', () => {
    expect(html).toMatch(/function formatLogEntry/);
    expect(html).toMatch(/formatLogEntry\s*\(\s*level\s*,\s*args\s*\)/);
  });

  it('captureLogEntry pushes to captured array', () => {
    expect(html).toMatch(/captureLogEntry\s*\(entry\)/);
    expect(html).toMatch(/capturedLogs\.push\s*\(\s*entry\s*\)/);
  });

  it('Copy log button aria-label and title mention errors and warnings', () => {
    expect(html).toMatch(/Copy error logs|Copy captured|errors and warnings/);
    expect(html).toMatch(/btnCopyLog|Copy.*log|errors?.*warnings?/);
  });

  it('copied text header mentions errors/warnings', () => {
    expect(html).toMatch(/JARVIS.*Error|JARVIS.*Warning|JARVIS.*log/i);
    expect(html).toMatch(/No logs captured yet|No errors or warnings captured yet/);
    expect(html).toMatch(/errors? and warnings?/i);
  });

  it('each log entry includes type (ERROR or WARN)', () => {
    expect(html).toMatch(/ERROR|WARN/);
    expect(html).toMatch(/formatLogEntry\s*\(\s*['"]ERROR['"]|formatLogEntry\s*\(\s*['"]WARN['"]/);
  });

  it('exposes __JARVIS_CAPTURED_LOGS for debugging', () => {
    expect(html).toMatch(/__JARVIS_CAPTURED_LOGS/);
    expect(html).toMatch(/capturedLogs|captured\s*=\s*capturedLogs/);
  });

  it('limits stored entries (maxEntries)', () => {
    expect(html).toMatch(/maxEntries\s*=\s*\d+/);
    expect(html).toMatch(/captured\.length\s*>\s*maxEntries/);
  });
});
