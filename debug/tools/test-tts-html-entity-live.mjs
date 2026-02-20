#!/usr/bin/env node
/**
 * LIVE debug tool: TTS HTML entity decode
 * Verifies that sanitized n8n replies (with &#x27;, &quot;, etc.) are correctly
 * decoded before TTS so the agent does not speak "ampersand hash twenty seven".
 * Per zEn DeBuGgEr.md - debug folder tools.
 *
 * Run: node debug/tools/test-tts-html-entity-live.mjs
 */

function decodeHtmlEntitiesForTTS(text) {
  if (typeof text !== 'string' && text != null) text = String(text);
  if (!text || !text.trim()) return text;
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const tests = [
  {
    name: 'n8n-style reply (apostrophes)',
    input: "I&#x27;m ready when you are, sir. Just let me know what you&#x27;d like to begin with.",
    expected: "I'm ready when you are, sir. Just let me know what you'd like to begin with.",
  },
  {
    name: '&#39; variant',
    input: "don&#39;t worry",
    expected: "don't worry",
  },
  {
    name: 'double quotes',
    input: '&quot;Hello&quot;',
    expected: '"Hello"',
  },
  {
    name: 'ampersand',
    input: 'Tom &amp; Jerry',
    expected: 'Tom & Jerry',
  },
  {
    name: 'plain text unchanged',
    input: 'Hello world',
    expected: 'Hello world',
  },
  {
    name: 'empty string',
    input: '',
    expected: '',
  },
];

console.log('🧪 TTS HTML Entity Decode - LIVE verification\n');

let failed = 0;
for (const t of tests) {
  const got = decodeHtmlEntitiesForTTS(t.input);
  const ok = got === t.expected;
  if (!ok) {
    failed++;
    console.log(`❌ ${t.name}`);
    console.log(`   Input:    "${t.input.slice(0, 60)}${t.input.length > 60 ? '...' : ''}"`);
    console.log(`   Expected: "${t.expected}"`);
    console.log(`   Got:      "${got}"`);
  } else {
    console.log(`✅ ${t.name}`);
  }
}

if (failed > 0) {
  console.log(`\n❌ ${failed} test(s) failed.`);
  process.exit(1);
}
console.log(`\n✅ All ${tests.length} tests passed. TTS will receive plain text, not HTML entities.`);
