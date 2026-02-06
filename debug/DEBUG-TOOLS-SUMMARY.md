# Debug Tools Summary - Comprehensive Research & New Tools

**Date:** 2026-02-02  
**Status:** ✅ All debugging tools created and verified

---

## Run the app and watch the console

1. **Start the dev server** (if not already running):
   ```bash
   npm run vite
   ```
2. **Open the app:** [http://localhost:3000/](http://localhost:3000/)
3. **Watch the console** — choose one:
   - **In-page:** Press **F12** → **Console** tab. All `console.log` / `console.error` / `console.warn` and unhandled errors appear there.
   - **Copy log button:** Use the **"Copy log"** button (bottom-right) to copy captured errors to the clipboard.
   - **Live errors page:** Open [http://localhost:3000/debug/console-errors-live.html](http://localhost:3000/debug/console-errors-live.html) in a **second tab**. Keep it open while using the main app; errors from the main tab are shown there in real time (BroadcastChannel).
4. **Debug mode:** Add `?debug=1` to the main app URL for extra logging: [http://localhost:3000/?debug=1](http://localhost:3000/?debug=1)

---

## Overview

Per **zEn DeBuGgEr.md**, comprehensive research was conducted across all JSON, NPM, TS, JS, .md, .txt files in the project to identify all issues, errors, and fixes. New LIVE debugging tools were created for specific issues that lacked dedicated debugging tools.

---

## Debugging Tools (Current)

### Node.js CLI Tools (`debug/tools/`)
- **check-console-errors.js** - Static check for bad patterns in source (empty keywords, undefined refs). Run: `node debug/tools/check-console-errors.js`
- **check-porcupine-import.js** - Verifies @picovoice/porcupine-web import resolution
- **verify-wake-word-setup.js** - Full wake word setup verification (.env, keywords, paths). Run: `npm run test:wakeword`
- **debug-wake-word-initialization.js** - Wake word initialization debugging
- **debug-wake-word-keyword-validation-live.js** - Live keyword validation (built-in vs custom paths)
- **test-wake-word-activation-flow.js** - Activation flow test (detection → STT). Run: `npm run test:wakeword:activation`
- **wake-word-activation-test-cli.js** - Interactive CLI wake word test. Run: `npm run test:wakeword:cli`

### Browser-Based Debug Pages (`public/debug/`)
- **debug-audioworklet.html** - AudioWorklet validation
- **voice-pipeline-debug.html** - Voice pipeline checks
- **fallback-revert-debug.html** - Mic button and text message fallbacks
- **console-errors-live.html** - Live console error capture (main app with `?capture_errors=1`)
- **wake-word-activation-test.html** - Wake word activation test in browser

### Jest / Live Tests
- **debug/live/** - Porcupine import, wake word init live tests
- **debug/tests/** - STT, TTS, integration, audio format tests
- **debug/tests/openwakeword-live.test.js** - openWakeWord client/manager API, bridge integration, and VAD getStream regression (run with full suite: `npm test`)

---

## All Issues Documented

### Wake Word Initialization
- **Issue:** Wake word initialization timeout
- **Fix:** Always return promise with timeout handling
- **Tool:** `debug-wake-word-initialization.js`
- **Documentation:** `debug/WAKE-WORD-INITIALIZATION-TIMEOUT-FIX.md`

### Wake Word Setup & Keywords
- **Tool:** `verify-wake-word-setup.js` (`npm run test:wakeword`) — .env, keywords, paths
- **Tool:** `debug-wake-word-keyword-validation-live.js` — live keyword validation

### Fallback Reverts
- **Issue:** Mic button and text messages reverting to fallbacks
- **Tool:** `fallback-revert-debug.html`
- **Documentation:** `debug/FALLBACK-REVERT-RESEARCH.md`

### Console Errors
- **Static check:** `check-console-errors.js` — bad patterns in code
- **Live capture:** `public/debug/console-errors-live.html` + main app `?capture_errors=1`
- **Guide:** `debug/CONSOLE-ERROR-CHECK-GUIDE.md`

---

## NPM Scripts (Debug / Wake Word)

```bash
npm run debug              # Full suite: lint → test → build → vite build
npm run debug:live         # Live Jest tests (debug/live)
npm run test:wakeword      # Verify wake word setup (verify-wake-word-setup.js)
npm run test:wakeword:activation  # Activation flow (test-wake-word-activation-flow.js)
npm run test:wakeword:cli  # Interactive CLI wake word test
npm test                   # All Jest tests
```

---

## Usage Guide

### Quick Start
```bash
# Verify wake word config (no server needed)
npm run test:wakeword

# Run full debug suite
npm run debug

# Start server and use browser debug pages
npm run vite
# Then open: http://localhost:3000/debug/console-errors-live.html
# Or: http://localhost:3000/debug/wake-word-activation-test.html
```

---

## Related Documentation

- `zEn DeBuGgEr.md` - Original requirements
- `debug/README.md` - Debug suite overview
- `debug/STATUS.md` - Debug system status
- `debug/SUMMARY.md` - Simplified debug tools summary
- `debug/errors-and-fixes.md` - Comprehensive error fixes log
- `aUdiO dOcS.md` - AudioWorklet implementation guide
- `gHiDrA eNgInEeRiNg.md` - Debugging methodology reference

---

## Conclusion

The debug suite includes CLI tools for wake word setup and console checks, browser debug pages for live testing, and Jest/live tests. Duplicate and obsolete tools have been removed; see `debug/ORPHANED-DUPLICATE-OLD-CODE.md` for the audit.
