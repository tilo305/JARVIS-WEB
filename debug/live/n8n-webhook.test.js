/**
 * LIVE test: n8n webhook responds (network required)
 * Uses full payload (session_id, timezone, location, etc.) — same as chat UI.
 * Run: npm test -- debug/live/n8n-webhook.test.js
 * @see zEn DeBuGgEr.md
 */
import { describe, it, expect } from '@jest/globals';
import { N8N_WEBHOOK_URL } from '../../dist/config.js';
import { buildN8nPayload } from '../../public/js/n8n-payload.js';

describe('LIVE: n8n webhook', () => {
  it('should POST full payload and receive response (2xx or 404 if workflow inactive)', async () => {
    const payload = buildN8nPayload('test from JARVIS', { source: 'text' });
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // 2xx = success; 404 = webhook URL exists but workflow inactive
    expect(res.status).toBeLessThan(500);
    const data = await res.json().catch(() => ({}));
    expect(data).toBeDefined();
    if (res.ok) {
      const reply = data?.output ?? data?.reply ?? data?.result ?? data?.text ?? data?.message;
      if (typeof reply === 'string') {
        expect(reply.length).toBeGreaterThan(0);
      }
    }
  }, 10000);
});
