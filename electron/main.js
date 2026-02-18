/**
 * Electron main process — JARVIS desktop app.
 *
 * Integration:
 * - Frontend/UI: Loads Vite dev server (dev) or dist-public/index.html (built).
 * - Preload (preload.js): Exposes electronAPI (isElectron, platform, invokeN8nWebhook, invokeMcp*) via contextBridge.
 * - Vite: Serves/bundles public/ (app.js, cartesia-audio-bridge, vad-config, audio/*).
 * - Cartesia: STT/TTS WebSockets run in renderer; API key from Vite define / .env.
 * - AudioWorklet: Processors loaded from absolute URL (http or file://); bridge uses file:// in built app.
 * - VAD: @ricky0123/vad-web runs in renderer; same MediaStream as STT pipeline.
 * - n8n webhook: Renderer can call invokeN8nWebhook so the request is made from main (no CORS).
 * - MCP (Desktop Commander): Renderer can call invokeMcpListTools / invokeMcpCall; main runs same bridge as server.js (no HTTP server needed).
 */
import { app, BrowserWindow, ipcMain, Menu, dialog, session, clipboard } from 'electron';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

// Ensure every console.error and console.warn from main process is logged to the terminal
const ts = () => new Date().toISOString();
const stderrWrite = process.stderr.write.bind(process.stderr);
const _err = console.error;
const _warn = console.warn;
console.error = function (...args) {
  stderrWrite(`[${ts()}] [Electron Main] [ERROR] ${args.map(a => (typeof a === 'object' && a != null ? JSON.stringify(a) : String(a))).join(' ')}\n`);
  _err.apply(console, args);
};
console.warn = function (...args) {
  stderrWrite(`[${ts()}] [Electron Main] [WARN] ${args.map(a => (typeof a === 'object' && a != null ? JSON.stringify(a) : String(a))).join(' ')}\n`);
  _warn.apply(console, args);
};
process.on('uncaughtException', (err) => {
  stderrWrite(`[${ts()}] [Electron Main] [uncaughtException] ${err.stack || err.message || err}\n`);
  _err('[Electron Main] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
  stderrWrite(`[${ts()}] [Electron Main] [unhandledRejection] ${msg}\n`);
  _err('[Electron Main] unhandledRejection:', reason);
});

const N8N_PROXY_TIMEOUT_MS = 30000;
const DEFAULT_N8N_WEBHOOK = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';

/** Only allow HTTPS webhook URLs to avoid SSRF and protocol abuse. */
function isAllowedWebhookUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.pathname.includes('/webhook/');
  } catch {
    return false;
  }
}

/**
 * Minimal payload validation before forwarding to n8n.
 * Must match frontend payload shape (message, query, input, session_id, sessionId, source, attachments).
 */
function validateN8nPayloadShape(payload) {
  if (!payload || typeof payload !== 'object') return 'Payload must be a JSON object';
  if (typeof payload.message !== 'string') return 'payload.message must be a string';
  if (typeof payload.query !== 'string') return 'payload.query must be a string';
  if (typeof payload.input !== 'string') return 'payload.input must be a string';
  if (payload.message !== payload.query || payload.message !== payload.input) return 'message, query, and input must be the same value';
  if (!payload.session_id && !payload.sessionId) return 'payload must have session_id or sessionId';
  if (payload.source !== 'voice' && payload.source !== 'text') return "payload.source must be 'voice' or 'text'";
  if (!Array.isArray(payload.attachments)) return 'payload.attachments must be an array';
  return null;
}

/**
 * Handle n8n webhook POST from renderer. Main process is not subject to CORS.
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {{ url: string, body: string }} arg - url and JSON body string
 * @returns {{ status: number, statusText: string, data: object }} or throws
 */
async function handleN8nWebhook(event, arg) {
  if (!validateIpcSender(event.senderFrame)) {
    throw new Error('Invalid IPC sender');
  }
  const { url, body } = arg || {};
  if (!isAllowedWebhookUrl(url)) {
    throw new Error('Invalid webhook URL');
  }
  if (typeof body !== 'string') {
    throw new Error('Body must be a JSON string');
  }
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error('Body must be valid JSON');
  }
  const validationError = validateN8nPayloadShape(payload);
  if (validationError) {
    throw new Error(`Invalid n8n payload: ${validationError}`);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const contentType = res.headers.get('content-type') || '';
    let data = {};
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => '');
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { output: text.trim() };
        }
      }
    }
    return { status: res.status, statusText: res.statusText, data };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const e = new Error('Request timed out after 30s');
      e.name = 'AbortError';
      throw e;
    }
    // Log actual failure for diagnosis (DNS, connection refused, TLS, etc.)
    const code = err.code || err.cause?.code;
    const msg = err.message || err.cause?.message || 'Network error';
    console.error('[Electron n8n] fetch failed:', { url, code, message: msg });
    const e = new Error(code ? `${code}: ${msg}` : msg);
    e.code = code;
    e.cause = err;
    throw e;
  }
}

/** Project root (parent of electron/). */
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VITE_DEV_PORT = Number(process.env.PORT) || 3000;

/** Allowed origins for IPC and navigation (Electron security checklist #13, #17). */
const ALLOWED_ORIGINS = new Set([
  `http://localhost:${VITE_DEV_PORT}`,
  `http://127.0.0.1:${VITE_DEV_PORT}`,
]);

/**
 * Validate IPC sender frame — only accept from our app (Electron security checklist #17).
 * @param {import('electron').WebFrameMain} frame
 * @returns {boolean}
 */
function validateIpcSender(frame) {
  if (!frame || !frame.url) return false;
  try {
    const u = new URL(frame.url);
    if (u.protocol === 'file:') {
      return u.pathname.includes('dist-public') || u.pathname.includes('index.html');
    }
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      const origin = u.origin;
      return ALLOWED_ORIGINS.has(origin) || u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    }
    return false;
  } catch {
    return false;
  }
}

/** Load .env into process.env so MCP bridge sees ENABLE_MCP, MCP_USE_DOCKER, etc. */
async function loadEnvForElectron() {
  try {
    const { loadEnvEverywhere } = await import(pathToFileURL(resolve(PROJECT_ROOT, 'scripts/load-env-everywhere.mjs')).href);
    loadEnvEverywhere(PROJECT_ROOT);
  } catch {
    // Optional: .env may be missing or script not available
  }
}

/** MCP: list tools (Desktop Commander bridge in main process). */
async function handleMcpListTools(event) {
  if (!validateIpcSender(event.senderFrame)) {
    throw new Error('Invalid IPC sender');
  }
  await loadEnvForElectron();
  const { listTools } = await import(pathToFileURL(resolve(PROJECT_ROOT, 'scripts/mcp-desktop-commander-bridge.mjs')).href);
  return listTools();
}

/** MCP: call tool (Desktop Commander bridge in main process). */
async function handleMcpCall(event, { tool, args }) {
  if (!validateIpcSender(event.senderFrame)) {
    throw new Error('Invalid IPC sender');
  }
  if (!tool || typeof tool !== 'string') {
    throw new Error('MCP call requires tool (string)');
  }
  await loadEnvForElectron();
  const { callTool } = await import(pathToFileURL(resolve(PROJECT_ROOT, 'scripts/mcp-desktop-commander-bridge.mjs')).href);
  return callTool(tool, args ?? {});
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const useBuilt =
  process.env.USE_BUILT === '1' ||
  process.env.USE_BUILT === 'true' ||
  app.isPackaged;
const isDev = !useBuilt && (process.env.NODE_ENV === 'development' || !app.isPackaged);

/** Preload script path — bridges main to renderer (contextBridge only). Must be absolute. */
const PRELOAD_PATH = resolve(__dirname, 'preload.js');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f0f15', // Matches app theme; avoids white flash before ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: PRELOAD_PATH,
      // Required for getUserMedia, AudioWorklet, and Cartesia WebSockets
      webSecurity: true,
    },
    title: 'JARVIS — Voice & Chat',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Forward every renderer console message to terminal (every error and warning + log/info/debug)
  // Supports (event, level, message, line, sourceId) or event object with same props
  mainWindow.webContents.on('console-message', (event, levelOrUndef, messageOrUndef, lineOrUndef, sourceIdOrUndef) => {
    const level = levelOrUndef ?? event?.level ?? 0;
    const message = messageOrUndef ?? event?.message ?? '';
    const line = lineOrUndef ?? event?.line;
    const sourceId = sourceIdOrUndef ?? event?.sourceId;
    const src = sourceId != null && line != null ? ` ${sourceId}:${line}` : '';
    const prefix = `[Renderer]${src}`;
    if (level === 3) {
      console.error(prefix, message);
    } else if (level === 2) {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  });

  // Native application menu (Pattern 3: Main→Renderer for menu-action)
  const showAbout = () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'About JARVIS',
      message: 'JARVIS — Voice & Chat',
      detail: 'Voice-powered AI assistant with Cartesia STT/TTS.\nElectron desktop app with IPC (n8n webhook, MCP).',
    });
  };
  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        { label: 'About JARVIS', click: showAbout },
        { type: 'separator' },
        ...(process.platform === 'darwin' ? [
          { role: 'services', label: 'Services' },
          { type: 'separator' },
          { role: 'hide', label: 'Hide JARVIS' },
          { role: 'hideOthers', label: 'Hide Others' },
          { role: 'unhide', label: 'Show All' },
          { type: 'separator' },
        ] : []),
        { role: 'quit', label: 'Quit JARVIS' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
        {
          label: 'Send ping to renderer',
          click: () => {
            if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
              mainWindow.webContents.send('menu-action', { action: 'ping', payload: 'Pong from main process' });
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About JARVIS', click: showAbout },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    const devUrl = `http://localhost:${VITE_DEV_PORT}`;
    mainWindow.loadURL(devUrl).catch(() => {
      console.warn(
        '[Electron] Vite dev server not running. Start it with: npm run dev:browser or npm run dev:electron'
      );
    });
    mainWindow.webContents.openDevTools();
  } else {
    const indexHtml = resolve(__dirname, '..', 'dist-public', 'index.html');
    mainWindow.loadFile(indexHtml);
  }
}

/** Pattern 1 (one-way): Set window title from renderer. */
function handleSetTitle(event, title) {
  if (!validateIpcSender(event.senderFrame)) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && typeof title === 'string' && title.trim()) {
    win.setTitle(title.trim());
  }
}

app.whenReady().then(() => {
  // --- Electron security checklist: session & navigation ---
  const ses = session.defaultSession;

  // #5: Handle permission requests (notifications, etc.) — only allow for our app origins
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    let allowed = false;
    try {
      const u = new URL(url);
      if (u.protocol === 'file:' && (u.pathname.includes('dist-public') || u.pathname.includes('index.html'))) {
        allowed = permission === 'media' || permission === 'microphone' || permission === 'notifications';
      } else if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && (u.protocol === 'http:' || u.protocol === 'https:')) {
        allowed = permission === 'media' || permission === 'microphone' || permission === 'notifications';
      }
    } catch { /* invalid URL */ }
    callback(allowed);
  });

  // #7: Content-Security-Policy — strict CSP per cSp DoCs
  // For file:// (built app): we cannot inject nonces, so use unsafe-inline fallback.
  // For http://localhost: preserve server's CSP (with nonce) — do not overwrite.
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    try {
      const u = new URL(details.url);
      if (u.protocol === 'file:') {
        // No strict-dynamic: we cannot inject nonces for file://. Use host allowlist.
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "connect-src 'self' wss://api.cartesia.ai wss: https: http://localhost http://127.0.0.1 blob:",
          "img-src 'self' data: blob:",
          "media-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-ancestors 'none'",
        ].join('; ');
        headers['Content-Security-Policy'] = [csp];
      }
      // For http(s): leave existing CSP from server (nonce-based when using server.js)
    } catch { /* invalid URL */ }
    callback({ responseHeaders: headers });
  });

  // #13, #14: Limit navigation and new windows (web-contents-created)
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      try {
        const u = new URL(navigationUrl);
        const ok =
          (u.protocol === 'file:' && (u.pathname.includes('dist-public') || u.pathname.includes('index.html'))) ||
          ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.protocol === 'http:');
        if (!ok) event.preventDefault();
      } catch {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler(() => {
      // Deny all — no popups. External links should use <a target="_blank"> + will-navigate or shell.openExternal with allowlist
      return { action: 'deny' };
    });

    // #12: If webview is ever used, enforce secure options
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      delete webPreferences.preload;
      webPreferences.nodeIntegration = false;
      webPreferences.contextIsolation = true;
      if (!params.src || !params.src.startsWith('https://')) {
        event.preventDefault();
      }
    });
  });

  ipcMain.on('set-title', handleSetTitle);
  ipcMain.handle('get-n8n-webhook-url', async (event) => {
    if (!validateIpcSender(event.senderFrame)) {
      throw new Error('Invalid IPC sender');
    }
    await loadEnvForElectron();
    return process.env.VITE_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK;
  });
  ipcMain.handle('n8n-webhook', handleN8nWebhook);
  ipcMain.handle('mcp-list-tools', handleMcpListTools);
  ipcMain.handle('mcp-call', handleMcpCall);
  ipcMain.handle('write-clipboard', (event, text) => {
    if (validateIpcSender(event.senderFrame) && typeof text === 'string') {
      clipboard.writeText(text);
      return true;
    }
    return false;
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
