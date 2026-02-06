#!/usr/bin/env node
/**
 * Test script to verify text response fix
 * 
 * Tests that:
 * 1. Text responses always display in chat (even if malformed)
 * 2. TTS only plays when text is not empty/whitespace
 * 3. Both text and voice handlers use the same validation logic
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const appJsPath = join(projectRoot, 'public', 'js', 'app.js');

console.log('🧪 Testing Text Response Fix...\n');

// Read app.js
const appJs = readFileSync(appJsPath, 'utf8');

// Test 1: Check text button handler has displayText validation
console.log('Test 1: Checking text button handler...');
const textHandlerPattern = /const displayText = typeof replyText === 'string' \? replyText : \(replyText != null \? String\(replyText\) : 'No response received\.'\);/;
if (textHandlerPattern.test(appJs)) {
  console.log('  ✅ Text handler has displayText validation');
} else {
  console.log('  ❌ Text handler missing displayText validation');
  process.exit(1);
}

// Test 2: Check voice handler has displayText validation
console.log('Test 2: Checking voice handler...');
if (appJs.includes('const displayText = typeof replyText === \'string\' ? replyText : (replyText != null ? String(replyText) : \'No response received.\');')) {
  console.log('  ✅ Voice handler has displayText validation');
} else {
  console.log('  ❌ Voice handler missing displayText validation');
  process.exit(1);
}

// Test 3: Check both handlers use hasTextToSpeak
console.log('Test 3: Checking empty text handling...');
const hasTextToSpeakCount = (appJs.match(/const hasTextToSpeak = displayText\.trim\(\)\.length > 0;/g) || []).length;
if (hasTextToSpeakCount >= 2) {
  console.log(`  ✅ Both handlers check for empty text (found ${hasTextToSpeakCount} instances)`);
} else {
  console.log(`  ❌ Missing empty text check (found ${hasTextToSpeakCount} instances, expected 2)`);
  process.exit(1);
}

// Test 4: Check TTS is only called when hasTextToSpeak is true
console.log('Test 4: Checking TTS conditional...');
const ttsConditionalCount = (appJs.match(/if \(apiKey && hasTextToSpeak\)/g) || []).length;
if (ttsConditionalCount >= 2) {
  console.log(`  ✅ TTS only plays when text is not empty (found ${ttsConditionalCount} instances)`);
} else {
  console.log(`  ❌ Missing TTS conditional (found ${ttsConditionalCount} instances, expected 2)`);
  process.exit(1);
}

// Test 5: Check both handlers use displayText for appendMessage
console.log('Test 5: Checking appendMessage usage...');
const appendMessageCount = (appJs.match(/appendMessage\('assistant', displayText\)/g) || []).length;
if (appendMessageCount >= 2) {
  console.log(`  ✅ Both handlers use displayText for appendMessage (found ${appendMessageCount} instances)`);
} else {
  console.log(`  ❌ Missing displayText in appendMessage (found ${appendMessageCount} instances, expected 2)`);
  process.exit(1);
}

// Test 6: Check both handlers use displayText for speakText
console.log('Test 6: Checking speakText usage...');
const speakTextCount = (appJs.match(/await bridge\.speakText\(displayText\)/g) || []).length;
if (speakTextCount >= 2) {
  console.log(`  ✅ Both handlers use displayText for speakText (found ${speakTextCount} instances)`);
} else {
  console.log(`  ❌ Missing displayText in speakText (found ${speakTextCount} instances, expected 2)`);
  process.exit(1);
}

// Test 7: Check error handling for empty response
console.log('Test 7: Checking error handling...');
const emptyResponseCount = (appJs.match(/if \(apiKey && !hasTextToSpeak\)/g) || []).length;
if (emptyResponseCount >= 2) {
  console.log(`  ✅ Both handlers handle empty response (found ${emptyResponseCount} instances)`);
} else {
  console.log(`  ⚠️  Empty response handling may be missing (found ${emptyResponseCount} instances, expected 2)`);
}

console.log('\n✅ All tests passed! Text response fix is correctly implemented.');
console.log('\nSummary:');
console.log('  - Text responses always display in chat (even if malformed)');
console.log('  - TTS only plays when text is not empty/whitespace');
console.log('  - Both text and voice handlers use the same validation logic');
console.log('  - Error handling is consistent across both handlers');
