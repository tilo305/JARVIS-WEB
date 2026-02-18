/**
 * CORS handler tests for JARVIS-WEB.
 * @see jEsT dOcS.md — Project Test Structure
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  detectCORSError,
  getCORSConfigurationGuide,
  testCORSPreflight,
  diagnoseCORS,
} from '../public/js/cors-handler.js';

describe('CORS handler', () => {
  let originalWarn;

  beforeEach(() => {
    originalWarn = console.warn;
    console.warn = () => {};
  });

  afterEach(() => {
    console.warn = originalWarn;
  });

  describe('detectCORSError', () => {
    it('returns true for "Failed to fetch"', () => {
      expect(detectCORSError(new Error('Failed to fetch'))).toBe(true);
    });

    it('returns true for "CORS" in message', () => {
      expect(detectCORSError(new Error('blocked by CORS policy'))).toBe(true);
    });

    it('returns true for "cross-origin" in message', () => {
      expect(detectCORSError(new Error('cross-origin request blocked'))).toBe(true);
    });

    it('returns true for "NetworkError"', () => {
      expect(detectCORSError(new Error('NetworkError when fetching'))).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(detectCORSError(new Error('Syntax error'))).toBe(false);
      expect(detectCORSError(null)).toBe(false);
    });
  });

  describe('getCORSConfigurationGuide', () => {
    it('returns a string with CORS headers', () => {
      const guide = getCORSConfigurationGuide('http://localhost:3000');
      expect(typeof guide).toBe('string');
      expect(guide).toContain('Access-Control-Allow-Origin');
      expect(guide).toContain('Access-Control-Allow-Methods');
      expect(guide).toContain('http://localhost:3000');
    });

    it('works without origin (uses fallback)', () => {
      const guide = getCORSConfigurationGuide();
      expect(guide).toContain('Access-Control-Allow-Origin');
    });
  });

  describe('testCORSPreflight', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: true,
        status: 204,
        headers: new Map([
          ['access-control-allow-origin', 'http://localhost:3000'],
          ['access-control-allow-methods', 'POST, OPTIONS'],
        ]),
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('returns object with ok, status, headers', async () => {
      const result = await testCORSPreflight('https://example.com/webhook');
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('headers');
      expect(typeof result.headers).toBe('object');
    });
  });

  describe('diagnoseCORS', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      globalThis.fetch = async (_url, opts) => {
        if (opts?.method === 'OPTIONS') {
          return {
            ok: true,
            status: 204,
            headers: new Map([['access-control-allow-origin', '*']]),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
          text: async () => '{}',
        };
      };
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('returns preflight and post results', async () => {
      const result = await diagnoseCORS('https://example.com/webhook');
      expect(result).toHaveProperty('preflight');
      expect(result).toHaveProperty('post');
      expect(result.preflight).toHaveProperty('ok');
      expect(result.preflight).toHaveProperty('status');
      expect(result.post).toHaveProperty('ok');
      expect(result.post).toHaveProperty('status');
    });
  });
});
