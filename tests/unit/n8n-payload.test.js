/**
 * Unit tests for n8n payload builder — ensures full payload is always sent.
 */
import { describe, it, expect } from '@jest/globals';
import { buildN8nPayload, getClientLocation, getNaturalFallback, extractReplyFromJson, extractFilesFromJson } from '../../public/js/n8n-payload.js';

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

    it('should pass through attachment ocrText from multimodal OCR tool', () => {
      const payload = buildN8nPayload('Describe this', {
        attachments: [{ name: 'note.png', type: 'image/png', size: 100, data: 'base64...', ocrText: 'Hello from image' }],
      });
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0].ocrText).toBe('Hello from image');
    });

    it('should include ocrText when empty string (OCR ran but found no text)', () => {
      const payload = buildN8nPayload('What is this?', {
        attachments: [{ name: 'pic.jpg', type: 'image/jpeg', size: 200, data: 'base64...', ocrText: '' }],
      });
      expect(payload.attachments).toHaveLength(1);
      expect(payload.attachments[0]).toHaveProperty('ocrText', '');
    });

    it('should include agentic fields when provided (Memory, Routing, Context Engineering)', () => {
      const payload = buildN8nPayload('Hello', {
        conversationHistory: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hey!' }],
        intent: 'greeting',
        contextEnrichment: { viewportWidth: 1920 },
      });
      expect(payload.conversationHistory).toHaveLength(2);
      expect(payload.intent).toBe('greeting');
      expect(payload.contextEnrichment).toEqual({ viewportWidth: 1920 });
    });

    it('should not include agentic fields when empty', () => {
      const payload = buildN8nPayload('Hello');
      expect(payload.conversationHistory).toBeUndefined();
      expect(payload.intent).toBeUndefined();
      expect(payload.contextEnrichment).toBeUndefined();
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

  describe('getNaturalFallback', () => {
    it('should return greeting reply for hello/hi etc.', () => {
      expect(getNaturalFallback('hello')).toBe("Good morning, sir. How can I assist you today?");
      expect(getNaturalFallback('Hi there')).toBe("Good morning, sir. How can I assist you today?");
      expect(getNaturalFallback('good morning')).toBe("Good morning, sir. How can I assist you today?");
    });
    it('should return goodbye/thanks/yes-no replies', () => {
      expect(getNaturalFallback('goodbye')).toBe("Goodbye, sir. I'll be here when you need me.");
      expect(getNaturalFallback('thank you')).toBe("You're welcome, sir.");
      expect(getNaturalFallback('yes')).toBe("Understood, sir.");
    });
    it('should return null for unknown or empty', () => {
      expect(getNaturalFallback('')).toBeNull();
      expect(getNaturalFallback('  ')).toBeNull();
      expect(getNaturalFallback('what is the weather')).toBeNull();
    });
  });

  describe('extractReplyFromJson', () => {
    it('should return string for standard reply keys', () => {
      expect(extractReplyFromJson({ output: 'Hi' })).toBe('Hi');
      expect(extractReplyFromJson({ reply: 'Hello' })).toBe('Hello');
      expect(extractReplyFromJson({ text: 'OK' })).toBe('OK');
      expect(extractReplyFromJson({ message: 'Done' })).toBe('Done');
    });

    it('should return first item string for array (Respond to Webhook format)', () => {
      expect(extractReplyFromJson([{ output: 'From array' }])).toBe('From array');
    });

    it('should handle n8n item format with json wrapper', () => {
      expect(extractReplyFromJson([{ json: { output: 'From json wrapper' } }])).toBe('From json wrapper');
    });

    it('should extract reply from object with array value (wrapped response)', () => {
      expect(extractReplyFromJson({ data: [{ output: 'From wrapped array' }] })).toBe('From wrapped array');
      expect(extractReplyFromJson({ result: [{ reply: 'Nested' }] })).toBe('Nested');
    });

    it('should return null for empty or non-object', () => {
      expect(extractReplyFromJson(null)).toBeNull();
      expect(extractReplyFromJson(undefined)).toBeNull();
      expect(extractReplyFromJson({})).toBeNull();
    });

    it('should prefer first matching key per N8N_REPLY_KEYS order', () => {
      const data = { message: 'first', output: 'second' };
      expect(extractReplyFromJson(data)).toBe('second');
    });
  });

  describe('extractFilesFromJson', () => {
    it('should return files array when present', () => {
      const data = { output: 'Hi', files: [{ type: 'pdf', title: 'Doc', content: 'x' }] };
      expect(extractFilesFromJson(data)).toHaveLength(1);
      expect(extractFilesFromJson(data)[0].type).toBe('pdf');
    });

    it('should return empty array when no files', () => {
      expect(extractFilesFromJson({})).toEqual([]);
      expect(extractFilesFromJson({ output: 'Hi' })).toEqual([]);
    });

    it('should filter out items without type', () => {
      const data = { files: [{ type: 'audio', text: 'x' }, { content: 'y' }] };
      expect(extractFilesFromJson(data)).toHaveLength(1);
      expect(extractFilesFromJson(data)[0].type).toBe('audio');
    });
  });
});
