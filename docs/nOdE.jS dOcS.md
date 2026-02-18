# nOdE.jS dOcS

**Comprehensive research on Node.js documentation (nodejs.org)**  
Based on [Node.js v25.6.1 Documentation](https://nodejs.org/docs/latest/), tailored for the JARVIS-WEB project.

---

## 1. Overview

Node.js is a JavaScript runtime built on Chrome's V8 engine. It enables server-side JavaScript execution and provides built-in modules for HTTP servers, file system access, path handling, process control, and more. JARVIS-WEB uses Node.js for:

- **server.js** — HTTP static file server + WebSocket bridge + MCP API
- **Electron main process** — Desktop app entry point
- **Scripts** — Build, env loading, process spawning, port management
- **Vite** — Dev server and production builds

- **Source:** [nodejs.org/docs/latest](https://nodejs.org/docs/latest/)
- **API index:** [nodejs.org/docs/latest/api](https://nodejs.org/docs/latest/api/)
- **Upstream:** [github.com/nodejs/node](https://github.com/nodejs/node)

**JARVIS-WEB:** `package.json` requires `"engines": { "node": ">=18.0.0" }`.

---

## 2. Where to Find Node.js Docs

| Purpose | URL |
|--------|-----|
| Latest docs | [nodejs.org/docs/latest](https://nodejs.org/docs/latest/) |
| API index | [nodejs.org/docs/latest/api](https://nodejs.org/docs/latest/api/) |
| Version-specific | `https://nodejs.org/docs/vX.XX.X/` |
| CLI options | [nodejs.org/docs/latest/api/cli.html](https://nodejs.org/docs/latest/api/cli.html) |
| Package schema | [nodejs.org/docs/latest](https://nodejs.org/docs/latest/) → `node-config-schema.json` |

---

## 3. Node.js APIs Used by JARVIS-WEB

### 3.1 server.js

| Module | Usage | Doc |
|--------|-------|-----|
| `node:http` | `createServer`, `req`/`res` handling, `req.on('data'|'end'|'error')`,`server.listen`,`server.on('upgrade'|'error')` | [HTTP](https://nodejs.org/docs/latest/api/http.html) |
| `node:fs/promises` | `readFile` for static files | [fs/promises](https://nodejs.org/docs/latest/api/fs.html#promises-api) |
| `node:fs` | `existsSync` for path checks | [fs](https://nodejs.org/docs/latest/api/fs.html) |
| `node:path` | `join`, `extname`, `normalize` for path resolution | [path](https://nodejs.org/docs/latest/api/path.html) |
| `node:url` | `fileURLToPath` for `__dirname` in ESM | [url](https://nodejs.org/docs/latest/api/url.html) |
| `process.env` | `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`, `ENABLE_MCP`, `MCP_API_SECRET` | [process](https://nodejs.org/docs/latest/api/process.html), [environment](https://nodejs.org/docs/latest/api/environment_variables.html) |
| `Buffer` | `Buffer.concat(chunks).toString('utf8')` for JSON body parsing | [buffer](https://nodejs.org/docs/latest/api/buffer.html) |

### 3.2 Scripts (load-env-everywhere, kill-port-then-vite, etc.)

| Module | Usage | Doc |
|--------|-------|-----|
| `node:fs` | `existsSync`, `readFileSync`, `rmSync`, `readFile`, `readdir`, `writeFile` | [fs](https://nodejs.org/docs/latest/api/fs.html) |
| `node:fs/promises` | `readFile`, `readdir`, `writeFile` | [fs/promises](https://nodejs.org/docs/latest/api/fs.html#promises-api) |
| `node:path` | `join`, `dirname`, `resolve`, `relative` | [path](https://nodejs.org/docs/latest/api/path.html) |
| `node:url` | `fileURLToPath` for `__dirname` in ESM | [url](https://nodejs.org/docs/latest/api/url.html) |
| `node:child_process` | `spawn`, `exec` for subprocesses | [child_process](https://nodejs.org/docs/latest/api/child_process.html) |
| `node:util` | `promisify` for callback-style APIs | [util](https://nodejs.org/docs/latest/api/util.html) |
| `node:https` / `node:http` | `https`, `http` for downloads | [https](https://nodejs.org/docs/latest/api/https.html), [http](https://nodejs.org/docs/latest/api/http.html) |

### 3.3 Electron main process

| Module | Usage | Doc |
|--------|-------|-----|
| `node:path` | `dirname`, `resolve`, `pathToFileURL` | [path](https://nodejs.org/docs/latest/api/path.html) |
| `node:url` | `fileURLToPath`, `pathToFileURL` | [url](https://nodejs.org/docs/latest/api/url.html) |

---

## 4. Key Modules (Reference)

### 4.1 HTTP

`node:http` provides HTTP server and client. JARVIS-WEB uses `createServer`:

```javascript
import { createServer } from 'http';
const server = createServer(async (req, res) => {
  // req.url, req.method, req.headers
  // res.writeHead(status, headers), res.end(data)
});
server.listen(PORT, () => { ... });
server.on('upgrade', (request, socket, head) => { ... });
```

- [HTTP API](https://nodejs.org/docs/latest/api/http.html)
- [Usage example (synopsis)](https://nodejs.org/docs/latest/api/synopsis.html)

### 4.2 File system (fs)

`node:fs` and `node:fs/promises` provide three forms: callback, sync, and promise.

- **Promise:** `import { readFile } from 'fs/promises'` — preferred for async
- **Sync:** `import { existsSync } from 'fs'` — for path checks
- **Callback:** `import { unlink } from 'fs'` — for max performance

JARVIS-WEB uses `readFile` (promises), `existsSync`, `readFileSync`, `rmSync`, `readdir`, `writeFile`.

- [fs API](https://nodejs.org/docs/latest/api/fs.html)
- [fs/promises](https://nodejs.org/docs/latest/api/fs.html#promises-api)

### 4.3 Path

`node:path` provides cross-platform path utilities. On Windows, behavior differs from POSIX; use `path.win32` or `path.posix` for consistent results when needed.

| Method | Purpose |
|--------|---------|
| `join(...)` | Join path segments |
| `dirname(path)` | Directory of path |
| `extname(path)` | File extension |
| `normalize(path)` | Normalize path |
| `resolve(...)` | Resolve to absolute path |

- [path API](https://nodejs.org/docs/latest/api/path.html)

### 4.4 URL

`node:url` provides URL parsing and resolution. Two APIs: legacy (`url.parse`) and WHATWG (`new URL`).

- `fileURLToPath(url)` — Convert `file:` URL to file path (used for `__dirname` in ESM)
- `pathToFileURL(path)` — Convert path to `file:` URL

- [url API](https://nodejs.org/docs/latest/api/url.html)

### 4.5 Process

`process` provides process info and control:

- `process.env` — Environment variables
- `process.exitCode` — Exit code
- `process.on('exit', ...)` — Exit handler

`process` is an instance of `EventEmitter`.

- [process API](https://nodejs.org/docs/latest/api/process.html)
- [environment variables](https://nodejs.org/docs/latest/api/environment_variables.html)

### 4.6 Buffer

`Buffer` represents fixed-length byte sequences. Used for request body handling:

```javascript
const raw = Buffer.concat(chunks).toString('utf8');
```

- [buffer API](https://nodejs.org/docs/latest/api/buffer.html)

### 4.7 Child process

`node:child_process` for spawning subprocesses:

- `spawn` — Stream-based (e.g. `electron`, `vite`)
- `exec` — Shell command, buffer output

- [child_process API](https://nodejs.org/docs/latest/api/child_process.html)

---

## 5. ECMAScript Modules (ESM)

JARVIS-WEB uses ESM (`"type": "module"` in package.json). Key points:

- **Import specifiers:** Use `node:` prefix for built-ins: `import { readFile } from 'node:fs/promises'`
- **Relative imports:** Must include file extension (e.g. `./foo.mjs`)
- **`__dirname` in ESM:** Use `fileURLToPath` + `import.meta.url`:

```javascript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

- **Dynamic import:** `await import('./module.mjs')` for conditional loading

- [ESM API](https://nodejs.org/docs/latest/api/esm.html)
- [Modules: Packages](https://nodejs.org/docs/latest/api/packages.html)

---

## 6. Environment Variables & .env

Node.js supports `.env` via:

- **CLI:** `--env-file=file`, `--env-file-if-exists=file`
- **Programmatic:** `process.loadEnvFile(path)`, `util.parseEnv(content)`

JARVIS-WEB uses `dotenv` package for `.env` loading in `scripts/load-env-everywhere.mjs`.

- [Environment variables](https://nodejs.org/docs/latest/api/environment_variables.html)
- [process.env](https://nodejs.org/docs/latest/api/process.html#processenv)

---

## 7. Full API Index (Node.js v25.6.1)

| Module | Purpose |
|--------|---------|
| assert | Assertion testing |
| async_hooks | Async context tracking |
| buffer | Binary data |
| child_process | Spawn subprocesses |
| cluster | Multi-core scaling |
| crypto | Crypto |
| dgram | UDP/datagram |
| dns | DNS |
| events | EventEmitter |
| fs | File system |
| http | HTTP server/client |
| https | HTTPS |
| http2 | HTTP/2 |
| path | Path utilities |
| process | Process control |
| stream | Streams |
| url | URL parsing |
| util | Utilities |
| worker_threads | Worker threads |
| zlib | Compression |
| ... | See [API index](https://nodejs.org/docs/latest/api/) |

---

## 8. Project-Specific Notes

| Topic | Notes |
|-------|-------|
| **Port in use** | `EADDRINUSE` → `PORT=${PORT+1} node server.js` or use `kill-port` |
| **Path security** | `path.startsWith(PUBLIC_DIR)` prevents traversal; `normalize` + `join` for safe paths |
| **Error handling** | `err.code === 'ENOENT'` for missing files; avoid leaking error details in production |
| **WebSocket upgrade** | `server.on('upgrade', ...)` handles `ws` handshake; `wss.handleUpgrade` for `ws` package |
| **CORS** | `ALLOWED_ORIGINS` env var; validate `Origin` in `getCorsHeaders` |

---

## 9. Quick Links

- [Node.js v25.6.1 Documentation](https://nodejs.org/docs/latest/)
- [API Index](https://nodejs.org/docs/latest/api/)
- [Usage and example](https://nodejs.org/docs/latest/api/synopsis.html)
- [Installing Node.js](https://nodejs.org/en/download/package-manager/)
