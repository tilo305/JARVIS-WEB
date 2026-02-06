/**
 * Simple static file server for the browser AudioWorklet demo.
 * Serves dist-public/ when present (after vite build), otherwise public/.
 * Use: npm run serve (or npm run vite:build && npm run serve for production).
 * Required: HTTPS for production (AudioWorklet needs secure context).
 */
import { createServer } from 'http';
import { readFile, access } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvEverywhere, getProjectRoot } from './scripts/load-env-everywhere.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Load .env from project root only
loadEnvEverywhere(getProjectRoot(__dirname));

const PORT = process.env.PORT || 3000;
const DIST_PUBLIC = join(__dirname, 'dist-public');
const PUBLIC_FALLBACK = join(__dirname, 'public');

/** Resolve root directory: prefer dist-public if it exists and has index.html */
async function getPublicDir() {
  try {
    await access(join(DIST_PUBLIC, 'index.html'));
    return DIST_PUBLIC;
  } catch {
    return PUBLIC_FALLBACK;
  }
}

let PUBLIC_DIR = PUBLIC_FALLBACK;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

// Never serve .env or .env.* (secrets must not be exposed over HTTP)
function isEnvFile(relativePath) {
  const base = relativePath.replace(/\/$/, '').split('/').pop() || '';
  return base === '.env' || base.startsWith('.env.');
}

const server = createServer(async (req, res) => {
  const root = PUBLIC_DIR;
  let raw = req.url === '/' ? '/index.html' : req.url;
  raw = raw.split('?')[0].replace(/\.\./g, '').replace(/^\//, '');
  const path = join(root, raw);

  if (!path.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (isEnvFile(raw)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  try {
    const data = await readFile(path);
    const mime = MIME[extname(path)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
});

getPublicDir().then((dir) => {
  PUBLIC_DIR = dir;
  const label = dir === DIST_PUBLIC ? 'dist-public (production build)' : 'public (development)';
  server.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Serving: ${label}`);
    console.log('Note: AudioWorklet requires HTTPS in production.');
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=${Number(PORT) + 1} node server.js`);
  } else {
    console.error('Server error:', err);
  }
  process.exitCode = 1;
});
