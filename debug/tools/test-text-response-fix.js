#!/usr/bin/env node
/**
 * Test script to verify text response fix
 *
 * Tests that:
 * 1. Text responses always display in chat (even if malformed)
 * 2. TTS only plays when stripped text is not empty/whitespace
 * 3. Both text and voice handlers use stripMarkdownForTTS before TTS
 * 4. safeReplyText used for display, safeReplyTextForTTS for TTS (no asterisk speech)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const appJsPath = join(projectRoot, 'public', 'js', 'app.js');

console.log('🧪 Testing Text Response Fix...\n');

// Read app.js
const appJs = readFileSync(appJsPath, 'utf8');

// Test 1: Both handlers have safeReplyText for display
console.log('Test 1: Checking display validation (safeReplyText)...');
const safeReplyTextCount = (appJs.match(/const safeReplyText = typeof replyText === 'string' \? replyText : String\(replyText \|\| ''\);/g) || []).length;
if (safeReplyTextCount >= 2) {
  console.log(`  ✅ Both handlers use safeReplyText for display (found ${safeReplyTextCount})`);
} else {
  console.log(`  ❌ Missing safeReplyText validation (found ${safeReplyTextCount}, expected 2)`);
  process.exit(1);
}

// Test 2: Both handlers use stripMarkdownForTTS before TTS
console.log('Test 2: Checking TTS markdown stripping...');
const stripMarkdownCount = (appJs.match(/stripMarkdownForTTS\(rawReply\)/g) || []).length;
if (stripMarkdownCount >= 2) {
  console.log(`  ✅ Both handlers strip markdown before TTS (found ${stripMarkdownCount})`);
} else {
  console.log(`  ❌ Missing stripMarkdownForTTS before TTS (found ${stripMarkdownCount}, expected 2)`);
  process.exit(1);
}

// Test 3: TTS only when safeReplyTextForTTS has content
console.log('Test 3: Checking empty text handling...');
const trimCheckCount = (appJs.match(/safeReplyTextForTTS\.trim\(\)/g) || []).length;
if (trimCheckCount >= 2) {
  console.log(`  ✅ TTS only when stripped text is non-empty (found ${trimCheckCount})`);
} else {
  console.log(`  ❌ Missing trim check for TTS (found ${trimCheckCount}, expected 2)`);
  process.exit(1);
}

// Test 4: Both handlers use appendMessage with safeReplyText
console.log('Test 4: Checking appendMessage usage...');
const appendCount = (appJs.match(/appendMessage\('assistant', safeReplyText\)/g) || []).length;
if (appendCount >= 2) {
  console.log(`  ✅ Both handlers use safeReplyText for appendMessage (found ${appendCount})`);
} else {
  console.log(`  ❌ Missing safeReplyText in appendMessage (found ${appendCount}, expected 2)`);
  process.exit(1);
}

// Test 5: speakText/streamTextChunks use safeReplyTextForTTS (not raw)
console.log('Test 5: Checking speakText usage...');
const speakStrippedCount = (appJs.match(/speakText\(safeReplyTextForTTS\)|streamTextChunks\(chunks\)/g) || []).length;
if (speakStrippedCount >= 2) {
  console.log(`  ✅ TTS uses stripped text (found ${speakStrippedCount})`);
} else {
  console.log(`  ❌ TTS should use safeReplyTextForTTS (found ${speakStrippedCount})`);
  process.exit(1);
}

console.log('\n✅ All tests passed! Text response fix is correctly implemented.');
console.log('\nSummary:');
console.log('  - Text responses always display in chat (safeReplyText)');
console.log('  - TTS strips markdown (no asterisk/underscore speech)');
console.log('  - TTS only plays when stripped text is non-empty');
console.log('  - Both voice and text handlers use consistent logic');
