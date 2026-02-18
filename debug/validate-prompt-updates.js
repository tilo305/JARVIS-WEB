/**
 * Validation script for system prompt updates
 * Checks that both prompt files have the image handling updates
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const files = [
  'docs/JARVIS-full-prompt-copy.md',
  'docs/JARVIS-system-prompt-elevenlabs.md',
  'JARVIS-Bidirectional-Conversation-Flow-Prompt.md',
];

const requiredPhrases = [
  'Image text and OCR',
  'Do NOT automatically read out text',
  'automatically read text, signs, or symbols from images',
  'Supabase MCP',
  'Vector Store (via Supabase MCP)',
  'Database rows (via Supabase MCP)',
];

let errors = [];
let warnings = [];

for (const file of files) {
  const filePath = join(rootDir, file);
  const content = readFileSync(filePath, 'utf8');
  
  console.log(`\nChecking: ${file}`);
  
  // Check for required phrases
  for (const phrase of requiredPhrases) {
    if (!content.includes(phrase)) {
      errors.push(`${file}: Missing required phrase: "${phrase}"`);
    } else {
      console.log(`  ✓ Found: "${phrase}"`);
    }
  }
  
  // Check markdown syntax (basic check for unmatched bold)
  const boldMatches = content.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    warnings.push(`${file}: Possible unmatched ** (bold) markers`);
  } else {
    console.log(`  ✓ Markdown syntax OK`);
  }
  
  // Check that Supabase (vector database) standalone is not present (replaced by Supabase MCP)
  if (content.includes('**Supabase (vector database)**') && !content.includes('**Supabase MCP**')) {
    errors.push(`${file}: Still references old "Supabase (vector database)"; should use Supabase MCP`);
  }
}

// Check key sections exist in all files
const keySections = ['Image text and OCR', 'automatically read text', 'Supabase MCP'];
for (const section of keySections) {
  const present = files.map((f) => {
    const path = join(rootDir, f);
    return readFileSync(path, 'utf8').includes(section);
  });
  if (!present.every(Boolean)) {
    const missing = files.filter((_, i) => !present[i]);
    errors.push(`"${section}" missing in: ${missing.join(', ')}`);
  }
}

console.log('\n' + '='.repeat(60));
if (errors.length > 0) {
  console.error('\n❌ ERRORS FOUND:');
  errors.forEach(err => console.error('  -', err));
  process.exit(1);
} else {
  console.log('\n✅ All validations passed!');
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warn => console.warn('  -', warn));
  }
  process.exit(0);
}
