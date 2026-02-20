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

// Test 2: Both handlers use decodeHtmlEntitiesForTTS then stripMarkdownForTTS before TTS
console.log('Test 2: Checking TTS HTML entity decode + markdown stripping...');
const decodeCount = (appJs.match(/decodeHtmlEntitiesForTTS/g) || []).length;
const stripMarkdownCount = (appJs.match(/stripMarkdownForTTS\(decodedReply\)/g) || []).length;
if (decodeCount >= 2 && stripMarkdownCount >= 2) {
  console.log(`  ✅ Both handlers decode HTML entities and strip markdown before TTS (decode: ${decodeCount}, strip: ${stripMarkdownCount})`);
} else {
  console.log(`  ❌ Missing decodeHtmlEntitiesForTTS or stripMarkdownForTTS(decodedReply) (decode: ${decodeCount}, strip: ${stripMarkdownCount}, expected 2 each)`);
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

// Test 4: Both handlers use appendMessage with reply text (displayText decoded for display, or safeReplyText)
// We use displayText = decodeHtmlEntitiesForTTS(safeReplyText) so chat shows "It's" not "It&#x27;s"
console.log('Test 4: Checking appendMessage usage...');
const appendDisplayText = (appJs.match(/appendMessage\('assistant', displayText\)/g) || []).length;
const appendSafeReply = (appJs.match(/appendMessage\('assistant', safeReplyText\)/g) || []).length;
const appendCount = appendDisplayText + appendSafeReply;
if (appendCount >= 2) {
  console.log(`  ✅ Both handlers use reply text for appendMessage (displayText: ${appendDisplayText}, safeReplyText: ${appendSafeReply})`);
} else {
  console.log(`  ❌ Missing reply text in appendMessage (found ${appendCount}, expected 2)`);
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
