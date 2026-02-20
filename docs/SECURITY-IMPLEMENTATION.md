# Security Implementation Guide

## Overview

This document describes the comprehensive security improvements implemented in JARVIS-WEB based on industry best practices from:

- **Building Secure and Reliable Systems** (Google)
- **OWASP Top 10** (2021, 2024)
- **OWASP API Security Top 10**
- **OWASP LLM Top 10**
- **Security Engineering** best practices

## Security Features Implemented

### 1. API Key Security ✅

**Issue Fixed**: Hardcoded API key in `public/index.html`

**Solution**:

- Removed hardcoded API key from source code
- API keys must now be provided via:
  - Environment variables (`VITE_CARTESIA_API_KEY`)
  - Runtime configuration (`window.JARVIS_CONFIG.apiKey`)
  - Never committed to version control

**Files Modified**:

- `public/index.html` - Removed hardcoded API key

---

### 2. File Upload Security ✅

**Implementation**: Comprehensive file validation with defense in depth

**Features**:

- **Extension Validation**: Blocks dangerous file extensions (`.exe`, `.bat`, `.php`, etc.)
- **MIME Type Validation**: Validates declared MIME type against allowed list
- **Magic Bytes Validation**: Verifies file content matches declared MIME type (prevents MIME spoofing)
- **Size Limits**: Enforces file size limits per file type
- **Filename Sanitization**: Prevents path traversal and injection attacks

**Files Created**:

- `server.js` and `scripts/security-config.mjs` - Server-side security and validation
- `public/js/security.js` - Client-side validation utilities

**Files Modified**:

- `public/js/app.js` - Integrated file validation into upload process

**Allowed File Types**:

- Images: JPEG, PNG, GIF, WebP (max 10MB)
- Audio: MP3, WAV, WebM, OGG (max 15MB)
- Documents: PDF (max 10MB), Plain Text (max 5MB)

---

### 3. Webhook Response Sanitization ✅

**Implementation**: XSS prevention for webhook responses

**Features**:

- Sanitizes all webhook response data before rendering
- Prevents script injection through LLM responses
- Validates and sanitizes file specifications from webhooks
- Escapes HTML entities in user-generated content

**Files Modified**:

- `public/js/app.js` - Added sanitization to `getLLMReply()` and `processFileSpecs()`

**Security Functions**:

- `sanitizeWebhookResponse()` - Recursively sanitizes objects/arrays/strings
- `sanitizeHtml()` - Escapes HTML entities

---

### 4. Security Headers ✅

**Implementation**: Comprehensive HTTP security headers

**Headers Implemented**:

- **Content-Security-Policy (CSP)**: Prevents XSS, injection attacks
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **X-Content-Type-Options**: Prevents MIME type sniffing (nosniff)
- **X-XSS-Protection**: Legacy browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security (HSTS)**: Forces HTTPS in production

**Files Modified**:

- `server.js` - Added security headers to all responses

**CSP Configuration** (strict nonce-based per docs/cSp DoCs.md):

- **server.js**: Injects nonce per HTML request; strict policy with `object-src 'none'`, `base-uri 'none'`, `script-src 'nonce-{random}' 'strict-dynamic'`
- **scripts/csp-utils.mjs**: `generateCspNonce()`, `buildStrictCspPolicy()`, `injectNonceIntoHtml()`
- **public/index.html**: All `<script>` tags have `nonce="{{CSP_NONCE}}"`; server replaces at serve time
- **Electron**: For `file://` uses fallback CSP; for `http://localhost` preserves server's CSP

---

### 5. Input Validation & Sanitization ✅

**Implementation**: Comprehensive input validation utilities

**Features**:

- HTML sanitization (XSS prevention)
- Filename sanitization (path traversal prevention)
- URL validation (SSRF prevention)
- Input length limits

**Security Functions**:

- `sanitizeHtml()` - Escapes HTML entities
- `sanitizeFilename()` - Removes path components, null bytes, control characters
- `isValidUrl()` - Validates URLs and blocks dangerous protocols

---

### 6. Rate Limiting ✅

**Implementation**: Client-side rate limiting for API calls

**Features**:

- Token bucket algorithm
- Per-session rate limiting
- Configurable limits (60 requests per minute default)
- Automatic cleanup of old entries

**Files Modified**:

- `public/js/app.js` - Added rate limiting to `getLLMReply()`

**Note**: Client-side rate limiting is a first line of defense. Server-side rate limiting should also be implemented in production.

---

### 7. Server-Side Security ✅

**Implementation**: Enhanced server security

**Features**:

- Path traversal prevention
- Sensitive file blocking (`.env`, `.git`, etc.)
- Secure error handling (no information leakage in production)
- Security headers on all responses

**Files Modified**:

- `server.js` - Added security checks and headers

**Blocked Paths**:

- `.env`, `.env.local`, `.env.production`
- `.git`, `node_modules`
- `package.json`, `package-lock.json`

---

## Security Best Practices Applied

### Defense in Depth

- Multiple layers of validation (extension, MIME type, magic bytes, size)
- Client-side and server-side validation
- Input validation and output sanitization

### Least Privilege

- Minimal file type allowlist
- Restricted browser permissions
- Limited CSP directives

### Fail Secure

- Default deny for file uploads
- Block dangerous extensions by default
- Secure error handling

### Input Validation

- Validate all user inputs
- Sanitize all outputs
- Validate file content, not just extensions

---

## Additional Security Features (Implemented)

### 7. WebSocket Authentication ✅

- **Implementation**: Optional token-based auth for `/ws` when `WS_AUTH_TOKEN` is set
- **Usage**: Clients must connect with `ws://host/ws?token=<WS_AUTH_TOKEN>`
- **File**: `server.js` (upgrade handler)

### 8. Server-Side Rate Limiting ✅

- **Implementation**: In-memory sliding-window rate limiter for API routes
- **Limits**: 60 requests/min for `/api/mcp/*` and `/api/n8n-proxy` (configurable via `RATE_LIMIT_API_MAX`)
- **Files**: `scripts/rate-limiter.mjs`, `server.js`

### 9. Security Logging ✅

- **Implementation**: Security event logger for auth failures, rate limits, proxy rejects
- **Config**: `SECURITY_LOG_ENABLED=1`, `SECURITY_LOG_LEVEL=warn`
- **File**: `scripts/security-logger.mjs`

### 10. Centralized Security Config ✅

- **Implementation**: Single module for all security-related env vars
- **File**: `scripts/security-config.mjs`

### 11. n8n Proxy (CORS Bypass) ✅

- **Implementation**: Optional `POST /api/n8n-proxy` to proxy n8n webhook requests (avoids CORS)
- **Config**: `N8N_PROXY_ENABLED=1`, `ALLOWED_N8N_WEBHOOKS` (or `N8N_WEBHOOK_URL`)
- **Client**: `app.js` tries proxy first when same-origin, falls back to direct fetch on 404

---

## Remaining Security Tasks

### Medium Priority

1. **HTTPS Enforcement** - Ensure HTTPS in production (AudioWorklet requirement)

### Low Priority

2. **Content Security Policy** - ✅ Strict nonce-based CSP implemented. Optional: add `report-uri` for violation monitoring.
2. **Security Testing** - Add automated security tests
3. **Dependency Scanning** - Regular dependency vulnerability scanning

---

## Security Checklist

### Before Production Deployment

- [x] Remove all hardcoded secrets
- [ ] Implement HTTPS (required for AudioWorklet)
- [x] CORS: ALLOWED_ORIGINS for API; n8n proxy avoids CORS when enabled
- [x] Server-side rate limiting (API routes)
- [x] Strict CSP with nonce (production: no unsafe-eval; dev: allows for Vite)
- [x] Security logging (enable with SECURITY_LOG_ENABLED=1)
- [ ] Set up dependency vulnerability scanning
- [ ] Conduct security audit
- [ ] Set up error tracking (without exposing sensitive data)

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP LLM Top 10](https://owasp.org/www-project-large-language-model-applications/)
- [Building Secure and Reliable Systems](https://google.github.io/building-secure-and-reliable-systems/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

---

## Security Contact

For security issues, please follow responsible disclosure practices.
