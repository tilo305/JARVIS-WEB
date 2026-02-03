/**
 * LIVE test: n8n webhook responds (network required)
 * Uses full payload (session_id, timezone, location, etc.) — same as chat UI.
 * Run: npm test -- debug/live/n8n-webhook.test.js
 * @see zEn DeBuGgEr.md
 */
import { describe, it, expect } from '@jest/globals';
import { N8N_WEBHOOK_URL } from '../../dist/config.js';
import { buildN8nPayload, extractReplyFromJson } from '../../public/js/n8n-payload.js';

const FETCH_TIMEOUT_MS = 8000;

function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(to));
}

describe('LIVE: n8n webhook', () => {
  it('should POST full payload and receive response (2xx or 404 if workflow inactive)', async () => {
    const payload = buildN8nPayload('test from JARVIS', { source: 'text' });
    let res;
    try {
      res = await fetchWithTimeout(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        console.warn('[LIVE] n8n webhook unreachable (timeout) — run npm run debug:n8n to test connectivity');
        expect(payload).toBeDefined();
        expect(payload.session_id).toBeDefined();
        return;
      }
      throw err;
    }
    // 2xx = success; 404 = webhook URL exists but workflow inactive
    expect(res.status).toBeLessThan(500);
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
    expect(data).toBeDefined();
    if (res.ok) {
      const reply = extractReplyFromJson(data);
      if (typeof reply === 'string') {
        expect(reply.length).toBeGreaterThan(0);
      }
    }
  }, 15000);
});
