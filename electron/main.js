/**
 * Electron main process — JARVIS desktop app.
 * Loads frontend (Vite dev server or dist-public), preload bridges electronAPI.
 * IPC: post-to-n8n — used by mic, text, and multi-modal (paperclip) flows via getLLMReply.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const port = process.env.PORT || 3000;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const loadUrl = process.env.ELECTRON_LOAD_URL; // Full URL e.g. http://localhost:3001 (used by electron:dev)
  const loadFromFile = process.env.ELECTRON_LOAD_FILE === '1' || process.env.ELECTRON_LOAD_FILE === 'true';
  const indexPath = join(__dirname, '..', 'dist-public', 'index.html');

  if (loadUrl) {
    win.loadURL(loadUrl); // Uses dynamic port from electron-dev.mjs
  } else if (loadFromFile || !isDev) {
    win.loadFile(indexPath);
  } else {
    win.loadURL(`http://localhost:${port}`);
  }

  if (isDev) {
    win.webContents.openDevTools();
  }
}

/** Get n8n webhook URL from env (used by renderer for Electron-only config) */
ipcMain.handle('get-n8n-webhook-url', async () => {
  return process.env.N8N_WEBHOOK_URL || process.env.VITE_N8N_WEBHOOK_URL || '';
});

/** POST to n8n webhook from main process (bypasses CORS) */
ipcMain.handle('post-to-n8n', async (_event, { url, body }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text().catch(() => '');
    let data = {};
    if (contentType.includes('application/json')) {
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { output: text.trim() };
      }
    } else if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { output: text.trim() };
      }
    }
    return { ok: res.ok, status: res.status, statusText: res.statusText, data };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
});

app.whenReady().then(createWindow);

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
