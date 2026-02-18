/**
 * Draggable Chat Interface Test
 *
 * Verifies that the chat interface is draggable (portable) and that
 * the implementation has the expected structure and exclusions.
 *
 * Tests public/index.html.
 * @see zEn DeBuGgEr.md
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '../..');
const INDEX_HTML = join(ROOT, 'public/index.html');

describe('Draggable Chat Interface', () => {
  let html, css;

  beforeAll(() => {
    html = readFileSync(INDEX_HTML, 'utf8');
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    css = styleMatch ? styleMatch[1] : '';
  });

  it('chat-interface has position: fixed for portability', () => {
    expect(css).toMatch(/\.chat-interface\s*\{[\s\S]*?position:\s*fixed/);
  });

  it('chat-interface is centered initially with transform', () => {
    expect(css).toMatch(/left:\s*50%/);
    expect(css).toMatch(/top:\s*50%/);
    expect(css).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });

  it('header has cursor: move as drag handle', () => {
    expect(css).toMatch(/\.header\s*\{[\s\S]*?cursor:\s*move/);
  });

  it('header buttons have cursor: pointer (not move)', () => {
    expect(css).toMatch(/\.header\s+button\s*\{[\s\S]*?cursor:\s*pointer/);
  });

  it('header has touch-action: none for drag on touch devices', () => {
    expect(css).toMatch(/\.header\s*\{[\s\S]*?touch-action:\s*none/);
  });

  it('has draggable script with initDraggable', () => {
    expect(html).toMatch(/initDraggable/);
  });

  it('draggable script uses jarvis_chat_position storage key', () => {
    expect(html).toMatch(/jarvis_chat_position/);
  });

  it('excludes status span from triggering drag (Ready button works)', () => {
    expect(html).toMatch(/closest\(['"]#status['"]\)/);
  });

  it('excludes buttons from triggering drag', () => {
    expect(html).toMatch(/closest\(['"]button['"]\)/);
  });

  it('attaches mousedown, mousemove, mouseup to header/document', () => {
    expect(html).toMatch(/addEventListener\(['"]mousedown['"]/);
    expect(html).toMatch(/addEventListener\(['"]mousemove['"]/);
    expect(html).toMatch(/addEventListener\(['"]mouseup['"]/);
  });

  it('attaches touch events for mobile', () => {
    expect(html).toMatch(/addEventListener\(['"]touchstart['"]/);
    expect(html).toMatch(/addEventListener\(['"]touchmove['"]/);
    expect(html).toMatch(/addEventListener\(['"]touchend['"]/);
  });

  it('persists position to localStorage', () => {
    expect(html).toMatch(/localStorage\.setItem/);
    expect(html).toMatch(/localStorage\.getItem/);
  });

  it('restores position on load', () => {
    expect(html).toMatch(/restorePosition/);
  });
});
