import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvEverywhere } from './scripts/load-env-everywhere.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CARTESIA_VERSION = '2025-04-16'; // Must match src/config.ts API_VERSION
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

/** Vite plugin: block serving .env / .env.* in dev (secrets must not be exposed). */
function blockEnvFilesPlugin() {
  return {
    name: 'block-env-files',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0];
        const base = path.replace(/\/$/, '').split('/').pop() || '';
        if (base === '.env' || base.startsWith('.env.')) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        next();
      });
    },
  };
}

/** Vite plugin: log Cartesia STT/TTS WebSocket reachability at startup and on an interval. */
function cartesiaWebSocketStatusPlugin() {
  return {
    name: 'cartesia-websocket-status',
    apply: 'serve',
    configureServer(server) {
      // Use same envDir as main config so we read root .env, not cwd (which may differ)
      const envDir = server?.config?.envDir || __dirname;
      const env = loadEnv('development', envDir, '');
      const apiKey = env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY || process.env.CARTESIA_API_KEY || '';

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
  // Load .env from project root only
  loadEnvEverywhere(__dirname);
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, ''); // '' = load all keys; frontend only gets VITE_* via define below
  Object.assign(process.env, env);
  return {
    root: 'public',
    publicDir: false,
    envDir, // Ensures dev/build both read root .env
    plugins: [
      preserveIndexHtmlPlugin(),
      blockEnvFilesPlugin(),
      viteStaticCopy({
        targets: [
          { src: 'audio/*', dest: 'audio' },
          { src: 'debug/*.html', dest: 'debug' },
          { src: 'js/n8n-payload.js', dest: 'js' },
          { src: 'keywords/*', dest: 'keywords' }, // Porcupine keyword files (.ppn)
        ],
      }),
      cartesiaWebSocketStatusPlugin(),
    ],
    build: {
      outDir: join(__dirname, 'dist-public'), // absolute path to project root
      emptyOutDir: true,
      chunkSizeWarningLimit: 4096, // main bundle includes Porcupine/TTS deps; suppress size warning
    },
    optimizeDeps: {
      include: [],
      esbuildOptions: {
        // Ensure proper handling of ESM packages
        target: 'es2022',
      },
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      open: true,
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      open: true,
    },
    // Expose env to frontend (from root .env). Use both VITE_* and non-VITE_ names so the same value shows up no matter what is looking for it.
    define: (() => {
      const defaultN8n = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
      const cartesiaApiKey = env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY || '';
      const cartesiaVoiceId = env.VITE_CARTESIA_VOICE_ID || env.CARTESIA_VOICE_ID || '95131c95-525c-463b-893d-803bafdf93c4';
      const n8nWebhookUrl = env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || defaultN8n;
      const wakeWordEnabled = env.VITE_WAKE_WORD_ENABLED || env.WAKE_WORD_ENABLED || 'false';
      const debugWakeWord = env.VITE_DEBUG_WAKE_WORD || env.DEBUG_WAKE_WORD || 'false';
      const useOpenWakeWord = env.VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD || 'false';
      const openWakeWordWsUrl = env.VITE_OPENWAKEWORD_WS_URL || env.OPENWAKEWORD_WS_URL || 'ws://localhost:8765/ws';
      return {
        'import.meta.env.VITE_CARTESIA_API_KEY': JSON.stringify(cartesiaApiKey),
        'import.meta.env.CARTESIA_API_KEY': JSON.stringify(cartesiaApiKey),
        'import.meta.env.VITE_CARTESIA_VOICE_ID': JSON.stringify(cartesiaVoiceId),
        'import.meta.env.CARTESIA_VOICE_ID': JSON.stringify(cartesiaVoiceId),
        'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(n8nWebhookUrl),
        'import.meta.env.N8N_WEBHOOK_URL': JSON.stringify(n8nWebhookUrl),
        'import.meta.env.VITE_WAKE_WORD_ENABLED': JSON.stringify(wakeWordEnabled),
        'import.meta.env.WAKE_WORD_ENABLED': JSON.stringify(wakeWordEnabled),
        'import.meta.env.VITE_DEBUG_WAKE_WORD': JSON.stringify(debugWakeWord),
        'import.meta.env.DEBUG_WAKE_WORD': JSON.stringify(debugWakeWord),
        'import.meta.env.VITE_USE_OPENWAKEWORD': JSON.stringify(useOpenWakeWord),
        'import.meta.env.USE_OPENWAKEWORD': JSON.stringify(useOpenWakeWord),
        'import.meta.env.VITE_OPENWAKEWORD_WS_URL': JSON.stringify(openWakeWordWsUrl),
        'import.meta.env.OPENWAKEWORD_WS_URL': JSON.stringify(openWakeWordWsUrl),
      };
    })(),
  };
});
