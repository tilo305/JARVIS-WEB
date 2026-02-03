# Orphaned, Duplicate, and Old Code — Audit

Findings from a full project parse. Use this to clean up dead code, consolidate duplicates, and align versions.

---

## 1. Duplicate code

### 1.1 `getNaturalFallback` (same logic in two places)

- **`public/js/app.js`** (lines ~145–162): full implementation.
- **`public/debug/fallback-revert-debug.html`** (lines ~84–93): copy-pasted implementation.

**Recommendation:** Export `getNaturalFallback` from `public/js/n8n-payload.js` (or a small shared module) and import it in both `app.js` and `fallback-revert-debug.html`. Single source of truth for “natural” fallback replies when n8n returns no reply.

---

### 1.2 `escapeHtml` (same helper in two places)

- **`public/js/app.js`**: `function escapeHtml(s) { ... }`
- **`public/debug/fallback-revert-debug.html`**: inline `function escapeHtml(s) { ... }` in the script.

**Recommendation:** Either export `escapeHtml` from a shared util (e.g. `public/js/debug.js` or a tiny `public/js/dom-utils.js`) and use it in both, or leave as-is if you want the debug page to stay self-contained.

---

### 1.3 Debug n8n fetch + reply extraction (duplicates `getLLMReply`)

- **`public/js/app.js`** — `JARVIS_DEBUG_SEND_TEST()` (lines ~382–420): builds payload, `fetch` to n8n, parses `content-type`, `extractReplyFromJson`, then logs. Same flow as `getLLMReply` but inlined.
- **`public/debug/fallback-revert-debug.html`**: similar fetch + `extractReplyFromJson` + `getNaturalFallback` in the click handler.

**Recommendation:** In `app.js`, have `JARVIS_DEBUG_SEND_TEST()` call `getLLMReply('Hello from JARVIS debug', { source: 'text' })` and then log `reply` / `data` and return a small result object. Reduces duplication and keeps one place for “call n8n and get reply”.

---

### 1.4 `floatTo16BitPCM` vs `float32ToInt16` (same implementation)

- **`public/js/audio-utils.js`**: `floatTo16BitPCM` and `float32ToInt16` have identical bodies (Float32 → Int16).
- Unit test explicitly says “float32ToInt16 should behave like floatTo16BitPCM”.

**Recommendation:** Implement `float32ToInt16` as `return floatTo16BitPCM(float32Array);` so there is a single implementation and two named exports for API clarity.

---

### 1.5 Default n8n webhook URL (repeated in many files)

Same URL string appears in:

- `src/config.ts` (`N8N_WEBHOOK_URL`)
- `public/js/app.js` (getConfig fallback)
- `vite.config.js` (define fallback)
- `public/debug/fallback-revert-debug.html` (`DEFAULT_WEBHOOK`)
- `debug/tools/open-app-debug-send.mjs` (`DEFAULT_WEBHOOK_URL` and `PRODUCTION_WEBHOOK_URL` — both identical)
- README, QUICKSTART, docs, debug markdown

**Recommendation:** Keep `src/config.ts` as the canonical default for Node/build. For browser, Vite injects from env; fallbacks in `app.js` and `vite.config.js` are acceptable. In **open-app-debug-send.mjs** remove the redundant `PRODUCTION_WEBHOOK_URL` and use a single constant (e.g. `DEFAULT_WEBHOOK_URL`), optionally read from `dist/config.js` when available.

---

## 2. Old / inconsistent code

### 2.1 Cartesia API version mismatch

- **`src/config.ts`**: `API_VERSION: '2025-04-16'` (current).
- **`public/js/cartesia-audio-bridge.js`**: `CARTESIA_VERSION = '2024-06-10'`.
- **`vite.config.js`**: `CARTESIA_VERSION = '2024-06-10'`.
- **`debug/tools/check-stt-sample-rate.js`**: hardcoded `'2024-06-10'`.
- **Docs** (`cArTeSiA dOcS.md`, `aUdiO dOcS.md`): reference `2025-04-16`.

So the **browser path** (bridge + Vite) and one debug tool use an **older** version than config and docs.

**Recommendation:** Update `cartesia-audio-bridge.js`, `vite.config.js`, and `check-stt-sample-rate.js` to use `'2025-04-16'` and add a short comment that this must match `src/config.ts` `API_VERSION`. If the STT API ever requires a different version, document that in one place (e.g. config or a shared constant).

---

## 3. Orphaned / barely used code

### 3.1 Exports only used by tests or docs

- **`public/js/audio-utils.js`**:  
  - **`decodeBase64PCM`** — used by `cartesia-audio-bridge.js` (main app).  
  - **`floatTo16BitPCM`**, **`int16ToFloat32`**, **`float32ToInt16`** — not used by the app; only by unit tests and `debug/tests/audio/format-boundary-live.test.js`. The AudioWorklet processors do their own conversion.  
  So these three are “test/docs/utility API” only, not dead: keep them as the public audio-utils API, but be aware they are unused by the main UI.

- **`public/js/file-creator.js`**:  
  - **`createWavBlob`**, **`createWavBlobFromAudioFile`** — not used by `app.js`. Used by unit tests; README documents them for “n8n or programmatic use”.  
  So they are part of the intended public API; not orphaned.

- **`public/js/ocr-tool.js`**:  
  - **`OCR_PSM`**, **`OCR_CONFIG`**, **`preprocessImageForOcr`**, **`isOcrSupportedType`**, **`runOcrOnImage`** — used internally by `addOcrToAttachments` and/or unit tests. Not orphaned.

- **`public/js/n8n-payload.js`**:  
  - **`N8N_REPLY_KEYS`** — used inside `extractReplyFromJson` and in n8n-payload unit test. Not orphaned.  
  - **`getClientLocation`** — used inside `buildN8nPayload` and in tests. Not orphaned.

### 3.2 Package entry (`src/index.ts`)

- **`src/index.ts`** re-exports STT/TTS clients, `BidirectionalConversation`, config, types. No internal project code imports from `src/index`; it is the **package main** for external consumers. Not orphaned.

### 3.3 Debug HTML pages

- **`public/debug/debug-audioworklet.html`**, **`fallback-revert-debug.html`**, **`voice-pipeline-debug.html`** — referenced in docs, QUICKSTART, and `tests/unit/css-embedded.test.js`. In active use for debugging; not orphaned.

---

## 4. Summary table

| Category        | Item                          | Location(s)                                      | Action |
|----------------|-------------------------------|---------------------------------------------------|--------|
| Duplicate      | `getNaturalFallback`         | Done   | Single export from n8n-payload.js |
| Duplicate      | `escapeHtml`                 | Optional | Still in app.js + fallback-revert-debug.html |
| Duplicate      | Debug n8n fetch + reply      | Done   | JARVIS_DEBUG_SEND_TEST uses getLLMReply |
| Duplicate      | `float32ToInt16` / floatTo16BitPCM | Done   | float32ToInt16 calls floatTo16BitPCM |
| Duplicate      | Default webhook URL          | Done   | Removed PRODUCTION_WEBHOOK_URL from open-app-debug-send.mjs |
| Old            | Cartesia API version         | Done   | 2025-04-16 everywhere,  comment “match config” |
| Orphaned       | (none critical)              | —      | audio-utils float* used only in tests — keep as public API |

---

*Last updated after cleanup. One optional duplicate remains: escapeHtml (app.js + fallback-revert-debug.html).*
