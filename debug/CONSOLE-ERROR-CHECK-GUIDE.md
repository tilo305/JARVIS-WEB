# Console Error Check Guide

**Purpose:** Check and diagnose console errors when running the app at localhost:3000.

**Important:** The script `node debug/tools/check-console-errors.js` is a **static** checker: it looks for bad patterns in source code (e.g. undefined refs). It does **not** run the app. So "0 errors" from that script means *no bad patterns in code* — it does **not** mean there are no runtime errors in the browser. Always check the browser DevTools Console (F12) and/or the LIVE capture tool for real runtime errors.

## LIVE Console Error Capture

**URL:** http://localhost:3000/debug/console-errors-live.html

1. Open the LIVE tool in one tab.
2. Open the main app with `?capture_errors=1` in another tab: http://localhost:3000/?capture_errors=1
3. Use the app — errors appear in the LIVE tool in real time.

## Static check

Run:

```bash
node debug/tools/check-console-errors.js
```

Checks `public/js/app.js` and `public/js/cartesia-audio-bridge.js` for common bad patterns.

## Common runtime errors

| Symptom | Cause | Fix |
|--------|--------|-----|
| `startSTT failed` / CARTESIA_API_KEY | Missing or invalid key | Add `VITE_CARTESIA_API_KEY` to `.env`, restart dev server |
| Recording not supported | Permissions or context | Use HTTPS or localhost; grant mic permission |
| STT WebSocket fails | API key or network | Verify Cartesia API key, network, firewall |
| `getUserMedia` denied | Permission denied | Grant mic permission; use user gesture (click mic) |
| AudioWorklet processor not loaded | 404 or path | Ensure `stt-capture-processor.js` loads; check console for 404 |
| VAD initialization fails | Model/WASM paths | Check VAD config and dependencies |

## How to check the console

1. Open the app: http://localhost:3000/ (or a debug page under http://localhost:3000/debug/).
2. Open DevTools: **F12** (or **Ctrl+Shift+I** / **Cmd+Option+I**) → **Console** tab.
3. For more logging: add `?debug=1` to the URL or use the console filter for `[JARVIS]`.

## Env location

The app loads `.env` only from the **project root** (folder containing `vite.config.js` and `server.js`). Restart the dev server after changing `.env`.

## Files to check when debugging

- `public/js/app.js` — main app
- `public/js/cartesia-audio-bridge.js` — audio bridge
- `public/debug/console-errors-live.html` — live error capture
- `.env` — environment variables (root only)
