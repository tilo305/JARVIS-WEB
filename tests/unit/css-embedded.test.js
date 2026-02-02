/**
 * Verifies embedded CSS in HTML files: syntax (balanced braces),
 * required rules present, and selectors match expected structure.
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');

function extractStyle(html) {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  return match ? match[1].trim() : '';
}

function balancedBraces(css) {
  let depth = 0;
  for (const c of css) {
    if (c === '{') depth++;
    else if (c === '}') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

describe('Embedded CSS', () => {
  describe('public/index.html', () => {
    let html, css;
    beforeAll(() => {
      html = readFileSync(join(ROOT, 'public/index.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(100);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('defines :root variables', () => {
      expect(css).toMatch(/:root\s*\{/);
      expect(css).toMatch(/--bg-deep:/);
      expect(css).toMatch(/--arc-blue:/);
      expect(css).toMatch(/--gold:/);
    });

    it('has layout and component rules', () => {
      expect(css).toMatch(/\.header\s*\{/);
      expect(css).toMatch(/\.chat-container\s*\{/);
      expect(css).toMatch(/\.message\s*\{/);
      expect(css).toMatch(/\.input-wrap\s*\{/);
      expect(css).toMatch(/\.btn-icon\s*\{/);
      expect(css).toMatch(/\.btn-send\s*\{/);
    });

    it('has focus-visible for accessibility', () => {
      expect(css).toMatch(/focus-visible/);
      expect(css).toMatch(/outline.*var\(--arc-blue\)|outline.*#00d4ff/);
    });

    it('respects prefers-reduced-motion', () => {
      expect(css).toMatch(/prefers-reduced-motion:\s*no-preference/);
      expect(css).toMatch(/@keyframes fadeIn/);
      expect(css).toMatch(/@keyframes pulse/);
    });

    it('hides file input', () => {
      expect(css).toMatch(/#fileInput\s*\{[^}]*display:\s*none/);
    });

    it('HTML has elements that match CSS selectors', () => {
      expect(html).toMatch(/class="header"/);
      expect(html).toMatch(/class="chat-container"/);
      expect(html).toMatch(/class="message assistant"/);
      expect(html).toMatch(/class="input-wrap"/);
      expect(html).toMatch(/class="btn-icon"/);
      expect(html).toMatch(/class="btn-send"/);
      expect(html).toMatch(/id="fileInput"/);
      expect(html).toMatch(/id="status"/);
    });
  });

  describe('public/debug/debug-audioworklet.html', () => {
    let html, css;
    beforeAll(() => {
      html = readFileSync(join(ROOT, 'public/debug/debug-audioworklet.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(50);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('has box-sizing and result/pass/fail/pending rules', () => {
      expect(css).toMatch(/box-sizing:\s*border-box/);
      expect(css).toMatch(/\.result\s*\{/);
      expect(css).toMatch(/\.pass\s*\{/);
      expect(css).toMatch(/\.fail\s*\{/);
      expect(css).toMatch(/\.pending\s*\{/);
    });

    it('has button focus-visible', () => {
      expect(css).toMatch(/button:focus-visible|button\s*:focus-visible/);
    });

    it('script builds result + status class names', () => {
      expect(html).toMatch(/result\s*\+\s*status|className.*result/);
    });
  });
});
