#!/usr/bin/env node
/**
 * Wake Word Setup Verification Script
 * Verifies that all wake word configuration is correct and ready to use
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getFirstEnvPath, getProjectRoot } from '../../scripts/load-env-everywhere.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = getProjectRoot(__dirname);
const envPathForCheck = getFirstEnvPath(projectRoot) ?? join(projectRoot, '.env');

function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    info: '\x1b[36m',    // Cyan
    reset: '\x1b[0m'
  };
  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    info: 'ℹ️ '
  };
  console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
}

function checkEnvFile() {
  log('Checking .env file...', 'info');
  try {
    const envContent = readFileSync(envPathForCheck, 'utf-8');
    
    // Either VITE_* or non-VITE_ form counts; both are read everywhere
    const requiredVars = {
      openWakeWord: false, // VITE_USE_OPENWAKEWORD + VITE_OPENWAKEWORD_WS_URL
      wakeWord: false,     // VITE_WAKE_WORD_ENABLED or WAKE_WORD_ENABLED
      cartesia: false,     // VITE_CARTESIA_API_KEY or CARTESIA_API_KEY
    };
    const keyToGroup = {
      VITE_USE_OPENWAKEWORD: 'openWakeWord',
      USE_OPENWAKEWORD: 'openWakeWord',
      VITE_OPENWAKEWORD_WS_URL: 'openWakeWord',
      OPENWAKEWORD_WS_URL: 'openWakeWord',
      VITE_WAKE_WORD_ENABLED: 'wakeWord',
      WAKE_WORD_ENABLED: 'wakeWord',
      VITE_CARTESIA_API_KEY: 'cartesia',
      CARTESIA_API_KEY: 'cartesia',
    };

    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;

      const [key] = trimmed.split('=');
      const value = trimmed.substring(key.length + 1).trim();
      const group = keyToGroup[key];
      if (group && !requiredVars[group]) {
        if (value && !value.includes('your_') && !value.includes('here') && value.toLowerCase() !== 'false') {
          requiredVars[group] = true;
          log(`  ${key}: Found`, 'success');
        } else {
          log(`  ${key}: Found but appears to be placeholder`, 'warning');
        }
      }
    }

    let allValid = true;
    if (!requiredVars.openWakeWord) {
      log('  VITE_USE_OPENWAKEWORD=true and VITE_OPENWAKEWORD_WS_URL: required', 'error');
      allValid = false;
    }
    if (!requiredVars.wakeWord) {
      log('  VITE_WAKE_WORD_ENABLED or WAKE_WORD_ENABLED: MISSING', 'error');
      allValid = false;
    }
    if (!requiredVars.cartesia) {
      log('  VITE_CARTESIA_API_KEY or CARTESIA_API_KEY: MISSING', 'error');
      allValid = false;
    }
    
    return allValid;
  } catch (err) {
    log(`  .env file not found or unreadable: ${err.message}`, 'error');
    return false;
  }
}

function checkViteConfig() {
  log('Checking vite.config.js...', 'info');
  try {
    const vitePath = join(projectRoot, 'vite.config.js');
    const viteContent = readFileSync(vitePath, 'utf-8');
    
    const checks = {
      'VITE_OPENWAKEWORD_WS_URL': viteContent.includes('VITE_OPENWAKEWORD_WS_URL'),
      'loadEnv': viteContent.includes('loadEnv'),
      'define': viteContent.includes('define:')
    };
    
    let allValid = true;
    for (const [check, found] of Object.entries(checks)) {
      if (found) {
        log(`  ${check}: Found`, 'success');
      } else {
        log(`  ${check}: MISSING`, 'error');
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    log(`  vite.config.js error: ${err.message}`, 'error');
    return false;
  }
}

function checkBridgeCode() {
  log('Checking cartesia-audio-bridge.js...', 'info');
  try {
    const bridgePath = join(projectRoot, 'public/js/cartesia-audio-bridge.js');
    const bridgeContent = readFileSync(bridgePath, 'utf-8');
    
    const checks = {
      'initWakeWord method': bridgeContent.includes('async initWakeWord()'),
      'OpenWakeWordManager': bridgeContent.includes('OpenWakeWordManager'),
      'openWakeWordWsUrl': bridgeContent.includes('openWakeWordWsUrl'),
      'error handling': bridgeContent.includes('onError')
    };
    
    let allValid = true;
    for (const [check, found] of Object.entries(checks)) {
      if (found) {
        log(`  ${check}: Found`, 'success');
      } else {
        log(`  ${check}: MISSING`, 'error');
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    log(`  cartesia-audio-bridge.js error: ${err.message}`, 'error');
    return false;
  }
}

function checkOpenWakeWordManager() {
  log('Checking openwakeword-manager.js...', 'info');
  try {
    const managerPath = join(projectRoot, 'public/js/openwakeword-manager.js');
    const managerContent = readFileSync(managerPath, 'utf-8');
    
    const checks = {
      'OpenWakeWordClient': managerContent.includes('OpenWakeWordClient'),
      'initialize method': managerContent.includes('async initialize('),
      'wsUrl': managerContent.includes('wsUrl'),
      'hey jarvis': managerContent.includes('hey jarvis') || managerContent.includes('OPENWAKEWORD_FRAME_SAMPLES')
    };
    
    let allValid = true;
    for (const [check, found] of Object.entries(checks)) {
      if (found) {
        log(`  ${check}: Found`, 'success');
      } else {
        log(`  ${check}: MISSING`, 'error');
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    log(`  openwakeword-manager.js error: ${err.message}`, 'error');
    return false;
  }
}

function checkTestPage() {
  log('Checking wake-word-activation-test.html...', 'info');
  try {
    const testPath = join(projectRoot, 'public/debug/wake-word-activation-test.html');
    const testContent = readFileSync(testPath, 'utf-8');
    
    const checks = {
      'initWakeWord call': testContent.includes('initWakeWord()'),
      'openWakeWord': testContent.includes('openWakeWord') || testContent.includes('OpenWakeWord'),
      'error handling': testContent.includes('catch')
    };
    
    let allValid = true;
    for (const [check, found] of Object.entries(checks)) {
      if (found) {
        log(`  ${check}: Found`, 'success');
      } else {
        log(`  ${check}: MISSING`, 'error');
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    log(`  wake-word-activation-test.html error: ${err.message}`, 'error');
    return false;
  }
}

async function main() {
  console.log('\n🔍 Wake Word Setup Verification\n');
  console.log('=' .repeat(50));
  
  const results = {
    envFile: checkEnvFile(),
    viteConfig: checkViteConfig(),
    bridgeCode: checkBridgeCode(),
    openWakeWordManager: checkOpenWakeWordManager(),
    testPage: checkTestPage()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:\n');
  
  const allPassed = Object.values(results).every(r => r);
  
  for (const [check, passed] of Object.entries(results)) {
    if (passed) {
      log(`${check}: PASSED`, 'success');
    } else {
      log(`${check}: FAILED`, 'error');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    log('\n✅ All checks passed! Wake word setup is ready.', 'success');
    log('\nNext steps:', 'info');
    log('1. Restart dev server: npm run vite', 'info');
    log('2. Open: http://localhost:3000/debug/wake-word-activation-test.html', 'info');
    log('3. Click "Initialize Bridge" then "Start Wake Word"', 'info');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'error');
    process.exit(1);
  }
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
