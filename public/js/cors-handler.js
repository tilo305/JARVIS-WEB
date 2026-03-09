/**
 * CORS diagnostic and configuration utilities for JARVIS-WEB.
 * Based on MDN CORS documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
 *
 * Used for:
 * - Detecting CORS-related errors in fetch failures
 * - Diagnosing preflight (OPTIONS) and POST CORS configuration
 * - Providing server configuration guidance (n8n, reverse proxy)
 */
'use strict';

/**
 * Test OPTIONS (preflight) request to a URL.
 * Returns diagnostic info about whether the server allows CORS preflight.
 * @param {string} url - Full webhook/API URL to test
 * @param {string} [origin] - Origin to send (defaults to current window.origin or 'http://localhost:3000')
 * @returns {Promise<{ ok: boolean, status: number, headers: Record<string, string>, error?: string }>}
 */
export async function testCORSPreflight(url, origin) {
  const o = origin || (typeof window !== 'undefined' ? window.origin : 'http://localhost:3000');
  const result = { ok: false, status: 0, headers: {} };

  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: o,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    result.status = res.status;
    result.ok = res.ok;
    res.headers.forEach((v, k) => { result.headers[k.toLowerCase()] = v; });
    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }
}

/**
 * Full CORS diagnostics: preflight + actual POST.
 * @param {string} url - Full webhook/API URL
 * @param {{ origin?: string, body?: string }} [options]
 * @returns {Promise<{
 *   preflight: { ok: boolean, status: number, headers: Record<string, string>, error?: string },
 *   post: { ok: boolean, status: number, corsBlocked?: boolean, error?: string }
 * }>}
 */
export async function diagnoseCORS(url, options = {}) {
  const origin = options.origin || (typeof window !== 'undefined' ? window.origin : 'http://localhost:3000');
  const body = options.body || JSON.stringify({ message: '[CORS diagnostic] test', sessionId: 'cors-test' });

  const preflight = await testCORSPreflight(url, origin);
  const post = { ok: false, status: 0 };

  if (!preflight.ok && preflight.error) {
    return { preflight, post };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    post.ok = res.ok;
    post.status = res.status;
    return { preflight, post };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    post.error = msg;
    post.corsBlocked = detectCORSError(err, url);
    return { preflight, post };
  }
}

/**
 * Detect if an error is likely CORS-related.
 * Browsers don't expose CORS details to JS; we infer from common error messages.
 * @param {unknown} error - Caught error (Error, string, etc.)
 * @param {string} [url] - URL that was fetched (for logging)
 * @returns {boolean}
 */
export function detectCORSError(error, url) {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error instanceof Error ? error.message : String(error));
  const lower = msg.toLowerCase();
  const corsIndicators = [
    'cors',
    'cross-origin',
    'failed to fetch',
    'networkerror',
    'network error',
    'access-control-allow-origin',
    'blocked by cors policy',
  ];
  const likely = corsIndicators.some((ind) => lower.includes(ind));
  /* eslint-disable no-console -- intentional: user-facing CORS diagnostic */
  if (likely && typeof console !== 'undefined' && console.warn) {
    console.warn('[JARVIS] Likely CORS error detected:', msg, url ? `(url: ${url})` : '');
  }
  /* eslint-enable no-console */
  return likely;
}

/**
 * Get server-side CORS configuration guidance for n8n / reverse proxy.
 * @param {string} [origin] - Client origin (e.g. http://localhost:3000)
 * @returns {string}
 */
export function getCORSConfigurationGuide(origin) {
  const o = origin || (typeof window !== 'undefined' ? window.origin : 'http://localhost:3000');
  return `
CORS Configuration Guide for JARVIS-WEB → n8n Webhook
──────────────────────────────────────────────────────
Client origin: ${o}

1. Server must respond to OPTIONS (preflight) with:
   - Access-Control-Allow-Origin: ${o}  (or * for non-credentialed)
   - Access-Control-Allow-Methods: POST, OPTIONS
   - Access-Control-Allow-Headers: Content-Type
   - Status: 200 or 204

2. Server must include in POST response:
   - Access-Control-Allow-Origin: ${o}  (or *)

3. n8n: Add a Set node before Respond to Webhook with these headers,
   and handle OPTIONS with early return. See docs/CORS-CONFIGURATION.md

4. Electron: Use main process fetch (invokeN8nWebhook) to bypass CORS.
`;
}
