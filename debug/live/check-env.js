#!/usr/bin/env node
/**
 * LIVE debug: validate .env and config for JARVIS-WEB.
 * Per zEn DeBuGgEr.md — no redundant tool (Jest does not validate .env file).
 * Run from project root: node debug/live/check-env.js
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const envPath = join(root, '.env');

const requiredEnvKeys = ['CARTESIA_API_KEY', 'CARTESIA_VOICE_ID'];
const endpointPattern = /^wss?:\/\/.+/;

function log(msg, ok) {
  const prefix = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO';
  console.log(`${prefix}: ${msg}`);
}

let hasError = false;

if (!existsSync(envPath)) {
  log('.env file not found at project root', false);
  hasError = true;
} else {
  log('.env file exists', true);
  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const env = {};
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const key of requiredEnvKeys) {
    if (!env[key] || env[key].length < 2) {
      log(`.env missing or empty: ${key}`, false);
      hasError = true;
    } else {
      log(`${key} is set (length ${env[key].length})`, true);
    }
  }
}

const ttsEndpoint = 'wss://api.cartesia.ai/tts/websocket';
const sttEndpoint = 'wss://api.cartesia.ai/stt/websocket';
if (!endpointPattern.test(ttsEndpoint)) {
  log('TTS endpoint format invalid', false);
  hasError = true;
} else {
  log('TTS endpoint format valid', true);
}
if (!endpointPattern.test(sttEndpoint)) {
  log('STT endpoint format invalid', false);
  hasError = true;
} else {
  log('STT endpoint format valid', true);
}

process.exit(hasError ? 1 : 0);
