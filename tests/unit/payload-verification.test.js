/**
 * Tests for payload verification module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  validatePayload,
  validateResponse,
  payloadMonitor,
  verifyPayloadFlow,
} from '../../public/js/payload-verification.js';

describe('payload-verification', () => {
  beforeEach(() => {
    // Clear monitor history before each test
    payloadMonitor.clear();
  });

  describe('validatePayload', () => {
    it('should validate a correct payload', () => {
      const payload = {
        message: 'Hello',
        query: 'Hello',
        input: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        timezone: 'UTC',
        location: 'UTC',
        message_id: 'msg_123',
        messageId: 'msg_123',
        source: 'text',
        attachments: [],
      };

      const result = validatePayload(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const payload = {
        message: 'Hello',
        // Missing other required fields
      };

      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect empty message', () => {
      const payload = {
        message: '',
        query: '',
        input: '',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        timezone: 'UTC',
        location: 'UTC',
        message_id: 'msg_123',
        messageId: 'msg_123',
        source: 'text',
        attachments: [],
      };

      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('message'))).toBe(true);
    });

    it('should detect invalid source', () => {
      const payload = {
        message: 'Hello',
        query: 'Hello',
        input: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        timezone: 'UTC',
        location: 'UTC',
        message_id: 'msg_123',
        messageId: 'msg_123',
        source: 'invalid',
        attachments: [],
      };

      const result = validatePayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('source'))).toBe(true);
    });

    it('should warn about mismatched session_id and sessionId', () => {
      const payload = {
        message: 'Hello',
        query: 'Hello',
        input: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_456',
        timestamp: '2024-01-01T00:00:00.000Z',
        timezone: 'UTC',
        location: 'UTC',
        message_id: 'msg_123',
        messageId: 'msg_123',
        source: 'text',
        attachments: [],
      };

      const result = validatePayload(payload);
      expect(result.warnings.some(w => w.includes('session_id'))).toBe(true);
    });

    it('should validate attachments structure', () => {
      const payload = {
        message: 'Hello',
        query: 'Hello',
        input: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        timezone: 'UTC',
        location: 'UTC',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
        attachments: [
          { name: 'test.txt', type: 'text/plain', size: 100 },
          { name: 'test.jpg', type: 'image/jpeg', size: 200, data: 'base64data' },
        ],
      };

      const result = validatePayload(payload);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateResponse', () => {
    it('should validate a response with output key', () => {
      const response = { output: 'Hello, how can I help?' };
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
      expect(result.hasReply).toBe(true);
      expect(result.replyKey).toBe('output');
    });

    it('should validate a response with reply key', () => {
      const response = { reply: 'Hello, how can I help?' };
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
      expect(result.hasReply).toBe(true);
      expect(result.replyKey).toBe('reply');
    });

    it('should detect empty response', () => {
      const response = {};
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.hasReply).toBe(false);
      expect(result.errors.some(e => e.includes('empty'))).toBe(true);
    });

    it('should handle array responses', () => {
      const response = [{ output: 'Hello, how can I help?' }];
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
      expect(result.hasReply).toBe(true);
      expect(result.replyKey).toBe('[0].output');
    });

    it('should handle n8n item format', () => {
      const response = [{ json: { output: 'Hello, how can I help?' } }];
      const result = validateResponse(response);
      expect(result.valid).toBe(true);
      expect(result.hasReply).toBe(true);
      expect(result.replyKey).toBe('[0].json.output');
    });

    it('should detect response without reply', () => {
      const response = { status: 'ok', data: {} };
      const result = validateResponse(response);
      expect(result.valid).toBe(false);
      expect(result.hasReply).toBe(false);
    });
  });

  describe('payloadMonitor', () => {
    it('should record sends', () => {
      const payload = {
        message: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
      };

      const record = payloadMonitor.recordSend(payload, 'https://example.com/webhook');
      expect(record).toBeDefined();
      expect(record.payload).toEqual(payload);
      expect(record.url).toBe('https://example.com/webhook');
    });

    it('should record receives', () => {
      const response = { output: 'Hello, how can I help?' };
      const record = payloadMonitor.recordReceive(response, 200, 'https://example.com/webhook');
      expect(record).toBeDefined();
      expect(record.response).toEqual(response);
      expect(record.status).toBe(200);
    });

    it('should provide statistics', () => {
      const payload = {
        message: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
      };

      payloadMonitor.recordSend(payload, 'https://example.com/webhook');
      payloadMonitor.recordReceive({ output: 'Reply' }, 200, 'https://example.com/webhook');

      const stats = payloadMonitor.getStats();
      expect(stats.sends.total).toBe(1);
      expect(stats.receives.total).toBe(1);
      expect(stats.health).toBeDefined();
    });

    it('should limit history size', () => {
      const payload = {
        message: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
      };

      // Record more than maxHistory (100)
      for (let i = 0; i < 150; i++) {
        payloadMonitor.recordSend(payload, 'https://example.com/webhook');
      }

      const stats = payloadMonitor.getStats();
      expect(stats.sends.total).toBeLessThanOrEqual(100);
    });
  });

  describe('verifyPayloadFlow', () => {
    it('should report healthy when sends and receives match', () => {
      const payload = {
        message: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
      };

      payloadMonitor.recordSend(payload, 'https://example.com/webhook');
      payloadMonitor.recordReceive({ output: 'Reply' }, 200, 'https://example.com/webhook');

      const verification = verifyPayloadFlow();
      expect(verification.healthy).toBe(true);
      expect(verification.stats).toBeDefined();
    });

    it('should detect issues when no sends recorded', () => {
      const verification = verifyPayloadFlow();
      expect(verification.issues.length).toBeGreaterThan(0);
      expect(verification.issues.some(i => i.message.includes('No payloads'))).toBe(true);
    });

    it('should detect issues when responses have no reply', () => {
      const payload = {
        message: 'Hello',
        session_id: 'sess_123',
        sessionId: 'sess_123',
        timestamp: '2024-01-01T00:00:00.000Z',
        source: 'text',
        message_id: 'msg_123',
        messageId: 'msg_123',
      };

      payloadMonitor.recordSend(payload, 'https://example.com/webhook');
      payloadMonitor.recordReceive({ status: 'ok' }, 200, 'https://example.com/webhook');

      const verification = verifyPayloadFlow();
      expect(verification.issues.some(i => i.message.includes('no reply'))).toBe(true);
    });
  });
});
