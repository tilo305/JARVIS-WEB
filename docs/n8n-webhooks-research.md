# Comprehensive Research: n8n Webhooks in JARVIS-WEB

This document summarizes all n8n webhook usage across the project (single webhook, multiple consumers).

---

## 1. Summary

| Item | Value |
|------|--------|
| **Number of distinct webhooks** | **1** |
| **Default URL** | `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Expected response** | JSON with one of: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content` |

**No text or voice in chat?** If the Respond to Webhook node shows the correct output but the frontend gets nothing, the Webhook trigger node must use **Respond: "Using Respond to Webhook Node"**. See **`debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`**.

---

## 1.5 Single Source of Truth: n8n Payload

**`public/js/n8n-payload.js`** — Shared module used by:
- Chat UI (`app.js`) — via `buildN8nPayload`
- Debug test (`debug/live/n8n-webhook.test.js`)
- Debug tool (`debug/tools/check-n8n-webhook.js`)
- Fallback-revert debug page (`public/debug/fallback-revert-debug.html`)

All n8n requests use `buildN8nPayload(message, options)` to ensure session_id, timezone, location, and all fields are always sent. No minimal payloads.

---

## 2. Where the Webhook URL Is Defined

### 2.1 Source of truth (TypeScript/Node)

| File | What |
|------|------|
| **`src/config.ts`** | Exports `N8N_WEBHOOK_URL` (hardcoded default). Used by Node/build and by examples that import from `dist/config.js` or `src/config.js`. |

```ts
// src/config.ts (lines 6–7)
export const N8N_WEBHOOK_URL =
  'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
```

### 2.2 Frontend (browser)

| File | What |
|------|------|
| **`public/js/app.js`** | Reads URL via `getConfig()`: `import.meta.env.VITE_N8N_WEBHOOK_URL` (Vite build) or `window.JARVIS_CONFIG.n8nWebhookUrl`, fallback = same default URL. |
| **`vite.config.js`** | Injects `import.meta.env.VITE_N8N_WEBHOOK_URL` from `process.env.VITE_N8N_WEBHOOK_URL` or the same default. |

So the **same single webhook** is used everywhere; only the way it’s supplied differs (env vs config file vs `JARVIS_CONFIG`).

---

## 3. All Call Sites (Who POSTs to the Webhook)

### 3.1 Chat UI (production path)

| File | Function | Payload |
|------|----------|---------|
| **`public/js/app.js`** | `getLLMReply(userText, options)` | Full payload from `buildN8nPayload()` (see below). Used for both **text** and **voice** messages. |

- **When**: User sends a text message or finishes speaking (final transcript).
- **Options**: `source: 'voice' | 'text'`, optional `attachments`.
- **Reply extraction**: `extractReplyFromJson(data)` checks keys in order: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`, then arrays and nested objects.

### 3.2 Bidirectional conversation example (Node)

| File | Function | Payload |
|------|----------|---------|
| **`src/examples/bidirectional-conversation.ts`** | `processTranscript(userText)` | Minimal: `{ message: userText }`. |

- **When**: Example flow: STT final transcript → this processor → n8n → TTS.
- **Reply extraction**: `data?.output ?? data?.reply ?? data?.result ?? data?.text ?? data?.message`.

### 3.3 Debug / validation tools (Node)

| File | Purpose | Payload |
|------|----------|---------|
| **`debug/tools/check-n8n-webhook.js`** | Live connectivity check | `{ message: 'Hello from JARVIS debug' }`. |
| **`debug/live/n8n-webhook.test.js`** | Jest LIVE test | `{ message: 'test from JARVIS' }`. |
| **`debug/tools/validate-config.js`** | Validates config (including URL format); does **not** call the webhook. | N/A |

- **Scripts**: `npm run debug:n8n` runs `check-n8n-webhook.js` (after build). The live test runs with the full test suite.

---

## 4. Payload Structures

### 4.1 Full payload (Chat UI – `public/js/app.js`)

Built by `buildN8nPayload(message, options)` — **all of these are sent on every request**:

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | User message (trimmed). |
| `session_id` | string | Per-tab session id, e.g. `sess_<timestamp>_<random>`. |
| `sessionId` | string | Same as `session_id` (camelCase for n8n). |
| `timestamp` | string | ISO 8601 when message was sent (e.g. `new Date().toISOString()`). |
| `timezone` | string | User's IANA timezone from browser (e.g. `America/New_York`). |
| `location` | string | Same as `timezone` (user location for context). |
| `message_id` | string | Unique per message, e.g. `msg_<timestamp>_<random>`. |
| `messageId` | string | Same as `message_id` (camelCase for n8n). |
| `source` | string | `'voice'` or `'text'`. |
| `attachments` | array | `[{ name, type, size, data?, ocrText? }, ...]` — `data` is base64 file content when present (empty for voice). Image attachments include `ocrText` (extracted via client-side OCR) when available. |
| `locale` | string | Browser locale (e.g. `en-US`), if available. |
| `language` | string | Browser language (e.g. `en-US`), if available. |

### 4.2 Minimal payload (Example + debug/live test)

- **Example**: `{ message: userText }`.
- **Debug/Live**: `{ message: 'Hello from JARVIS debug' }` or `{ message: 'test from JARVIS' }`.

So the **only field n8n can rely on in all cases is `message`**. The chat UI sends extra fields for tracing, idempotency, and attachments.

---

## 5. Expected n8n Response

- **Status**: 2xx for success. 404 is treated as “webhook exists but workflow inactive” (no failure in live test).
- **Body**: JSON. The app looks for a **reply string** in this order:
  1. Top-level: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`.
  2. First element if body is non-empty array and that element is a string or object (then recursively).
  3. Any string value in a nested object (recursive).

So the n8n workflow should return at least one of these keys with a string value, e.g.:

- `{ "reply": "Hello!" }`
- `{ "output": "Hello!" }`
- Or any of the other keys above.

---

## 6. Configuration & Overrides

| Context | How to override |
|---------|------------------|
| **Chat UI (Vite)** | `.env`: `VITE_N8N_WEBHOOK_URL=<url>`. Or before load: `window.JARVIS_CONFIG = { n8nWebhookUrl: '<url>' };`. |
| **Vite build** | `vite.config.js` uses `env.VITE_N8N_WEBHOOK_URL` (from `.env`) or the default. |
| **Node / examples / debug** | Change `N8N_WEBHOOK_URL` in `src/config.ts` and rebuild, or ensure `dist/config.js` is built from that. No env for n8n in `config.ts` (only Cartesia uses `process.env` there). |

**Valid URL format** (enforced in `debug/tools/validate-config.js` and `tests/unit/config.test.ts`):

- Regex: `^https:\/\/.+\/webhook\/[a-f0-9-]+$`
- Example: `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4`

---

## 7. Files Reference (Quick Index)

| File | Role |
|------|------|
| `src/config.ts` | Defines `N8N_WEBHOOK_URL`. |
| `public/js/app.js` | Chat UI: `buildN8nPayload`, `getLLMReply`, `extractReplyFromJson`, `N8N_REPLY_KEYS`. |
| `vite.config.js` | Injects `VITE_N8N_WEBHOOK_URL` for frontend. |
| `src/examples/bidirectional-conversation.ts` | Example: `processTranscript` POSTs minimal payload. |
| `debug/tools/check-n8n-webhook.js` | Standalone webhook connectivity check. |
| `debug/tools/validate-config.js` | Validates URL format (no HTTP call). |
| `debug/live/n8n-webhook.test.js` | Jest LIVE test for webhook. |
| `tests/unit/config.test.ts` | Unit test: `N8N_WEBHOOK_URL` defined and matches URL regex. |
| `README.md`, `QUICKSTART.md` | Document `VITE_N8N_WEBHOOK_URL` and n8n usage. |
| `package.json` | Script: `debug:n8n` → build + `node debug/tools/check-n8n-webhook.js`. |

---

## 8. Conclusion

- There is **one n8n webhook** in the project:  
  `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4`.
- It is **POST**ed to from:
  - **Chat UI** (`app.js`) with full payload (message, session_id, timestamp, timezone, message_id, source, attachments).
  - **Bidirectional example** and **debug/live** code with minimal `{ message }` payload.
- Response must be JSON with a reply string in one of: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`.
- Override for the **browser** is `VITE_N8N_WEBHOOK_URL` (or `JARVIS_CONFIG.n8nWebhookUrl`). For **Node/examples/debug**, change `src/config.ts` and rebuild.
