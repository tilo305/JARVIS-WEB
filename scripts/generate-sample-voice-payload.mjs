#!/usr/bin/env node
/**
 * Generates a sample voice payload matching the exact format the JARVIS frontend
 * sends to the n8n webhook. Use for testing your n8n workflow.
 *
 * Output:
 *   - samples/sample-voice.pcm     Raw PCM (16kHz, mono, s16le)
 *   - samples/sample-voice-payload.json  Full JSON payload ready to POST
 *
 * Run: node scripts/generate-sample-voice-payload.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = join(__dirname, '..', 'samples');

// Cartesia STT format (matches frontend)
const SAMPLE_RATE = 16000;
const DURATION_SEC = 2;
const SAMPLE_COUNT = SAMPLE_RATE * DURATION_SEC;

/**
 * Generate PCM s16le audio: 16kHz, mono, signed 16-bit little-endian.
 * Creates a 440Hz tone (audible) so you can verify playback.
 */
function generatePcmAudio() {
  const buffer = Buffer.alloc(SAMPLE_COUNT * 2); // 2 bytes per sample
  const freq = 440;
  const amplitude = 8000; // ~25% of max to avoid clipping

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / SAMPLE_RATE;
    const sample = Math.round(amplitude * Math.sin(2 * Math.PI * freq * t));
    const clamped = Math.max(-32768, Math.min(32767, sample));
    buffer.writeInt16LE(clamped, i * 2);
  }
  return buffer;
}

/**
 * Build payload matching public/js/n8n-payload.js buildN8nPayload + app.js voice flow.
 */
function buildVoicePayload(message, audioBase64) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const now = new Date().toISOString();

  const attachments = audioBase64
    ? [
        {
          name: 'voice-recording.pcm',
          type: 'audio/pcm',
          size: Math.floor((audioBase64.length * 3) / 4),
          data: audioBase64,
        },
      ]
    : [];

  return {
    message,
    query: message,
    input: message,
    session_id: sessionId,
    sessionId,
    timestamp: now,
    timezone: 'UTC',
    location: 'UTC',
    message_id: messageId,
    messageId,
    source: 'voice',
    attachments,
    locale: 'en-US',
    language: 'en',
  };
}

function main() {
  if (!existsSync(SAMPLES_DIR)) mkdirSync(SAMPLES_DIR, { recursive: true });

  const pcmBuffer = generatePcmAudio();
  const audioBase64 = pcmBuffer.toString('base64');
  const message = "That's thing one, two.";

  const payload = buildVoicePayload(message, audioBase64);

  const pcmPath = join(SAMPLES_DIR, 'sample-voice.pcm');
  const jsonPath = join(SAMPLES_DIR, 'sample-voice-payload.json');

  writeFileSync(pcmPath, pcmBuffer);
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('Generated sample voice payload:');
  console.log(`  ${pcmPath}`);
  console.log(`  ${jsonPath}`);
  console.log('');
  console.log('Format: PCM s16le, 16kHz, mono');
  console.log(`Duration: ${DURATION_SEC}s (${SAMPLE_COUNT} samples, ${pcmBuffer.length} bytes)`);
  console.log(`Message: "${message}"`);
  console.log('');
  console.log('To test your n8n webhook:');
  console.log(`  curl -X POST -H "Content-Type: application/json" -d @${jsonPath} YOUR_WEBHOOK_URL`);
}

main();
