/**
 * Validation script for system prompt updates
 * Checks that both prompt files have the image handling updates
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const files = [
  'docs/JARVIS-system-prompt-elevenlabs.md',
  'JARVIS-Bidirectional-Conversation-Flow-Prompt.md'
];

const requiredPhrases = [
  'Image text and OCR',
  'Do NOT automatically read out text',
  'automatically read text, signs, or symbols from images'
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
  
  // Check that both files have similar content
  if (file === files[0]) {
    const firstContent = content;
    const secondPath = join(rootDir, files[1]);
    const secondContent = readFileSync(secondPath, 'utf8');
    
    // Check key sections exist in both
    const keySections = [
      'Image text and OCR',
      'automatically read text'
    ];
    
    for (const section of keySections) {
      const inFirst = firstContent.includes(section);
      const inSecond = secondContent.includes(section);
      if (inFirst !== inSecond) {
        errors.push(`Inconsistency: "${section}" in ${files[0]} but not in ${files[1]}`);
      }
    }
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
