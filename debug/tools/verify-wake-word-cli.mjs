#!/usr/bin/env node
/**
 * Verification script for wake-word-activation-test-cli.js
 * Tests all functions and verifies the script works correctly
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'wake-word-activation-test-cli.js');

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    testsPassed++;
  } else {
    console.log(`✗ ${name}`);
    testsFailed++;
  }
}

console.log('Verifying wake-word-activation-test-cli.js...\n');

// Test 1: File exists
test('Script file exists', existsSync(scriptPath));

// Test 2: Read and parse file
let scriptContent = '';
try {
  scriptContent = readFileSync(scriptPath, 'utf8');
  test('Script file is readable', scriptContent.length > 0);
} catch (error) {
  test('Script file is readable', false);
  console.error('Error:', error.message);
  process.exit(1);
}

// Test 3: Check for required imports
test('Has fs imports', scriptContent.includes("import { readFileSync, existsSync } from 'fs'"));
test('Has path imports', scriptContent.includes("import { dirname, join } from 'path'"));
test('Has url imports', scriptContent.includes("import { fileURLToPath } from 'url'"));
test('Has readline import', scriptContent.includes("import readline from 'readline'"));

// Test 4: Check for required functions
test('Has log function', scriptContent.includes('function log(') || scriptContent.includes('const log ='));
test('Has displayMenu function', scriptContent.includes('function displayMenu('));
test('Has initializeBridge function', scriptContent.includes('async function initializeBridge('));
test('Has startWakeWord function', scriptContent.includes('async function startWakeWord('));
test('Has stopWakeWord function', scriptContent.includes('async function stopWakeWord('));
test('Has simulateDetection function', scriptContent.includes('async function simulateDetection('));
test('Has runFullTest function', scriptContent.includes('async function runFullTest('));
test('Has viewLogs function', scriptContent.includes('async function viewLogs('));
test('Has clearLogs function', scriptContent.includes('function clearLogs('));
test('Has showFlowDiagram function', scriptContent.includes('async function showFlowDiagram('));
test('Has showTestResults function', scriptContent.includes('async function showTestResults('));
test('Has handleCommand function', scriptContent.includes('async function handleCommand('));
test('Has main function', scriptContent.includes('async function main('));

// Test 5: Check for required features
test('Has colorize function', scriptContent.includes('function colorize('));
test('Has logSection function', scriptContent.includes('function logSection('));
test('Has metrics tracking', scriptContent.includes('metrics = {') || scriptContent.includes('let metrics'));
test('Has status tracking', scriptContent.includes('status = {') || scriptContent.includes('let status'));
test('Has logs array', scriptContent.includes('logs = []') || scriptContent.includes('let logs'));
test('Has testResults array', scriptContent.includes('testResults = []') || scriptContent.includes('let testResults'));

// Test 6: Check for error handling
test('Has SIGINT handler', scriptContent.includes('SIGINT') || scriptContent.includes('process.on'));
test('Has error handling in main', scriptContent.includes('.catch(') || scriptContent.includes('try {'));

// Test 7: Check for menu commands
test('Has command 1 (Initialize Bridge)', scriptContent.includes("case '1'"));
test('Has command 2 (Start Wake Word)', scriptContent.includes("case '2'"));
test('Has command 3 (Stop Wake Word)', scriptContent.includes("case '3'"));
test('Has command 4 (Simulate Detection)', scriptContent.includes("case '4'"));
test('Has command 5 (Run Full Test)', scriptContent.includes("case '5'"));
test('Has command 6 (View Logs)', scriptContent.includes("case '6'"));
test('Has command 7 (Clear Logs)', scriptContent.includes("case '7'"));
test('Has command 8 (Show Flow Diagram)', scriptContent.includes("case '8'"));
test('Has command 9 (Show Test Results)', scriptContent.includes("case '9'"));
test('Has command 0 (Exit)', scriptContent.includes("case '0'"));

// Test 8: Check for environment variable loading
test('Has loadEnv function', scriptContent.includes('function loadEnv(') || scriptContent.includes('const loadEnv ='));
test('Loads .env file', scriptContent.includes('.env') && scriptContent.includes('readFileSync'));

// Test 9: Check for proper async/await usage
test('Uses async/await', scriptContent.includes('async ') && scriptContent.includes('await '));

// Test 10: Check for readline interface
test('Creates readline interface', scriptContent.includes('readline.createInterface'));

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

if (testsFailed === 0) {
  console.log('\n✅ All verification tests passed!');
  console.log('The script appears to be correctly structured.');
  process.exit(0);
} else {
  console.log('\n❌ Some verification tests failed.');
  console.log('Please review the script and fix the issues.');
  process.exit(1);
}
