# CORS Docs

**Comprehensive reference on Cross-Origin Resource Sharing (CORS)**  
Based on [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), tailored for the JARVIS-WEB project.

---

## 1. What is CORS?

**Cross-Origin Resource Sharing (CORS)** is an HTTP-header–based mechanism that lets a server declare which **origins** (domain, scheme, or port) other than its own are allowed to load its resources. Browsers enforce the **same-origin policy**: scripts can only freely request resources from the same origin unless the server opts in via CORS.

- **Origin** = scheme + domain + port (e.g. `https://foo.example`, `http://localhost:3000`).
- CORS applies to: `fetch()`, `XMLHttpRequest`, Web Fonts, WebGL textures, canvas `drawImage()`, CSS shapes from images.

CORS failures produce errors that **do not expose details to JavaScript** for security reasons. To see the real cause, check the browser’s Network tab and console.

---

## 2. Functional Overview

1. The server sends **CORS response headers** to state which origins may read the response.
2. For requests that can change server state (non-GET, or POST with certain `Content-Type`), the browser sends a **preflight** `OPTIONS` request first; only if the server approves does it send the real request.
3. Servers can also indicate whether **credentials** (cookies, HTTP auth) may be sent.

---

## 3. Simple vs Preflighted Requests

### 3.1 Simple requests (no preflight)

A request is treated as **simple** only if **all** of the following hold:

- **Method:** `GET`, `HEAD`, or `POST`
- **Headers:** Only CORS-safelisted headers are set by the client (e.g. `Accept`, `Accept-Language`, `Content-Language`, `Content-Type`, `Range` with a single value)
- **Content-Type:** Only one of:
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`
- No `ReadableStream` in the request; no listeners on `XMLHttpRequest.upload`

For simple requests, the browser sends the request directly. The server still must send **`Access-Control-Allow-Origin`** (or the response is not exposed to the script).

**Example (simple GET):**

```http
GET /resources/public-data/ HTTP/1.1
Host: bar.other
Origin: https://foo.example
```

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/xml
```

### 3.2 Preflighted requests

Any request that **does not** qualify as simple is **preflighted**. The browser:

1. Sends an **OPTIONS** request with `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers`.
2. If the server responds with allowed method/headers and an allowed origin, the browser then sends the **actual** request.

**Typical triggers in this project:**

- **POST with `Content-Type: application/json`** (used for n8n webhooks from the browser).
- Custom headers (e.g. `X-PINGOTHER`, `Authorization`).

**Preflight (OPTIONS) example:**

```http
OPTIONS /doc HTTP/1.1
Host: bar.other
Origin: https://foo.example
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type,x-pingother
```

**Server must respond to OPTIONS with something like:**

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
```

Then the real POST is sent. The **actual** response must also include CORS headers (e.g. `Access-Control-Allow-Origin`) for the script to read the response.

**Preflight and redirects:** Some browsers still disallow following cross-origin redirects after a preflight. If you see errors about “disallowed for cross-origin requests that require preflight,” consider avoiding redirects for that endpoint or making the request “simple” if possible.

---

## 4. Credentialed Requests

By default, cross-origin `fetch()` and XHR **do not** send cookies or HTTP auth. To send them:

- **fetch:** `fetch(url, { credentials: 'include' })`
- **XHR:** `xhr.withCredentials = true`

For credentialed requests:

- The server **must not** use the `*` wildcard for `Access-Control-Allow-Origin`; it must echo a specific origin (e.g. `https://foo.example`).
- The server should send **`Access-Control-Allow-Credentials: true`** so the browser exposes the response to the page.
- Preflight responses must also allow credentials (e.g. `Access-Control-Allow-Credentials: true`). Preflight requests themselves must **not** include credentials.

**Third-party cookie policies** still apply; browsers may block or restrict third-party cookies regardless of CORS settings.

---

## 5. HTTP Response Headers (Server-Side)

| Header | Purpose |
|--------|--------|
| **Access-Control-Allow-Origin** | `<origin>` or `*`. Which origin(s) may read the response. For credentialed requests, must be a single origin, not `*`. |
| **Access-Control-Expose-Headers** | Comma-separated list of headers the script is allowed to read (e.g. `X-My-Header`). |
| **Access-Control-Max-Age** | How long (seconds) the preflight result can be cached. |
| **Access-Control-Allow-Credentials** | `true` if the response may be exposed when the request uses credentials. |
| **Access-Control-Allow-Methods** | Used in preflight response: allowed methods (e.g. `POST, GET, OPTIONS`). |
| **Access-Control-Allow-Headers** | Used in preflight response: allowed request headers (e.g. `Content-Type, Authorization`). |

When using a single dynamic origin (not `*`), the server should send **`Vary: Origin`** so caches treat responses correctly per origin.

---

## 6. HTTP Request Headers (Set by the Browser)

Developers do not set these manually; the browser adds them for cross-origin requests:

| Header | Purpose |
|--------|--------|
| **Origin** | Origin of the page making the request (e.g. `https://foo.example`). |
| **Access-Control-Request-Method** | Sent in preflight: the method that will be used (e.g. `POST`). |
| **Access-Control-Request-Headers** | Sent in preflight: the headers that will be sent (e.g. `content-type, authorization`). |

---

## 7. JARVIS-WEB and CORS

### Where CORS matters

- **Browser → n8n webhook:** When the app runs in the browser (e.g. `http://localhost:3000` or `file://`), POSTs to an n8n webhook (different origin) are cross-origin. Browsers require the n8n server (or a proxy in front of it) to send proper CORS headers and to respond to OPTIONS.
- **Electron:** The **main process** is not subject to CORS. In this project, the renderer can call `invokeN8nWebhook` so the main process performs the `fetch()` to n8n, avoiding browser CORS for that call. See `electron/main.js` and `electron/preload.js`.

### Project server CORS (optional)

The JARVIS-WEB static server (`server.js`) supports optional CORS for future API routes. Set `ALLOWED_ORIGINS` (comma-separated) to enable:

```bash
ALLOWED_ORIGINS="http://localhost:3000,https://app.example.com" node server.js
```

When set, the server responds to `OPTIONS` preflight and adds CORS headers to responses for allowed origins. The CSP `connect-src` includes `http://localhost` and `http://127.0.0.1` for local n8n development.

### Project docs and code

- **Configuration and n8n:** `docs/CORS-CONFIGURATION.md` — how to configure n8n (Set node, webhook settings, or reverse proxy) so the browser can call the webhook.
- **Implementation summary:** `docs/CORS-IMPLEMENTATION-SUMMARY.md` — CORS handler, diagnostics, and debug helpers.
- **Debugging:** `docs/SERVER-CORS-DEBUGGING.md` — server-side CORS debugging.
- **Security headers:** `server.js` (`getSecurityHeaders`) and `scripts/security-config.mjs` — CORS-related headers when `allowedOrigins` is set (e.g. `Access-Control-Allow-Origin`, `-Methods`, `-Headers`).
- **App logic:** `public/js/app.js` — uses main-process webhook when in Electron to avoid CORS; in browser, shows CORS-aware error messages and points to the debug guide.

### Quick checklist for “CORS or network” errors

1. Confirm the n8n workflow is active and the webhook URL is correct (e.g. production `webhook/` path).
2. Ensure the server (or n8n/proxy) responds to **OPTIONS** with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` as needed.
3. Ensure **POST** responses include `Access-Control-Allow-Origin` (and, if using credentials, `Access-Control-Allow-Credentials: true` and a specific origin).
4. In Electron, prefer invoking the webhook via the main process to avoid browser CORS for that request.
5. Use `?debug=1` and `JARVIS_DEBUG_CORS()` (or `JARVIS_DEBUG_CORS_PREFLIGHT()`) in the console for in-browser diagnostics.

---

## 8. References

- [MDN – Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN – CORS errors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS_Errors)
- [Fetch Standard – CORS](https://fetch.spec.whatwg.org/#http-access-control-allow-origin)
- Project: `docs/CORS-CONFIGURATION.md`, `docs/CORS-IMPLEMENTATION-SUMMARY.md`, `docs/SERVER-CORS-DEBUGGING.md`
