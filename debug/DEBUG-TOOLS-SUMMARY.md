# Debug Tools Summary

**Date:** 2026-02-07  
**Status:** Current — wake word and obsolete CLI tools removed; only active tools listed.

---

## Run the app and watch the console

1. **Start the dev server** (if not already running):
   ```bash
   npm run vite
   ```
2. **Open the app:** [http://localhost:3000/](http://localhost:3000/)
3. **Watch the console** — choose one:
   - **In-page:** Press **F12** → **Console** tab.
   - **Copy log button:** Use the **"Copy log"** button (bottom-right) to copy captured errors to the clipboard.
   - **Live errors page:** Open [http://localhost:3000/debug/console-errors-live.html](http://localhost:3000/debug/console-errors-live.html) in a **second tab** for real-time errors (BroadcastChannel).
4. **Debug mode:** Add `?debug=1` to the main app URL: [http://localhost:3000/?debug=1](http://localhost:3000/?debug=1)

---

## Current debug tools

### Node.js CLI tools (`debug/tools/`)

| Tool | Purpose |
|------|---------|
| **check-console-errors.js** | Static check for bad patterns in app and bridge (undefined refs, etc.). Run: `node debug/tools/check-console-errors.js` |
| **test-copy-log-reset.js** | Tests copy-log reset behavior. |
| **test-text-response-fix.js** | Tests text response handling. |
| **test-timestamp-live.js** | Timestamp display checks. |
| **test-greeting-live.html** | Browser-based greeting/time-of-day test (open in browser). |

### Browser debug pages (`public/debug/`)

| Page | Purpose |
|------|---------|
| **debug-audioworklet.html** | AudioWorklet validation |
| **voice-pipeline-debug.html** | Voice pipeline checks |
| **fallback-revert-debug.html** | Mic button and text message fallbacks (n8n test) |
| **console-errors-live.html** | Live console error capture (use main app with `?capture_errors=1`) |

### Jest / debug tests (`debug/tests/`)

- **debug/tests/** — STT, TTS, bidirectional, integration, audio format, greeting, timestamp, strip-markdown, websocket optimization.
- Run with full suite: `npm test`
- Integration only (no coverage): `npm run test:integration`

---

## NPM scripts (debug)

```bash
npm run debug              # Full suite: lint → test → build → vite build
npm test                   # All Jest tests (including debug/tests)
npm run test:integration   # Cartesia integration tests only (debug/tests/integration)
```

---

## Related documentation

- `debug/README.md` — Debug suite overview
- `debug/ORPHANED-DUPLICATE-OLD-CODE.md` — Audit of duplicates and removals
- `debug/CONSOLE-ERROR-CHECK-GUIDE.md` — Console error checking
- `debug/errors-and-fixes.md` — Error fixes log
