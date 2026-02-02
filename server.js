/**
 * Simple static file server for the browser AudioWorklet demo.
 * Serves public/ on http://localhost:3000
 * Required: HTTPS for production (AudioWorklet needs secure context).
 */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(__dirname, 'public');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  let raw = req.url === '/' ? '/index.html' : req.url;
  raw = raw.split('?')[0].replace(/\.\./g, '').replace(/^\//, '');
  const path = join(PUBLIC_DIR, raw);

  if (!path.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
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

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
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
