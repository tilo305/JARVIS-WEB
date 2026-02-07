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
 * - Building Secure and Reliable Systems (Google)
 * - Security Engineering best practices
 */
import { createServer } from 'http';
import { loadEnvEverywhere } from './scripts/load-env-everywhere.mjs';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
loadEnvEverywhere(__dirname);
const PORT = process.env.PORT || 3000;
const WS_PATH = '/ws';
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
 * Security headers based on OWASP recommendations
 */
function getSecurityHeaders() {
  const headers = {
    // Content Security Policy - prevents XSS, injection attacks
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
      ...(IS_PRODUCTION ? ["upgrade-insecure-requests"] : []),
    ].join('; '),
    
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
  
  // HTTP Strict Transport Security - force HTTPS in production
  if (IS_PRODUCTION) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  return headers;
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

const server = createServer(async (req, res) => {
  let raw = req.url === '/' ? '/index.html' : req.url;
  raw = raw.split('?')[0].replace(/\.\./g, '').replace(/^\//, '');
  const path = normalize(join(PUBLIC_DIR, raw));

  // Security: Prevent path traversal and access to sensitive files
  if (!path.startsWith(PUBLIC_DIR) || isBlockedPath(path)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(path);
    const mime = MIME[extname(path)] || 'application/octet-stream';
    
    // Apply security headers
    const headers = {
      'Content-Type': mime,
      ...getSecurityHeaders(),
    };
    
    res.writeHead(200, headers);
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...getSecurityHeaders() });
      res.end('Not Found');
    } else {
      // Don't leak error details in production
      const message = IS_PRODUCTION ? 'Server Error' : (err instanceof Error ? err.message : 'Server Error');
      res.writeHead(500, { 'Content-Type': 'text/plain', ...getSecurityHeaders() });
      res.end(message);
    }
  }
});

// WebSocket server: same port as HTTP, path /ws — bridged and connected for status/health
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const urlPath = (request.url || '/').split('?')[0];
  if (urlPath !== WS_PATH) {
    socket.destroy();
    return;
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
