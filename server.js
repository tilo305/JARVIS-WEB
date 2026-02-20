/**
 * Secure static file server for the browser AudioWorklet demo.
 * Serves public/ (or dist-public when built) on http://localhost:3000.
 * WebSocket server attached on same port for /ws (status/health bridge).
 * Required: HTTPS for production (AudioWorklet needs secure context).
 *
 * WebSocket integration:
 * - Browser → Cartesia STT/TTS: direct wss://api.cartesia.ai (from cartesia-audio-bridge.js).
 * - Optional: Browser → this server ws://localhost:3000/ws for status/health (same-origin).
 *
 * Security improvements based on:
 * - OWASP Secure Headers Project
 * - OWASP Developer Guide (wEb sEcUrItY.pdf)
 * - Building Secure and Reliable Systems (Google)
 */
import { createServer } from 'node:http';
import { loadEnvEverywhere } from './scripts/load-env-everywhere.mjs';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { generateCspNonce, buildStrictCspPolicy, injectNonceIntoHtml } from './scripts/csp-utils.mjs';
import { loadSecurityConfig } from './scripts/security-config.mjs';
import { createSecurityLogger } from './scripts/security-logger.mjs';
import { createRateLimiter } from './scripts/rate-limiter.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
loadEnvEverywhere(__dirname);

// Ensure every console.error and console.warn is logged to the terminal with a timestamp
const ts = () => new Date().toISOString();
const origStderrWrite = process.stderr.write.bind(process.stderr);
const _originalError = console.error;
const _originalWarn = console.warn;
console.error = function (...args) {
  const line = `[${ts()}] [ERROR] ${args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ')}\n`;
  origStderrWrite(line);
  _originalError.apply(console, args);
};
console.warn = function (...args) {
  const line = `[${ts()}] [WARN] ${args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ')}\n`;
  origStderrWrite(line);
  _originalWarn.apply(console, args);
};
process.on('uncaughtException', (err) => {
  origStderrWrite(`[${ts()}] [uncaughtException] ${err.stack || err.message || err}\n`);
  _originalError('[Server] uncaughtException:', err);
});
process.on('unhandledRejection', (reason, _promise) => {
  const msg = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
  origStderrWrite(`[${ts()}] [unhandledRejection] ${msg}\n`);
  _originalError('[Server] unhandledRejection:', reason);
});

const SEC = loadSecurityConfig(process.env);
const secLog = createSecurityLogger(SEC.securityLog);
const apiRateLimiter = createRateLimiter({
  windowMs: SEC.rateLimit.windowMs,
  maxRequests: SEC.rateLimit.maxApiRequests,
});

const PORT = process.env.PORT || 3000;
const WS_PATH = '/ws';
const ALLOWED_ORIGINS = SEC.allowedOrigins;
const ENABLE_MCP = SEC.mcp.enabled;
const MCP_API_SECRET = SEC.mcp.apiSecret;
// Serve dist-public (Vite production build) when present; otherwise public/ for development
const DIST_PUBLIC = join(__dirname, 'dist-public');
const PUBLIC_FALLBACK = join(__dirname, 'public');
const PUBLIC_DIR = existsSync(join(DIST_PUBLIC, 'index.html')) ? DIST_PUBLIC : PUBLIC_FALLBACK;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

/**
 * Security headers based on OWASP recommendations.
 * @param {Object} [opts]
 * @param {string} [opts.csp] - Override CSP (e.g. strict nonce-based policy). If omitted, no CSP header (used when CSP is set per-HTML with nonce).
 */
function getSecurityHeaders(opts = {}) {
  const headers = {
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
      'microphone=(self)',
      'camera=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  };

  if (opts.csp) {
    headers['Content-Security-Policy'] = opts.csp;
  }

  if (IS_PRODUCTION) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * CORS headers for cross-origin requests (when ALLOWED_ORIGINS is set).
 * Validates request Origin against allowlist; returns headers or empty object.
 * Used in OPTIONS handler below.
 */
function getCorsHeaders(req) {
  if (ALLOWED_ORIGINS.length === 0) return {};
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Block access to sensitive files
 */
const BLOCKED_PATHS = [
  '.env',
  '.env.local',
  '.env.production',
  '.git',
  'package.json',
  'package-lock.json',
  'node_modules',
];

function isBlockedPath(path) {
  const normalized = path.toLowerCase();
  return BLOCKED_PATHS.some(blocked => normalized.includes(blocked));
}

/** Read JSON body from incoming request (for API routes). */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/** Get client IP for rate limiting (X-Forwarded-For or socket) */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim() || req.socket?.remoteAddress || 'unknown';
  }
  return req.socket?.remoteAddress || 'unknown';
}

/** Whether IP is local/private (skip ISP lookup). */
function isPrivateOrLocalIp(ip) {
  if (!ip || ip === 'unknown') return true;
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) return true;
  return false;
}

/** Resolve ISP for a public IP (ip-api.com, fields=isp). Returns null on skip/failure. */
async function getIspForIp(ip) {
  if (isPrivateOrLocalIp(ip)) return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=isp`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json().catch(() => ({}));
    return typeof data?.isp === 'string' ? data.isp : null;
  } catch {
    return null;
  }
}

/** Check MCP API auth: no secret = allow all; otherwise require X-MCP-Secret or Authorization: Bearer <secret>. */
function checkMcpAuth(req) {
  if (!MCP_API_SECRET) return true;
  const secret = req.headers['x-mcp-secret'] || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '');
  const ok = secret === MCP_API_SECRET;
  if (!ok) secLog.authFailure('MCP invalid or missing secret', { ip: getClientIp(req) });
  return ok;
}

const server = createServer(async (req, res) => {
  const clientIp = getClientIp(req);

  // Handle OPTIONS (CORS preflight) when ALLOWED_ORIGINS is set
  if (req.method === 'OPTIONS' && ALLOWED_ORIGINS.length > 0) {
    res.writeHead(204, { ...getSecurityHeaders(), ...getCorsHeaders(req) });
    res.end();
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];

  // MCP in-app API (Desktop Commander bridge)
  if (ENABLE_MCP && urlPath.startsWith('/api/mcp')) {
    const { allowed } = apiRateLimiter.check(`api:${clientIp}`);
    if (!allowed) {
      secLog.rateLimit(`api:${clientIp}`, { path: urlPath });
      res.writeHead(429, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded' }));
      return;
    }
    if (!checkMcpAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing MCP API secret' }));
      return;
    }
    const sendJson = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify(body));
    };
    try {
      if (urlPath === '/api/mcp/tools' && req.method === 'GET') {
        const { listTools } = await import('./scripts/mcp-desktop-commander-bridge.mjs');
        const result = await listTools();
        sendJson(200, result);
        return;
      }
      if (urlPath === '/api/mcp/call' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const tool = body.tool || body.name;
        const args = body.arguments ?? body.args ?? {};
        if (!tool || typeof tool !== 'string') {
          sendJson(400, { error: 'Bad Request', message: 'Missing or invalid "tool" (or "name")' });
          return;
        }
        const { callTool } = await import('./scripts/mcp-desktop-commander-bridge.mjs');
        const result = await callTool(tool, args);
        sendJson(200, result);
        return;
      }
      sendJson(404, { error: 'Not Found', message: 'MCP endpoint not found' });
      return;
    } catch (err) {
      console.error('[MCP]', err);
      sendJson(500, {
        error: 'Internal Server Error',
        message: IS_PRODUCTION ? 'MCP request failed' : (err?.message || String(err)),
      });
      return;
    }
  }

  // n8n proxy: POST /api/n8n-proxy — same-origin proxy to avoid CORS (when N8N_PROXY_ENABLED=1)
  if (SEC.n8nProxy.enabled && urlPath === '/api/n8n-proxy' && req.method === 'POST') {
    const { allowed } = apiRateLimiter.check(`n8n:${clientIp}`);
    if (!allowed) {
      secLog.rateLimit(`n8n:${clientIp}`, { path: urlPath });
      res.writeHead(429, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded' }));
      return;
    }
    try {
      const body = await readJsonBody(req);
      const url = body?.url || body?.webhookUrl;
      if (!url || typeof url !== 'string') {
        secLog.proxyReject('missing url', { ip: clientIp });
        res.writeHead(400, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
        res.end(JSON.stringify({ error: 'Bad Request', message: 'Missing "url" or "webhookUrl"' }));
        return;
      }
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || !parsed.pathname.includes('/webhook/')) {
        secLog.proxyReject('invalid url', { url: url.slice(0, 80), ip: clientIp });
        res.writeHead(400, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
        res.end(JSON.stringify({ error: 'Bad Request', message: 'URL must be HTTPS and contain /webhook/' }));
        return;
      }
      const allowed = SEC.n8nProxy.allowedUrls;
      if (allowed.length > 0 && !allowed.some((a) => url.startsWith(a.trim()))) {
        secLog.proxyReject('url not in allowlist', { url: url.slice(0, 80), ip: clientIp });
        res.writeHead(403, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
        res.end(JSON.stringify({ error: 'Forbidden', message: 'Webhook URL not allowed' }));
        return;
      }
      const payload = body?.body ?? body;
      const payloadObj = payload && typeof payload === 'object' ? { ...payload } : payload;
      if (payloadObj && typeof payloadObj === 'object') {
        payloadObj.client_ip = clientIp;
        const isp = await getIspForIp(clientIp);
        if (isp) payloadObj.isp = isp;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SEC.n8nProxy.timeoutMs);
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadObj ?? payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await fetchRes.json().catch(() => ({}));
      res.writeHead(fetchRes.status, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify(data));
    } catch (err) {
      secLog.error('n8n proxy failed', { ip: clientIp, err: err?.message });
      res.writeHead(500, { 'Content-Type': 'application/json', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: IS_PRODUCTION ? 'Proxy failed' : (err?.message || 'Proxy failed') }));
    }
    return;
  }

  let raw = req.url === '/' ? '/index.html' : req.url;
  raw = raw.split('?')[0].replace(/\.\./g, '').replace(/^\//, '');
  const resolvedPath = resolve(PUBLIC_DIR, raw);
  const pathRelative = relative(PUBLIC_DIR, resolvedPath);

  // Security: Prevent path traversal and access to sensitive files (cross-platform)
  if (pathRelative.startsWith('..') || isAbsolute(pathRelative) || isBlockedPath(resolvedPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const mime = MIME[extname(resolvedPath)] || 'application/octet-stream';
    const isHtml = mime === 'text/html';
    let data = isHtml ? await readFile(resolvedPath, 'utf8') : await readFile(resolvedPath);
    let csp = null;

    // Strict CSP with nonce for HTML that contains the placeholder
    if (isHtml && data.includes('{{CSP_NONCE}}')) {
      const nonce = generateCspNonce();
      data = injectNonceIntoHtml(data, nonce);
      csp = buildStrictCspPolicy({
        nonce,
        isProduction: IS_PRODUCTION,
        allowUnsafeEval: !IS_PRODUCTION,
      });
    } else if (isHtml) {
      // Fallback CSP for HTML without nonce placeholder (e.g. debug pages)
      csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src 'self' wss: https: http://localhost http://127.0.0.1 blob:",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
      ].join('; ');
    }

    const headers = {
      'Content-Type': mime,
      ...getSecurityHeaders(csp ? { csp } : {}),
      ...getCorsHeaders(req),
    };

    res.writeHead(200, headers);
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end('Not Found');
    } else {
      // Don't leak error details in production
      const message = IS_PRODUCTION ? 'Server Error' : (err instanceof Error ? err.message : 'Server Error');
      res.writeHead(500, { 'Content-Type': 'text/plain', ...getSecurityHeaders(), ...getCorsHeaders(req) });
      res.end(message);
    }
  }
});

// WebSocket server: same port as HTTP, path /ws — bridged and connected for status/health
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const fullUrl = request.url || '/';
  const [urlPath, query] = fullUrl.split('?');
  if (urlPath !== WS_PATH) {
    socket.destroy();
    return;
  }
  // Optional WebSocket auth: if WS_AUTH_TOKEN is set, require ?token=<token>
  if (SEC.wsAuthToken) {
    const params = new URLSearchParams(query || '');
    const token = params.get('token');
    if (token !== SEC.wsAuthToken) {
      secLog.wsAuthReject(token ? 'invalid token' : 'missing token');
      socket.destroy();
      return;
    }
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', server: 'jarvis', ws: true, ts: Date.now() }));
  ws.on('message', (data) => {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : { type: 'unknown' };
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      }
    } catch {
      // ignore
    }
  });
  ws.on('close', () => {});
  ws.on('error', () => {});
});

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}${WS_PATH} (bridged)`);
  console.log(`Serving: ${PUBLIC_DIR === DIST_PUBLIC ? 'dist-public (production build)' : 'public (development)'}`);
  if (SEC.n8nProxy.enabled) {
    console.log('N8n: POST /api/n8n-proxy enabled (UI ↔ n8n webhook bridged)');
  }
  if (ENABLE_MCP) {
    console.log('MCP: Desktop Commander bridge enabled at POST /api/mcp/call and GET /api/mcp/tools');
  }
  console.log('Note: AudioWorklet requires HTTPS in production.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=${Number(PORT) + 1} node server.js`);
  } else {
    console.error('Server error:', err);
  }
  process.exitCode = 1;
});
