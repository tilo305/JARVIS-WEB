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

// Must match the NEW patterns we added (standalone * and _ removal, whitespace normalize)
const REQUIRED_PATTERNS = [
  { name: 'Remove remaining asterisks', search: '\\*+/g' },
  { name: 'Remove remaining underscores', search: '_+/g' },
  { name: 'Normalize whitespace', search: '\\s+/g' },
];

const FILES = [
  'public/js/app.js',
  'src/bidirectional-conversation.ts',
  'debug/tests/strip-markdown-for-tts.test.js',
];

let errors = [];

for (const relPath of FILES) {
  const filePath = join(rootDir, relPath);
  if (!existsSync(filePath)) {
    errors.push(`${relPath}: File not found`);
    continue;
  }
  const content = readFileSync(filePath, 'utf8');

  for (const { name, search } of REQUIRED_PATTERNS) {
    if (!content.includes(search)) {
      errors.push(`${relPath}: Missing "${name}" - stripMarkdownForTTS may be out of sync`);
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
