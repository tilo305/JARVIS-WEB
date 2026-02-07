/**
 * Regression tests for TTS markdown stripping (agent must not read asterisks/meta-words).
 * Behavior must match public/js/app.js stripMarkdownForTTS().
 * Per zEn DeBuGgEr.md - debug folder tests.
 */

function stripMarkdownForTTS(text) {
  if (typeof text !== 'string' && text != null) text = String(text);
  if (!text || !text.trim()) return '';
  let t = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  return t.trim();
}

describe('stripMarkdownForTTS (TTS no asterisks)', () => {
  it('strips **bold** to plain text', () => {
    expect(stripMarkdownForTTS('**Calendar** and **Gmail**')).toBe('Calendar and Gmail');
  });

  it('strips *italic* to plain text', () => {
    expect(stripMarkdownForTTS('*Calendar* and *Gmail*')).toBe('Calendar and Gmail');
  });

  it('strips __bold__ and _italic_', () => {
    expect(stripMarkdownForTTS('__Calendar__ and _Airtable_')).toBe('Calendar and Airtable');
  });

  it('strips `code` backticks', () => {
    expect(stripMarkdownForTTS('Use `Tavily` for search.')).toBe('Use Tavily for search.');
  });

  it('strips ~~strikethrough~~', () => {
    expect(stripMarkdownForTTS('~~old~~ new')).toBe('old new');
  });

  it('strips [link](url) to link text only', () => {
    expect(stripMarkdownForTTS('See [documentation](https://example.com).')).toBe('See documentation.');
  });

  it('returns empty string for empty or whitespace', () => {
    expect(stripMarkdownForTTS('')).toBe('');
    expect(stripMarkdownForTTS('   ')).toBe('');
  });

  it('leaves plain text unchanged', () => {
    expect(stripMarkdownForTTS('Here whenever you need me, sir.')).toBe('Here whenever you need me, sir.');
  });

  it('handles mixed markdown like agent intro', () => {
    const intro = 'I can manage your **Calendar**, handle **Gmail**, update **Google Sheets**, and **Airtable**.';
    expect(stripMarkdownForTTS(intro)).toBe('I can manage your Calendar, handle Gmail, update Google Sheets, and Airtable.');
  });
});
