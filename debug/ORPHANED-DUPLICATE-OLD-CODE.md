# Orphaned, Duplicate, and Old Code — Audit

Findings from a full project parse. Use this to clean up dead code, consolidate duplicates, and align versions.

---

## 1. Duplicate code

### 1.1 `getNaturalFallback` (same logic in two places)

- **`public/js/app.js`** (lines ~145–162): full implementation.
- **`public/debug/fallback-revert-debug.html`** (lines ~84–93): copy-pasted implementation.

**Recommendation:** Export `getNaturalFallback` from `public/js/n8n-payload.js` (or a small shared module) and import it in both `app.js` and `fallback-revert-debug.html`. Single source of truth for “natural” fallback replies when n8n returns no reply.

---

### 1.2 `escapeHtml` (same helper in two places) — ✅ Fixed

- **`public/js/debug.js`**: Single export `escapeHtml(s)` — imported by `app.js`, `fallback-revert-debug.html`, and `console-errors-live.html`.

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

### 1.5 Default n8n webhook URL (repeated in many files) — ✅ Acceptable

Same URL string appears in `src/config.ts`, `public/js/app.js` (getConfig fallback), `vite.config.js` (define fallback), `public/debug/fallback-revert-debug.html` (`DEFAULT_WEBHOOK`), and docs. `src/config.ts` is canonical for Node/build; Vite injects for browser.

---

## 2. Old / inconsistent code

### 2.1 Cartesia API version mismatch

- **`src/config.ts`**: `API_VERSION: '2025-04-16'` (current).
- **`public/js/cartesia-audio-bridge.js`**, **`vite.config.js`**: `CARTESIA_VERSION = '2025-04-16'` — ✅ Fixed.

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

| Category        | Item                          | Location(s)                                      | Action | Status |
|----------------|-------------------------------|---------------------------------------------------|--------|--------|
| Duplicate      | `getNaturalFallback`         | `public/js/n8n-payload.js` (exported) | ✅ Fixed | Single export, imported in app.js and fallback-revert-debug.html |
| Duplicate      | `escapeHtml`                 | `debug.js` (exported) | ✅ Fixed | Single export, imported in app.js, fallback-revert-debug.html, console-errors-live.html |
| Duplicate      | Debug n8n fetch + reply      | `app.js` - `JARVIS_DEBUG_SEND_TEST()` | ✅ Fixed | Now uses `getLLMReply()` |
| Duplicate      | `float32ToInt16` / floatTo16BitPCM | `public/js/audio-utils.js` | ✅ Fixed | `float32ToInt16` calls `floatTo16BitPCM` |
| Duplicate      | Default webhook URL          | Multiple files | ✅ Acceptable | Canonical in src/config.ts |
| Old            | Cartesia API version         | config.ts, bridge, vite | ✅ Fixed | `2025-04-16` everywhere |
| Orphaned       | (none critical)              | —      | ✅ Verified | audio-utils float* used only in tests — keep as public API |

---

## 5. Debug Tools Cleanup (2026-02-05)

**Removed duplicate and obsolete debug CLI tools:**

- **verify-wake-word-cli.mjs** — Meta-test that only verified `wake-word-activation-test-cli.js` exists; redundant.
- **test-wake-word-cli.mjs** — Meta-test (syntax check) for the same script; redundant.
- **check-wake-word-config.js** — Overlapped with **verify-wake-word-setup.js** (kept); single config verifier now.
- **debug-wake-word-keywords.js** — Overlapped with **debug-wake-word-keyword-validation-live.js** (kept); single keyword debug tool.
- **test-wake-word-detection.js** — Config validation overlapped with **verify-wake-word-setup.js**. `npm run test:wakeword` now runs `verify-wake-word-setup.js`.

**Consolidated docs:** Removed **CONSOLE-ERROR-CHECKLIST.md** (content covered by **CONSOLE-ERROR-CHECK-GUIDE.md**).

**Current debug tools:** See `debug/README.md` and `debug/DEBUG-TOOLS-SUMMARY.md`.

**Cleanup (2026-02-07):** The `debug:live` npm script was removed (debug/live/ was already gone). **MD cleanup:** `debug/archive/` (old verification reports) was removed. The single doc referenced by app and docs—`N8N-RESPOND-TO-WEBHOOK-FIX.md`—lives in `debug/`. Root-level parse/summary .md (e.g. *-PARSE.md, *-SUMMARY.md) and duplicate docs in `docs/` (ERROR-FIXES-COMPLETE, FINAL-VERIFICATION-*, INTEGRATION-VERIFICATION) were removed.

---

## 6. VAD files (2026-02-07)

**Current (only):** `public/js/vad-config.js` (config), `tests/unit/vad-config.test.js` (unit tests). Both in use by app and bridge.

**Removed / obsolete:** No separate VAD parser or duplicate tests. `parse-vad-files.js` was removed; VAD parsing is part of `parse-all-files.js`. `debug/tests/filler-config-live.test.js` was removed as duplicate of `tests/unit/vad-config.test.js`.

---

## 7. Test cleanup (2026-02-07)

**Orphaned / removed:**

- **`debug/live/`** — Empty. Former live tests (`n8n-webhook.test.js`, `example-run.test.js`) were removed; Jest no longer matches this path (`testPathIgnorePatterns` includes `debug/live`).
- **`debug/tests/bridge-stream-optimization.test.js`** — Removed. Logic merged into `tests/unit/cartesia-audio-bridge.test.js` (streamTextChunks optimization tests).
- **`debug/tests/filler-config-live.test.js`** — Removed. Duplicate of `tests/unit/vad-config.test.js` (fillerPhrases, fillerTimeDelayMs, and allowed keys already covered).

**AudioWorklet (2026-02-07):** No duplicate or orphaned processor files. Only two processors remain and are in use: `public/audio/stt-capture-processor.js` and `public/audio/tts-playback-processor.js`. The former `public/audio/wake-word-processor.js` was already removed. Docs updated: `docs/INTEGRATION.md` (removed wake-word/OpenWakeWord rows and troubleshooting), `docs/archive/VERIFICATION-CHECKLIST.md` (historical note). Debug pages `debug-audioworklet.html` and `voice-pipeline-debug.html` stay; they validate the two active processors.

---

## 8. Orphaned Wake Word Test Page (2026-02-05)

**Removed:** `public/wake-word-test.html` — Orphaned. Duplicated functionality of `public/debug/wake-word-activation-test.html` (the canonical test). Not referenced in any docs, tools, or scripts.

**Removed (2026-02-07):** `public/debug/wake-word-activation-test.html` — Orphaned stub after wake word feature removal. Page only showed "check console" with no real test; wake word backend and scripts were already deleted.

---

## 9. Orphaned JS modules (status)

**In use by app.js:**

- **`public/js/cors-handler.js`** — CORS diagnostics: `detectCORSError`, `diagnoseCORS`, `testCORSPreflight`, `getCORSConfigurationGuide`. Imported and used in app.js.
- **`public/js/agentic-patterns.js`** — ConversationHistory, classifyIntent, getContextEnrichment, validateInput, runWithRetry. Imported and used in app.js.

**Removed (no longer in repo):**

- **`public/js/ui-patterns.js`** — Was never added to app.js import chain; docs (INTEGRATION-GUIDE, UI-PATTERNS-IMPLEMENTATION) referenced it; file does not exist.
- **`public/js/payload-verification.js`** — Removed as orphaned (not imported by app). See docs/PAYLOAD-VERIFICATION-COMPLETE.md.

**Still in use (app.js import chain):** `app.js` → cartesia-audio-bridge, vad-config, n8n-payload, ocr-tool, file-creator, debug.js, utils (error-handling, performance, debug), security.js, agentic-patterns.js, cors-handler.js.

**Removed (orphaned):** `src/security/` (headers.ts, validation.ts) — never imported; server.js and scripts/security-config.mjs implement security headers and validation.

---

## 10. Current Status (2026-02-07)

**All critical duplicates have been fixed.** Orphaned JS modules have been removed.

- ✅ `getNaturalFallback` - Single source of truth in `n8n-payload.js`
- ✅ `float32ToInt16` - Delegates to `floatTo16BitPCM`
- ✅ `JARVIS_DEBUG_SEND_TEST` - Uses `getLLMReply`
- ✅ Cartesia API version - `2025-04-16` everywhere
- ✅ Webhook URL - No duplicate constants
- ✅ `escapeHtml` - Consolidated in debug.js, imported where needed
- ✅ payload-verification.js removed (orphaned). cors-handler.js and agentic-patterns.js are in use by app.js.

**Cartesia cleanup (2026-02-07):** Removed orphaned `parse-cartesia-files.js` (superseded by `parse-all-files.js`). Removed stub `cArTeSiA wEbSoCkEt.md` and consolidated API reference URL into `cArTeSiA dOcS.md`; updated src @see refs.

**Frontend (public/) cleanup:** No orphaned or duplicate frontend files remain. Entry: `index.html` → `js/app.js`. App imports: cartesia-audio-bridge, vad-config, n8n-payload, ocr-tool, file-creator, debug.js, utils (error-handling, performance, debug), security.js. Audio: only `audio/stt-capture-processor.js` and `audio/tts-playback-processor.js`. Debug pages in use: `debug/console-errors-live.html`, `debug/debug-audioworklet.html`, `debug/fallback-revert-debug.html`, `debug/voice-pipeline-debug.html`. No references to removed modules in `public/`.

See `docs/archive/CODE-AUDIT-REPORT.md` for detailed verification.
