#!/usr/bin/env node
/**
 * Wake Word Setup Verification Script
 * Verifies that all wake word configuration is correct and ready to use
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

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
    const envPath = join(projectRoot, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    const requiredVars = {
      'VITE_PICOVOICE_ACCESS_KEY': false,
      'VITE_WAKE_WORD_ENABLED': false,
      'VITE_CARTESIA_API_KEY': false
    };
    
    // Also track non-VITE variants for compatibility
    let wakeWordEnabledFound = false;
    
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed) continue;
      
      const [key] = trimmed.split('=');
      const value = trimmed.substring(key.length + 1).trim();
      
      if (key in requiredVars) {
        if (value && !value.includes('your_') && !value.includes('here')) {
          requiredVars[key] = true;
          if (key === 'VITE_PICOVOICE_ACCESS_KEY') {
            log(`  ${key}: Found (${value.length} chars)`, 'success');
          } else {
            log(`  ${key}: Found`, 'success');
          }
        } else {
          log(`  ${key}: Found but appears to be placeholder`, 'warning');
        }
      } else if (key === 'WAKE_WORD_ENABLED' && value && !value.includes('your_') && !value.includes('here')) {
        // Found WAKE_WORD_ENABLED without VITE_ prefix - mark both as found
        wakeWordEnabledFound = true;
        requiredVars['VITE_WAKE_WORD_ENABLED'] = true;
        log(`  ${key}: Found (will use as VITE_WAKE_WORD_ENABLED)`, 'success');
      }
    }
    
    let allValid = true;
    for (const [key, found] of Object.entries(requiredVars)) {
      if (!found) {
        log(`  ${key}: MISSING`, 'error');
        allValid = false;
      }
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
      'VITE_PICOVOICE_ACCESS_KEY': viteContent.includes('VITE_PICOVOICE_ACCESS_KEY'),
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
      'picovoiceAccessKey check': bridgeContent.includes('picovoiceAccessKey'),
      'WakeWordManager': bridgeContent.includes('WakeWordManager'),
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

function checkWakeWordManager() {
  log('Checking wake-word-manager.js...', 'info');
  try {
    const managerPath = join(projectRoot, 'public/js/wake-word-manager.js');
    const managerContent = readFileSync(managerPath, 'utf-8');
    
    const checks = {
      'Porcupine import': managerContent.includes('@picovoice/porcupine-web'),
      'initialize method': managerContent.includes('async initialize('),
      'AccessKey validation': managerContent.includes('accessKey'),
      'built-in keywords': managerContent.includes('Jarvis') || managerContent.includes('BUILT_IN_KEYWORDS')
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
    log(`  wake-word-manager.js error: ${err.message}`, 'error');
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
      'picovoiceAccessKey check': testContent.includes('picovoiceAccessKey'),
      'error handling': testContent.includes('catch'),
      'diagnostics': testContent.includes('Environment Variable Diagnostics')
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
    wakeWordManager: checkWakeWordManager(),
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
