#!/usr/bin/env node
/**
 * LIVE debug tool: Test n8n webhook connectivity
 * Sends full payload (session_id, timezone, location, etc.) — same as chat UI.
 * Run: node debug/tools/check-n8n-webhook.js
 * @see zEn DeBuGgEr.md
 */
import { N8N_WEBHOOK_URL } from '../../dist/config.js';
import { buildN8nPayload } from '../../public/js/n8n-payload.js';

const FETCH_TIMEOUT_MS = 15000;

async function main() {
  console.log('[DEBUG] Testing n8n webhook:', N8N_WEBHOOK_URL);
  const payload = buildN8nPayload('Hello from JARVIS debug', { source: 'text' });
  console.log('[DEBUG] Payload keys:', Object.keys(payload).join(', '));
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(to));
    const ok = res.ok;
    const data = await res.json().catch(() => ({}));
    console.log('[DEBUG] Status:', res.status, res.statusText);
    console.log('[DEBUG] Response:', JSON.stringify(data, null, 2));
    if (res.status === 404) {
      console.warn('[DEBUG] 404 = Workflow inactive. Activate the n8n workflow to receive replies.');
      process.exit(0);
    }
    if (!ok) {
      console.error('[DEBUG] FAIL: Webhook returned non-2xx');
      process.exit(1);
    }
    const reply = data?.output ?? data?.reply ?? data?.result ?? data?.text ?? data?.message;
    if (typeof reply === 'string') {
      console.log('[DEBUG] OK: Got reply:', reply.slice(0, 80) + (reply.length > 80 ? '...' : ''));
    } else {
      console.log('[DEBUG] OK: Webhook responded (no standard reply field)');
    }
    process.exit(0);
  } catch (err) {
    console.error('[DEBUG] FAIL:', err.message);
    process.exit(1);
  }
}
main();
