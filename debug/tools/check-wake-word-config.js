#!/usr/bin/env node
/**
 * Debug tool: Check wake word configuration
 * Validates .env file, keyword files, and configuration
 * Run: node debug/tools/check-wake-word-config.js
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const envPath = join(root, '.env');
const keywordsDir = join(root, 'public/keywords');

function log(msg, ok = true) {
  const prefix = ok ? '✓' : '✗';
  console.log(`${prefix} ${msg}`);
}

let hasError = false;
let hasWarning = false;

console.log('\n=== Wake Word Configuration Check ===\n');

// Check .env file
if (!existsSync(envPath)) {
  log('.env file not found', false);
  hasError = true;
} else {
  log('.env file exists', true);
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
    log('PICOVOICE_ACCESS_KEY is not set', false);
    hasError = true;
  } else if (accessKey === 'your_access_key_here' || accessKey.length < 20) {
    log('PICOVOICE_ACCESS_KEY appears to be a placeholder or invalid', false);
    hasError = true;
  } else {
    log(`PICOVOICE_ACCESS_KEY is set (${accessKey.substring(0, 10)}...)`, true);
  }

  // Check PORCUPINE_KEYWORD
  const keyword = env.PORCUPINE_KEYWORD || env.VITE_PORCUPINE_KEYWORD || '';
  if (!keyword || keyword.length === 0) {
    log('PORCUPINE_KEYWORD is not set', false);
    hasError = true;
  } else {
    log(`PORCUPINE_KEYWORD is set: "${keyword}"`, true);
  }

  // Check PORCUPINE_SENSITIVITY
  const sensitivity = parseFloat(env.PORCUPINE_SENSITIVITY || env.VITE_PORCUPINE_SENSITIVITY || '0.5');
  if (isNaN(sensitivity) || sensitivity < 0 || sensitivity > 1) {
    log('PORCUPINE_SENSITIVITY is invalid (must be 0.0-1.0)', false);
    hasError = true;
  } else {
    log(`PORCUPINE_SENSITIVITY is set: ${sensitivity}`, true);
  }

  // Check WAKE_WORD_ENABLED
  const enabled = (env.WAKE_WORD_ENABLED || env.VITE_WAKE_WORD_ENABLED || 'false').toLowerCase() === 'true';
  if (enabled) {
    log('WAKE_WORD_ENABLED is true', true);
  } else {
    log('WAKE_WORD_ENABLED is false (wake word disabled)', false);
    hasWarning = true;
  }

  // Check VITE_DEBUG_WAKE_WORD
  const debug = (env.DEBUG_WAKE_WORD || env.VITE_DEBUG_WAKE_WORD || 'false').toLowerCase() === 'true';
  if (debug) {
    log('VITE_DEBUG_WAKE_WORD is true (debug logging enabled)', true);
  } else {
    log('VITE_DEBUG_WAKE_WORD is false (debug logging disabled)', true);
  }
}

// Check keyword files
console.log('\n--- Keyword Files ---');
if (!existsSync(keywordsDir)) {
  log('keywords directory does not exist', false);
  hasError = true;
} else {
  log('keywords directory exists', true);
  
  try {
    const ppnFiles = await glob('*.ppn', { cwd: keywordsDir });
    if (ppnFiles.length === 0) {
      log('No .ppn keyword files found in public/keywords/', false);
      hasError = true;
      console.log('  → You need to download a .ppn file from https://console.picovoice.ai/');
      console.log('  → Place it in public/keywords/ directory');
      console.log('  → Default naming: {keyword}_en_wasm_v3_0_0.ppn');
    } else {
      log(`Found ${ppnFiles.length} keyword file(s):`, true);
      ppnFiles.forEach(file => {
        const filePath = join(keywordsDir, file);
        const stats = require('fs').statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        log(`  - ${file} (${sizeKB} KB)`, true);
      });
    }
  } catch (err) {
    log(`Error checking keyword files: ${err.message}`, false);
    hasError = true;
  }
}

// Check package.json for Porcupine
console.log('\n--- Dependencies ---');
try {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const porcupineVersion = packageJson.dependencies?.['@picovoice/porcupine-web'] || 
                          packageJson.devDependencies?.['@picovoice/porcupine-web'];
  if (porcupineVersion) {
    log(`@picovoice/porcupine-web is installed: ${porcupineVersion}`, true);
  } else {
    log('@picovoice/porcupine-web is not installed', false);
    hasError = true;
  }
} catch (err) {
  log(`Error checking package.json: ${err.message}`, false);
  hasError = true;
}

// Summary
console.log('\n=== Summary ===');
if (hasError) {
  console.log('✗ Configuration has ERRORS - wake word will not work');
  console.log('\nTo fix:');
  console.log('1. Get your Picovoice AccessKey from https://console.picovoice.ai/');
  console.log('2. Update PICOVOICE_ACCESS_KEY in .env file');
  console.log('3. Download a .ppn keyword file from Picovoice Console');
  console.log('4. Place the .ppn file in public/keywords/ directory');
  process.exit(1);
} else if (hasWarning) {
  console.log('⚠ Configuration has WARNINGS - check above');
  process.exit(0);
} else {
  console.log('✓ Configuration looks good!');
  console.log('\nNote: Make sure to restart your dev server after changing .env');
  process.exit(0);
}
