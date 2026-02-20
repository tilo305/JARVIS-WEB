#!/usr/bin/env node
/**
 * Test n8n webhook with the exact payload shape the frontend sends.
 * Loads URL from .env (VITE_N8N_WEBHOOK_URL or N8N_WEBHOOK_URL).
 *
 * Usage: node scripts/test-n8n-webhook.mjs [message]
 * Example: node scripts/test-n8n-webhook.mjs "Hello"
 */
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';

loadEnvEverywhere(getProjectRoot());

const message = process.argv[2] || 'Hello from JARVIS test script';
const url =
  process.env.VITE_N8N_WEBHOOK_URL ||
  process.env.N8N_WEBHOOK_URL ||
  'https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96';

/** Same payload shape as buildN8nPayload (minimal required + optional) */
const payload = {
  message,
  query: message,
  input: message,
  session_id: 'sess_test_' + Date.now(),
  sessionId: 'sess_test_' + Date.now(),
  timestamp: new Date().toISOString(),
  timezone: 'UTC',
  location: 'UTC',
  message_id: 'msg_test_' + Date.now(),
  messageId: 'msg_test_' + Date.now(),
  source: 'voice',
  attachments: [],
};

console.log('[test-n8n-webhook] URL:', url);
console.log('[test-n8n-webhook] Payload:', JSON.stringify(payload, null, 2));
console.log('');

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('[test-n8n-webhook] Status:', res.status, res.statusText);

  const contentType = res.headers.get('content-type') || '';
  let data = {};
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => '');
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { output: text.trim() };
      }
    }
  }

  if (res.ok) {
    const reply =
      data.output ??
      data.reply ??
      data.result ??
      data.text ??
      data.message ??
      data.response ??
      data.answer ??
      data.content ??
      data.body;
    console.log('[test-n8n-webhook] Reply:', reply || '(no reply key found)');
    console.log('[test-n8n-webhook] Full response:', JSON.stringify(data, null, 2));
  } else {
    console.error('[test-n8n-webhook] Error response:', JSON.stringify(data, null, 2));
    if (res.status === 404) {
      console.error('');
      console.error('404 = Webhook not found. Check:');
      console.error('  1. Use /webhook/... not /webhook-test/...');
      console.error('  2. Workflow is activated in n8n');
      console.error('  3. Webhook URL in .env matches the workflow');
    }
    process.exit(1);
  }
} catch (err) {
  console.error('[test-n8n-webhook] Network error:', err.message);
  if (err.cause) console.error('  Cause:', err.cause.message);
  process.exit(1);
}
