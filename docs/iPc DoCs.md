# iPc DoCs

**Comprehensive research on Electron Inter-Process Communication (IPC)**  
Based on [Inter-Process Communication | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc), tailored for the JARVIS-WEB project.

---

## 1. Overview

Inter-process communication (IPC) is a key part of building feature-rich desktop applications in Electron. Because the main and renderer processes have different responsibilities in Electron's process model, **IPC is the only way** to perform many common tasks, such as:

- Calling a native API from your UI
- Triggering changes in web contents from native menus
- Bypassing CORS (e.g. n8n webhook from renderer)
- Running MCP/Desktop Commander tools from the main process

---

## 2. IPC Channels

In Electron, processes communicate by passing messages through developer-defined **channels** with the `ipcMain` and `ipcRenderer` modules.

| Property | Description |
|----------|-------------|
| **Arbitrary** | You can name channels anything (e.g. `set-title`, `n8n-webhook`, `mcp-call`) |
| **Bidirectional** | Same channel name can be used for both main and renderer |
| **Serialization** | Uses [Structured Clone Algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — DOM objects, Node.js C++ objects, and Electron objects (WebContents, BrowserWindow) are **not** serializable |

---

## 3. Context Isolation & Preload

Before implementing IPC, you must use a **preload script** to import Node.js and Electron modules in a context-isolated renderer process.

- **Preload script:** Runs before the page loads; has access to both Node.js and `contextBridge`
- **contextBridge:** Exposes a controlled API to the renderer — **never** expose raw `ipcRenderer`
- **Security:** Limit renderer access to Electron APIs as much as possible

**JARVIS-WEB:** `electron/preload.js` uses `contextBridge.exposeInMainWorld('electronAPI', {...})` to expose only safe wrappers.

---

## 4. IPC Patterns (from Electron docs)

### 4.1 Pattern 1: Renderer → Main (one-way)

**Use case:** Fire a one-way message from renderer to main. No response expected.

| API | Location | Purpose |
|-----|----------|---------|
| `ipcRenderer.send(channel, ...args)` | Preload / Renderer | Send message |
| `ipcMain.on(channel, listener)` | Main process | Receive message |

**Example (Electron docs):** Set window title from renderer.

```js
// main.js
ipcMain.on('set-title', (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setTitle(title);
});

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
});
```

**JARVIS-WEB:** Uses `setTitle(title)` for one-way IPC. Renderer can call `window.electronAPI.setTitle('New Title')` to update the window title.

---

### 4.2 Pattern 2: Renderer → Main (two-way)

**Use case:** Call main process and wait for a result. **Recommended** for async requests.

| API | Location | Purpose |
|-----|----------|---------|
| `ipcRenderer.invoke(channel, ...args)` | Preload | Send request; returns Promise |
| `ipcMain.handle(channel, listener)` | Main process | Handle request; return value is sent back |

**Example (Electron docs):** Open file dialog and return path.

```js
// main.js
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  return canceled ? undefined : filePaths[0];
});

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
});
```

**JARVIS-WEB uses this pattern for all three IPC channels:**

| Channel | Handler | Exposed API | Purpose |
|---------|----------|-------------|---------|
| `set-title` | `handleSetTitle` | `setTitle(title)` | Pattern 1: Set window title (one-way) |
| `n8n-webhook` | `handleN8nWebhook` | `invokeN8nWebhook(url, bodyJson)` | POST to n8n from main (no CORS) |
| `mcp-list-tools` | `handleMcpListTools` | `invokeMcpListTools()` | List MCP/Desktop Commander tools |
| `mcp-call` | `handleMcpCall` | `invokeMcpCall(tool, args)` | Call MCP tool from main |
| `menu-action` | (main sends) | `onMenuAction(callback)` | Pattern 3: Main→Renderer (native menu) |

**Legacy (avoid):** `ipcRenderer.send` + `event.reply` for two-way, or `ipcRenderer.sendSync` (blocks renderer).

---

### 4.3 Pattern 3: Main → Renderer

**Use case:** Send a message from main process to a specific renderer.

| API | Location | Purpose |
|-----|----------|---------|
| `webContents.send(channel, ...args)` | Main process | Send to renderer |
| `ipcRenderer.on(channel, listener)` | Preload | Receive in renderer |

**Example (Electron docs):** Update counter from native menu.

```js
// main.js
Menu.buildFromTemplate([{
  label: 'Increment',
  click: () => mainWindow.webContents.send('update-counter', 1)
}]);

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value))
});
```

**Optional reply:** Renderer can send back via `ipcRenderer.send`; main listens with `ipcMain.on`.

**JARVIS-WEB:** Uses `onMenuAction(callback)` for main→renderer IPC. Native menu "View > Send ping to renderer" sends `menu-action` with `{ action: 'ping', payload }`; renderer shows a toast notification.

---

### 4.4 Pattern 4: Renderer → Renderer

There is **no direct** IPC between renderer processes. Options:

1. **Main as broker:** Renderer A → main → Renderer B
2. **MessagePort:** Pass a MessagePort from main to both renderers for direct communication

**JARVIS-WEB:** Single-window app; no renderer-to-renderer need.

---

## 5. JARVIS-WEB IPC Implementation

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RENDERER (public/js/app.js)                                             │
│  - window.electronAPI?.isElectron                                        │
│  - window.electronAPI.setTitle(title)           [Pattern 1 one-way]      │
│  - window.electronAPI.invokeN8nWebhook(url, bodyJson)                    │
│  - window.electronAPI.invokeMcpListTools()                               │
│  - window.electronAPI.invokeMcpCall(tool, args)                          │
│  - window.electronAPI.onMenuAction(cb)          [Pattern 3 main→renderer] │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  ipcRenderer.invoke (via preload)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PRELOAD (electron/preload.js)                                          │
│  - contextBridge.exposeInMainWorld('electronAPI', {...})                 │
│  - Wraps ipcRenderer.invoke for: n8n-webhook, mcp-list-tools, mcp-call  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  IPC channels
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MAIN (electron/main.js)                                                 │
│  - ipcMain.handle('n8n-webhook', handleN8nWebhook)                        │
│  - ipcMain.handle('mcp-list-tools', handleMcpListTools)                   │
│  - ipcMain.handle('mcp-call', handleMcpCall)                             │
│  - fetch() to n8n (no CORS)                                              │
│  - mcp-desktop-commander-bridge.mjs (listTools, callTool)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Channel Details

#### `n8n-webhook`

- **Args:** `{ url: string, body: string }` — body is JSON string
- **Returns:** `{ status, statusText, data }` or throws
- **Validation:** URL must be HTTPS and contain `/webhook/`; payload shape validated
- **Timeout:** 30 seconds
- **Frontend usage:** `public/js/app.js` — when `window.electronAPI?.invokeN8nWebhook` exists, uses it instead of direct fetch (avoids CORS)

#### `mcp-list-tools`

- **Args:** none
- **Returns:** `{ tools: Array<{ name, description?, inputSchema? }> }`
- **Bridge:** `scripts/mcp-desktop-commander-bridge.mjs` — loads `.env`, connects to Desktop Commander MCP

#### `mcp-call`

- **Args:** `{ tool: string, args?: object }`
- **Returns:** MCP tool result (e.g. `{ content?, isError? }`)
- **Bridge:** Same as `mcp-list-tools`

### 5.3 Error Handling

- **ipcMain.handle** errors are serialized; only the `message` property reaches the renderer ([#24427](https://github.com/electron/electron/issues/24427))
- JARVIS-WEB handlers throw descriptive errors (e.g. `Invalid webhook URL`, `Body must be valid JSON`)
- Frontend should catch and display these in the UI

### 5.4 Security

| Measure | Implementation |
|---------|----------------|
| No raw ipcRenderer | Preload exposes only named functions |
| URL validation | `isAllowedWebhookUrl()` — HTTPS, `/webhook/` path |
| Payload validation | `validateN8nPayloadShape()` — message, query, input, session_id, source, attachments |
| Timeout | 30s AbortController on n8n fetch |
| contextIsolation | `true` in webPreferences |
| nodeIntegration | `false` |

---

## 6. Adding New IPC Channels

To add a new two-way channel (recommended pattern):

1. **Main process** (`electron/main.js`):

   ```js
   async function handleMyFeature(_event, arg) {
     // validate arg, do work
     return result;
   }
   app.whenReady().then(() => {
     ipcMain.handle('my-feature', handleMyFeature);
     // ...
   });
   ```

2. **Preload** (`electron/preload.js`):

   ```js
   contextBridge.exposeInMainWorld('electronAPI', {
     // ...existing
     invokeMyFeature: (arg) => ipcRenderer.invoke('my-feature', arg),
   });
   ```

3. **Renderer** (e.g. `public/js/app.js`):

   ```js
   const result = await window.electronAPI.invokeMyFeature(arg);
   ```

For **main→renderer**, add `webContents.send` in main and expose `ipcRenderer.on` via preload (wrap callback to avoid leaking `event.sender`).

---

## 7. Quick Reference

| Pattern | Main | Preload | Renderer |
|--------|------|---------|----------|
| Renderer→Main (one-way) | `ipcMain.on` | `ipcRenderer.send` | `window.electronAPI.foo()` |
| Renderer→Main (two-way) | `ipcMain.handle` | `ipcRenderer.invoke` | `await window.electronAPI.foo()` |
| Main→Renderer | `webContents.send` | `ipcRenderer.on` | `window.electronAPI.onFoo(cb)` |

---

## 8. References

- [Inter-Process Communication | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [ipcMain API](https://www.electronjs.org/docs/latest/api/ipc-main)
- [ipcRenderer API](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Context Isolation Tutorial](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [eLeCtRoN dOcS.md](./eLeCtRoN%20dOcS.md) — project Electron overview
