#!/usr/bin/env node
/**
 * Test script to verify n8n warning improvements
 * 
 * Tests that:
 * 1. Duplicate "Response body is empty" warning is removed
 * 2. Enhanced warning includes diagnostic steps
 * 3. Warning properly detects test URLs
 * 4. Warning provides actionable guidance
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const appJsPath = join(projectRoot, 'public', 'js', 'app.js');

console.log('🧪 Testing n8n Warning Improvements...\n');

// Read app.js
const appJs = readFileSync(appJsPath, 'utf8');

let errors = 0;
let warnings = 0;

// Test 1: Check duplicate warning is removed
console.log('Test 1: Checking duplicate warning is removed...');
const duplicateWarningPattern = /console\.warn\('\[JARVIS\] VERIFY: Response body is empty'/g;
const duplicateMatches = (appJs.match(duplicateWarningPattern) || []).length;
if (duplicateMatches === 0) {
  console.log('  ✅ Duplicate "Response body is empty" warning removed');
} else {
  console.log(`  ❌ Found ${duplicateMatches} duplicate warning(s) - should be 0`);
  errors++;
}

// Test 2: Check enhanced warning includes diagnosticSteps
console.log('Test 2: Checking enhanced warning includes diagnosticSteps...');
if (appJs.includes('diagnosticSteps') && appJs.includes('diagnostics: diagnosticSteps')) {
  console.log('  ✅ Enhanced warning includes diagnosticSteps array');
} else {
  console.log('  ❌ Enhanced warning missing diagnosticSteps');
  errors++;
}

// Test 3: Check warning includes issue description
console.log('Test 3: Checking warning includes issue description...');
if (appJs.includes('issue: issueDescription')) {
  console.log('  ✅ Warning includes issue description');
} else {
  console.log('  ❌ Warning missing issue description');
  errors++;
}

// Test 4: Check test URL detection
console.log('Test 4: Checking test URL detection...');
if (appJs.includes('/webhook-test/') && appJs.includes('isTestUrl')) {
  console.log('  ✅ Test URL detection implemented');
} else {
  console.log('  ❌ Test URL detection missing');
  errors++;
}

// Test 5: Check diagnostic steps for empty response
console.log('Test 5: Checking diagnostic steps for empty response...');
if (appJs.includes('Respond to Webhook') && appJs.includes('diagnosticSteps.push')) {
  console.log('  ✅ Diagnostic steps include Respond to Webhook guidance');
} else {
  console.log('  ❌ Diagnostic steps missing Respond to Webhook guidance');
  errors++;
}

// Test 6: Check warning includes contentType
console.log('Test 6: Checking warning includes contentType...');
const warningPattern = /console\.warn\('\[JARVIS\] n8n configuration issue: no reply in response\. Using fallback\.',\s*\{[^}]*contentType/s;
if (warningPattern.test(appJs)) {
  console.log('  ✅ Warning includes contentType');
} else {
  console.log('  ⚠️  Warning may not include contentType (check manually)');
  warnings++;
}

// Test 7: Check warning includes webhookUrl
console.log('Test 7: Checking warning includes webhookUrl...');
if (appJs.includes('webhookUrl: isTestUrl') || appJs.includes('webhookUrl:')) {
  console.log('  ✅ Warning includes webhookUrl');
} else {
  console.log('  ❌ Warning missing webhookUrl');
  errors++;
}

// Test 8: Check warning includes hint to debug file
console.log('Test 8: Checking warning includes hint to debug file...');
if (appJs.includes('N8N-RESPOND-TO-WEBHOOK-FIX.md')) {
  console.log('  ✅ Warning includes hint to debug file');
} else {
  console.log('  ❌ Warning missing hint to debug file');
  errors++;
}

// Test 9: Check empty response handling doesn't log duplicate
console.log('Test 9: Checking empty response handling...');
const emptyResponseSection = appJs.match(/} else \{[^}]*Response body is empty[^}]*data = \{\};/s);
if (emptyResponseSection && emptyResponseSection[0].includes('Don\'t log a separate warning')) {
  console.log('  ✅ Empty response handling avoids duplicate warning');
} else {
  console.log('  ⚠️  Empty response handling may still log duplicate (check manually)');
  warnings++;
}

// Test 10: Check diagnostic steps are properly structured
console.log('Test 10: Checking diagnostic steps structure...');
if (appJs.includes('diagnosticSteps.push(\'1.') && appJs.includes('diagnosticSteps.push(\'2.')) {
  console.log('  ✅ Diagnostic steps are properly numbered');
} else {
  console.log('  ⚠️  Diagnostic steps may not be properly numbered');
  warnings++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('Test Summary:');
console.log(`  ✅ Passed: ${10 - errors - warnings}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Errors: ${errors}`);

if (errors > 0) {
  console.log('\n❌ Tests failed! Please fix the errors above.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Tests passed with warnings. Please review manually.');
  process.exit(0);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
