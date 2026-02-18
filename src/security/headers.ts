/**
 * Security Headers Configuration
 * Based on OWASP Secure Headers Project and Building Secure and Reliable Systems
 * Implements strict CSP per docs/cSp DoCs.md (web.dev/strict-csp)
 */

export interface SecurityHeaders {
  [key: string]: string | number;
}

/**
 * Build strict CSP policy string (nonce-based).
 * Use with getSecurityHeaders({ csp: buildStrictCsp(...) }) when serving HTML.
 */
export function buildStrictCsp(options: {
  nonce: string;
  isProduction?: boolean;
  allowUnsafeEval?: boolean;
  reportUri?: string;
}): string {
  const { nonce, isProduction = false, allowUnsafeEval = false, reportUri = '' } = options;
  const scriptSrc = [
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isProduction ? [] : ["'unsafe-inline'"]),
    ...(allowUnsafeEval ? ["'unsafe-eval'"] : []),
    'https:',
    'http:',
  ].join(' ');
  const directives = [
    `script-src ${scriptSrc}`,
    "object-src 'none'",
    "base-uri 'none'",
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' wss: https: http://localhost http://127.0.0.1 blob:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (reportUri) directives.push(`report-uri ${reportUri}`);
  if (isProduction) directives.push("upgrade-insecure-requests");
  return directives.join('; ');
}

/**
 * Generate comprehensive security headers
 * Based on OWASP Secure Headers Project recommendations
 */
export function getSecurityHeaders(options: {
  isProduction?: boolean;
  allowedOrigins?: string[];
  enableCSP?: boolean;
  /** Pre-built strict CSP (e.g. from buildStrictCsp). When set, enableCSP is ignored for CSP. */
  csp?: string;
} = {}): SecurityHeaders {
  const { isProduction = false, allowedOrigins = [], enableCSP = true, csp } = options;

  const fallbackCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https: http://localhost http://127.0.0.1",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  const cspValue = csp ?? (enableCSP ? fallbackCsp : null);

  const headers: SecurityHeaders = {
    ...(cspValue && { 'Content-Security-Policy': cspValue }),
    
    // HTTP Strict Transport Security - force HTTPS
    ...(isProduction && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
    
    // X-Frame-Options - prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // X-Content-Type-Options - prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // X-XSS-Protection - legacy browser XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy - control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy - control browser features
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
    ].join(', '),
    
    // CORS headers (if needed)
    ...(allowedOrigins.length > 0 && {
      'Access-Control-Allow-Origin': allowedOrigins[0], // In production, validate origin
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }),
  };
  
  return headers;
}

/**
 * Apply security headers to HTTP response
 */
export function applySecurityHeaders(
  headers: SecurityHeaders,
  responseHeaders: Record<string, string | number | string[]>
): void {
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      responseHeaders[key] = String(value);
    }
  }
}
