#!/usr/bin/env node
/**
 * LIVE diagnostic: POST to n8n webhook (same payload as app) and report 404 vs 200.
 * Use when you see "HTTP 404: Not Found" from JARVIS. See debug/N8N-WEBHOOK-404-FIX.md.
 *
 * Loads URL from .env at project root (N8N_WEBHOOK_URL or VITE_N8N_WEBHOOK_URL).
 *
 * Usage: node debug/tools/n8n-webhook-live.mjs [message]
 * Example: node debug/tools/n8n-webhook-live.mjs "Hello"
 */
import { loadEnvEverywhere, getProjectRoot } from '../../scripts/load-env-everywhere.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = getProjectRoot(__dirname);
loadEnvEverywhere(projectRoot);

const message = process.argv[2] || 'Hello from JARVIS debug live';
const url =
  process.env.VITE_N8N_WEBHOOK_URL ||
  process.env.N8N_WEBHOOK_URL ||
  'https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96';

const payload = {
  message,
  query: message,
  input: message,
  session_id: 'sess_live_' + Date.now(),
  sessionId: 'sess_live_' + Date.now(),
  timestamp: new Date().toISOString(),
  timezone: 'UTC',
  location: 'UTC',
  message_id: 'msg_live_' + Date.now(),
  messageId: 'msg_live_' + Date.now(),
  source: 'text',
  attachments: [],
};

console.log('[n8n-webhook-live] URL:', url);
console.log('[n8n-webhook-live] Message:', message);
console.log('');

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

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

  if (res.status === 404) {
    console.error('[n8n-webhook-live] Status: 404 Not Found');
    console.error('[n8n-webhook-live] Webhook not registered. Fix:');
    console.error('  1. Use production URL: /webhook/... not /webhook-test/...');
    console.error('  2. In n8n: open the workflow → turn it ON (Active).');
    console.error('  3. Copy the Production webhook URL from the Webhook node into .env.');
    console.error('');
    console.error('See debug/N8N-WEBHOOK-404-FIX.md for full checklist.');
    process.exit(1);
  }

  if (!res.ok) {
    console.error('[n8n-webhook-live] Status:', res.status, res.statusText);
    console.error('[n8n-webhook-live] Response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

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
  console.log('[n8n-webhook-live] Status: 200 OK');
  console.log('[n8n-webhook-live] Reply:', reply != null ? String(reply).slice(0, 120) + (String(reply).length > 120 ? '…' : '') : '(no reply key)');
  console.log('[n8n-webhook-live] Webhook is reachable. If the app still fails, see debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
} catch (err) {
  console.error('[n8n-webhook-live] Network error:', err.message);
  if (err.cause) console.error('  Cause:', err.cause.message);
  console.error('  Check: n8n server reachable, DNS, firewall.');
  process.exit(1);
}
