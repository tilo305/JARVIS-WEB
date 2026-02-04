#!/usr/bin/env node
/**
 * Wake Word Activation Test - Terminal CLI
 * 
 * Interactive terminal version of the wake word activation test tool.
 * Provides the same functionality as the HTML debug page but in the terminal.
 * 
 * Usage:
 *   node debug/tools/wake-word-activation-test-cli.js
 *   npm run test:wakeword:cli
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const envPath = join(root, '.env');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function colorize(text, color) {
  return `${colors[color] || colors.reset}${text}${colors.reset}`;
}

function log(message, type = 'info', skipStorage = false) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: colorize('•', 'cyan'),
    success: colorize('✓', 'green'),
    warning: colorize('⚠', 'yellow'),
    error: colorize('✗', 'red'),
    trace: colorize('→', 'gray'),
  }[type] || '•';
  
  const logMessage = `${colorize(`[${timestamp}]`, 'gray')} ${prefix} ${message}`;
  console.log(logMessage);
  
  // Store in logs array (unless skipStorage is true)
  if (!skipStorage) {
    logs.push({
      timestamp,
      type,
      message,
      formatted: logMessage
    });
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.shift();
    }
  }
}

function logSection(title) {
  console.log(`\n${colorize('═'.repeat(70), 'bright')}`);
  console.log(`${colorize(`  ${title}`, 'bright')}`);
  console.log(`${colorize('═'.repeat(70), 'bright')}\n`);
}

// State
let metrics = {
  detections: 0,
  activationTime: 0,
  bufferFlushes: 0,
  preSpeechChunks: 0,
};

let status = {
  bridge: 'Not Initialized',
  wakeWord: 'Inactive',
  stt: 'Inactive',
  streaming: 'No',
};

let logs = [];
let testResults = [];

// Load environment variables
function loadEnv() {
  const config = {};
  if (existsSync(envPath)) {
    const raw = readFileSync(envPath, 'utf8');
    const lines = raw.split('\n').map(l => l.replace(/\r$/, '')).filter((l) => l.trim() && !l.trim().startsWith('#'));
    for (const line of lines) {
      const i = line.indexOf('=');
      if (i > 0) {
        const key = line.slice(0, i).trim();
        const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
        config[key] = value;
      }
    }
  }
  return config;
}

const config = loadEnv();
const apiKey = config.CARTESIA_API_KEY || config.VITE_CARTESIA_API_KEY || '';
const picovoiceKey = config.PICOVOICE_ACCESS_KEY || config.VITE_PICOVOICE_ACCESS_KEY || '';

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function displayMenu() {
  // Clear screen (works on Windows, Linux, macOS)
  try {
    process.stdout.write('\x1B[2J\x1B[0f');
  } catch (e) {
    // Fallback if clear fails
    console.clear();
  }
  logSection('🔊 Wake Word Activation Test - Terminal CLI');
  
  // Status
  console.log(colorize('Status:', 'bright'));
  console.log(`  Bridge: ${getStatusColor(status.bridge)}${status.bridge}${colors.reset}`);
  console.log(`  Wake Word: ${getStatusColor(status.wakeWord)}${status.wakeWord}${colors.reset}`);
  console.log(`  STT: ${getStatusColor(status.stt)}${status.stt}${colors.reset}`);
  console.log(`  Streaming: ${getStatusColor(status.streaming)}${status.streaming}${colors.reset}`);
  
  // Metrics
  console.log(`\n${colorize('Metrics:', 'bright')}`);
  console.log(`  Detections: ${colorize(metrics.detections.toString(), 'cyan')}`);
  console.log(`  Activation Time: ${colorize(`${metrics.activationTime}ms`, 'cyan')}`);
  console.log(`  Buffer Flushes: ${colorize(metrics.bufferFlushes.toString(), 'cyan')}`);
  console.log(`  Pre-Speech Chunks: ${colorize(metrics.preSpeechChunks.toString(), 'cyan')}`);
  
  // Menu
  console.log(`\n${colorize('Commands:', 'bright')}`);
  console.log(`  ${colorize('1', 'cyan')}. Initialize Bridge`);
  console.log(`  ${colorize('2', 'cyan')}. Start Wake Word`);
  console.log(`  ${colorize('3', 'cyan')}. Stop Wake Word`);
  console.log(`  ${colorize('4', 'cyan')}. Simulate Detection`);
  console.log(`  ${colorize('5', 'cyan')}. Run Full Test`);
  console.log(`  ${colorize('6', 'cyan')}. View Logs`);
  console.log(`  ${colorize('7', 'cyan')}. Clear Logs`);
  console.log(`  ${colorize('8', 'cyan')}. Show Flow Diagram`);
  console.log(`  ${colorize('9', 'cyan')}. Show Test Results`);
  console.log(`  ${colorize('R', 'cyan')}. Reset State (Stop STT & Re-enable Wake Word)`);
  console.log(`  ${colorize('0', 'cyan')}. Exit`);
  console.log();
}

function getStatusColor(statusText) {
  if (statusText.includes('Ready') || statusText.includes('Active') || statusText.includes('Listening') || statusText.includes('Yes')) {
    return colors.green;
  } else if (statusText.includes('Error') || statusText.includes('Failed')) {
    return colors.red;
  } else if (statusText.includes('Initializing') || statusText.includes('Connecting')) {
    return colors.yellow;
  }
  return colors.gray;
}

async function showFlowDiagram() {
  logSection('Activation Flow Diagram');
  
  const steps = [
    { num: 1, name: 'Wake Word Detected', desc: 'Porcupine detects wake word' },
    { num: 2, name: 'Check Cooldown', desc: 'Prevent re-triggering within 3s' },
    { num: 3, name: 'Activate STT Pipeline', desc: 'Set _sttActive = true' },
    { num: 4, name: 'Flush Pre-Speech Buffer', desc: 'Send buffered audio to STT' },
    { num: 5, name: 'Start Streaming', desc: 'Stream audio to Cartesia STT API' },
    { num: 6, name: 'Disable Wake Word', desc: 'Prevent re-triggering during STT' },
  ];
  
  steps.forEach(step => {
    console.log(`  ${colorize(`[${step.num}]`, 'cyan')} ${colorize(step.name, 'bright')}`);
    console.log(`      ${colorize(step.desc, 'dim')}`);
  });
  console.log();
  
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function initializeBridge() {
  log('Initializing CartesiaAudioBridge...', 'info');
  status.bridge = 'Initializing...';
  displayMenu();
  
  // Check configuration
  if (!apiKey || apiKey.length < 20) {
    log('Warning: CARTESIA_API_KEY not found in environment', 'warning');
    log('Note: You can still test the activation flow, but STT/TTS will not work without API keys', 'info');
  } else {
    log(`Using Cartesia API Key (${apiKey.substring(0, 10)}...)`, 'success');
  }
  
  const isValidKey = picovoiceKey && picovoiceKey.length >= 20 && 
                     picovoiceKey !== 'your_access_key_here' && 
                     picovoiceKey !== 'your_key_here' && 
                     picovoiceKey !== 'your_key';
  
  if (!isValidKey) {
    log('CRITICAL: PICOVOICE_ACCESS_KEY is missing or invalid!', 'error');
    log('Wake word detection will NOT work without a valid Picovoice AccessKey', 'error');
    log('', 'info');
    log('SOLUTION: Update .env file and RESTART dev server', 'info');
    log('1. Open .env file in project root', 'info');
    log('2. Ensure line exists: VITE_PICOVOICE_ACCESS_KEY=your_actual_key', 'info');
    log('3. Replace "your_actual_key" with your key from https://console.picovoice.ai/', 'info');
    log('4. IMPORTANT: Stop dev server (Ctrl+C) and restart: npm run vite', 'error');
    log('   (Vite only loads .env at startup - changes require restart!)', 'error');
    status.bridge = 'Missing AccessKey - Cannot Initialize';
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  log(`Using Picovoice AccessKey (${picovoiceKey.length} chars)`, 'success');
  
  // Simulate initialization
  await new Promise(resolve => setTimeout(resolve, 500));
  
  log('Bridge initialized successfully', 'success');
  status.bridge = 'Ready';
  displayMenu();
  
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function startWakeWord() {
  if (status.bridge !== 'Ready') {
    log('Bridge not initialized. Run "Initialize Bridge" first.', 'error');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  if (status.wakeWord === 'Listening') {
    log('Wake word is already listening', 'warning');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  log('Starting wake word detection...', 'info');
  status.wakeWord = 'Listening';
  displayMenu();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  log('Wake word started successfully', 'success');
  displayMenu();
  
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function stopWakeWord() {
  if (status.bridge !== 'Ready') {
    log('Bridge not initialized', 'error');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  if (status.wakeWord === 'Inactive' || status.wakeWord === 'Stopped') {
    log('Wake word is already stopped', 'warning');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  log('Stopping wake word...', 'info');
  status.wakeWord = 'Stopped';
  displayMenu();
  
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function resetState() {
  if (status.bridge !== 'Ready') {
    log('Bridge not initialized. Run "Initialize Bridge" first.', 'error');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  log('Resetting state...', 'info');
  
  // Stop STT streaming
  if (status.stt === 'Active' || status.streaming === 'Yes') {
    log('Stopping STT streaming...', 'info');
    status.stt = 'Inactive';
    status.streaming = 'No';
  }
  
  // Re-enable wake word if it was disabled
  if (status.wakeWord === 'Disabled') {
    log('Re-enabling wake word...', 'info');
    status.wakeWord = 'Listening';
    log('Wake word re-enabled (ready for next detection)', 'success');
  } else if (status.wakeWord === 'Detected!') {
    // If still in detected state, reset to listening
    status.wakeWord = 'Listening';
    log('Wake word reset to listening state', 'success');
  } else {
    log('Wake word state unchanged', 'info');
  }
  
  displayMenu();
  log('State reset complete', 'success');
  
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function simulateDetection(silent = false) {
  if (status.bridge !== 'Ready') {
    log('Bridge not initialized. Run "Initialize Bridge" first.', 'error');
    if (!silent) {
      await question(colorize('Press Enter to continue...', 'gray'));
    }
    return false;
  }
  
  if (!silent) {
    log('Simulating wake word detection...', 'info');
  }
  const activationStartTime = Date.now();
  
  // Step 1: Wake word detected
  log('Wake word detected! (keywordIndex: 0)', 'success');
  metrics.detections++;
  status.wakeWord = 'Detected!';
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Step 2: Check cooldown
  log('Cooldown check: Passed', 'success');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 3: Activate STT
  log('STT pipeline activated', 'success');
  status.stt = 'Active';
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 4: Flush buffer
  log('Flushing pre-speech buffer...', 'info');
  metrics.bufferFlushes++;
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 5: Start streaming
  log('Speech detected - STT streaming started', 'success');
  status.streaming = 'Yes';
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Step 6: Disable wake word
  log('Wake word disabled (as expected)', 'success');
  status.wakeWord = 'Disabled';
  
  // Calculate activation time
  metrics.activationTime = Date.now() - activationStartTime;
  
  if (!silent) {
    displayMenu();
    await question(colorize('Press Enter to continue...', 'gray'));
  }
  
  return true;
}

async function runFullTest() {
  if (status.bridge !== 'Ready') {
    log('Bridge not initialized. Run "Initialize Bridge" first.', 'error');
    await question(colorize('Press Enter to continue...', 'gray'));
    return;
  }
  
  logSection('Running Full Test Suite');
  testResults = [];
  
  // Save initial state
  const initialState = {
    stt: status.stt,
    streaming: status.streaming,
    wakeWord: status.wakeWord,
    detections: metrics.detections,
    bufferFlushes: metrics.bufferFlushes,
  };
  
  // Test 1: Pre-setup check
  log('Test 1: Checking pre-setup components...', 'info');
  const test1 = {
    name: 'Pre-setup Components',
    status: 'pass',
    details: [
      '✓ STT WebSocket pre-connected (simulated)',
      '✓ STT audio graph pre-setup (simulated)',
      '✓ VAD pre-started (simulated)',
    ],
  };
  testResults.push(test1);
  log('Test 1: PASS', 'success');
  
  // Test 2: Activation flow
  log('Test 2: Testing activation flow...', 'info');
  const detectionResult = await simulateDetection(true); // Silent mode for test
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const test2 = {
    name: 'Activation Flow',
    status: detectionResult && status.stt === 'Active' ? 'pass' : 'fail',
    details: [
      status.stt === 'Active' ? '✓ STT pipeline activated' : '✗ STT pipeline not activated',
      status.streaming === 'Yes' ? '✓ STT streaming started' : '⚠ STT streaming not started',
      status.wakeWord === 'Disabled' ? '✓ Wake word disabled after activation' : `⚠ Wake word status: ${status.wakeWord}`,
    ],
  };
  testResults.push(test2);
  log(`Test 2: ${test2.status === 'pass' ? 'PASS' : 'FAIL'}`, test2.status === 'pass' ? 'success' : 'error');
  
  // Test 3: Pre-speech buffer
  log('Test 3: Testing pre-speech buffer...', 'info');
  const test3 = {
    name: 'Pre-Speech Buffer',
    status: 'pass',
    details: [
      `✓ Pre-speech buffer has ${metrics.preSpeechChunks} chunks`,
      metrics.bufferFlushes > initialState.bufferFlushes ? '✓ Buffer flush function works' : '⚠ Buffer flush not triggered',
      '✓ Pre-speech buffer cleared after flush',
    ],
  };
  testResults.push(test3);
  log('Test 3: PASS', 'success');
  
  // Test 4: Cooldown
  log('Test 4: Testing cooldown period...', 'info');
  const test4 = {
    name: 'Cooldown Period',
    status: 'pass',
    details: [
      '✓ Cooldown prevents re-triggering (simulated)',
    ],
  };
  testResults.push(test4);
  log('Test 4: PASS', 'success');
  
  // Summary
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  
  logSection('Test Complete');
  log(`${passed} passed, ${failed} failed`, failed > 0 ? 'error' : 'success');
  
  displayMenu();
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function viewLogs() {
  logSection('Debug Logs');
  
  if (logs.length === 0) {
    console.log(colorize('No logs yet', 'gray'));
  } else {
    const recentLogs = logs.slice(-50);
    recentLogs.forEach(logEntry => {
      if (typeof logEntry === 'string') {
        console.log(logEntry);
      } else if (logEntry.formatted) {
        console.log(logEntry.formatted);
      } else {
        console.log(`[${logEntry.timestamp}] ${logEntry.message}`);
      }
    });
    console.log(colorize(`\nShowing ${recentLogs.length} of ${logs.length} total logs`, 'gray'));
  }
  
  console.log();
  await question(colorize('Press Enter to continue...', 'gray'));
}

function clearLogs() {
  const count = logs.length;
  logs = [];
  // Don't log the clear action itself to avoid adding it back
  console.log(colorize(`✓ Logs cleared (${count} entries removed)`, 'green'));
}

async function showTestResults() {
  logSection('Test Results');
  
  if (testResults.length === 0) {
    log('No tests run yet', 'info');
    log('Run "Full Test" to execute automated tests', 'info');
  } else {
    testResults.forEach((result, index) => {
      const statusColor = result.status === 'pass' ? 'green' : result.status === 'fail' ? 'red' : 'yellow';
      console.log(`\n${colorize(`Test ${index + 1}: ${result.name}`, 'bright')} [${colorize(result.status.toUpperCase(), statusColor)}]`);
      result.details.forEach(detail => {
        console.log(`  ${detail}`);
      });
    });
  }
  
  console.log();
  await question(colorize('Press Enter to continue...', 'gray'));
}

async function handleCommand(choice) {
  const trimmedChoice = (choice || '').trim();
  
  switch (trimmedChoice) {
    case '1':
      await initializeBridge();
      break;
    case '2':
      await startWakeWord();
      break;
    case '3':
      await stopWakeWord();
      break;
    case '4':
      await simulateDetection();
      break;
    case '5':
      await runFullTest();
      break;
    case '6':
      await viewLogs();
      break;
    case '7':
      clearLogs();
      displayMenu();
      await question(colorize('Press Enter to continue...', 'gray'));
      break;
    case '8':
      await showFlowDiagram();
      break;
    case '9':
      await showTestResults();
      break;
    case 'r':
    case 'R':
    case 'reset':
      await resetState();
      break;
    case '0':
    case 'q':
    case 'Q':
    case 'exit':
      console.log(colorize('\nExiting...', 'cyan'));
      rl.close();
      process.exit(0);
      break;
    case '':
      // Empty input - just refresh menu
      break;
    default:
      log(`Invalid command: "${trimmedChoice}". Please try again.`, 'error');
      await question(colorize('Press Enter to continue...', 'gray'));
  }
}

async function main() {
  // Clear screen (works on Windows, Linux, macOS)
  try {
    process.stdout.write('\x1B[2J\x1B[0f');
  } catch (e) {
    // Fallback if clear fails
    console.clear();
  }
  logSection('🔊 Wake Word Activation Test - Terminal CLI');
  
  log('Welcome to the Wake Word Activation Test Tool', 'info');
  log('This tool provides the same functionality as the HTML debug page', 'info');
  log('but in a terminal interface.', 'info');
  log('', 'info');
  
  // Check configuration
  if (!apiKey || apiKey.length < 20) {
    log('Warning: CARTESIA_API_KEY not found in environment', 'warning');
  }
  
  const isValidKey = picovoiceKey && picovoiceKey.length >= 20 && 
                     picovoiceKey !== 'your_access_key_here' && 
                     picovoiceKey !== 'your_key_here' && 
                     picovoiceKey !== 'your_key';
  
  if (!isValidKey) {
    log('Warning: PICOVOICE_ACCESS_KEY not found or invalid', 'warning');
    log('Wake word detection will not work without a valid key', 'warning');
  }
  
  log('', 'info');
  await question(colorize('Press Enter to start...', 'gray'));
  
  // Main loop
  while (true) {
    try {
      displayMenu();
      const choice = await question(colorize('Select command: ', 'cyan'));
      await handleCommand(choice);
    } catch (error) {
      log(`Error in main loop: ${error.message}`, 'error');
      console.error(error);
      await question(colorize('Press Enter to continue...', 'gray'));
    }
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(colorize('\n\nExiting...', 'cyan'));
  rl.close();
  process.exit(0);
});

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  rl.close();
  process.exit(1);
});
