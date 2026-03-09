# JARVIS Error Log Checker

Check captured error logs for issues and get suggested fixes.

## Usage

1. **Copy logs from the app** — Click "Copy error logs" (clipboard icon) in JARVIS.
2. **Save to file** — Paste into `debug/results/jarvis-logs.txt` (or any file).
3. **Run checker:**
   ```bash
   npm run check:logs debug/results/jarvis-logs.txt
   # or
   node debug/tools/check-error-logs.js debug/results/jarvis-logs.txt
   ```
4. **From stdin:**
   ```bash
   node debug/tools/check-error-logs.js < path/to/logs.txt
   ```

## Exit codes

- `0` — No serious errors
- `1` — Errors found (exceptions, rejections)
- `2` — Invalid input or file not found

## Getting better diagnostics for "(no message)" errors

Uncaught exceptions with no message often come from script load failures or cross-origin code. To see the real error:

1. Open DevTools **before** loading (F12 or View → Toggle Developer Tools).
2. Reload the app.
3. Check the Console tab for the full error and stack.

## Mic button not activating

If the mic button does nothing when clicked:

1. **App failed to load** — Uncaught exceptions during startup prevent the mic handler from being attached. In DevTools Console, run `window.JARVIS_BRIDGE` — if `undefined`, the app did not finish loading. Fix the errors shown in the log first.
2. **Missing API key** — Ensure `CARTESIA_API_KEY` is set (Vite `.env` or `window.JARVIS_CONFIG.apiKey` for static HTML). The status bar will show "Add CARTESIA_API_KEY" if missing.
3. **Mic permission denied** — Grant microphone access when prompted. In Electron, use Settings → Privacy if needed.
4. **Script load failures** — The improved error capture now shows "Script load failed: &lt;url&gt;" for failed script loads. Fix those paths or CORS first.
