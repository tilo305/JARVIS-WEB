/**
 * Security Headers Configuration
 * Based on OWASP Secure Headers Project and Building Secure and Reliable Systems
 * 
 * Implements comprehensive security headers for defense in depth
 */

export interface SecurityHeaders {
  [key: string]: string | number;
}

/**
 * Generate comprehensive security headers
 * Based on OWASP Secure Headers Project recommendations
 */
export function getSecurityHeaders(options: {
  isProduction?: boolean;
  allowedOrigins?: string[];
  enableCSP?: boolean;
} = {}): SecurityHeaders {
  const { isProduction = false, allowedOrigins = [], enableCSP = true } = options;
  
  const headers: SecurityHeaders = {
    // Content Security Policy - prevents XSS, injection attacks
    ...(enableCSP && {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Vite dev, tighten in production
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https:",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join('; '),
    }),
    
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
