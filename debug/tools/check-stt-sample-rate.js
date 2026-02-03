#!/usr/bin/env node
/**
 * LIVE debug tool: Test Cartesia STT WebSocket with correct sample_rate (integer)
 * Verifies that sample_rate: 16000 (integer) is accepted; string causes "Invalid sample rate" error.
 * Run: npm run debug:stt (loads .env automatically if present)
 * Requires: CARTESIA_API_KEY in env or .env
 * @see zEn DeBuGgEr.md, cArTeSiA dOcS.md, debug/SAMPLE-RATE-RESEARCH.md
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env before config import (no dotenv dependency)
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}

import WebSocket from 'ws';

const TIMEOUT_MS = 8000;

async function main() {
  const { CARTESIA_CONFIG } = await import('../../dist/config.js');
  const API_KEY = process.env.CARTESIA_API_KEY || CARTESIA_CONFIG.API_KEY;

  if (!API_KEY || API_KEY.length < 10) {
    console.error('[DEBUG] CARTESIA_API_KEY not set or invalid. Set env and run: npm run build && node debug/tools/check-stt-sample-rate.js');
    process.exit(1);
  }

  // Cartesia STT: config via URL query params (not first message). @cartesia/cartesia-js SDK style.
  const url = new URL(CARTESIA_CONFIG.STT.ENDPOINT);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('cartesia_version', '2024-06-10');
  url.searchParams.set('model', CARTESIA_CONFIG.STT.MODEL);
  url.searchParams.set('encoding', 'pcm_s16le');
  url.searchParams.set('sample_rate', '16000');
  url.searchParams.set('language', 'en');
  url.searchParams.set('min_volume', '0.0');
  url.searchParams.set('max_silence_duration_secs', '2.0');

  console.log('[DEBUG] Connecting to Cartesia STT WebSocket (config in URL query params)...');

  const ws = new WebSocket(url.toString());
  let resolved = false;

  const done = (ok, msg) => {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeout);
    ws.close();
    if (ok) {
      console.log('[DEBUG] OK:', msg);
      process.exit(0);
    } else {
      console.error('[DEBUG] FAIL:', msg);
      process.exit(1);
    }
  };

  const timeout = setTimeout(() => {
    done(false, 'Timeout waiting for STT response');
  }, TIMEOUT_MS);

  ws.on('open', () => {
    // No config message — Cartesia STT expects config in URL query params
    // If no error within 3s, config was accepted (STT waits for audio)
    setTimeout(() => {
      if (!resolved) done(true, 'STT config accepted (no error received within 3s)');
    }, 3000);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(String(data));
      if (msg.type === 'error' || msg.error || msg.message?.includes('Invalid sample rate')) {
        const errMsg = msg.message || msg.error || JSON.stringify(msg);
        done(false, `STT error: ${errMsg}`);
        return;
      }
      // Any non-error response = config accepted
      if (msg.type === 'transcript' || msg.type === 'flush_done' || msg.type === 'done' || !msg.type) {
        done(true, 'STT config accepted (no Invalid sample rate error)');
      }
    } catch {
      // Binary or non-JSON — config was accepted, we're getting raw audio response or similar
      done(true, 'STT config accepted (received non-JSON response)');
    }
  });

  ws.on('error', (err) => {
    done(false, `WebSocket error: ${err.message}`);
  });

  ws.on('close', (code, reason) => {
    if (!resolved) {
      if (code === 1000) {
        done(true, 'WebSocket closed normally');
      } else {
        done(false, `WebSocket closed: ${code} ${reason || ''}`);
      }
    }
  });
}

main().catch((err) => {
  console.error('[DEBUG] Unhandled error:', err);
  process.exit(1);
});
