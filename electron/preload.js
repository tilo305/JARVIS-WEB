const { contextBridge, ipcRenderer } = require('electron');

/**
 * Electron preload bridge — exposes safe APIs to the renderer (frontend).
 * Used by: mic button (voice), text button (send), multi-modal button (paperclip + attachments).
 * All input paths → getLLMReply() → postToN8n (Electron) or fetch (browser).
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Always true when running in Electron */
  isElectron: true,
  /** Platform: 'darwin' | 'win32' | 'linux' */
  platform: process.platform,
  /** Electron/Node versions for debugging */
  versions: {
    electron: process.versions?.electron || '',
    chrome: process.versions?.chrome || '',
    node: process.versions?.node || '',
  },
  /** POST to n8n webhook via main process (bypasses CORS). Used by mic, text, and multi-modal flows. */
  postToN8n: (url, body) => ipcRenderer.invoke('post-to-n8n', { url, body }),
  /** Same as postToN8n but returns { status, statusText, data } for getLLMReply. Used by mic, text, multi-modal. */
  invokeN8nWebhook: (url, body) => ipcRenderer.invoke('post-to-n8n', { url, body }),
  /** Get n8n webhook URL from main process .env (N8N_WEBHOOK_URL). */
  getN8nWebhookUrl: () => ipcRenderer.invoke('get-n8n-webhook-url'),
});
