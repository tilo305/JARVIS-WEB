import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CARTESIA_VERSION = '2024-06-10';
const STT_WS = 'wss://api.cartesia.ai/stt/websocket';
const TTS_WS = 'wss://api.cartesia.ai/tts/websocket';
const WS_CHECK_MS = 30_000;

/** Vite plugin: ensure built index.html preserves full source (chat-interface, JARVIS_CONFIG, favicon, etc.) */
function preserveIndexHtmlPlugin() {
  return {
    name: 'preserve-index-html',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || join(__dirname, 'dist-public');
      const jsChunk = Object.keys(bundle).find((k) => k.startsWith('assets/') && k.endsWith('.js'));
      if (!jsChunk) return;
      const scriptSrc = '/' + jsChunk;
      const sourcePath = join(__dirname, 'public', 'index.html');
      let html = readFileSync(sourcePath, 'utf8');
      html = html.replace(
        /<script\s+type="module"\s+src="[^"]*"><\/script>/,
        `<script type="module" crossorigin src="${scriptSrc}"></script>`
      );
      writeFileSync(join(outDir, 'index.html'), html);
    },
  };
}

/** Vite plugin: log Cartesia STT/TTS WebSocket reachability at startup and on an interval. */
function cartesiaWebSocketStatusPlugin() {
  return {
    name: 'cartesia-websocket-status',
    apply: 'serve',
    configureServer() {
      const env = loadEnv('development', process.cwd(), '');
      const apiKey = env.CARTESIA_API_KEY || process.env.CARTESIA_API_KEY || '';

      async function checkEndpoint(baseUrl) {
        const url = `${baseUrl}?api_key=${encodeURIComponent(apiKey)}&cartesia_version=${CARTESIA_VERSION}`;
        const { default: WebSocket } = await import('ws');
        return new Promise((resolve) => {
          let resolved = false;
          const done = (ok, msg) => {
            if (resolved) return;
            resolved = true;
            resolve(ok ? { ok: true } : { ok: false, msg: msg || 'unreachable' });
          };
          const t = setTimeout(() => done(false, 'timeout'), 5000);
          const ws = new WebSocket(url);
          ws.on('open', () => {
            clearTimeout(t);
            ws.close();
            done(true);
          });
          ws.on('error', (err) => {
            clearTimeout(t);
            done(false, err.message);
          });
          ws.on('close', (code, reason) => {
            clearTimeout(t);
            if (!resolved) done(false, `closed ${code} ${String(reason || '').trim()}`);
          });
        });
      }

      async function runCheck() {
        if (!apiKey) {
          console.log('[WS] Cartesia: no CARTESIA_API_KEY — STT/TTS will fail in browser.');
          return;
        }
        const [stt, tts] = await Promise.all([
          checkEndpoint(STT_WS),
          checkEndpoint(TTS_WS),
        ]);
        console.log('[WS] Cartesia STT:', stt.ok ? 'OK' : stt.msg);
        console.log('[WS] Cartesia TTS:', tts.ok ? 'OK' : tts.msg);
      }

      runCheck();
      setInterval(runCheck, WS_CHECK_MS);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: 'public',
    publicDir: false,
    plugins: [
      preserveIndexHtmlPlugin(),
      viteStaticCopy({
        targets: [
          { src: 'audio/*', dest: 'audio' },
          { src: 'debug/*.html', dest: 'debug' },
          { src: 'js/n8n-payload.js', dest: 'js' },
        ],
      }),
      cartesiaWebSocketStatusPlugin(),
    ],
    build: {
      outDir: 'dist-public', // relative to config file (project root), not to root: 'public'
      emptyOutDir: true,
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      open: true,
    },
    define: {
      'import.meta.env.VITE_CARTESIA_API_KEY': JSON.stringify(env.CARTESIA_API_KEY || ''),
      'import.meta.env.VITE_CARTESIA_VOICE_ID': JSON.stringify(env.CARTESIA_VOICE_ID || ''),
      'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(
        env.VITE_N8N_WEBHOOK_URL || 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4'
      ),
    },
  };
});
