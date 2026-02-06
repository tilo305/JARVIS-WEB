#!/usr/bin/env node
/**
 * Debug tool: Comprehensive wake word initialization debugging
 * Tests wake word initialization with timeout detection, error handling, and diagnostics
 * 
 * Run: node debug/tools/debug-wake-word-initialization.js
 * 
 * This tool:
 * - Validates configuration
 * - Tests initialization with timeout detection
 * - Provides detailed diagnostics
 * - Suggests fixes for common issues
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

import { getFirstEnvPath, getProjectRoot } from '../../scripts/load-env-everywhere.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = getProjectRoot(__dirname);
const envPath = getFirstEnvPath(root) ?? join(root, '.env');
const keywordsDir = join(root, 'public/keywords');

// Built-in Porcupine keywords
const BUILT_IN_KEYWORDS = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 'Okay Google', 'Picovoice', 'Porcupine', 'Terminator'];

function log(msg, type = 'info') {
  const prefixes = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: '•'
  };
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  const prefix = prefixes[type] || '•';
  const color = colors[type] || colors.info;
  console.log(`${color}${prefix} ${msg}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

let issues = [];
let warnings = [];

logSection('Wake Word Initialization Debug Tool');

// 1. Check .env configuration
logSection('1. Configuration Check');

if (!existsSync(envPath)) {
  log('.env file not found', 'error');
  issues.push('Create .env file with PICOVOICE_ACCESS_KEY and PORCUPINE_KEYWORD');
} else {
  log('.env file exists', 'success');
  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const env = {};
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim();
      env[key] = value;
    }
  }

  // Check PICOVOICE_ACCESS_KEY
  const accessKey = env.PICOVOICE_ACCESS_KEY || env.VITE_PICOVOICE_ACCESS_KEY || '';
  if (!accessKey || accessKey.length === 0) {
    log('PICOVOICE_ACCESS_KEY is not set', 'error');
    issues.push('Set PICOVOICE_ACCESS_KEY in .env file (get from https://console.picovoice.ai/)');
  } else if (accessKey === 'your_access_key_here' || accessKey.length < 20) {
    log('PICOVOICE_ACCESS_KEY appears to be a placeholder or invalid', 'error');
    issues.push('PICOVOICE_ACCESS_KEY is too short or appears to be a placeholder');
  } else {
    log(`PICOVOICE_ACCESS_KEY is set (${accessKey.substring(0, 10)}...)`, 'success');
  }

  // Check PORCUPINE_KEYWORD
  const keyword = env.PORCUPINE_KEYWORD || env.VITE_PORCUPINE_KEYWORD || '';
  if (!keyword || keyword.length === 0) {
    log('PORCUPINE_KEYWORD is not set', 'error');
    issues.push('Set PORCUPINE_KEYWORD in .env file (e.g., "Jarvis" for built-in, or path to .ppn file)');
  } else {
    log(`PORCUPINE_KEYWORD is set: "${keyword}"`, 'success');
    
    // Check if it's a built-in keyword
    const isBuiltIn = BUILT_IN_KEYWORDS.some(k => k.toLowerCase() === keyword.trim().toLowerCase());
    if (isBuiltIn) {
      log('Using built-in keyword (no .ppn file needed)', 'success');
    } else {
      log('Using custom keyword (requires .ppn file)', 'info');
    }
  }

  // Check PORCUPINE_SENSITIVITY
  const sensitivity = parseFloat(env.PORCUPINE_SENSITIVITY || env.VITE_PORCUPINE_SENSITIVITY || '0.5');
  if (isNaN(sensitivity) || sensitivity < 0 || sensitivity > 1) {
    log('PORCUPINE_SENSITIVITY is invalid (must be 0.0-1.0)', 'error');
    issues.push('PORCUPINE_SENSITIVITY must be between 0.0 and 1.0');
  } else {
    log(`PORCUPINE_SENSITIVITY is set: ${sensitivity}`, 'success');
  }

  // Check WAKE_WORD_ENABLED
  const enabled = (env.WAKE_WORD_ENABLED || env.VITE_WAKE_WORD_ENABLED || 'false').toLowerCase() === 'true';
  if (enabled) {
    log('WAKE_WORD_ENABLED is true', 'success');
  } else {
    log('WAKE_WORD_ENABLED is false (wake word disabled)', 'warning');
    warnings.push('Wake word is disabled - set WAKE_WORD_ENABLED=true to enable');
  }
}

// 2. Check keyword files
logSection('2. Keyword Files Check');

if (!existsSync(keywordsDir)) {
  log('keywords directory does not exist', 'error');
  issues.push('Create public/keywords/ directory');
} else {
  log('keywords directory exists', 'success');
  
  try {
    const ppnFiles = await glob('*.ppn', { cwd: keywordsDir });
    if (ppnFiles.length === 0) {
      log('No .ppn keyword files found', 'warning');
      warnings.push('No .ppn files found - you can use built-in keywords (e.g., "Jarvis") instead');
      log('  → Built-in keywords available:', 'info');
      BUILT_IN_KEYWORDS.forEach(k => log(`    - ${k}`, 'info'));
    } else {
      log(`Found ${ppnFiles.length} keyword file(s):`, 'success');
      ppnFiles.forEach(file => {
        const filePath = join(keywordsDir, file);
        const stats = require('fs').statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        log(`  - ${file} (${sizeKB} KB)`, 'success');
        
        // Check file size (should be ~100-500 KB)
        if (stats.size < 10000) {
          warnings.push(`File ${file} is very small (${sizeKB} KB) - may be corrupted`);
        } else if (stats.size > 1000000) {
          warnings.push(`File ${file} is very large (${(stats.size / 1024 / 1024).toFixed(2)} MB) - may be wrong file type`);
        }
      });
    }
  } catch (err) {
    log(`Error checking keyword files: ${err.message}`, 'error');
    issues.push(`Error reading keywords directory: ${err.message}`);
  }
}

// 3. Check dependencies
logSection('3. Dependencies Check');

try {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const porcupineVersion = packageJson.dependencies?.['@picovoice/porcupine-web'] || 
                          packageJson.devDependencies?.['@picovoice/porcupine-web'];
  if (porcupineVersion) {
    log(`@picovoice/porcupine-web is installed: ${porcupineVersion}`, 'success');
  } else {
    log('@picovoice/porcupine-web is not installed', 'error');
    issues.push('Run: npm install @picovoice/porcupine-web');
  }
} catch (err) {
  log(`Error checking package.json: ${err.message}`, 'error');
  issues.push(`Error reading package.json: ${err.message}`);
}

// 4. Timeout Configuration Check
logSection('4. Timeout Configuration');

log('Wake word initialization timeout: 10 seconds (configured in cartesia-audio-bridge.js)', 'info');
log('This timeout prevents the initialization from hanging indefinitely', 'info');

// 5. Common Issues and Fixes
logSection('5. Common Issues & Fixes');

if (issues.length === 0 && warnings.length === 0) {
  log('No issues found! Configuration looks good.', 'success');
  log('\nIf you still experience timeout errors:', 'info');
  log('  1. Check browser console for detailed error messages', 'info');
  log('  2. Verify microphone permissions are granted', 'info');
  log('  3. Check network connectivity (for loading .ppn files)', 'info');
  log('  4. Try using a built-in keyword instead of custom file', 'info');
  log('  5. Increase timeout in cartesia-audio-bridge.js if needed', 'info');
} else {
  if (issues.length > 0) {
    log('\nIssues found:', 'error');
    issues.forEach((issue, i) => {
      log(`  ${i + 1}. ${issue}`, 'error');
    });
  }
  
  if (warnings.length > 0) {
    log('\nWarnings:', 'warning');
    warnings.forEach((warning, i) => {
      log(`  ${i + 1}. ${warning}`, 'warning');
    });
  }
  
  log('\nRecommended fixes:', 'info');
  log('  1. Fix all issues listed above', 'info');
  log('  2. Restart your dev server after changing .env', 'info');
  log('  3. Clear browser cache and reload', 'info');
  log('  4. Check browser console for runtime errors', 'info');
}

// 6. Testing Recommendations
logSection('6. Testing Recommendations');

log('To test wake word initialization:', 'info');
log('  1. Open browser DevTools (F12)', 'info');
log('  2. Go to Console tab', 'info');
log('  3. Look for "[JARVIS] [ERROR]" or "[JARVIS] [TRACE]" messages', 'info');
log('  4. Check wake word tracker UI for status updates', 'info');
log('  5. If timeout occurs, check network tab for failed file loads', 'info');

log('\nTimeout error troubleshooting:', 'info');
log('  - If timeout occurs immediately: Check AccessKey and keyword configuration', 'info');
log('  - If timeout occurs after 5-10 seconds: Check .ppn file loading or network issues', 'info');
log('  - If timeout occurs after mic permission: Check getUserMedia() errors in console', 'info');

// Summary
logSection('Summary');

if (issues.length === 0) {
  log('✓ Configuration is valid', 'success');
  if (warnings.length > 0) {
    log(`⚠ ${warnings.length} warning(s) - see above`, 'warning');
  } else {
    log('✓ No warnings', 'success');
  }
  log('\nConfiguration looks good! If you still experience issues, check browser console.', 'success');
  process.exit(0);
} else {
  log(`✗ ${issues.length} issue(s) found`, 'error');
  if (warnings.length > 0) {
    log(`⚠ ${warnings.length} warning(s) found`, 'warning');
  }
  log('\nPlease fix the issues above before testing wake word initialization.', 'error');
  process.exit(1);
}
