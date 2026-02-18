/**
 * CSP (Content Security Policy) utilities for strict nonce-based CSP.
 * Based on web.dev/strict-csp and csp.withgoogle.com/docs.
 *
 * Nonces must be:
 * - Cryptographically strong random (128+ bits)
 * - Base64 encoded
 * - Newly generated for every response
 */

import { randomBytes } from 'node:crypto';

const NONCE_LENGTH = 16;

/**
 * Generate a cryptographically strong nonce for CSP.
 * @returns {string} Base64-encoded nonce
 */
export function generateCspNonce() {
  return randomBytes(NONCE_LENGTH).toString('base64');
}

/**
 * Build a strict CSP policy string.
 * Uses nonce + strict-dynamic; object-src 'none'; base-uri 'none'.
 *
 * @param {Object} options
 * @param {string} options.nonce - The nonce value (from generateCspNonce)
 * @param {boolean} [options.isProduction=true] - If true, omit unsafe-inline/unsafe-eval fallbacks
 * @param {string} [options.reportUri] - Optional report-uri for violation reporting
 * @param {boolean} [options.allowUnsafeEval=false] - Allow eval() if app requires it
 * @returns {string} CSP policy string
 */
export function buildStrictCspPolicy({
  nonce,
  isProduction = true,
  reportUri = '',
  allowUnsafeEval = false,
} = {}) {
  if (!nonce || typeof nonce !== 'string') {
    throw new Error('CSP nonce is required for strict policy');
  }

  const scriptSrc = [
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // Fallbacks for older browsers (Chrome <55, Firefox <43, Safari)
    // Modern browsers ignore these when nonce/strict-dynamic present
    ...(isProduction ? [] : ["'unsafe-inline'"]),
    ...(allowUnsafeEval ? ["'unsafe-eval'"] : []),
    "https://cdn.jsdelivr.net",
    "https:",
    "http:",
  ].join(' ');

  const directives = [
    `script-src ${scriptSrc}`,
    "object-src 'none'",
    "base-uri 'none'",
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' wss://api.cartesia.ai wss: https: http://localhost http://127.0.0.1 blob:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join('; ');
}

/**
 * Inject nonce into HTML by replacing {{CSP_NONCE}} placeholder.
 * Script tags in index.html must include nonce="{{CSP_NONCE}}" for strict CSP.
 *
 * @param {string} html - Raw HTML content
 * @param {string} nonce - The nonce value
 * @returns {string} HTML with nonce injected
 */
export function injectNonceIntoHtml(html, nonce) {
  if (!nonce || typeof nonce !== 'string') {
    return html;
  }
  const safeNonce = nonce.replace(/[^a-zA-Z0-9+/=]/g, '');
  return html.replace(/\{\{CSP_NONCE\}\}/g, safeNonce);
}
