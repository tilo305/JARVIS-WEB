#!/usr/bin/env node
/**
 * OpenWakeWord Configuration LIVE Debugging Tool
 * 
 * Comprehensive debugging tool for OpenWakeWord configuration issues.
 * Tests all aspects of the configuration from .env to runtime.
 * 
 * Based on @gHiDrA eNgInEeRiNg.md debugging principles.
 * 
 * Usage:
 *   node debug/tools/debug-openwakeword-config-live.js
 *   npm run debug:openwakeword
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

// ============================================================================
// 1. .env File Check
// ============================================================================
logSection('1. .env File Configuration Check');

const envPath = getFirstEnvPath(projectRoot) ?? join(projectRoot, '.env');
let envConfig = {};

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
    
    // Check VITE_USE_OPENWAKEWORD
    const useOpenWakeWord = envConfig.VITE_USE_OPENWAKEWORD || envConfig.USE_OPENWAKEWORD;
    if (!useOpenWakeWord) {
      logError('VITE_USE_OPENWAKEWORD is NOT set in .env');
      logInfo('  Expected: VITE_USE_OPENWAKEWORD=true');
      fixes.push('Add VITE_USE_OPENWAKEWORD=true to .env file');
      errors++;
    } else if (useOpenWakeWord.toLowerCase() !== 'true') {
      logError(`VITE_USE_OPENWAKEWORD is set to "${useOpenWakeWord}" (should be "true")`);
      fixes.push(`Change VITE_USE_OPENWAKEWORD=${useOpenWakeWord} to VITE_USE_OPENWAKEWORD=true in .env`);
      errors++;
    } else {
      logSuccess(`VITE_USE_OPENWAKEWORD=${useOpenWakeWord}`);
    }
    
    // Check VITE_OPENWAKEWORD_WS_URL
    const wsUrl = envConfig.VITE_OPENWAKEWORD_WS_URL || envConfig.OPENWAKEWORD_WS_URL;
    if (!wsUrl) {
      logError('VITE_OPENWAKEWORD_WS_URL is NOT set in .env');
      logInfo('  Expected: VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws');
      fixes.push('Add VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws to .env file');
      errors++;
    } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      logError(`VITE_OPENWAKEWORD_WS_URL="${wsUrl}" is not a valid WebSocket URL (should start with ws:// or wss://)`);
      fixes.push(`Fix VITE_OPENWAKEWORD_WS_URL in .env to start with ws:// or wss://`);
      errors++;
    } else {
      logSuccess(`VITE_OPENWAKEWORD_WS_URL=${wsUrl}`);
    }
    
    // Check VITE_WAKE_WORD_ENABLED (optional but recommended)
    const wakeWordEnabled = envConfig.VITE_WAKE_WORD_ENABLED || envConfig.WAKE_WORD_ENABLED;
    if (!wakeWordEnabled || wakeWordEnabled.toLowerCase() !== 'true') {
      logWarning('VITE_WAKE_WORD_ENABLED is not set to "true" (optional but recommended)');
      fixes.push('Add VITE_WAKE_WORD_ENABLED=true to .env file (optional)');
      warnings++;
    } else {
      logSuccess(`VITE_WAKE_WORD_ENABLED=${wakeWordEnabled}`);
    }
    
  } catch (err) {
    logError(`Failed to read .env file: ${err.message}`);
    errors++;
  }
} else {
  logError(`.env file not found at ${envPath}`);
  logInfo('  Create a .env file in the project root with:');
  logInfo('    VITE_USE_OPENWAKEWORD=true');
  logInfo('    VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws');
  fixes.push('Create .env file with VITE_USE_OPENWAKEWORD=true and VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws');
  errors++;
}

// ============================================================================
// 2. Vite Config Check
// ============================================================================
logSection('2. Vite Configuration Check');

const viteConfigPath = join(projectRoot, 'vite.config.js');
if (existsSync(viteConfigPath)) {
  logSuccess(`vite.config.js found`);
  
  try {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    
    // Check if VITE_USE_OPENWAKEWORD is handled
    if (viteConfig.includes('VITE_USE_OPENWAKEWORD')) {
      logSuccess('VITE_USE_OPENWAKEWORD is handled in vite.config.js');
      
      // Check default value
      if (viteConfig.includes("VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD || 'false'")) {
        logWarning('vite.config.js defaults VITE_USE_OPENWAKEWORD to "false"');
        logInfo('  This means if not set in .env, it will be "false"');
        logInfo('  Make sure VITE_USE_OPENWAKEWORD=true is in .env');
        warnings++;
      }
    } else {
      logError('VITE_USE_OPENWAKEWORD is not handled in vite.config.js');
      errors++;
    }
    
    // Check if VITE_OPENWAKEWORD_WS_URL is handled
    if (viteConfig.includes('VITE_OPENWAKEWORD_WS_URL')) {
      logSuccess('VITE_OPENWAKEWORD_WS_URL is handled in vite.config.js');
    } else {
      logError('VITE_OPENWAKEWORD_WS_URL is not handled in vite.config.js');
      errors++;
    }
    
    // Check if define is used
    if (viteConfig.includes('define:') || viteConfig.includes('define(')) {
      logSuccess('Vite define() is used (env vars will be injected)');
    } else {
      logWarning('Vite define() may not be used (env vars may not be injected)');
      warnings++;
    }
    
  } catch (err) {
    logError(`Failed to read vite.config.js: ${err.message}`);
    errors++;
  }
} else {
  logError('vite.config.js not found');
  errors++;
}

// ============================================================================
// 3. Source Code Configuration Check
// ============================================================================
logSection('3. Source Code Configuration Check');

// Check app.js
const appJsPath = join(projectRoot, 'public/js/app.js');
if (existsSync(appJsPath)) {
  logSuccess('app.js found');
  
  try {
    const appJs = readFileSync(appJsPath, 'utf-8');
    
    // Check if useOpenWakeWord is read correctly
    if (appJs.includes('VITE_USE_OPENWAKEWORD')) {
      logSuccess('app.js reads VITE_USE_OPENWAKEWORD');
      
      // Check default
      if (appJs.includes("VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD || cfg.useOpenWakeWord || 'false'")) {
        logWarning('app.js defaults useOpenWakeWord to "false"');
        logInfo('  This means if env var is not set, it will be false');
        warnings++;
      }
    } else {
      logError('app.js does not read VITE_USE_OPENWAKEWORD');
      errors++;
    }
    
    // Check if openWakeWordWsUrl is read
    if (appJs.includes('VITE_OPENWAKEWORD_WS_URL') || appJs.includes('openWakeWordWsUrl')) {
      logSuccess('app.js reads openWakeWordWsUrl');
    } else {
      logError('app.js does not read openWakeWordWsUrl');
      errors++;
    }
    
  } catch (err) {
    logError(`Failed to read app.js: ${err.message}`);
    errors++;
  }
} else {
  logError('app.js not found');
  errors++;
}

// Check wake-word-test-config.js
const testConfigPath = join(projectRoot, 'public/debug/wake-word-test-config.js');
if (existsSync(testConfigPath)) {
  logSuccess('wake-word-test-config.js found');
  
  try {
    const testConfig = readFileSync(testConfigPath, 'utf-8');
    
    // Check default value
    if (testConfig.includes("VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD || cfg.useOpenWakeWord || 'true'")) {
      logWarning('wake-word-test-config.js defaults useOpenWakeWord to "true"');
      logInfo('  This conflicts with vite.config.js default of "false"');
      logInfo('  Vite will inject "false" if not set in .env');
      warnings++;
    }
    
  } catch (err) {
    logError(`Failed to read wake-word-test-config.js: ${err.message}`);
    errors++;
  }
} else {
  logWarning('wake-word-test-config.js not found (may not be needed)');
  warnings++;
}

// ============================================================================
// 4. WebSocket Server Check
// ============================================================================
logSection('4. OpenWakeWord WebSocket Server Check');

const wsUrl = envConfig.VITE_OPENWAKEWORD_WS_URL || envConfig.OPENWAKEWORD_WS_URL || 'ws://localhost:8765/ws';
const urlObj = new URL(wsUrl);
const host = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === 'wss:' ? 443 : 80);

logInfo(`Testing connection to: ${wsUrl}`);
logInfo(`  Host: ${host}`);
logInfo(`  Port: ${port}`);

// Check if Python server script exists
const serverScriptPath = join(projectRoot, 'scripts/openwakeword-server.py');
if (existsSync(serverScriptPath)) {
  logSuccess('openwakeword-server.py found');
  
  try {
    const serverScript = readFileSync(serverScriptPath, 'utf-8');
    
    // Check if it's a valid Python script
    if (serverScript.includes('aiohttp') || serverScript.includes('websocket') || serverScript.includes('openwakeword')) {
      logSuccess('openwakeword-server.py appears to be valid');
    } else {
      logWarning('openwakeword-server.py may not be a valid OpenWakeWord server');
      warnings++;
    }
    
    // Check default port
    if (serverScript.includes('8765') || serverScript.includes('port')) {
      logSuccess('openwakeword-server.py appears to handle port configuration');
    }
    
  } catch (err) {
    logError(`Failed to read openwakeword-server.py: ${err.message}`);
    errors++;
  }
} else {
  logError('openwakeword-server.py not found');
  logInfo('  Expected at: scripts/openwakeword-server.py');
  fixes.push('Ensure scripts/openwakeword-server.py exists');
  errors++;
}

// Try to connect to WebSocket server
logInfo('Attempting WebSocket connection...');
try {
  const ws = new WebSocket(wsUrl);
  
  const connectionTimeout = setTimeout(() => {
    ws.close();
    logError('WebSocket connection timeout (server may not be running)');
    logInfo('  Start the server with: python scripts/openwakeword-server.py');
    fixes.push('Start OpenWakeWord server: python scripts/openwakeword-server.py');
    errors++;
  }, 3000);
  
  ws.on('open', () => {
    clearTimeout(connectionTimeout);
    logSuccess('WebSocket connection successful!');
    ws.close();
  });
  
  ws.on('error', (err) => {
    clearTimeout(connectionTimeout);
    logError(`WebSocket connection failed: ${err.message}`);
    logInfo('  Make sure the OpenWakeWord server is running');
    logInfo('  Start with: python scripts/openwakeword-server.py');
    fixes.push('Start OpenWakeWord server: python scripts/openwakeword-server.py');
    errors++;
  });
  
  // Wait a bit for connection attempt
  await new Promise(resolve => setTimeout(resolve, 3500));
  
} catch (err) {
  logError(`WebSocket connection error: ${err.message}`);
  errors++;
}

// ============================================================================
// 5. Bridge Code Check
// ============================================================================
logSection('5. CartesiaAudioBridge Code Check');

const bridgePath = join(projectRoot, 'public/js/cartesia-audio-bridge.js');
if (existsSync(bridgePath)) {
  logSuccess('cartesia-audio-bridge.js found');
  
  try {
    const bridgeCode = readFileSync(bridgePath, 'utf-8');
    
    // Check if OpenWakeWord is supported
    if (bridgeCode.includes('OpenWakeWordManager') || bridgeCode.includes('openWakeWord')) {
      logSuccess('CartesiaAudioBridge supports OpenWakeWord');
    } else {
      logError('CartesiaAudioBridge does not appear to support OpenWakeWord');
      errors++;
    }
    
    // Check initWakeWord method
    if (bridgeCode.includes('async initWakeWord()') || bridgeCode.includes('initWakeWord()')) {
      logSuccess('initWakeWord() method found');
    } else {
      logError('initWakeWord() method not found');
      errors++;
    }
    
    // Check configuration validation
    if (bridgeCode.includes('VITE_USE_OPENWAKEWORD') || bridgeCode.includes('useOpenWakeWord')) {
      logSuccess('Bridge checks useOpenWakeWord configuration');
    } else {
      logWarning('Bridge may not check useOpenWakeWord configuration');
      warnings++;
    }
    
    // Check error handling
    if (bridgeCode.includes('OpenWakeWord') && (bridgeCode.includes('onError') || bridgeCode.includes('catch'))) {
      logSuccess('Bridge has error handling for OpenWakeWord');
    } else {
      logWarning('Bridge may not have proper error handling for OpenWakeWord');
      warnings++;
    }
    
  } catch (err) {
    logError(`Failed to read cartesia-audio-bridge.js: ${err.message}`);
    errors++;
  }
} else {
  logError('cartesia-audio-bridge.js not found');
  errors++;
}

// ============================================================================
// 6. Test Page Check
// ============================================================================
logSection('6. Test Page Check');

const testPagePath = join(projectRoot, 'public/debug/wake-word-activation-test.html');
if (existsSync(testPagePath)) {
  logSuccess('wake-word-activation-test.html found');
  
  try {
    const testPage = readFileSync(testPagePath, 'utf-8');
    
    // Check if it uses the config
    if (testPage.includes('getWakeWordTestConfig') || testPage.includes('wake-word-test-config')) {
      logSuccess('Test page uses wake-word-test-config.js');
    } else {
      logWarning('Test page may not use wake-word-test-config.js');
      warnings++;
    }
    
    // Check if it validates config
    if (testPage.includes('useOpenWakeWord') && testPage.includes('openWakeWordWsUrl')) {
      logSuccess('Test page validates OpenWakeWord configuration');
    } else {
      logWarning('Test page may not validate OpenWakeWord configuration');
      warnings++;
    }
    
  } catch (err) {
    logError(`Failed to read wake-word-activation-test.html: ${err.message}`);
    errors++;
  }
} else {
  logWarning('wake-word-activation-test.html not found (may not be needed)');
  warnings++;
}

// ============================================================================
// 7. Summary and Fixes
// ============================================================================
logSection('Summary');

if (errors === 0 && warnings === 0) {
  logSuccess('All checks passed! OpenWakeWord configuration is correct.');
  logInfo('\nNext steps:');
  logInfo('  1. Make sure the OpenWakeWord server is running:');
  logInfo('     python scripts/openwakeword-server.py');
  logInfo('  2. Restart the dev server:');
  logInfo('     npm run vite');
  logInfo('  3. Open the test page:');
  logInfo('     http://localhost:3000/debug/wake-word-activation-test.html');
  process.exit(0);
} else {
  if (errors > 0) {
    logError(`${errors} error(s) found`);
  }
  if (warnings > 0) {
    logWarning(`${warnings} warning(s) found`);
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
  
  logInfo('1. Edit .env file in project root:');
  logInfo('   VITE_USE_OPENWAKEWORD=true');
  logInfo('   VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws');
  logInfo('   VITE_WAKE_WORD_ENABLED=true  (optional)');
  logInfo('');
  logInfo('2. Start OpenWakeWord server:');
  logInfo('   python scripts/openwakeword-server.py');
  logInfo('');
  logInfo('3. Restart dev server:');
  logInfo('   npm run vite');
  logInfo('');
  logInfo('4. Test in browser:');
  logInfo('   http://localhost:3000/debug/wake-word-activation-test.html');
  
  process.exit(errors > 0 ? 1 : 0);
}
