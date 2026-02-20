#!/usr/bin/env node
/**
 * Generates a Postman collection for testing the n8n webhook with the JARVIS voice payload.
 * Import the output file into Postman: File → Import → select the generated file.
 *
 * Run: node scripts/generate-postman-collection.mjs
 * Output: samples/postman-n8n-voice-test.postman_collection.json
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = join(__dirname, '..', 'samples');
const SAMPLE_PAYLOAD_PATH = join(SAMPLES_DIR, 'sample-voice-payload.json');
const DEFAULT_WEBHOOK = 'https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96';

// Generate sample payload first if missing
if (!existsSync(SAMPLE_PAYLOAD_PATH)) {
  const { execSync } = await import('node:child_process');
  execSync(`node "${join(__dirname, 'generate-sample-voice-payload.mjs')}"`, { stdio: 'inherit' });
}

const payload = JSON.parse(readFileSync(SAMPLE_PAYLOAD_PATH, 'utf8'));

const collection = {
  info: {
    name: 'JARVIS n8n Webhook Test',
    description: 'Test the JARVIS voice payload against your n8n webhook. Uses the exact payload the frontend sends.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Voice payload (JARVIS → n8n)',
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json', type: 'text' },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(payload, null, 2),
        },
        url: '{{webhook_url}}',
        description: 'POST the exact voice payload JARVIS sends: message, session_id, attachments (base64 PCM), etc.',
      },
    },
  ],
  variable: [
    { key: 'webhook_url', value: DEFAULT_WEBHOOK },
  ],
};

const outPath = join(SAMPLES_DIR, 'postman-n8n-voice-test.postman_collection.json');
writeFileSync(outPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Postman collection saved: ${outPath}`);
console.log('Import into Postman: File → Import → select this file');
console.log(`Default webhook URL: ${DEFAULT_WEBHOOK} (edit collection variable "webhook_url" to change)`);
