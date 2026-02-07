/**
 * Security Module Tests
 * Tests for public/js/security.js security utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateFile,
  sanitizeFilename,
  sanitizeHtml,
  sanitizeWebhookResponse,
  isValidUrl,
  rateLimiter,
} from '../../public/js/security.js';

describe('security', () => {
  describe('sanitizeFilename', () => {
    it('should remove path components', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('.._.._etc_passwd');
      expect(sanitizeFilename('folder/file.txt')).toBe('folder_file.txt');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
    });

    it('should remove control characters', () => {
      expect(sanitizeFilename('file\x00\x1Fname.txt')).toBe('filename.txt');
    });

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized).toMatch(/\.txt$/);
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my-file_123.txt')).toBe('my-file_123.txt');
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      // Note: / is escaped as &#x2F; for security (more secure than just /)
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeHtml('Hello & World')).toBe('Hello &amp; World');
      expect(sanitizeHtml("It's working")).toBe('It&#x27;s working');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
      expect(sanitizeHtml(123)).toBe('');
    });
  });

  describe('sanitizeWebhookResponse', () => {
    it('should sanitize string responses', () => {
      // Note: / is escaped as &#x2F; for security
      const result = sanitizeWebhookResponse('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize object responses', () => {
      const input = {
        message: '<script>alert("xss")</script>',
        title: 'Hello & World',
      };
      const result = sanitizeWebhookResponse(input);
      expect(result.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result.title).toBe('Hello &amp; World');
    });

    it('should sanitize array responses', () => {
      const input = ['<script>alert("xss")</script>', 'Hello & World'];
      const result = sanitizeWebhookResponse(input);
      expect(result[0]).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result[1]).toBe('Hello &amp; World');
    });

    it('should handle nested objects', () => {
      const input = {
        data: {
          message: '<script>alert("xss")</script>',
        },
      };
      const result = sanitizeWebhookResponse(input);
      expect(result.data.message).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
  });

  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should accept valid WebSocket URLs', () => {
      expect(isValidUrl('ws://example.com')).toBe(true);
      expect(isValidUrl('wss://example.com')).toBe(true);
    });

    it('should reject dangerous protocols', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
      expect(isValidUrl('javascript:alert("xss")')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
    });

    it('should validate against allowed domains', () => {
      expect(isValidUrl('https://example.com', ['example.com'])).toBe(true);
      expect(isValidUrl('https://other.com', ['example.com'])).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate allowed image files', async () => {
      // Create a mock File object with JPEG magic bytes
      const blob = new Blob([new Uint8Array([0xFF, 0xD8, 0xFF])], { type: 'image/jpeg' });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject dangerous file extensions', async () => {
      const blob = new Blob(['test'], { type: 'application/x-executable' });
      const file = new File([blob], 'malware.exe', { type: 'application/x-executable' });
      
      const result = await validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Dangerous file extension');
    });

    it('should reject files with mismatched magic bytes', async () => {
      // Create file with wrong magic bytes for declared type
      const blob = new Blob([new Uint8Array([0x00, 0x00, 0x00])], { type: 'image/jpeg' });
      const file = new File([blob], 'fake.jpg', { type: 'image/jpeg' });
      
      const result = await validateFile(file, { checkMagicBytes: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('magic bytes');
    });

    it('should reject files exceeding size limits', async () => {
      // Create a large file (20MB)
      const largeBlob = new Blob([new Array(20 * 1024 * 1024).fill(0)], { type: 'image/jpeg' });
      const file = new File([largeBlob], 'large.jpg', { type: 'image/jpeg' });
      
      const result = await validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size');
    });
  });

  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      
      // Should allow first 60 requests
      for (let i = 0; i < 60; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      
      // Exhaust the limit
      for (let i = 0; i < 60; i++) {
        rateLimiter.isAllowed(identifier);
      }
      
      // Next request should be blocked
      expect(rateLimiter.isAllowed(identifier)).toBe(false);
    });

    it('should track different identifiers separately', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should cleanup old entries', () => {
      rateLimiter.cleanup();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
