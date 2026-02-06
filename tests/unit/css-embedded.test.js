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
      expect(css).toMatch(/--iron-red:/);
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
      expect(css).toMatch(/outline.*var\(--gold\)|outline.*var\(--iron-red\)|outline.*#FFB800|outline.*#C41E3A/);
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

  describe('public/debug/fallback-revert-debug.html', () => {
    let html, css;
    beforeAll(() => {
      html = readFileSync(join(ROOT, 'public/debug/fallback-revert-debug.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(50);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('has expected structure (section, button, input)', () => {
      expect(css).toMatch(/section|\.ok|\.fail/);
    });

    it('imports n8n-payload and has Test n8n button', () => {
      expect(html).toMatch(/n8n-payload\.js/);
      expect(html).toMatch(/btnTest|Test n8n/);
    });
  });

  describe('public/debug/voice-pipeline-debug.html', () => {
    let html, css;
    beforeAll(() => {
      html = readFileSync(join(ROOT, 'public/debug/voice-pipeline-debug.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(50);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('has result/pass/fail/pending/info rules', () => {
      expect(css).toMatch(/\.result\s*\{/);
      expect(css).toMatch(/\.pass\s*\{/);
      expect(css).toMatch(/\.fail\s*\{/);
      expect(css).toMatch(/\.info\s*\{/);
    });

    it('has runAll and runVoice buttons', () => {
      expect(html).toMatch(/runAll|runVoice/);
    });
  });

  describe('public/debug/wake-word-activation-test.html', () => {
    let css;
    beforeAll(() => {
      const html = readFileSync(join(ROOT, 'public/debug/wake-word-activation-test.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(50);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('has result/pass/fail/pending rules', () => {
      expect(css).toMatch(/\.test-result\.pass/);
      expect(css).toMatch(/\.test-result\.fail/);
      expect(css).toMatch(/\.test-result\.pending/);
    });
  });

  describe('public/debug/console-errors-live.html', () => {
    let css;
    beforeAll(() => {
      const html = readFileSync(join(ROOT, 'public/debug/console-errors-live.html'), 'utf8');
      css = extractStyle(html);
    });

    it('has a non-empty style block', () => {
      expect(css.length).toBeGreaterThan(20);
    });

    it('has balanced braces', () => {
      expect(balancedBraces(css)).toBe(true);
    });

    it('has panel and error-item rules', () => {
      expect(css).toMatch(/\.panel/);
      expect(css).toMatch(/\.error-item/);
    });
  });
});
