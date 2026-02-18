# Code Audit Report - Orphaned, Duplicate, and Outdated Code

**Date:** 2026-02-02 (updated 2026-02-05)  
**Status:** All issues resolved

---

## Summary

✅ **All duplicates fixed:**

- `getNaturalFallback` - Single source in `n8n-payload.js`
- `float32ToInt16` - Delegates to `floatTo16BitPCM`
- `JARVIS_DEBUG_SEND_TEST` - Uses `getLLMReply`
- Cartesia API version - `2025-04-16` everywhere
- `escapeHtml` - Consolidated in `debug.js`, imported where needed

---

## 1. Duplicate Code

### ✅ 1.1 `getNaturalFallback` - FIXED

- **Status:** ✅ Fixed
- **Location:** `public/js/n8n-payload.js` (exported)
- **Used by:** `public/js/app.js`, `public/debug/fallback-revert-debug.html`
- **Action:** Single source of truth established

### ✅ 1.2 `escapeHtml` - FIXED

- **Status:** ✅ Fixed
- **Location:** `public/js/debug.js` (single export)
- **Used by:** `app.js`, `fallback-revert-debug.html`, `console-errors-live.html`, `wake-word-tracker.js`

### ✅ 1.3 Debug n8n fetch - FIXED

- **Status:** ✅ Fixed
- **Location:** `public/js/app.js` - `JARVIS_DEBUG_SEND_TEST()` now uses `getLLMReply()`
- **Action:** Removed duplicate fetch/reply extraction logic

### ✅ 1.4 `float32ToInt16` / `floatTo16BitPCM` - FIXED

- **Status:** ✅ Fixed
- **Location:** `public/js/audio-utils.js`
- **Implementation:** `float32ToInt16` now calls `floatTo16BitPCM` (line 37-38)
- **Action:** Single implementation, two named exports for API clarity

### ✅ 1.5 Default n8n webhook URL - FIXED

- **Status:** ✅ Fixed
- **Locations:**
  - `src/config.ts` - Canonical source
  - `public/js/app.js` - Fallback in `getConfig()`
  - `vite.config.js` - Vite define fallback
  - `public/debug/fallback-revert-debug.html` - Debug page fallback
  - (Removed tools: `open-app-debug-send.mjs`, `check-stt-sample-rate.js` — see `debug/ORPHANED-DUPLICATE-OLD-CODE.md`)
- **Action:** Removed `PRODUCTION_WEBHOOK_URL` duplicate

---

## 2. Outdated Code

### ✅ 2.1 Cartesia API Version - FIXED

- **Status:** ✅ Fixed
- **Current version:** `2025-04-16` (matches `src/config.ts`)
- **Verified locations:**
  - ✅ `src/config.ts` - `API_VERSION: '2025-04-16'`
  - ✅ `public/js/cartesia-audio-bridge.js` - `CARTESIA_VERSION = '2025-04-16'` (line 12)
  - ✅ `vite.config.js` - `CARTESIA_VERSION = '2025-04-16'` (line 9)
  - (check-stt-sample-rate.js removed — Cartesia version in config.ts, bridge, vite.config.js)
- **Action:** All files updated with matching version and comments

---

## 3. Orphaned Code

### ✅ 3.1 Test-only exports - INTENTIONAL

- **Status:** ✅ Not orphaned (intentional public API)
- **Files:**
  - `public/js/audio-utils.js` - `floatTo16BitPCM`, `int16ToFloat32`, `float32ToInt16` (test/utility API)
  - `public/js/file-creator.js` - `createWavBlob`, `createWavBlobFromAudioFile` (documented public API)
  - `public/js/ocr-tool.js` - Internal exports used by `addOcrToAttachments`
  - `public/js/n8n-payload.js` - All exports used internally or in tests
- **Action:** Keep as public API (documented for external use)

### ✅ 3.2 Package entry - INTENTIONAL

- **Status:** ✅ Not orphaned
- **File:** `src/index.ts`
- **Purpose:** Package main entry point for external consumers
- **Action:** Keep as-is

### ✅ 3.3 Debug HTML pages - IN USE

- **Status:** ✅ Not orphaned
- **Files:**
  - `public/debug/debug-audioworklet.html`
  - `public/debug/fallback-revert-debug.html`
  - `public/debug/voice-pipeline-debug.html`
- **References:** Docs, QUICKSTART, unit tests
- **Action:** Keep as active debug tools

---

## 4. Unused Imports

### ✅ 4.1 All imports verified

- **Status:** ✅ No unused imports found
- **Verification:** ESLint configured to catch unused imports
- **Action:** None required

---

## 5. Recommendations

### High Priority

- ✅ **DONE:** All critical duplicates fixed
- ✅ **DONE:** API versions aligned

### Low Priority (Optional)

- ⚠️ **Optional:** Consolidate `escapeHtml` into shared utility (if desired)
  - Current state is acceptable (debug page intentionally self-contained)
  - Would require creating `public/js/dom-utils.js` or exporting from `debug.js`

---

## 6. Files to Review

### Documentation

- `debug/ORPHANED-DUPLICATE-OLD-CODE.md` - Audit of duplicates and orphaned code; kept up to date with current status (cors-handler and agentic-patterns in use; payload-verification removed).

---

## 7. Verification Checklist

- ✅ `getNaturalFallback` - Single source of truth
- ✅ `float32ToInt16` - Delegates to `floatTo16BitPCM`
- ✅ `JARVIS_DEBUG_SEND_TEST` - Uses `getLLMReply`
- ✅ Cartesia API version - `2025-04-16` everywhere
- ✅ Webhook URL - No duplicate `PRODUCTION_WEBHOOK_URL`
- ✅ `escapeHtml` - Consolidated in debug.js
- ✅ No orphaned code found
- ✅ No unused imports found
- ✅ All test-only exports are intentional public API

---

## Conclusion

**Overall Status:** ✅ **EXCELLENT**

The codebase is well-maintained with minimal duplication. All duplicates have been resolved, including `escapeHtml` (consolidated in `debug.js`). No orphaned code or unused imports were found.
