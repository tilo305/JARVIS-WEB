/**
 * Unit tests for n8n payload builder — ensures full payload is always sent.
 */
import { describe, it, expect } from '@jest/globals';
import { buildN8nPayload, getClientLocation } from '../../public/js/n8n-payload.js';

const REQUIRED_KEYS = [
  'message',
  'session_id',
  'sessionId',
  'timestamp',
  'timezone',
  'location',
  'message_id',
  'messageId',
  'source',
  'attachments',
];

describe('n8n-payload', () => {
  describe('buildN8nPayload', () => {
    it('should include all required keys (session_id, timezone, location, etc.)', () => {
      const payload = buildN8nPayload('Hello');
      for (const key of REQUIRED_KEYS) {
        expect(payload).toHaveProperty(key);
      }
    });

    it('should set session_id and sessionId to same value', () => {
      const payload = buildN8nPayload('test');
      expect(payload.session_id).toBe(payload.sessionId);
    });

    it('should set location same as timezone', () => {
      const payload = buildN8nPayload('test');
      expect(payload.location).toBe(payload.timezone);
    });

    it('should set message_id and messageId to same value', () => {
      const payload = buildN8nPayload('test');
      expect(payload.message_id).toBe(payload.messageId);
    });

    it('should use options.sessionId when provided', () => {
      const payload = buildN8nPayload('test', { sessionId: 'sess_custom_123' });
      expect(payload.session_id).toBe('sess_custom_123');
      expect(payload.sessionId).toBe('sess_custom_123');
    });

    it('should use options.source', () => {
      expect(buildN8nPayload('hi', { source: 'voice' }).source).toBe('voice');
      expect(buildN8nPayload('hi').source).toBe('text');
    });

    it('should have ISO timestamp', () => {
      const payload = buildN8nPayload('test');
      expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getClientLocation', () => {
    it('should return timezone, locale, language', () => {
      const loc = getClientLocation();
      expect(loc).toHaveProperty('timezone');
      expect(loc).toHaveProperty('locale');
      expect(loc).toHaveProperty('language');
      expect(typeof loc.timezone).toBe('string');
    });
  });
});
