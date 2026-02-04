#!/usr/bin/env node
/**
 * Wake Word Keywords Debug Tool
 * 
 * Comprehensive debugging tool for wake word keyword validation issues.
 * Traces keyword paths from configuration through validation to Porcupine.
 * 
 * Usage:
 *   node debug/tools/debug-wake-word-keywords.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const wakeWordManagerPath = join(root, 'public/js/wake-word-manager.js');

const BUILT_IN_KEYWORDS = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 
  'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 
  'Okay Google', 'Picovoice', 'Porcupine', 'Terminator'];

function log(message, type = 'info') {
  const prefix = {
    info: '•',
    success: '✓',
    warning: '⚠',
    error: '✗',
  }[type] || '•';
  console.log(`${prefix} ${message}`);
}

function testKeywordValidation(keyword) {
  log(`\nTesting keyword: "${keyword}"`, 'info');
  
  // Test 1: Check if it's in built-in keywords list
  const normalized = keyword.toLowerCase();
  const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalized);
  
  if (builtInMatch) {
    log(`  ✓ Matches built-in keyword: "${builtInMatch}"`, 'success');
    log(`  ✓ Should skip file existence check`, 'success');
    return { valid: true, type: 'built-in', keyword: builtInMatch };
  } else {
    log(`  ✗ Not a built-in keyword`, 'error');
    log(`  ⚠ Will attempt file existence check`, 'warning');
    return { valid: false, type: 'custom', keyword };
  }
}

function analyzeWakeWordManager() {
  log('Analyzing wake-word-manager.js...', 'info');
  
  if (!existsSync(wakeWordManagerPath)) {
    log(`File not found: ${wakeWordManagerPath}`, 'error');
    return;
  }
  
  const content = readFileSync(wakeWordManagerPath, 'utf8');
  
  // Check for built-in keyword validation
  const hasBuiltInCheck = content.includes('BUILT_IN_KEYWORDS.find');
  log(`Built-in keyword check: ${hasBuiltInCheck ? 'Found' : 'Missing'}`, hasBuiltInCheck ? 'success' : 'error');
  
  // Check for async validation loop
  const hasAsyncLoop = content.includes('for (let i = 0; i < this.keywordPaths.length; i++)') && 
                       content.includes('await');
  log(`Async validation loop: ${hasAsyncLoop ? 'Found' : 'Missing'}`, hasAsyncLoop ? 'success' : 'warning');
  
  // Check for file existence check
  const hasFileCheck = content.includes('fetch(validatedPath') || content.includes('HEAD');
  log(`File existence check: ${hasFileCheck ? 'Found' : 'Missing'}`, hasFileCheck ? 'success' : 'warning');
  
  // Check for final keywords validation
  const hasFinalValidation = content.includes('finalKeywords') && content.includes('Porcupine.create');
  log(`Final keywords validation: ${hasFinalValidation ? 'Found' : 'Missing'}`, hasFinalValidation ? 'success' : 'error');
}

function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('  🔍 Wake Word Keywords Debug Tool');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  
  log('Built-in Keywords Available:', 'info');
  BUILT_IN_KEYWORDS.forEach((keyword, i) => {
    console.log(`  ${i + 1}. ${keyword}`);
  });
  
  // Test common keywords
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Testing Common Keywords', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  
  const testKeywords = ['Jarvis', 'jarvis', 'JARVIS', 'Computer', 'computer', 'invalid-keyword'];
  testKeywords.forEach(keyword => {
    testKeywordValidation(keyword);
  });
  
  // Analyze code
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Code Analysis', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  analyzeWakeWordManager();
  
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Recommendations', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  log('1. Ensure built-in keywords are checked BEFORE file existence check', 'info');
  log('2. Built-in keywords should skip async file validation entirely', 'info');
  log('3. Case-insensitive matching should work for all built-in keywords', 'info');
  log('4. Final keywords array should never be empty before Porcupine.create()', 'info');
  
  console.log('\n');
}

main();
