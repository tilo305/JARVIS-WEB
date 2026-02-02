#!/usr/bin/env node
/**
 * LIVE debug tool: Validate all config (Cartesia + n8n)
 * Run: node debug/tools/validate-config.js
 * @see zEn DeBuGgEr.md
 */
import { CARTESIA_CONFIG, N8N_WEBHOOK_URL } from '../../dist/config.js';

const errors = [];

if (!CARTESIA_CONFIG.API_KEY || CARTESIA_CONFIG.API_KEY.length < 10) {
  errors.push('CARTESIA_CONFIG.API_KEY missing or invalid');
}
if (!CARTESIA_CONFIG.VOICE_ID || !/^[a-f0-9-]{36}$/.test(CARTESIA_CONFIG.VOICE_ID)) {
  errors.push('CARTESIA_CONFIG.VOICE_ID missing or invalid UUID');
}
if (!CARTESIA_CONFIG.TTS?.ENDPOINT?.startsWith('wss://')) {
  errors.push('CARTESIA_CONFIG.TTS.ENDPOINT invalid');
}
if (!CARTESIA_CONFIG.STT?.ENDPOINT?.startsWith('wss://')) {
  errors.push('CARTESIA_CONFIG.STT.ENDPOINT invalid');
}
if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_URL.startsWith('https://')) {
  errors.push('N8N_WEBHOOK_URL missing or invalid');
}
if (!/^https:\/\/.+\/webhook\/[a-f0-9-]+$/.test(N8N_WEBHOOK_URL)) {
  errors.push('N8N_WEBHOOK_URL format unexpected (expected https://.../webhook/UUID)');
}

if (errors.length) {
  console.error('[DEBUG] Config validation FAILED:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log('[DEBUG] Config validation OK');
console.log('  - API_KEY:', CARTESIA_CONFIG.API_KEY.slice(0, 12) + '...');
console.log('  - VOICE_ID:', CARTESIA_CONFIG.VOICE_ID);
console.log('  - N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL);
process.exit(0);
