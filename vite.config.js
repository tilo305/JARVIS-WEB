import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvEverywhere } from './scripts/load-env-everywhere.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Inline error-capture.js in build so Vite does not warn "can't be bundled without type=module". */
function inlineErrorCapturePlugin() {
  return {
    name: 'inline-error-capture',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) return html;
        const scriptTag = '<script src="./js/error-capture.js"></script>';
        if (!html.includes(scriptTag)) return html;
        const path = join(__dirname, 'public', 'js', 'error-capture.js');
        const content = readFileSync(path, 'utf8');
        const inline = `<script>${content}</script>`;
        return html.replace(scriptTag, inline);
      },
    },
  };
}

const CARTESIA_VERSION = '2025-04-16'; // Must match src/config.ts API_VERSION
const STT_WS = 'wss://api.cartesia.ai/stt/websocket';
const TTS_WS = 'wss://api.cartesia.ai/tts/websocket';
const WS_CHECK_MS = 30_000;

/** Vite plugin: ensure built index.html preserves full source (chat-interface, JARVIS_CONFIG, favicon, etc.). Uses relative script path so Electron file:// and static servers both work. Inlines error-capture.js in the written file. */
function preserveIndexHtmlPlugin() {
  return {
    name: 'preserve-index-html',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || join(__dirname, 'dist-public');
      // Prefer entry chunk (app.js → assets/app-*.js); fallback to first assets/*.js
      const jsChunk =
        Object.keys(bundle).find((k) => k.startsWith('assets/') && k.includes('app-') && k.endsWith('.js')) ||
        Object.keys(bundle).find((k) => k.startsWith('assets/') && k.endsWith('.js'));
      if (!jsChunk) return;
      const scriptSrc = './' + jsChunk;
      const sourcePath = join(__dirname, 'public', 'index.html');
      let html = readFileSync(sourcePath, 'utf8');
      // Inline error-capture.js so built HTML does not request it (works in Electron app:// and avoids script-tag warning)
      const scriptTag = '<script src="./js/error-capture.js"></script>';
      if (html.includes(scriptTag)) {
        const capturePath = join(__dirname, 'public', 'js', 'error-capture.js');
        html = html.replace(scriptTag, `<script>${readFileSync(capturePath, 'utf8')}</script>`);
      }
      html = html.replace(
        /<script\s+type="module"\s+src="[^"]*"([^>]*)><\/script>/,
        (_, extra) => `<script type="module" crossorigin src="${scriptSrc}"${extra}></script>`
      );
      // Ensure built index has modulepreload for the chunk (replace dev modulepreload for ./js/app.js)
      html = html.replace(
        /<link\s+rel="modulepreload"\s+href="\.\/js\/app\.js"\s*\/?>/,
        `<link rel="modulepreload" href="${scriptSrc}">`
      );
      writeFileSync(join(outDir, 'index.html'), html);
    },
  };
}

/** Vite plugin: relax CSP in dev so Vite HMR and inline scripts work (no nonce injection). */
function devCspPlugin() {
  const DEV_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' wss://api.cartesia.ai wss: https: http://localhost http://127.0.0.1 blob:; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'none';";
  return {
    name: 'dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/?>/,
        `<meta http-equiv="Content-Security-Policy" content="${DEV_CSP}">`
      );
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
      inlineErrorCapturePlugin(),
      preserveIndexHtmlPlugin(),
      devCspPlugin(),
      blockEnvFilesPlugin(),
      viteStaticCopy({
        targets: [
          { src: 'audio/*', dest: 'audio' },
          { src: 'debug/*.html', dest: 'debug' },
          { src: 'js/n8n-payload.js', dest: 'js' },
          { src: 'js/debug.js', dest: 'js' },
          { src: 'js/error-capture.js', dest: 'js' },
        ],
      }),
      cartesiaWebSocketStatusPlugin(),
    ],
    build: {
      base: './',
      outDir: join(__dirname, 'dist-public'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 4096,
      rollupOptions: {
        // Single JS entry so Rollup bundles app + all deps (including @ricky0123/vad-web) into one chunk for Electron
        input: join(__dirname, 'public', 'js', 'app.js'),
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
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
      const defaultN8n = 'https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96';
      const cartesiaApiKey = env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY || '';
      const cartesiaVoiceId = env.VITE_CARTESIA_VOICE_ID || env.CARTESIA_VOICE_ID || '95131c95-525c-463b-893d-803bafdf93c4';
      const n8nWebhookUrl = env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || defaultN8n;
      // Low-latency bidirectional flow: default true (send on STT final); set to 'false' to wait for silence
      const sendTranscriptOnFinal = env.VITE_SEND_TRANSCRIPT_ON_FINAL !== 'false';
      return {
        'import.meta.env.VITE_CARTESIA_API_KEY': JSON.stringify(cartesiaApiKey),
        'import.meta.env.CARTESIA_API_KEY': JSON.stringify(cartesiaApiKey),
        'import.meta.env.VITE_CARTESIA_VOICE_ID': JSON.stringify(cartesiaVoiceId),
        'import.meta.env.CARTESIA_VOICE_ID': JSON.stringify(cartesiaVoiceId),
        'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(n8nWebhookUrl),
        'import.meta.env.N8N_WEBHOOK_URL': JSON.stringify(n8nWebhookUrl),
        'import.meta.env.VITE_SEND_TRANSCRIPT_ON_FINAL': JSON.stringify(String(sendTranscriptOnFinal)),
      };
    })(),
  };
});
