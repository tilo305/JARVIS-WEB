/**
 * Validate stripMarkdownForTTS implementations stay in sync across app.js,
 * bidirectional-conversation.ts, and debug/tests/strip-markdown-for-tts.test.js.
 * Per zEn DeBuGgEr.md - ensures no asterisk/underscore TTS speech regressions.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Must match stripMarkdownForTTS patterns (standalone * and _ removal, whitespace normalize)
const STRIP_PATTERNS = [
  { name: 'Remove remaining asterisks', search: '\\*+/g' },
  { name: 'Remove remaining underscores', search: '_+/g' },
  { name: 'Normalize whitespace', search: '\\s+/g' },
];

// Must match decodeHtmlEntitiesForTTS (app.js and bidirectional-conversation only; test file has its own)
const DECODE_PATTERNS = [
  { name: 'decodeHtmlEntitiesForTTS', search: 'decodeHtmlEntitiesForTTS' },
  { name: 'Decode &#x27;', search: '&#x27;' },
];

const FILES_STRIP = [
  'public/js/app.js',
  'src/bidirectional-conversation.ts',
  'debug/tests/strip-markdown-for-tts.test.js',
];

const FILES_DECODE = [
  'public/js/app.js',
  'src/bidirectional-conversation.ts',
  'debug/tests/strip-markdown-for-tts.test.js',
];

let errors = [];

for (const relPath of FILES_STRIP) {
  const filePath = join(rootDir, relPath);
  if (!existsSync(filePath)) {
    errors.push(`${relPath}: File not found`);
    continue;
  }
  const content = readFileSync(filePath, 'utf8');
  for (const { name, search } of STRIP_PATTERNS) {
    if (!content.includes(search)) {
      errors.push(`${relPath}: Missing "${name}" - stripMarkdownForTTS may be out of sync`);
    }
  }
}

for (const relPath of FILES_DECODE) {
  const filePath = join(rootDir, relPath);
  if (!existsSync(filePath)) {
    errors.push(`${relPath}: File not found`);
    continue;
  }
  const content = readFileSync(filePath, 'utf8');
  for (const { name, search } of DECODE_PATTERNS) {
    if (!content.includes(search)) {
      errors.push(`${relPath}: Missing "${name}" - decodeHtmlEntitiesForTTS may be out of sync`);
    }
  }
}

if (errors.length > 0) {
  console.error('stripMarkdownForTTS sync validation FAILED:\n');
  errors.forEach((e) => console.error('  ❌', e));
  process.exit(1);
}

console.log('✓ stripMarkdownForTTS implementations in sync (app.js, bidirectional-conversation, test)');
process.exit(0);
