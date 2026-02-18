# Desktop Commander MCP — Running inside JARVIS-WEB

This doc describes how to run **Desktop Commander MCP inside your app** so that your JARVIS-WEB server (and n8n) can call terminal and file tools without using Cursor or Claude Desktop.

**Reference:** [DesktopCommanderMCP @ 8d1e7e8](https://github.com/wonderwhy-er/DesktopCommanderMCP/tree/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59)

---

## Overview

- **server.js** spawns the Desktop Commander MCP server (via **Docker** or **npx**) and talks to it using the MCP protocol.
- Two HTTP endpoints are exposed when MCP is enabled:
  - **GET /api/mcp/tools** — list available tools.
  - **POST /api/mcp/call** — call a tool by name with arguments.
- Your **browser** can call these only if you add a proxy from the front-end to the same origin (e.g. your app calls `fetch('/api/mcp/call', ...)`).
- **n8n** can call your JARVIS-WEB server (e.g. `http://your-server:3000/api/mcp/call`) from an HTTP Request node so the AI/voice flow can run commands or edit files.

---

## 1. Prerequisites

- **Docker Desktop** (recommended): so the MCP server runs in a container with optional workspace mount.
- Or **Node.js 18+** and `npx` if you prefer not to use Docker (`MCP_USE_DOCKER=0`).
- Desktop Commander image (when using Docker): `docker pull mcp/desktop-commander:latest` (done automatically on first use).

---

## 2. Enable MCP in the app

In your **.env** (or environment):

```env
ENABLE_MCP=1
```

Optional:

```env
MCP_API_SECRET=your-secret-here
MCP_USE_DOCKER=1
MCP_DOCKER_IMAGE=mcp/desktop-commander:latest
MCP_WORKSPACE_PATH=C:/Users/You/Projects/JARVIS-WEB
```

- **MCP_API_SECRET** — If set, every request to `/api/mcp/*` must include either:
  - Header `X-MCP-Secret: your-secret-here`, or
  - Header `Authorization: Bearer your-secret-here`
- **MCP_USE_DOCKER** — `1` (default) = run Desktop Commander via Docker; `0` = run via `npx @wonderwhy-er/desktop-commander@latest`.
- **MCP_WORKSPACE_PATH** — Directory to mount as `/workspace` in the container (Docker only). Defaults to the server’s current working directory. Use forward slashes on Windows (e.g. `C:/Users/...`).
- **MCP_DOCKER_IMAGE** — Docker image name. Default: `mcp/desktop-commander:latest`.

Restart the server after changing env:

```bash
node server.js
```

You should see in the console:

```
MCP: Desktop Commander bridge enabled at POST /api/mcp/call and GET /api/mcp/tools
```

---

## 3. API usage

Base URL: `http://localhost:3000` (or your server URL). If **MCP_API_SECRET** is set, add a header to every request.

### List tools

```http
GET /api/mcp/tools
X-MCP-Secret: your-secret-here   (if MCP_API_SECRET is set)
```

Response (example):

```json
{
  "tools": [
    { "name": "read_file", "description": "...", "inputSchema": { ... } },
    { "name": "write_file", ... },
    { "name": "start_process", ... }
  ]
}
```

### Call a tool

```http
POST /api/mcp/call
Content-Type: application/json
X-MCP-Secret: your-secret-here   (if MCP_API_SECRET is set)

{
  "tool": "read_file",
  "arguments": {
    "path": "/workspace/README.md",
    "offset": 0,
    "limit": 50
  }
}
```

Alternative body shape (same effect):

```json
{
  "name": "read_file",
  "args": { "path": "/workspace/README.md" }
}
```

Response (example):

```json
{
  "content": [
    { "type": "text", "text": "# JARVIS-WEB\n\n..." }
  ],
  "isError": false
}
```

If the tool errors, the response will include `"isError": true` and error details in `content`.

---

## 4. Using from the browser (same origin)

From your front-end (e.g. `public/js/app.js` or a debug page), you can call the API on the same origin:

```javascript
// List tools
const toolsRes = await fetch('/api/mcp/tools', {
  headers: { 'X-MCP-Secret': 'your-secret' }  // only if MCP_API_SECRET is set
});
const { tools } = await toolsRes.json();

// Call a tool
const callRes = await fetch('/api/mcp/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-MCP-Secret': 'your-secret'  // only if set
  },
  body: JSON.stringify({
    tool: 'read_file',
    arguments: { path: '/workspace/README.md', limit: 100 }
  })
});
const result = await callRes.json();
```

Do **not** expose the app (or MCP endpoints) to the public internet without auth and HTTPS; MCP can run arbitrary commands and read/write files.

---

## 5. Using from n8n

So that **JARVIS voice** can trigger terminal or file operations:

1. In your n8n workflow, after the node that receives the user message (e.g. Webhook), add logic (e.g. LLM or a switch) to decide when to run an MCP tool.
2. Add an **HTTP Request** node:
   - **Method:** POST
   - **URL:** `http://your-jarvis-server:3000/api/mcp/call`  
     (Use the machine that runs `node server.js`. If n8n runs on the same host, `http://localhost:3000` is fine.)
   - **Headers:**  
     `Content-Type: application/json`  
     If you set **MCP_API_SECRET**, add: `X-MCP-Secret: your-secret` or `Authorization: Bearer your-secret`.
   - **Body (JSON):**

     ```json
     {
       "tool": "start_process",
       "arguments": { "command": "ls -la /workspace" }
     }
     ```

3. Use the HTTP response (e.g. `content[0].text`) in the next step (e.g. to form the reply to the user or to another node).

Example tools you might call from n8n:

| Tool            | Typical use                          |
|-----------------|--------------------------------------|
| `read_file`     | Read a file (path: e.g. `/workspace/...`) |
| `write_file`    | Write or append to a file            |
| `list_directory`| List files in a directory            |
| `start_process` | Run a shell command                  |
| `edit_block`    | Search/replace in a file             |

See [Desktop Commander README](https://github.com/wonderwhy-er/DesktopCommanderMCP) for the full list and argument schemas.

---

## 6. Security

- **MCP can run arbitrary commands and access the filesystem.** Restrict who can call `/api/mcp/*`:
  - Set **MCP_API_SECRET** and only give it to trusted callers (your app, n8n).
  - Do not expose the server to the internet without authentication and HTTPS; if you must, put the app behind a reverse proxy with auth.
- **Docker:** The container sees only what you mount (e.g. `MCP_WORKSPACE_PATH` → `/workspace`). Use a dedicated directory if you want to limit scope.
- **n8n:** If n8n is on another host, use a strong **MCP_API_SECRET** and HTTPS for the JARVIS-WEB server.

---

## 7. Troubleshooting

| Issue | What to try |
|-------|-------------|
| “Docker not found” or spawn error | Ensure Docker Desktop is running and `docker` is on PATH. Or set `MCP_USE_DOCKER=0` to use npx. |
| 401 Unauthorized | Set the same value as **MCP_API_SECRET** in the request header (`X-MCP-Secret` or `Authorization: Bearer ...`). |
| Tool call times out | Some tools (e.g. long-running commands) may take a while; consider increasing timeouts in n8n or the client. |
| Path not found in container | When using Docker, paths inside the container are under `/workspace` if you set **MCP_WORKSPACE_PATH**. Use `/workspace/relative/path` in tool arguments. |
| MCP not enabled | Confirm `ENABLE_MCP=1` (or `true`) in .env and restart the server. Check the console for the “MCP: Desktop Commander bridge enabled” line. |

---

## 8. Electron (desktop app)

When the app runs inside **Electron** (dev or built), the MCP bridge runs in the **main process** via IPC. You do **not** need to run `server.js` for MCP to work.

- **Renderer** can call:
  - `window.electronAPI.invokeMcpListTools()` → returns `{ tools: [...] }`
  - `window.electronAPI.invokeMcpCall(tool, args)` → returns the same shape as `POST /api/mcp/call`
- Set **ENABLE_MCP=1** (and optional **MCP_USE_DOCKER**, **MCP_WORKSPACE_PATH**) in your environment or `.env` before starting Electron so the bridge uses the same config. The main process loads `.env` from the project root when the first MCP IPC call is made.
- **Built app** (`npm run electron:built`): no HTTP server; MCP is available only via `electronAPI` in the renderer. **Dev** (`npm run dev:electron`): same — Vite serves the UI, MCP runs in Electron main.

---

## 9. Relation to other docs

- **DESKTOP-COMMANDER-MCP-RESEARCH.md** — Explains how Desktop Commander fits with JARVIS-WEB (Options A/B/C). This in-app bridge is **Option C** (expose tools to n8n / app).
- **DESKTOP-COMMANDER-DOCKER-SETUP.md** — Setup for using Desktop Commander **in Cursor** via Docker; separate from running MCP inside the app.
- **Electron:** MCP works in Electron via `window.electronAPI.invokeMcpListTools()` and `invokeMcpCall(tool, args)` (see §8 above).
