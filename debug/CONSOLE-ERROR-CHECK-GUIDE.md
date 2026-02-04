# Console Error Check Guide for localhost:3000

**Date:** 2026-02-04  
**Purpose:** Guide to check and diagnose console errors in the wake word test page

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
