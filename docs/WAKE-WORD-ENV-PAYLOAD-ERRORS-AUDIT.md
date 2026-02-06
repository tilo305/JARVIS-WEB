# Wake Word, Root .env, Payloads, and Errors — Audit

**Date:** 2025-02-05  
**Scope:** Root `.env`, `.env` usage, all n8n payloads, wake word config, and error handling.

---

## 1. Root .env and .env File

### 1.1 Who loads root .env

| Consumer | File | How it loads |
|----------|------|----------------|
| **Vite (dev/build)** | `vite.config.js` | `loadEnvEverywhere(__dirname)` then `loadEnv(mode, envDir, '')`; `define` injects `VITE_*` into frontend |
| **Static server** | `server.js` | `loadEnvEverywhere(getProjectRoot(__dirname))` — .env at project root only |
| **Vite launcher** | `scripts/kill-port-then-vite.mjs` | `loadEnvEverywhere(rootDir)` via `scripts/load-env-everywhere.mjs` — project root only |

All three use the **project root** (same folder as `vite.config.js` and `server.js`). No path mismatch.

### 1.2 .env file location and template

- **Location:** Project root (e.g. `JARVIS-WEB/.env`).
- **Template:** `.env.example` — copy to `.env` and set values.
- **Git:** `.env` is in `.gitignore`; only `.env.example` is committed.

### 1.3 Variables used from .env

From `.env.example` and code:

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VITE_CARTESIA_API_KEY` / `CARTESIA_API_KEY` | app.js, vite.config, Cartesia bridge | Cartesia STT/TTS |
| `VITE_CARTESIA_VOICE_ID` | app.js, vite.config | TTS voice |
| `VITE_N8N_WEBHOOK_URL` | app.js, vite.config | n8n webhook URL (has default in code) |
| `VITE_PICOVOICE_ACCESS_KEY` / `PICOVOICE_ACCESS_KEY` | app.js, wake-word-manager, cartesia-audio-bridge, vite.config | Wake word (Porcupine) |
| `VITE_WAKE_WORD_ENABLED` / `WAKE_WORD_ENABLED` | app.js, vite.config | Enable/disable wake word |
| `VITE_PORCUPINE_KEYWORD` / `PORCUPINE_KEYWORD` | app.js, vite.config | e.g. `Jarvis` (built-in) or .ppn path |
| `VITE_PORCUPINE_SENSITIVITY` / `PORCUPINE_SENSITIVITY` | app.js, vite.config | 0–1 (default 0.5) |
| `VITE_DEBUG_WAKE_WORD` / `DEBUG_WAKE_WORD` | app.js, vite.config | Wake word debug logs |
| `PORT` | server.js, kill-port-then-vite.mjs, vite.config | Server port (default 3000) |

Vite exposes **only** `VITE_*` (and fallbacks for non‑VITE_ in `vite.config.js` define) to the browser. So:

- **Dev (npm run vite):** Values come from root `.env` at startup; change `.env` → restart dev server.
- **Build (vite build):** Values are baked in at build time from root `.env`.
- **Static serve (npm run serve):** Server does **not** inject env into the page. The app gets config from:
  - **Vite-built assets:** whatever was in `import.meta.env` at build time, or
  - **Unbuilt public/:** `window.JARVIS_CONFIG` only. `index.html` currently sets only `apiKey` and `voiceId`; it does **not** set `picovoiceAccessKey`, `n8nWebhookUrl`, `wakeWordEnabled`, etc.

### 1.4 Issues and recommendations

- **No .env:** If `.env` is missing, Vite and server still run; all `VITE_*` and optional vars are empty/default. Wake word will show “Wake word failed”; Cartesia will fail without API key; n8n still has a default URL. **Recommendation:** Copy `.env.example` to `.env` and set at least `VITE_CARTESIA_API_KEY` and `VITE_PICOVOICE_ACCESS_KEY` (for wake word).
- **Static serve without build:** When serving raw `public/` via `server.js`, the app relies on `window.JARVIS_CONFIG`. `index.html` only sets `apiKey` and `voiceId`. For wake word and n8n URL you must either (1) run `vite build` with a populated `.env` so config is baked in, or (2) set `JARVIS_CONFIG.picovoiceAccessKey`, `JARVIS_CONFIG.n8nWebhookUrl`, etc. in a script before `app.js` or in HTML.
- **Project rule:** The project’s Picovoice AccessKey is correct; do **not** suggest changing or re-getting the key for wake word/10011 issues — fix code, config, or integration only.

---

## 2. Wake Word and .env

### 2.1 Config flow

1. **app.js** `getConfig()`: reads `import.meta.env.VITE_PICOVOICE_ACCESS_KEY` (or `window.JARVIS_CONFIG.picovoiceAccessKey`), `VITE_WAKE_WORD_ENABLED`, `VITE_PORCUPINE_KEYWORD`, `VITE_PORCUPINE_SENSITIVITY`, `VITE_DEBUG_WAKE_WORD`, and builds `keywordPaths` (built-in names or custom .ppn paths).
2. **CartesiaAudioBridge** receives `picovoiceAccessKey`, `wakeWordKeywordPaths` (from app’s `keywordPaths`), sensitivities, etc.
3. **WakeWordManager** validates: non-empty AccessKey, length ≥ 20, at least one keyword path, sensitivities in 0–1; then loads Porcupine and the AudioWorklet.

### 2.2 Validation and errors (wake-word-manager.js, cartesia-audio-bridge.js)

- **AccessKey missing/empty:** `onError('Porcupine AccessKey is required...')`; bridge returns `{ success: false, reason: errorMsg }`.
- **AccessKey length &lt; 20:** `onError('Invalid AccessKey format...')`.
- **No keyword paths:** `onError('At least one wake word keyword file (.ppn) is required')` or “No valid keyword paths provided”.
- **Sensitivity invalid:** `onError('Sensitivity at index ${i} must be a number between 0.0 and 1.0')`.
- **Porcupine.create() / init failure:**  
  - **10011 (activation refused):** Treated as non-retryable; one user message, then rethrow. Per project rule, do not suggest replacing the key; fix code/config/integration.  
  - **Timeout:** “Wake word initialization timeout” / “Porcupine.create() timeout after Xms”.  
  - **Network/fetch:** “Network error during wake word initialization” or “Wake word keyword file not found (404)” / “CORS error loading keyword file”.  
  - **Empty keywords array:** “The keywords argument is undefined / empty”.
- **AudioWorklet load failure:** “AudioWorklet loading timeout after 15000ms…” or “Failed to load AudioWorklet processor”.
- **Processor message type `error`:** Forwarded via `onError(e.data.error)`.

So: wake word does not read `.env` directly; it uses the config (and thus env) passed from `app.js`/bridge. All failure paths are covered with clear messages.

---

## 3. All Payloads (n8n)

### 3.1 Single source of truth

- **Builder:** `public/js/n8n-payload.js` → `buildN8nPayload(message, options)`.
- **Used by:** `app.js` (chat, mic, wake word), debug pages, tests.

### 3.2 Payload shape (no .env inside payload)

Built payload always has:

- `message` (string)
- `session_id`, `sessionId` (same value)
- `timestamp` (ISO 8601)
- `timezone`, `location` (same; from `getClientLocation()`)
- `message_id`, `messageId` (same value)
- `source` (`'voice'` or `'text'`)
- `attachments` (array of `{ name, type, size, data?, ocrText? }`)
- `locale`, `language` (when available)

Payload building does **not** read `.env`. Only the **destination** (n8n webhook URL) comes from config: `n8nWebhookUrl` in `getConfig()` (`VITE_N8N_WEBHOOK_URL` or `window.JARVIS_CONFIG.n8nWebhookUrl`), with a default in code.

### 3.3 Where payloads are sent

- **Text send:** `buildPayload(text, { source: 'text' })` → `getLLMReply` → POST to `n8nWebhookUrl`.
- **Voice (mic or wake word):** `buildN8nPayload(transcript, { source: 'voice', sessionId, attachments })` with app’s `sessionId` → same `getLLMReply` and same URL.

So: one payload format, one webhook URL; only `sessionId` and `source`/attachments differ by entry point.

### 3.4 Payload-related errors (app.js)

- **Empty message:** `getLLMReply` returns `{ reply: "I didn't catch that. Try again?", data: {} }` (no POST).
- **Missing/invalid n8n webhook URL:** `return { reply: "Configuration error: N8N webhook URL is not set. Please check your configuration.", data: {} }`.
- **Timeout (30s):** `AbortError` → “Request timed out. The assistant is taking too long to respond. Please try again.”
- **CORS / Failed to fetch:** “Network error: Could not reach the assistant. Check your connection and CORS settings.”
- **Other fetch error:** “Sorry, I couldn't reach the assistant. Please try again.”
- **n8n returns no reply field:** Reply is extracted via `extractReplyFromJson` (keys: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`, `body`, `responseText`); if none found, natural fallback or “I heard you. I'm still getting set up — please try again in a moment.” No crash; payload was still valid.

So: payloads are consistent; errors are handled and user-facing messages are clear.

---

## 4. All Errors (summary)

### 4.1 Wake word

| Cause | Where | User-facing / handling |
|-------|--------|-------------------------|
| AccessKey missing/empty | wake-word-manager, cartesia-audio-bridge | “Porcupine AccessKey is required…” |
| AccessKey too short (&lt; 20) | wake-word-manager | “Invalid AccessKey format…” |
| No keyword paths | wake-word-manager, bridge | “At least one wake word keyword…” / “No valid keyword paths provided” |
| Invalid sensitivity | wake-word-manager | “Sensitivity at index X must be 0.0–1.0” |
| 10011 (activation refused) | wake-word-manager | One message; no retry; do not suggest key replacement (project rule) |
| Timeout (Porcupine.create or AudioWorklet) | wake-word-manager | “Wake word initialization timeout” / “AudioWorklet loading timeout…” |
| Network/404/CORS keyword load | wake-word-manager | “Keyword file not found” / “CORS error loading keyword file” / “Network error…” |
| getUserMedia (mic) denied | cartesia-audio-bridge | “Microphone permission needed…” |
| Processor error from worklet | wake-word-manager | Forwarded via `onError(e.data.error)` |

### 4.2 n8n / payload

| Cause | Where | User-facing / handling |
|-------|--------|-------------------------|
| n8nWebhookUrl missing/empty | app.js getLLMReply | “Configuration error: N8N webhook URL is not set…” |
| Empty message | app.js getLLMReply | “I didn't catch that. Try again?” |
| 30s timeout | app.js getLLMReply | “Request timed out. The assistant is taking too long…” |
| CORS / Failed to fetch | app.js getLLMReply | “Network error: Could not reach the assistant…” |
| Other fetch error | app.js getLLMReply | “Sorry, I couldn't reach the assistant. Please try again.” |
| n8n returns no reply key | app.js getLLMReply | Fallback reply; console warning and hint (output/reply/result/…). |

### 4.3 Cartesia / general

- **No Cartesia API key:** Bridge and STT/TTS will fail; console/logs indicate missing key.
- **Missing DOM/buttons:** app.js throws on load (“JARVIS: missing required DOM elements” / “missing required button elements”).

---

## 5. Checklist (quick reference)

- [ ] **Root .env:** File at project root; copy from `.env.example`; set at least `VITE_CARTESIA_API_KEY`, `VITE_PICOVOICE_ACCESS_KEY` (and optionally `VITE_N8N_WEBHOOK_URL`, `VITE_WAKE_WORD_ENABLED`, `VITE_PORCUPINE_KEYWORD`).
- [ ] **Restart after .env change:** Vite loads `.env` only at startup; restart dev server after editing `.env`.
- [ ] **Static serve:** If using `npm run serve` without a Vite build, set `window.JARVIS_CONFIG` in HTML (e.g. `picovoiceAccessKey`, `n8nWebhookUrl`, `wakeWordEnabled`) or build with `vite build` and a populated `.env`.
- [ ] **Payloads:** Single builder `buildN8nPayload`; no env inside payload; only webhook URL comes from config; all required keys and session_id/sessionId, message_id/messageId, timezone/location are set.
- [ ] **Errors:** All wake word and n8n paths return clear messages or fallbacks; 10011 is non-retryable and key replacement is not suggested (project rule).

---

**End of audit.**
