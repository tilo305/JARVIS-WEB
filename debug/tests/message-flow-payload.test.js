/**
 * Message-flow payload contract (send/receive).
 * Mirrors JARVIS_VERIFY_MESSAGE_FLOW() in app.js: payload shape and validation.
 * Per zEn DeBuGgEr.md — debug folder tests.
 */
import { describe, it, expect } from '@jest/globals';
import {
  buildN8nPayload,
  validateN8nPayload,
  N8N_PAYLOAD_REQUIRED_KEYS,
  extractReplyFromJson,
} from '../../public/js/n8n-payload.js';

describe('Message flow payload (send/receive contract)', () => {
  it('builds payload with message, query, input aligned (same as JARVIS_VERIFY_MESSAGE_FLOW)', () => {
    const payload = buildN8nPayload('verify-flow-test', { source: 'text' });
    expect(payload.message).toBe('verify-flow-test');
    expect(payload.query).toBe(payload.message);
    expect(payload.input).toBe(payload.message);
  });

  it('includes all required keys required by n8n', () => {
    const payload = buildN8nPayload('Hello');
    for (const key of N8N_PAYLOAD_REQUIRED_KEYS) {
      expect(payload).toHaveProperty(key);
    }
  });

  it('passes validateN8nPayload when built by buildN8nPayload', () => {
    const payload = buildN8nPayload('verify-flow-test', { source: 'text' });
    const validation = validateN8nPayload(payload);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('extractReplyFromJson returns reply for standard n8n response keys', () => {
    expect(extractReplyFromJson({ output: 'Hi' })).toBe('Hi');
    expect(extractReplyFromJson({ reply: 'Done' })).toBe('Done');
    expect(extractReplyFromJson([{ json: { output: 'From array' } }])).toBe('From array');
  });
});
