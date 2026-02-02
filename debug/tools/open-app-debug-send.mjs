#!/usr/bin/env node
/**
 * Debug tool: Open the web app with ?debug=1, then send a test message from the browser console
 * and check for a valid n8n response. If no reply, suggests fixes (URL, CORS, workflow).
 *
 * 1. Runs a Node fetch to the n8n webhook and reports (same as check-n8n-webhook).
 * 2. Opens the app at APP_URL/?debug=1 in the default browser.
 * 3. Tells you to run JARVIS_DEBUG_SEND_TEST() in the browser console to send the message
 *    and see the response (catches CORS / wrong URL in browser).
 *
 * Run: node debug/tools/open-app-debug-send.mjs
 * Env: APP_URL (default http://localhost:3000), VITE_N8N_WEBHOOK_URL or N8N_WEBHOOK_URL
 * @see zEn DeBuGgEr.md, debug/N8N-RESPOND-TO-WEBHOOK-FIX.md
 */

import { exec } from 'child_process';

const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_WEBHOOK_URL = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
const PRODUCTION_WEBHOOK_URL = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
const FETCH_TIMEOUT_MS = 15000;

const N8N_REPLY_KEYS = ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content'];

function extractReplyFromJson(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of N8N_REPLY_KEYS) {
    const v = data[key];
    if (typeof v === 'string') return v;
  }
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return extractReplyFromJson(first);
  }
  for (const v of Object.values(data)) {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = extractReplyFromJson(v);
      if (nested) return nested;
    }
  }
  return null;
}

async function getWebhookUrlResolved() {
  if (process.env.VITE_N8N_WEBHOOK_URL) return process.env.VITE_N8N_WEBHOOK_URL;
  if (process.env.N8N_WEBHOOK_URL) return process.env.N8N_WEBHOOK_URL;
  try {
    const { N8N_WEBHOOK_URL } = await import('../../dist/config.js');
    return N8N_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  } catch {
    return DEFAULT_WEBHOOK_URL;
  }
}

function buildPayload(message, sessionId) {
  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  let timezone = 'UTC';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
    }
  } catch {
    /* ignore */
  }
  return {
    message: (message || '').trim(),
    session_id: sessionId,
    sessionId,
    timestamp: now,
    timezone,
    location: timezone,
    message_id: messageId,
    messageId: messageId,
    source: 'text',
    attachments: [],
  };
}

function openBrowser(url) {
  const escaped = url.replace(/"/g, '\\"');
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${escaped}"`
        : `xdg-open "${escaped}"`;
  exec(cmd, (err) => {
    if (err) console.warn('[DEBUG] Could not open browser:', err.message);
  });
}

async function nodeFetchTest(webhookUrl) {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const payload = buildPayload('Hello from JARVIS debug', sessionId);
  console.log('[DEBUG] Node fetch: POST', webhookUrl);
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(to));
    const data = await res.json().catch(() => ({}));
    const reply = extractReplyFromJson(data);
    return { ok: res.ok, status: res.status, data, reply };
  } catch (err) {
    return { ok: false, status: null, data: {}, reply: null, error: err.message };
  }
}

function suggestFixes(webhookUrl, nodeResult) {
  const fixes = [];
  if (webhookUrl.includes('webhook-test')) {
    fixes.push(`Use production URL, not test: ${PRODUCTION_WEBHOOK_URL}`);
  }
  if (nodeResult.status === 404) {
    fixes.push('n8n workflow is inactive. Activate the workflow in n8n.');
  }
  if (nodeResult.ok && !nodeResult.reply) {
    fixes.push('Respond to Webhook node must send JSON with key: output, reply, result, text, or message. See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
  }
  if (nodeResult.error) {
    fixes.push('Network/CORS: Ensure webhook URL is reachable. In browser, run JARVIS_DEBUG_SEND_TEST() to see CORS errors.');
  }
  return fixes;
}

async function main() {
  const appUrl = process.env.APP_URL || DEFAULT_APP_URL;
  const debugUrl = appUrl.replace(/\?.*$/, '').replace(/\/$/, '') + '/?debug=1';

  const webhookUrl = await getWebhookUrlResolved();
  console.log('[DEBUG] App URL (with debug):', debugUrl);
  console.log('[DEBUG] Webhook URL:', webhookUrl);

  if (webhookUrl.includes('webhook-test')) {
    console.warn('[DEBUG] WARNING: Using webhook-test URL. Use production URL for chat to work:');
    console.warn('[DEBUG]   ', PRODUCTION_WEBHOOK_URL);
  }

  const nodeResult = await nodeFetchTest(webhookUrl);
  console.log('[DEBUG] Node fetch result: status', nodeResult.status, nodeResult.reply ? 'reply OK' : 'no reply');
  if (nodeResult.reply) {
    console.log('[DEBUG] Reply:', nodeResult.reply.slice(0, 80) + (nodeResult.reply.length > 80 ? '…' : ''));
  } else if (Object.keys(nodeResult.data || {}).length > 0) {
    console.log('[DEBUG] Response body:', JSON.stringify(nodeResult.data).slice(0, 200) + '…');
  }
  if (nodeResult.error) {
    console.error('[DEBUG] Node fetch error:', nodeResult.error);
  }

  const fixes = suggestFixes(webhookUrl, nodeResult);
  if (fixes.length) {
    console.log('[DEBUG] Fixes:');
    fixes.forEach((f) => console.log('[DEBUG]  -', f));
  }

  console.log('');
  console.log('[DEBUG] Opening app in browser with ?debug=1...');
  openBrowser(debugUrl);

  console.log('');
  console.log('--- In the browser console, run: ---');
  console.log('  JARVIS_DEBUG_SEND_TEST()');
  console.log('');
  console.log('This sends a test message to n8n and logs whether a reply was received.');
  console.log('If you see "No reply" or errors, check the fixes above and debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
  console.log('');
}

main().catch((err) => {
  console.error('[DEBUG]', err);
  process.exit(1);
});
