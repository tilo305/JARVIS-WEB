/**
 * Electron preload script — bridges main process to renderer (UI) in a secure way.
 * Exposes only safe APIs via contextBridge so the frontend can detect Electron
 * and integrate with Cartesia, AudioWorklet, and VAD correctly. Secure context (app://) is required
 * for getUserMedia and AudioWorklet; the bridge uses window.location.origin + '/audio/' for processor paths.
 *
 * Context isolation is kept ON; no nodeIntegration in renderer.
 * Sandbox is ON: no Node built-ins (path, dotenv) — n8n URL comes from main via IPC.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** Get n8n webhook URL from main process (.env loaded there; avoids path/dotenv in preload sandbox). */
  getN8nWebhookUrl: () => ipcRenderer.invoke('get-n8n-webhook-url'),
  /** True when running inside Electron (desktop app). */
  isElectron: true,
  /**
   * Pattern 1 (one-way): Set window title from renderer.
   * @param {string} title - New window title
   */
  setTitle: (title) => ipcRenderer.send('set-title', title),
  /**
   * Pattern 3 (Main→Renderer): Subscribe to menu actions from main process.
   * @param {(payload: { action: string, payload?: unknown }) => void} callback
   */
  onMenuAction: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
  /** Process platform: 'win32' | 'darwin' | 'linux'. */
  platform: process.platform,
  /** Electron version string (e.g. "40.2.1"). */
  versions: typeof process.versions !== 'undefined' ? {
    electron: process.versions.electron || '',
    chrome: process.versions.chrome || '',
  } : {},
  /**
   * Send n8n webhook POST via main process (bypasses CORS).
   * @param {string} url - Full webhook URL (must be https and contain /webhook/)
   * @param {string} bodyJson - JSON string body
   * @returns {Promise<{ status: number, statusText: string, data: object }>}
   */
  invokeN8nWebhook: (url, bodyJson) => ipcRenderer.invoke('n8n-webhook', { url, body: bodyJson }),
  /**
   * MCP (Desktop Commander): list tools. Runs bridge in main process (works without server.js).
   * @returns {Promise<{ tools: Array<{ name: string, description?: string, inputSchema?: object }> }>}
   */
  invokeMcpListTools: () => ipcRenderer.invoke('mcp-list-tools'),
  /**
   * MCP (Desktop Commander): call a tool. Runs bridge in main process (works without server.js).
   * @param {string} tool - Tool name (e.g. read_file, start_process)
   * @param {object} [args] - Tool arguments
   * @returns {Promise<{ content?: Array<{ type: string, text?: string }>, isError?: boolean }>}
   */
  invokeMcpCall: (tool, args) => ipcRenderer.invoke('mcp-call', { tool, args }),
  /** Write text to clipboard (works in sandboxed renderer; delegates to main). */
  writeClipboardText: (text) => ipcRenderer.invoke('write-clipboard', text),
  /** Get media access status (microphone) for permission diagnostics. */
  getMediaAccessStatus: () => ipcRenderer.invoke('get-media-access-status'),
  /** Open system privacy settings for microphone (Windows: ms-settings, macOS: System Preferences). */
  openMicPrivacySettings: () => ipcRenderer.invoke('open-mic-privacy-settings'),
});
