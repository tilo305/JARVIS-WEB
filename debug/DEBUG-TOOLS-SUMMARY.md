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
| **validate-strip-markdown-sync.js** | Ensures stripMarkdownForTTS (no asterisk/underscore TTS) stays in sync in app.js, bidirectional-conversation, and tests. Run: `node debug/tools/validate-strip-markdown-sync.js` |
| **validate-cors-handler.js** | Validates cors-handler.js exports and app.js integration. Run: `node debug/tools/validate-cors-handler.js` |
| **validate-electron-paths.js** | Verifies electron/main.js, electron/preload.js, and dist-public/index.html exist (run after vite:build). Run: `node debug/tools/validate-electron-paths.js` |
| **verify-electron-integration.mjs** | Verifies Electron ↔ Vite, preload bridge, frontend, backend wiring. Run: `npm run electron:verify` or `node debug/tools/verify-electron-integration.mjs` |
| **smoke-electron-built.mjs** | Spawns Electron with USE_BUILT=1, checks stderr for path/load errors (live smoke test). Run: `node debug/tools/smoke-electron-built.mjs` |
| **kill-all-tasks** (npm) | Kills Vite (port 3000), Electron, and related Node processes. Run: `npm run kill:all` (script: `scripts/kill-all-tasks.mjs`). |
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
| **draggable-chat-live.html** | Manual checklist for draggable chat interface (portable window) |

### Jest / debug tests (`debug/tests/`)

- **debug/tests/** — STT, TTS, bidirectional, integration, audio format, greeting, timestamp, strip-markdown, **cors-handler**, websocket optimization, **draggable-chat-interface**, **electron-integration** (main/preload/bridge wiring).
- Run with full suite: `npm test`
- Integration only (no coverage): `npm run test:integration`

---

## NPM scripts (debug)

```bash
npm run debug              # Full suite: lint → strip-markdown sync → test → build → vite build → Electron paths → Electron integration → Electron built smoke → kill:all
npm test                   # All Jest tests (including debug/tests)
npm run test:integration   # Cartesia integration tests only (debug/tests/integration)
```

---

## Related documentation

- `debug/README.md` — Debug suite overview
- `debug/ORPHANED-DUPLICATE-OLD-CODE.md` — Audit of duplicates and removals
- `debug/CONSOLE-ERROR-CHECK-GUIDE.md` — Console error checking
- `debug/errors-and-fixes.md` — Error fixes log
