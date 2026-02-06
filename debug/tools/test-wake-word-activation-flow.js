#!/usr/bin/env node
/**
 * Wake Word Activation Flow Test Tool
 * 
 * Tests the wake word detection → STT activation flow:
 * 1. Wake word detection → activation
 * 2. STT pipeline activation (components pre-setup)
 * 3. Pre-speech buffer flushing
 * 4. Streaming to Cartesia STT API
 * 5. Wake word disabling
 * 
 * Usage:
 *   node debug/tools/test-wake-word-activation-flow.js
 *   npm run test:wakeword:activation
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getFirstEnvPath, getProjectRoot } from '../../scripts/load-env-everywhere.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = getProjectRoot(__dirname);
const envPath = getFirstEnvPath(root) ?? join(root, '.env');
const bridgePath = join(root, 'public/js/cartesia-audio-bridge.js');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
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
  log(`✓ ${msg}`, 'green');
}

function logError(msg) {
  log(`✗ ${msg}`, 'red');
}

function logWarning(msg) {
  log(`⚠ ${msg}`, 'yellow');
}

function logInfo(msg) {
  log(`• ${msg}`, 'cyan');
}

function logStep(stepNum, description) {
  log(`  [${stepNum}] ${description}`, 'cyan');
}

let errors = 0;
let warnings = 0;

logSection('Wake Word Activation Flow Test');

// 1. Configuration Check
logSection('1. Configuration Check');

let config = {};
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split('\n').map(l => l.replace(/\r$/, '')).filter((l) => l.trim() && !l.trim().startsWith('#'));
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim();
      config[key] = value;
    }
  }
}

const apiKey = config.CARTESIA_API_KEY || config.VITE_CARTESIA_API_KEY || '';
const wakeWordKey = config.WAKE_WORD_ACCESS_KEY || config.VITE_WAKE_WORD_ACCESS_KEY || '';
const wakeWordEnabled = (config.WAKE_WORD_ENABLED || config.VITE_WAKE_WORD_ENABLED || 'false').toLowerCase() === 'true';

if (!apiKey || apiKey.length < 20) {
  logError('CARTESIA_API_KEY is not set or invalid');
  logInfo('Get your API key from: https://cartesia.ai/');
  logInfo('Add to .env: CARTESIA_API_KEY=your_key_here');
  errors++;
} else {
  logSuccess(`CARTESIA_API_KEY configured (${apiKey.substring(0, 10)}...)`);
}

if (!wakeWordKey || wakeWordKey.length < 20) {
  logError('WAKE_WORD_ACCESS_KEY is not set or invalid');
  logInfo('Get your AccessKey from your service provider');
  logInfo('Add to .env: WAKE_WORD_ACCESS_KEY=your_key_here');
  errors++;
} else {
  logSuccess(`WAKE_WORD_ACCESS_KEY configured (${wakeWordKey.substring(0, 10)}...)`);
}

if (!wakeWordEnabled) {
  logWarning('WAKE_WORD_ENABLED is false');
  logInfo('Set WAKE_WORD_ENABLED=true in .env to enable wake word');
  warnings++;
} else {
  logSuccess('Wake word is enabled');
}

// 2. Code Analysis
logSection('2. Code Flow Analysis');

if (!existsSync(bridgePath)) {
  logError('cartesia-audio-bridge.js not found');
  errors++;
} else {
  logSuccess('cartesia-audio-bridge.js found');
  
  const bridgeCode = readFileSync(bridgePath, 'utf8');
  
  // Check for _onWakeWordDetected method
  if (bridgeCode.includes('async _onWakeWordDetected')) {
    logSuccess('_onWakeWordDetected() method found');
    
    // Extract the method to analyze - use a more robust pattern
    // Match from async _onWakeWordDetected to the closing brace at the same indentation level
    const methodStart = bridgeCode.indexOf('async _onWakeWordDetected(');
    if (methodStart !== -1) {
      // Find the opening brace
      const braceStart = bridgeCode.indexOf('{', methodStart);
      if (braceStart !== -1) {
        // Find matching closing brace by counting braces
        let braceCount = 0;
        let methodEnd = braceStart;
        for (let i = braceStart; i < bridgeCode.length; i++) {
          if (bridgeCode[i] === '{') braceCount++;
          if (bridgeCode[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              methodEnd = i + 1;
              break;
            }
          }
        }
        const methodCode = bridgeCode.substring(methodStart, methodEnd);
        
        // Check for cooldown check
      if (methodCode.includes('_lastWakeWordDetectionTime') && methodCode.includes('_wakeWordCooldownMs')) {
        logSuccess('Cooldown check implemented');
      } else {
        logWarning('Cooldown check may be missing');
        warnings++;
      }
      
      // Check for STT activation
      if (methodCode.includes('_sttActive = true') || methodCode.includes('_sttActive=true') || methodCode.includes('this._sttActive = true')) {
        logSuccess('STT activation flag set');
      } else {
        logWarning('STT activation flag may not be set');
        warnings++;
      }
      
      // Check for pre-speech buffer flush
      if (methodCode.includes('_flushPreSpeechBuffer()') || methodCode.includes('this._flushPreSpeechBuffer()')) {
        logSuccess('Pre-speech buffer flush called');
      } else {
        logError('Pre-speech buffer flush not found in _onWakeWordDetected');
        errors++;
      }
      
      // Check for STT streaming
      if (methodCode.includes('_sttStreaming = true') || methodCode.includes('_sttStreaming=true') || methodCode.includes('this._sttStreaming = true')) {
        logSuccess('STT streaming flag set');
      } else {
        logWarning('STT streaming flag may not be set');
        warnings++;
      }
      
      // Check for wake word disabling
      if (methodCode.includes('wakeWordManager') && (methodCode.includes('setEnabled(false)') || methodCode.includes('.setEnabled(false)') || methodCode.includes('this.wakeWordManager.setEnabled(false)'))) {
        logSuccess('Wake word disabling implemented');
      } else {
        logWarning('Wake word disabling may be missing');
        warnings++;
      }
      
      // Check for WebSocket connection check
      if (methodCode.includes('sttWs') && methodCode.includes('readyState')) {
        logSuccess('STT WebSocket connection check found');
      } else {
        logWarning('STT WebSocket connection check may be missing');
        warnings++;
      }
      
      // Check for audio graph setup
      if (methodCode.includes('sttNode') || methodCode.includes('audio graph')) {
        logSuccess('Audio graph setup check found');
      } else {
        logWarning('Audio graph setup check may be missing');
        warnings++;
      }
      
      // Check for VAD check
      if (methodCode.includes('vad') || methodCode.includes('VAD')) {
        logSuccess('VAD check found');
      } else {
        logWarning('VAD check may be missing');
        warnings++;
        }
      } else {
        logWarning('Could not extract full _onWakeWordDetected method code');
        warnings++;
      }
    } else {
      logError('_onWakeWordDetected() method not found');
      errors++;
    }
  } else {
    logError('_onWakeWordDetected() method not found');
    errors++;
  }
  
  // Check for _flushPreSpeechBuffer method
  if (bridgeCode.includes('_flushPreSpeechBuffer()')) {
    logSuccess('_flushPreSpeechBuffer() method found');
    
    // Extract _flushPreSpeechBuffer method more robustly
    // Look for the method definition, not just any call to it
    // Method definition pattern: _flushPreSpeechBuffer() { (not inside another method)
    let flushStart = -1;
    const matches = bridgeCode.matchAll(/^\s*_flushPreSpeechBuffer\(\)\s*\{/gm);
    for (const match of matches) {
      // Check if this is a method definition (not inside a callback)
      const beforeMatch = bridgeCode.substring(Math.max(0, match.index - 50), match.index);
      // Method definition should not be preceded by . or this. or inside a callback
      if (!beforeMatch.includes('this._flushPreSpeechBuffer') && 
          !beforeMatch.includes('._flushPreSpeechBuffer') &&
          !beforeMatch.includes('onSpeechStart') &&
          !beforeMatch.includes('callback')) {
        flushStart = match.index;
        break;
      }
    }
    
    // Fallback to simple indexOf if pattern matching didn't work
    if (flushStart === -1) {
      // Look for method definition pattern: _flushPreSpeechBuffer() {
      flushStart = bridgeCode.indexOf('_flushPreSpeechBuffer() {');
      // If not found, try without space
      if (flushStart === -1) {
        flushStart = bridgeCode.indexOf('_flushPreSpeechBuffer(){');
      }
    }
    
    if (flushStart !== -1) {
      const flushBraceStart = bridgeCode.indexOf('{', flushStart);
      if (flushBraceStart !== -1) {
        let braceCount = 0;
        let flushEnd = flushBraceStart;
        for (let i = flushBraceStart; i < bridgeCode.length; i++) {
          if (bridgeCode[i] === '{') braceCount++;
          if (bridgeCode[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              flushEnd = i + 1;
              break;
            }
          }
        }
        const flushCode = bridgeCode.substring(flushStart, flushEnd);
        
        if (flushCode.includes('_preSpeechBuffer')) {
          logSuccess('Pre-speech buffer accessed');
        }
        
        if (flushCode.includes('_sendChunkToSTT') || flushCode.includes('this._sendChunkToSTT') || flushCode.includes('_sendChunkToSTT(')) {
          logSuccess('Buffer chunks sent to STT');
        } else {
          logError('Buffer chunks not sent to STT');
          logInfo(`Debug: Flush code snippet: ${flushCode.substring(0, 200)}...`);
          errors++;
        }
        
        if (flushCode.includes('_preSpeechBuffer = []') || flushCode.includes('this._preSpeechBuffer = []') || flushCode.includes('_preSpeechBuffer.length = 0')) {
          logSuccess('Pre-speech buffer cleared after flush');
        } else {
          logWarning('Pre-speech buffer may not be cleared');
          warnings++;
        }
      }
    }
  } else {
    logError('_flushPreSpeechBuffer() method not found');
    errors++;
  }
  
  // Check for pre-setup in initialization
  if (bridgeCode.includes('connectSTTWebSocket()') && bridgeCode.includes('_initWakeWordInternal')) {
    logSuccess('STT WebSocket pre-connection found in wake word init');
  } else {
    logWarning('STT WebSocket may not be pre-connected');
    warnings++;
  }
  
  if (bridgeCode.includes('sttNode') && bridgeCode.includes('_initWakeWordInternal')) {
    logSuccess('STT audio graph pre-setup found in wake word init');
  } else {
    logWarning('STT audio graph may not be pre-setup');
    warnings++;
  }
  
  if (bridgeCode.includes('vad') && bridgeCode.includes('_initWakeWordInternal') && bridgeCode.includes('MicVAD')) {
    logSuccess('VAD pre-start found in wake word init');
  } else {
    logWarning('VAD may not be pre-started');
    warnings++;
  }
}

// 3. Flow Verification
logSection('3. Activation Flow Verification');

logInfo('Expected flow when wake word is detected:');
logStep(1, 'Wake word detected by Porcupine');
logStep(2, 'Check cooldown period (prevent re-triggering within 3s)');
logStep(3, 'Set _wakeWordActive = true');
logStep(4, 'Call onWakeWordDetected callback (update UI)');
logStep(5, 'Ensure STT WebSocket is connected (should be pre-connected)');
logStep(6, 'Ensure STT audio graph is setup (should be pre-setup)');
logStep(7, 'Ensure VAD is started (should be pre-started)');
logStep(8, 'Set _sttActive = true');
logStep(9, 'Flush _preSpeechBuffer (send buffered audio to STT)');
logStep(10, 'Set _sttStreaming = true (start streaming to Cartesia STT API)');
logStep(11, 'Disable wake word (prevent re-triggering during STT)');

// 4. Browser Test Instructions
logSection('4. Browser Test Instructions');

logInfo('To test the activation flow in the browser:');
logInfo('  1. Start dev server: npm run dev');
logInfo('  2. Open: http://localhost:3000/debug/wake-word-activation-test.html');
logInfo('  3. Click "Initialize Bridge"');
logInfo('  4. Click "Start Wake Word"');
logInfo('  5. Say your wake word ("Jarvis") or click "Simulate Detection"');
logInfo('  6. Observe the flow diagram and metrics');
logInfo('  7. Check the debug logs for detailed information');
logInfo('  8. Click "Run Full Test" for automated testing');

// 5. Summary
logSection('Summary');

if (errors === 0 && warnings === 0) {
  logSuccess('All checks passed! The activation flow appears to be properly implemented.');
  logInfo('\nNext steps:');
  logInfo('  • Test in browser using the debug tool');
  logInfo('  • Monitor console logs during wake word detection');
  logInfo('  • Verify pre-speech buffer is flushed correctly');
  logInfo('  • Confirm wake word is disabled during STT');
  process.exit(0);
} else {
  if (errors > 0) {
    logError(`${errors} error(s) found - please review and fix`);
  }
  if (warnings > 0) {
    logWarning(`${warnings} warning(s) - review recommended`);
  }
  
  logInfo('\nNext steps:');
  if (errors > 0) {
    logInfo('  • Fix the errors listed above');
  }
  logInfo('  • Review warnings and verify implementation');
  logInfo('  • Test in browser after fixing issues');
  
  process.exit(errors > 0 ? 1 : 0);
}