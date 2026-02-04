#!/usr/bin/env node
/**
 * Wake Word Configuration Test Tool (Terminal Only)
 * 
 * Validates wake word configuration and setup without requiring a browser.
 * 
 * Usage:
 *   npm run test:wakeword
 *   node debug/tools/test-wake-word-detection.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const envPath = join(root, '.env');

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

let errors = 0;
let warnings = 0;

logSection('Wake Word Configuration Test');

// 1. Check configuration
logSection('1. Configuration Check');

let config = {};
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim();
      config[key] = value;
    }
  }
}

const accessKey = config.PICOVOICE_ACCESS_KEY || config.VITE_PICOVOICE_ACCESS_KEY || '';
const keyword = config.PORCUPINE_KEYWORD || config.VITE_PORCUPINE_KEYWORD || 'Jarvis';
const sensitivity = parseFloat(config.PORCUPINE_SENSITIVITY || config.VITE_PORCUPINE_SENSITIVITY || '0.5');
const wakeWordEnabled = (config.WAKE_WORD_ENABLED || config.VITE_WAKE_WORD_ENABLED || 'false').toLowerCase() === 'true';

if (!accessKey || accessKey.length < 20) {
  logError('PICOVOICE_ACCESS_KEY is not set or invalid');
  logInfo('Get your AccessKey from: https://console.picovoice.ai/');
  logInfo('Add to .env: PICOVOICE_ACCESS_KEY=your_key_here');
  errors++;
} else {
  logSuccess(`AccessKey configured (${accessKey.substring(0, 10)}...)`);
}

logInfo(`Keyword: ${keyword}`);
logInfo(`Sensitivity: ${sensitivity}`);

if (isNaN(sensitivity) || sensitivity < 0 || sensitivity > 1) {
  logWarning('Sensitivity is out of range (0-1), using default 0.5');
  warnings++;
}

// Validate keyword
const builtInKeywords = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 
  'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 
  'Okay Google', 'Picovoice', 'Porcupine', 'Terminator'];

const isBuiltIn = builtInKeywords.some(k => k.toLowerCase() === keyword.toLowerCase());
if (isBuiltIn) {
  logSuccess(`Using built-in keyword: ${keyword}`);
} else {
  logWarning(`Custom keyword: ${keyword} (ensure keyword file exists)`);
  warnings++;
}

logInfo(`Wake word enabled: ${wakeWordEnabled ? 'Yes' : 'No'}`);

if (!wakeWordEnabled) {
  logWarning('Wake word is disabled in configuration');
  logInfo('Set WAKE_WORD_ENABLED=true in .env to enable');
  warnings++;
}

// 2. Check dependencies
logSection('2. Dependencies Check');

const packageJsonPath = join(root, 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const hasPorcupine = packageJson.dependencies?.['@picovoice/porcupine-web'] ||
                       packageJson.devDependencies?.['@picovoice/porcupine-web'];
  
  if (hasPorcupine) {
    logSuccess(`@picovoice/porcupine-web installed (${hasPorcupine})`);
  } else {
    logError('@picovoice/porcupine-web not found in package.json');
    logInfo('Install with: npm install @picovoice/porcupine-web');
    errors++;
  }
} else {
  logError('package.json not found');
  errors++;
}

// Check if package is actually installed
const porcupinePackagePath = join(root, 'node_modules', '@picovoice', 'porcupine-web');
if (existsSync(porcupinePackagePath)) {
  logSuccess('Porcupine package is installed in node_modules');
} else {
  logError('Porcupine package not found in node_modules');
  logInfo('Run: npm install');
  errors++;
}

// 3. Check Vite configuration
logSection('3. Vite Configuration Check');

const viteConfigPath = join(root, 'vite.config.js');
if (existsSync(viteConfigPath)) {
  const viteConfig = readFileSync(viteConfigPath, 'utf8');
  
  // Check if environment variables are exposed
  const hasViteEnv = viteConfig.includes('VITE_PICOVOICE') || 
                     viteConfig.includes('VITE_PORCUPINE') ||
                     viteConfig.includes('VITE_WAKE_WORD');
  
  if (hasViteEnv || viteConfig.includes('define:') || viteConfig.includes('envPrefix')) {
    logSuccess('Vite config appears to handle environment variables');
  } else {
    logWarning('Vite config may not expose Porcupine env vars');
    logInfo('Ensure VITE_ prefix is used for environment variables');
    warnings++;
  }
} else {
  logWarning('vite.config.js not found');
  warnings++;
}

// 4. Check wake word manager
logSection('4. Wake Word Manager Check');

const wakeWordManagerPath = join(root, 'public', 'js', 'wake-word-manager.js');
if (existsSync(wakeWordManagerPath)) {
  logSuccess('wake-word-manager.js exists');
  
  const wakeWordManagerContent = readFileSync(wakeWordManagerPath, 'utf8');
  
  // Check for correct import
  if (wakeWordManagerContent.includes('import { Porcupine }')) {
    logSuccess('Correct Porcupine import syntax found');
  } else if (wakeWordManagerContent.includes('import Porcupine from')) {
    logError('Incorrect Porcupine import syntax (should use named import)');
    errors++;
  } else {
    logWarning('Porcupine import not found in wake-word-manager.js');
    warnings++;
  }
  
  // Check for error handling
  if (wakeWordManagerContent.includes('try') && wakeWordManagerContent.includes('catch')) {
    logSuccess('Error handling found');
  } else {
    logWarning('Error handling may be missing');
    warnings++;
  }
} else {
  logWarning('wake-word-manager.js not found');
  warnings++;
}

// 5. Summary
logSection('Summary');

if (errors === 0 && warnings === 0) {
  logSuccess('All checks passed! Wake word is properly configured.');
  logInfo('\nTo test wake word detection:');
  logInfo('  1. Start dev server: npm run vite');
  logInfo('  2. Open: http://localhost:3000');
  logInfo('  3. Grant microphone permission when prompted (if not already granted)');
  logInfo('  4. Say your wake word ("' + keyword + '") - no clicking needed!');
  logInfo('  5. Wake word detection runs automatically in always-listening mode');
  logInfo('  6. Check browser console (F12) for detection logs');
  process.exit(0);
} else {
  if (errors > 0) {
    logError(`${errors} error(s) found - please fix before using wake word`);
  }
  if (warnings > 0) {
    logWarning(`${warnings} warning(s) - review recommended`);
  }
  
  logInfo('\nNext steps:');
  if (errors > 0) {
    logInfo('  • Fix the errors listed above');
  }
  logInfo('  • Ensure .env file has PICOVOICE_ACCESS_KEY set');
  logInfo('  • Run: npm install (if package is missing)');
  logInfo('  • Test in browser after fixing errors');
  
  process.exit(errors > 0 ? 1 : 0);
}
