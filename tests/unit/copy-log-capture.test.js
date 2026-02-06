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
    expect(html).toMatch(/send\s*\(\s*['"]error['"]\s*,/);
    expect(html).toMatch(/send\s*\(\s*['"]warn['"]\s*,/);
  });

  it('uses argsToMessageAndStack for error and warn to capture stack', () => {
    expect(html).toMatch(/function argsToMessageAndStack/);
    expect(html).toMatch(/argsToMessageAndStack\s*\(\s*Array\.from\s*\(\s*arguments\s*\)\s*\)/);
  });

  it('addEntry is called from send for both types', () => {
    expect(html).toMatch(/addEntry\s*\(\s*type\s*,\s*message\s*,\s*stack\s*\)/);
    expect(html).toMatch(/captured\.push\s*\(\s*\{\s*time:\s*time\s*,\s*type:\s*type\s*,/);
  });

  it('Copy log button aria-label and title mention errors and warnings', () => {
    expect(html).toMatch(/Copy captured console errors and warnings to clipboard/);
    expect(html).toMatch(/Copy captured errors and warnings \(.*\) to clipboard/);
  });

  it('copied text header mentions errors/warnings', () => {
    expect(html).toMatch(/JARVIS captured errors\/warnings from this page/);
    expect(html).toMatch(/No errors or warnings captured yet/);
  });

  it('each log entry includes type (ERROR or WARN)', () => {
    expect(html).toMatch(/e\.type\.toUpperCase\s*\(\s*\)/);
  });

  it('exposes __JARVIS_CAPTURED_ERRORS for debugging', () => {
    expect(html).toMatch(/window\.__JARVIS_CAPTURED_ERRORS\s*=\s*captured/);
  });

  it('limits stored entries (maxEntries)', () => {
    expect(html).toMatch(/maxEntries\s*=\s*\d+/);
    expect(html).toMatch(/captured\.length\s*>\s*maxEntries/);
  });
});
