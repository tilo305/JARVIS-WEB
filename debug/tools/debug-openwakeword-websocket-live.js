#!/usr/bin/env node
/**
 * OpenWakeWord WebSocket Connection LIVE Debugging Tool
 * 
 * Comprehensive LIVE debugging tool for OpenWakeWord WebSocket connection issues.
 * Tests the WebSocket connection in real-time, detects errors, and provides fixes.
 * 
 * Based on @gHiDrA eNgInEeRiNg.md debugging principles.
 * 
 * Usage:
 *   node debug/tools/debug-openwakeword-websocket-live.js
 *   npm run debug:openwakeword:websocket
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getFirstEnvPath, getProjectRoot } from '../../scripts/load-env-everywhere.mjs';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = getProjectRoot(__dirname);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}\n`);
}

function logSuccess(msg) {
  log(`✅ ${msg}`, 'green');
}

function logError(msg) {
  log(`❌ ${msg}`, 'red');
}

function logWarning(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

function logInfo(msg) {
  log(`ℹ️  ${msg}`, 'cyan');
}

function logStep(stepNum, description) {
  log(`  [${stepNum}] ${description}`, 'cyan');
}

let errors = 0;
let warnings = 0;
let fixes = [];
let testResults = [];

// ============================================================================
// 1. Configuration Check
// ============================================================================
logSection('1. Configuration Check');

const envPath = getFirstEnvPath(projectRoot) ?? join(projectRoot, '.env');
let envConfig = {};
let wsUrl = 'ws://localhost:8765/ws';

if (existsSync(envPath)) {
  logSuccess(`.env file found: ${envPath}`);
  
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;
      
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        envConfig[key] = value;
      }
    }
    
    // Get WebSocket URL
    wsUrl = envConfig.VITE_OPENWAKEWORD_WS_URL || envConfig.OPENWAKEWORD_WS_URL || wsUrl;
    logInfo(`WebSocket URL: ${wsUrl}`);
    
    // Validate URL format
    try {
      const urlObj = new URL(wsUrl);
      if (!urlObj.protocol.startsWith('ws')) {
        logError(`Invalid WebSocket URL protocol: ${urlObj.protocol} (should be ws:// or wss://)`);
        fixes.push(`Fix WebSocket URL protocol in .env: ${wsUrl}`);
        errors++;
      } else {
        logSuccess(`WebSocket URL format is valid`);
      }
    } catch {
      logError(`Invalid WebSocket URL format: ${wsUrl}`);
      fixes.push(`Fix WebSocket URL format in .env: ${wsUrl}`);
      errors++;
    }
    
  } catch (err) {
    logError(`Failed to read .env file: ${err.message}`);
    errors++;
  }
} else {
  logError(`.env file not found at ${envPath}`);
  fixes.push(`Create .env file with VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws`);
  errors++;
}

// ============================================================================
// 2. Server Script Check
// ============================================================================
logSection('2. OpenWakeWord Server Script Check');

const serverScriptPath = join(projectRoot, 'scripts/openwakeword-server.py');
if (existsSync(serverScriptPath)) {
  logSuccess(`openwakeword-server.py found`);
  
  try {
    const serverScript = readFileSync(serverScriptPath, 'utf-8');
    
    // Check if it's a valid Python script
    if (serverScript.includes('aiohttp') || serverScript.includes('websocket') || serverScript.includes('openwakeword')) {
      logSuccess(`openwakeword-server.py appears to be valid`);
    } else {
      logWarning(`openwakeword-server.py may not be a valid OpenWakeWord server`);
      warnings++;
    }
    
    // Check default port
    if (serverScript.includes('8765') || serverScript.includes('port')) {
      logSuccess(`openwakeword-server.py appears to handle port configuration`);
    }
    
    // Check for WebSocket endpoint
    if (serverScript.includes('/ws') || serverScript.includes('websocket')) {
      logSuccess(`openwakeword-server.py appears to have WebSocket endpoint`);
    } else {
      logWarning(`openwakeword-server.py may not have WebSocket endpoint`);
      warnings++;
    }
    
  } catch (err) {
    logError(`Failed to read openwakeword-server.py: ${err.message}`);
    errors++;
  }
} else {
  logError(`openwakeword-server.py not found`);
  logInfo(`  Expected at: scripts/openwakeword-server.py`);
  fixes.push(`Ensure scripts/openwakeword-server.py exists`);
  errors++;
}

// ============================================================================
// 3. Python Dependencies Check
// ============================================================================
logSection('3. Python Dependencies Check');

const requirementsPath = join(projectRoot, 'requirements-openwakeword.txt');
if (existsSync(requirementsPath)) {
  logSuccess(`requirements-openwakeword.txt found`);
  
  try {
    const requirements = readFileSync(requirementsPath, 'utf-8');
    const requiredPackages = ['openwakeword', 'aiohttp', 'numpy'];
    const missingPackages = [];
    
    for (const pkg of requiredPackages) {
      if (requirements.includes(pkg)) {
        logSuccess(`Required package found: ${pkg}`);
      } else {
        logWarning(`Required package may be missing: ${pkg}`);
        missingPackages.push(pkg);
        warnings++;
      }
    }
    
    if (missingPackages.length > 0) {
      fixes.push(`Install missing Python packages: pip install ${missingPackages.join(' ')}`);
    }
    
  } catch (err) {
    logError(`Failed to read requirements-openwakeword.txt: ${err.message}`);
    errors++;
  }
} else {
  logWarning(`requirements-openwakeword.txt not found`);
  warnings++;
}

// ============================================================================
// 4. LIVE WebSocket Connection Test
// ============================================================================
logSection('4. LIVE WebSocket Connection Test');

const urlObj = new URL(wsUrl);
const host = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === 'wss:' ? 443 : 80);

logInfo(`Testing connection to: ${wsUrl}`);
logInfo(`  Host: ${host}`);
logInfo(`  Port: ${port}`);
logInfo(`  Protocol: ${urlObj.protocol}`);

// Test WebSocket connection
let connectionTestPassed = false;
let connectionError = null;
let connectionDetails = {};

try {
  const ws = new WebSocket(wsUrl);
  
  const connectionTimeout = setTimeout(() => {
    ws.close();
    connectionTestPassed = false;
    connectionError = 'Connection timeout (server may not be running)';
    connectionDetails = {
      error: connectionError,
      code: 'TIMEOUT',
      url: wsUrl
    };
    testResults.push({
      test: 'WebSocket Connection',
      status: 'FAILED',
      error: connectionError,
      details: connectionDetails
    });
    
    logError(`WebSocket connection timeout (server may not be running)`);
    logInfo(`  Start the server with: python scripts/openwakeword-server.py`);
    fixes.push(`Start OpenWakeWord server: python scripts/openwakeword-server.py`);
    errors++;
  }, 5000);
  
  ws.on('open', () => {
    clearTimeout(connectionTimeout);
    connectionTestPassed = true;
    connectionDetails = {
      url: wsUrl,
      readyState: ws.readyState,
      protocol: ws.protocol || 'none'
    };
    testResults.push({
      test: 'WebSocket Connection',
      status: 'PASSED',
      details: connectionDetails
    });
    
    logSuccess(`WebSocket connection successful!`);
    logInfo(`  Ready state: ${ws.readyState} (OPEN = 1)`);
    logInfo(`  Protocol: ${ws.protocol || 'none'}`);
    
    // Test sending sample rate
    try {
      ws.send('16000');
      logSuccess(`Sent sample rate: 16000 Hz`);
      
      // Wait for response
      setTimeout(() => {
        ws.close();
      }, 1000);
    } catch (err) {
      logWarning(`Failed to send sample rate: ${err.message}`);
      warnings++;
    }
  });
  
  ws.on('error', (err) => {
    clearTimeout(connectionTimeout);
    connectionTestPassed = false;
    connectionError = err.message || String(err);
    connectionDetails = {
      error: connectionError,
      code: err.code || 'UNKNOWN',
      url: wsUrl
    };
    testResults.push({
      test: 'WebSocket Connection',
      status: 'FAILED',
      error: connectionError,
      details: connectionDetails
    });
    
    logError(`WebSocket connection failed: ${connectionError}`);
    
    // Provide specific error guidance
    if (connectionError.includes('ECONNREFUSED') || connectionError.includes('connect ECONNREFUSED')) {
      logInfo(`  Error: Connection refused - server is not running`);
      logInfo(`  Fix: Start the server with: python scripts/openwakeword-server.py`);
      fixes.push(`Start OpenWakeWord server: python scripts/openwakeword-server.py`);
    } else if (connectionError.includes('ENOTFOUND') || connectionError.includes('getaddrinfo')) {
      logInfo(`  Error: Host not found - check hostname in URL`);
      logInfo(`  Fix: Verify VITE_OPENWAKEWORD_WS_URL in .env file`);
      fixes.push(`Verify WebSocket URL hostname in .env file`);
    } else if (connectionError.includes('EADDRINUSE')) {
      logInfo(`  Error: Port already in use`);
      logInfo(`  Fix: Use a different port: python scripts/openwakeword-server.py --port 8766`);
      fixes.push(`Use different port or stop conflicting service`);
    } else {
      logInfo(`  Make sure the OpenWakeWord server is running`);
      logInfo(`  Start with: python scripts/openwakeword-server.py`);
      fixes.push(`Start OpenWakeWord server: python scripts/openwakeword-server.py`);
    }
    errors++;
  });
  
  ws.on('message', (data) => {
    try {
      if (typeof data === 'string') {
        const payload = JSON.parse(data);
        logSuccess(`Received message from server: ${JSON.stringify(payload)}`);
        
        if (payload.loaded_models) {
          logSuccess(`Server loaded models: ${payload.loaded_models.join(', ')}`);
        }
        if (payload.activations) {
          logSuccess(`Server detected activations: ${payload.activations.join(', ')}`);
        }
      } else {
        logInfo(`Received binary message (${data.length} bytes)`);
      }
    } catch (err) {
      logWarning(`Failed to parse server message: ${err.message}`);
      warnings++;
    }
  });
  
  ws.on('close', (code, reason) => {
    if (connectionTestPassed) {
      logInfo(`WebSocket closed (code: ${code}, reason: ${reason || 'none'})`);
    }
  });
  
  // Wait for connection attempt
  await new Promise(resolve => setTimeout(resolve, 6000));
  
} catch (err) {
  connectionTestPassed = false;
  connectionError = err.message || String(err);
  connectionDetails = {
    error: connectionError,
    code: 'EXCEPTION',
    url: wsUrl
  };
  testResults.push({
    test: 'WebSocket Connection',
    status: 'FAILED',
    error: connectionError,
    details: connectionDetails
  });
  
  logError(`WebSocket connection error: ${connectionError}`);
  errors++;
}

// ============================================================================
// 5. Error Pattern Analysis
// ============================================================================
logSection('5. Error Pattern Analysis');

// Check for common error patterns from the user's error log
const errorPatterns = [
  {
    pattern: /WebSocket connection failed.*Unable to connect/i,
    description: 'WebSocket connection failed - server not running',
    fix: 'Start OpenWakeWord server: python scripts/openwakeword-server.py'
  },
  {
    pattern: /code.*1006/i,
    description: 'WebSocket close code 1006 (abnormal closure)',
    fix: 'Server is not running or connection was refused'
  },
  {
    pattern: /reconnect.*attempts/i,
    description: 'Multiple reconnect attempts failed',
    fix: 'Server is not running - start it before connecting'
  }
];

logInfo(`Analyzing error patterns from user's error log...`);
for (const patternInfo of errorPatterns) {
  if (connectionError && patternInfo.pattern.test(connectionError)) {
    logWarning(`Detected error pattern: ${patternInfo.description}`);
    logInfo(`  Suggested fix: ${patternInfo.fix}`);
    if (!fixes.includes(patternInfo.fix)) {
      fixes.push(patternInfo.fix);
    }
  }
}

// ============================================================================
// 6. Browser-Specific Issues Check
// ============================================================================
logSection('6. Browser-Specific Issues Check');

logInfo(`Checking for browser-specific WebSocket issues...`);

// Check if URL is localhost (browser security)
if (host === 'localhost' || host === '127.0.0.1') {
  logSuccess(`Host is localhost (browser-compatible)`);
} else {
  logWarning(`Host is not localhost (${host}) - may have CORS/security issues in browser`);
  warnings++;
  fixes.push(`Consider using localhost instead of ${host} for browser compatibility`);
}

// Check port range
const portNum = parseInt(port, 10);
if (portNum >= 1 && portNum <= 65535) {
  logSuccess(`Port is in valid range: ${portNum}`);
} else {
  logError(`Port is invalid: ${portNum}`);
  errors++;
  fixes.push(`Fix port number in WebSocket URL`);
}

// ============================================================================
// 7. Summary and Fixes
// ============================================================================
logSection('Summary');

if (errors === 0 && warnings === 0 && connectionTestPassed) {
  logSuccess('All checks passed! WebSocket connection is working.');
  logInfo('\nNext steps:');
  logInfo('  1. Make sure the OpenWakeWord server stays running:');
  logInfo('     python scripts/openwakeword-server.py');
  logInfo('  2. Restart the dev server if you changed .env:');
  logInfo('     npm run vite');
  logInfo('  3. Test in browser:');
  logInfo('     http://localhost:3000/');
  process.exit(0);
} else {
  if (errors > 0) {
    logError(`${errors} error(s) found`);
  }
  if (warnings > 0) {
    logWarning(`${warnings} warning(s) found`);
  }
  if (!connectionTestPassed) {
    logError('WebSocket connection test FAILED');
  }
  
  console.log(`\n${colors.bright}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}  REQUIRED FIXES${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}\n`);
  
  if (fixes.length > 0) {
    fixes.forEach((fix, index) => {
      logStep(index + 1, fix);
    });
  } else {
    logInfo('No specific fixes identified. Review warnings above.');
  }
  
  console.log(`\n${colors.bright}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}  QUICK FIX GUIDE${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}\n`);
  
  logInfo('1. Start OpenWakeWord server (in a separate terminal):');
  logInfo('   python scripts/openwakeword-server.py');
  logInfo('');
  logInfo('2. Verify server is running:');
  logInfo('   Check terminal output for: "Model loaded: [\'hey jarvis\']"');
  logInfo('   Server should be listening on: http://0.0.0.0:8765');
  logInfo('');
  logInfo('3. Verify .env configuration:');
  logInfo('   VITE_USE_OPENWAKEWORD=true');
  logInfo('   VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws');
  logInfo('');
  logInfo('4. Restart dev server (if .env changed):');
  logInfo('   npm run vite');
  logInfo('');
  logInfo('5. Test in browser:');
  logInfo('   http://localhost:3000/');
  logInfo('   Open DevTools Console (F12) and look for:');
  logInfo('   [JARVIS OpenWakeWord] WebSocket connected');
  
  process.exit(errors > 0 ? 1 : 0);
}
