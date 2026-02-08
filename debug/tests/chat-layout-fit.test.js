/**
 * Chat Layout Fit Test
 *
 * Verifies that the chat interface and chat window fit the screen
 * even when the viewport collapses (responsive layout).
 *
 * Tests CSS rules in public/index.html.
 * @see zEn DeBuGgEr.md
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');
const INDEX_HTML = join(ROOT, 'public/index.html');

function extractStyle(html) {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  return match ? match[1].trim() : '';
}

describe('Chat Layout Fit (responsive)', () => {
  let html, css;

  beforeAll(() => {
    html = readFileSync(INDEX_HTML, 'utf8');
    css = extractStyle(html);
  });

  it('defines .chat-interface with viewport-relative sizing', () => {
    expect(css).toMatch(/\.chat-interface\s*\{/);
    // Base width: min(700px, calc(100vw - 2rem)) so it shrinks on narrow screens
    expect(css).toMatch(/width:\s*min\(700px|width:\s*min\(700px\s*,\s*calc\(100vw\s*-\s*2rem\)\)/);
    // Base height: min(600px, calc(100vh - 2rem)) so it shrinks on short screens
    expect(css).toMatch(/height:\s*min\(600px|height:\s*min\(600px\s*,\s*calc\(100vh\s*-\s*2rem\)\)/);
  });

  it('chat-interface has max-width and max-height for overflow prevention', () => {
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/max-height:\s*100%/);
  });

  it('chat-interface has min dimensions to stay usable when collapsed', () => {
    expect(css).toMatch(/min-width:\s*(280|260)px/);
    expect(css).toMatch(/min-height:\s*(320|300)px/);
  });

  it('chat-container has flex: 1 and min-height: 0 for proper shrink/scroll', () => {
    expect(css).toMatch(/\.chat-container\s*\{[\s\S]*?flex:\s*1/);
    expect(css).toMatch(/\.chat-container\s*\{[\s\S]*?min-height:\s*0/);
    expect(css).toMatch(/\.chat-container\s*\{[\s\S]*?overflow-y:\s*auto/);
  });

  it('has responsive media query for max-width 768px', () => {
    expect(css).toMatch(/@media\s*\(\s*max-width:\s*768px\s*\)/);
    expect(css).toMatch(/width:\s*calc\(100vw\s*-\s*2rem\)/);
    expect(css).toMatch(/height:\s*calc\(100vh\s*-\s*2rem\)/);
  });

  it('has responsive media query for max-width 480px', () => {
    expect(css).toMatch(/@media\s*\(\s*max-width:\s*480px\s*\)/);
    expect(css).toMatch(/width:\s*calc\(100vw\s*-\s*1rem\)/);
    expect(css).toMatch(/height:\s*calc\(100vh\s*-\s*1rem\)/);
  });

  it('body has overflow: hidden to prevent page scroll', () => {
    expect(css).toMatch(/body\s*\{[\s\S]*?overflow:\s*hidden/);
  });

  it('body has min-height for full viewport', () => {
    expect(css).toMatch(/body\s*\{[\s\S]*?min-height:\s*100vh/);
  });
});
