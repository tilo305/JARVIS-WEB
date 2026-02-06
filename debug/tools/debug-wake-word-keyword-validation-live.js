#!/usr/bin/env node
/**
 * Wake Word Keyword Validation - LIVE Debug Tool
 * 
 * Comprehensive LIVE debugging tool for wake word keyword validation issues.
 * Tests the actual validation logic used in wake-word-manager.js
 * 
 * Usage:
 *   node debug/tools/debug-wake-word-keyword-validation-live.js
 */

const BUILT_IN_KEYWORDS = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 
  'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 
  'Okay Google', 'Porcupine', 'Terminator'];

function log(message, type = 'info') {
  const prefix = {
    info: '•',
    success: '✓',
    warning: '⚠',
    error: '✗',
  }[type] || '•';
  console.log(`${prefix} ${message}`);
}

async function simulateKeywordValidation(keywordPaths, sensitivities = [0.5]) {
  log(`\nSimulating validation for: ${JSON.stringify(keywordPaths)}`, 'info');
  
  const validatedPaths = [];
  const validatedSensitivities = [];
  
  for (let i = 0; i < keywordPaths.length; i++) {
    const path = keywordPaths[i];
    
    log(`  Processing keyword ${i + 1}: "${path}"`, 'info');
    
    // Skip empty or invalid paths
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      log(`    ✗ Skipping empty or invalid path`, 'error');
      continue;
    }
    
    const trimmedPath = path.trim();
    
    // Check if it's a built-in keyword name (case-insensitive)
    const normalizedPath = trimmedPath.toLowerCase();
    const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalizedPath);
    
    if (builtInMatch) {
      log(`    ✓ Matches built-in keyword: "${builtInMatch}"`, 'success');
      validatedPaths.push(builtInMatch);
      validatedSensitivities.push(sensitivities[i] ?? 0.5);
      log(`    ✓ Added to validatedPaths (length: ${validatedPaths.length})`, 'success');
      continue; // Skip file existence check
    }
    
    log(`    ⚠ Not a built-in keyword, would check file existence`, 'warning');
    // In real code, this would do async file check, but for built-in keywords we skip it
  }
  
  log(`\nValidation Results:`, 'info');
  log(`  Original paths: ${JSON.stringify(keywordPaths)}`, 'info');
  log(`  Validated paths: ${JSON.stringify(validatedPaths)}`, validatedPaths.length > 0 ? 'success' : 'error');
  log(`  Validated length: ${validatedPaths.length}`, validatedPaths.length > 0 ? 'success' : 'error');
  
  if (validatedPaths.length === 0) {
    log(`  ✗ ERROR: No valid keywords after validation!`, 'error');
    return { valid: false, validatedPaths: [], error: 'No valid keywords after validation' };
  }
  
  // Final filtering (simulating the code)
  const filteredPaths = validatedPaths.filter(path => path && typeof path === 'string' && path.trim().length > 0);
  const finalKeywords = filteredPaths.filter(k => k != null && typeof k === 'string' && k.trim().length > 0);
  
  log(`  Final keywords: ${JSON.stringify(finalKeywords)}`, finalKeywords.length > 0 ? 'success' : 'error');
  log(`  Final length: ${finalKeywords.length}`, finalKeywords.length > 0 ? 'success' : 'error');
  
  if (finalKeywords.length === 0) {
    log(`  ✗ ERROR: Final keywords array is empty after filtering!`, 'error');
    return { valid: false, validatedPaths, finalKeywords: [], error: 'Final keywords empty after filtering' };
  }
  
  return { valid: true, validatedPaths, finalKeywords };
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('  🔍 Wake Word Keyword Validation - LIVE Debug Tool');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  
  log('Built-in Keywords Available:', 'info');
  BUILT_IN_KEYWORDS.forEach((keyword, i) => {
    console.log(`  ${i + 1}. ${keyword}`);
  });
  
  // Test cases
  const testCases = [
    { paths: ['Jarvis'], sensitivities: [0.5] },
    { paths: ['jarvis'], sensitivities: [0.5] }, // lowercase
    { paths: ['JARVIS'], sensitivities: [0.5] }, // uppercase
    { paths: ['Computer'], sensitivities: [0.5] },
    { paths: ['invalid-keyword'], sensitivities: [0.5] },
    { paths: [''], sensitivities: [0.5] }, // empty
    { paths: ['Jarvis', 'Computer'], sensitivities: [0.5, 0.6] },
  ];
  
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Running Test Cases', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await simulateKeywordValidation(testCase.paths, testCase.sensitivities);
    
    if (result.valid) {
      passed++;
      log(`\n✓ Test PASSED: ${JSON.stringify(testCase.paths)}`, 'success');
    } else {
      failed++;
      log(`\n✗ Test FAILED: ${JSON.stringify(testCase.paths)}`, 'error');
      log(`  Error: ${result.error}`, 'error');
    }
  }
  
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Summary', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  log(`Passed: ${passed}`, passed > 0 ? 'success' : 'info');
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
  
  log('\n══════════════════════════════════════════════════════════════════════', 'info');
  log('Recommendations', 'info');
  log('══════════════════════════════════════════════════════════════════════', 'info');
  log('1. Built-in keywords should be matched case-insensitively', 'info');
  log('2. Built-in keywords should skip file existence check', 'info');
  log('3. Final keywords array should never be empty', 'info');
  log('4. Add comprehensive debug logging at each validation step', 'info');
  
  console.log('\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
