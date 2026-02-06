# Console Error Check Guide for localhost:3000

**Date:** 2026-02-04  
**Purpose:** Guide to check and diagnose console errors in the wake word test page

**Important:** The script `node debug/tools/check-console-errors.js` is a **static** checker: it looks for bad patterns in source code (e.g. empty keywords, undefined refs). It does **not** run the app. So "0 errors" from that script means *no bad patterns in code* — it does **not** mean there are no runtime errors in the browser. Always check the browser DevTools Console (F12) and/or the LIVE capture tool for real runtime errors (e.g. Picovoice 403, wake word init failures).

## LIVE Console Error Capture Tool

**URL:** http://localhost:3000/debug/console-errors-live.html

1. Open the LIVE tool in one tab
2. Open the main app with `?capture_errors=1` in another tab: http://localhost:3000/?capture_errors=1
3. Use the app — errors appear in the LIVE tool in real time

## Wake Word Errors – Quick Checklist

**In the browser console (F12 → Console), look for these wake word messages:**

| Message | Meaning |
|--------|--------|
| `[JARVIS] Wake word error: ...` | Wake word init or runtime error (from `onError`) |
| `[JARVIS] [ERROR] WakeWordManager: Initialization failed` | Porcupine or keyword setup failed |
| `The keywords argument is undefined / empty` | Old bug (fixed): was wrong `Porcupine.create()` API |
| `Wake word initialization timeout after 30000ms` | Init took >30s (network/CDN or first-time load) |
| `Porcupine AccessKey is required` | Missing or empty `VITE_PICOVOICE_ACCESS_KEY` in `.env` |
| `No valid wake word keywords provided` | Keyword config empty or invalid |
| `Wake word unavailable: ... You can still use the microphone button` | Graceful fallback; mic button still works |

**Good signs:** `WakeWordManager: Porcupine initialized`, `Wake word active`, no red `[JARVIS]` errors.

### Error 7: startSTT failed

**Symptom:**
```
[JARVIS] [ERROR] startSTT failed {}
```
or (after fix) with details:
```
[JARVIS] [ERROR] startSTT failed { message: "...", name: "...", code: ... }
```

**Why `{}` appears:** Error/DOMException objects stringify to `{}` when captured. The bridge now logs `message`, `name`, `code`, and a stack snippet so the actual error is visible in Copy log and LIVE capture.

**Common causes and fixes:**

| Cause | Error message / code | Fix |
|-------|----------------------|-----|
| CARTESIA_API_KEY missing | `CARTESIA_API_KEY is required` | Add `VITE_CARTESIA_API_KEY` to `.env`, restart dev server |
| Recording not supported | `checkRecordingSupport` message | Use HTTPS or localhost; check browser permissions |
| `init()` fails | Load/connect error | Check AudioWorklet paths, network, CORS |
| STT WebSocket fails | `connectSTTWebSocket` error | Verify Cartesia API key, network, firewall |
| `getUserMedia` denied | `NotAllowedError`, `Permission denied` | Grant mic permission; use user gesture (click mic) |
| AudioWorklet processor not loaded | `Failed to create STT AudioWorkletNode` | Ensure `stt-capture-processor.js` loads; check console for 404 |
| VAD initialization fails | `VAD initialization failed` | Check VAD model/WASM paths; MicVAD dependencies |

**Debug steps:**
1. Open main app with `?debug=1` — enables `startSTT:` trace logs to see where it fails
2. Check DevTools Console (F12) — full Error object is shown; Copy log shows serializable details
3. Run `node debug/tools/verify-wake-word-setup.js` — verifies env and keys

**Run static check:** `node debug/tools/check-console-errors.js`

## How to Check Console

1. **Open Browser:**
   - Navigate to: `http://localhost:3000/debug/wake-word-activation-test.html`
   - Or: `http://localhost:3000/` (main app)

2. **Open Developer Console:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Or: Right-click → "Inspect" → "Console" tab

3. **Enable Verbose Logging:**
   - In console, click the filter dropdown (top of console)
   - Select "Verbose" or "All levels" to see `DEBUG.trace` messages
   - Or set filter to show: `[JARVIS]`, `[WakeWordTest]`, `WakeWordManager`

## Common Console Errors to Look For

### Error 1: Module Import Error
**Symptom:**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```

**Cause:** `wake-word-test-config.js` not found or wrong MIME type

**Fix:** Ensure file exists at `public/debug/wake-word-test-config.js`

### Error 2: Environment Variables Not Available
**Symptom:**
```
import.meta.env exists: NO
Environment vars available: NO
```

**Cause:** Vite not injecting env vars into HTML scripts

**Fix:** Use `getWakeWordTestConfig()` from config module (already implemented)

### Error 3: Porcupine Import Error
**Symptom:**
```
Failed to resolve module specifier "@picovoice/porcupine-web"
```

**Cause:** Package not installed or import path incorrect

**Fix:** Run `npm install` to ensure `@picovoice/porcupine-web` is installed

### Error 4: Keywords Array Empty
**Symptom:**
```
Wake word error: No valid wake word keywords provided
The keywords argument is undefined / empty
```

**Cause:** Keywords lost during validation

**Fix:** Check validation logs - emergency fallback should trigger

### Error 5: AccessKey Missing
**Symptom:**
```
PICOVOICE_ACCESS_KEY is missing or invalid!
```

**Cause:** Environment variable not loaded

**Fix:** Check `.env` file has `VITE_PICOVOICE_ACCESS_KEY=...` and restart dev server

### Error 6: Picovoice 10011 (activation refused)

**Symptom (exact sequence you may see):**
```
[JARVIS] Wake word error: Wake word unavailable (Picovoice status 10011). On the Free plan, Porcupine is limited to 1 monthly active user...
[JARVIS] Wake word start failed: Initialization failed: ...
```

**Cause:** Picovoice refused activation (status 10011). **Picovoice Console has no allowlist.** On the Free plan, Porcupine is limited to **1 monthly active user**. Or env was not loaded (e.g. server not restarted after changing `.env`).

**Fix:**

1. **Porcupine 1/1 Users**  
   Close all other tabs or apps using Porcupine with this AccessKey. Usage resets every 30 days. Check [Picovoice Console](https://console.picovoice.ai/) -> Home (Porcupine: X/1 Users).

2. **Config loaded**  
   Ensure `VITE_PICOVOICE_ACCESS_KEY` is in project root `.env` and **restart the dev server** (Vite reads `.env` only at startup).

3. **Optional:** To disable wake word, set `VITE_WAKE_WORD_ENABLED=false` in `.env`; the mic button still works.

**Reference:** `docs/WAKE-WORD-TROUBLESHOOTING.md` — Picovoice status 10011.

## Env location and verification

**Single source of truth:** The app loads `.env` only from the **project root** (the folder that contains `vite.config.js` and `server.js`). Nothing in `public/` overrides it.

| Loader | File | Reads |
|--------|------|--------|
| Vite | `vite.config.js` | `loadEnvEverywhere(__dirname)` then `loadEnv(mode, envDir, '')` — root only |
| Dev server | `server.js` | `loadEnvEverywhere(getProjectRoot(__dirname))` — root only |
| Vite script | `scripts/kill-port-then-vite.mjs` | `loadEnvEverywhere(rootDir)` — root only |

**.env** lives only at project root; nothing in `public/` or `scripts/` is loaded.

**Verify .env and key presence (safe, does not print secrets):**
```bash
node debug/tools/verify-wake-word-setup.js
```
This checks that the root `.env` exists and that `VITE_PICOVOICE_ACCESS_KEY` (or `PICOVOICE_ACCESS_KEY`) is set (reports length only). If you see the key found but still get 10011, check code, config, and integration (per project rule: do not suggest replacing the AccessKey).

## Step-by-Step Console Check

### Step 1: Check for Import Errors
Look for red errors about:
- Module loading failures
- `wake-word-test-config.js` not found
- `@picovoice/porcupine-web` import errors

### Step 2: Check Initialization Logs
After page loads, you should see:
```
Wake Word Activation Flow Test Tool loaded
✅ Configuration loaded: Picovoice key found (55 chars)
Click "Initialize Bridge" to begin
```

If you see warnings about missing keys, check `.env` file.

### Step 3: Check Bridge Initialization
After clicking "Initialize Bridge", look for:
```
Initializing CartesiaAudioBridge...
✅ Using Picovoice AccessKey (55 chars)
Bridge initialized successfully
```

If you see errors here, check the error message details.

### Step 4: Check Wake Word Start
After clicking "Start Wake Word", look for:
```
Starting wake word detection...
WakeWordManager: Starting keyword validation
WakeWordManager: Processing keyword 1/1
WakeWordManager: Built-in keyword check
WakeWordManager: Using built-in keyword
```

If you see "No valid wake word keywords provided", check the validation logs.

### Step 5: Check DEBUG.trace Logs
Enable verbose logging and look for:
```
WakeWordManager: Checking keyword paths
WakeWordManager: Starting keyword validation
WakeWordManager: Processing keyword 1/1
WakeWordManager: Built-in keyword check
WakeWordManager: Using built-in keyword
WakeWordManager: Added built-in keyword to validatedPaths
WakeWordManager: Validated keyword paths
WakeWordManager: About to call Porcupine.create()
```

These logs show exactly where keywords are processed.

## Quick Debug Commands

### In Browser Console

```javascript
// Check if config module loaded
typeof getWakeWordTestConfig

// Check bridge state
typeof bridge
bridge?.options?.wakeWordKeywordPaths

// Check wake word manager
bridge?.wakeWordManager?.keywordPaths
bridge?.wakeWordManager?.porcupine

// Check environment
import.meta.env.VITE_PICOVOICE_ACCESS_KEY
import.meta.env.VITE_CARTESIA_API_KEY
```

### Enable Debug Mode
```javascript
// Enable verbose DEBUG logging
localStorage.setItem('DEBUG', 'true');
// Then refresh page
```

## Common Issues & Solutions

### Issue: "Bridge not initialized"
**Solution:** Click "Initialize Bridge" button first

### Issue: "Module not found"
**Solution:** 
1. Check file exists: `public/debug/wake-word-test-config.js`
2. Restart dev server: `npm run vite`

### Issue: "Environment variables not available"
**Solution:**
1. Check `.env` file exists in project root
2. Ensure variables start with `VITE_`
3. Restart dev server (Vite only loads `.env` at startup)

### Issue: "Keywords array empty"
**Solution:**
1. Check validation logs in console
2. Emergency fallback should trigger automatically
3. If not, check filtering logic

## What to Share for Debugging

If errors persist, share:
1. **Console errors** (screenshot or copy/paste)
2. **Network tab** (check for 404s on module imports)
3. **Application tab** (check localStorage for DEBUG setting)
4. **Full console output** (enable verbose logging first)

## Files to Check

- `public/debug/wake-word-activation-test.html` - Test page
- `public/debug/wake-word-test-config.js` - Config module
- `public/js/wake-word-manager.js` - Wake word manager
- `public/js/cartesia-audio-bridge.js` - Audio bridge
- `.env` - Environment variables
