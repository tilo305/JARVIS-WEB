# Wake Word Troubleshooting Guide

## Issue: Wake Word Not Being Detected

This guide helps diagnose and fix wake word detection issues.

## Quick Diagnostic Checklist

### 1. Check Configuration ✅

Verify these environment variables are set in `.env`:

```env
WAKE_WORD_ACCESS_KEY=your_access_key_here
PORCUPINE_KEYWORD=jarvis
PORCUPINE_SENSITIVITY=0.5
WAKE_WORD_ENABLED=true
```

**To check:**
- Open browser console (F12)
- Look for debug messages starting with `WakeWordManager:`
- Check for error messages about missing AccessKey or keyword files

### 2. Verify Keyword File Exists ✅

The `.ppn` keyword file must be in `public/keywords/` directory.

**Default naming pattern:** `{keyword}_en_wasm_v3_0_0.ppn`

For example, if `PORCUPINE_KEYWORD=jarvis`, the file should be:
- `public/keywords/jarvis_en_wasm_v3_0_0.ppn`

**To check:**
1. Navigate to `public/keywords/` directory
2. Verify `.ppn` file exists
3. Check browser console for 404 errors when loading the file

**To get a keyword file:**
1. Get AccessKey from your service provider
2. Navigate to **Porcupine** page
3. Create or select your wake word
4. Train for **Web** platform
5. Download the `.ppn` file
6. Place it in `public/keywords/` directory

### 3. Check Browser Console for Errors ✅

Open browser DevTools (F12) and check the Console tab for:

**Common Errors:**

1. **"Wake word keyword file not found"**
   - **Fix:** Ensure `.ppn` file exists in `public/keywords/` directory
   - Check the file path matches the expected pattern

2. **"Invalid AccessKey"**
   - **Fix:** Verify your AccessKey from your service provider
   - Ensure AccessKey is correct and not expired

3. **"Wake word processor disabled"**
   - **Fix:** Check that wake word is enabled after initialization
   - Look for `WakeWordManager: setEnabled` messages in console

4. **"Wake word processor: no audio input"**
   - **Fix:** Microphone permission may not be granted
   - Click the mic button to grant permission
   - Check browser microphone settings

5. **"CORS error loading keyword file"**
   - **Fix:** Ensure keyword file is served from same origin
   - For production, ensure proper CORS headers

### 4. Verify Microphone Permission ✅

Wake word detection requires microphone access.

**To check:**
1. Look for browser permission prompt
2. Check browser console for "getUserMedia" errors
3. Verify microphone is working (test with mic button)

**To fix:**
- Click the mic button to grant permission
- Check browser settings → Privacy → Microphone
- Ensure microphone is not blocked

### 5. Check Wake Word Initialization ✅

Look for these debug messages in browser console:

**Successful initialization:**
```
WakeWordManager: Porcupine initialized
WakeWordManager: AudioWorklet processor loaded successfully
WakeWordManager: AudioWorklet setup complete
WakeWordManager: setEnabled { enabled: true, ... }
```

**Failed initialization:**
```
WakeWordManager: Initialization failed
Wake word initialization failed: [error message]
```

### 6. Verify Audio Flow ✅

Check for these debug messages:

**Audio flowing:**
```
Wake word processor: sending frame 1 (512 samples)
Wake word processor: sending frame 2 (512 samples)
```

**No audio:**
```
Wake word processor: no audio input
Wake word processor disabled
```

### 7. Test Sensitivity ✅

If wake word is not detected, try adjusting sensitivity:

```env
PORCUPINE_SENSITIVITY=0.7  # Higher = more sensitive (may have false alarms)
PORCUPINE_SENSITIVITY=0.3  # Lower = less sensitive (may miss detections)
```

**Recommended:** Start at 0.5, adjust based on results.

### 8. Check Wake Word Status in UI ✅

The wake word tracker panel should show:

- **"Wake word active — waiting..."** - Wake word is listening
- **"Wake word not configured"** - Missing configuration
- **"Microphone permission needed"** - Need to grant mic permission
- **"Error: [message]"** - Check error message for details

## Step-by-Step Debugging

### Step 1: Check Configuration

```bash
# In project root, check .env file
cat .env | grep -E "WAKE_WORD|PORCUPINE"
```

Should show:
- `WAKE_WORD_ACCESS_KEY=...`
- `PORCUPINE_KEYWORD=...`
- `WAKE_WORD_ENABLED=true`

### Step 2: Verify Keyword File

```bash
# Check if keyword file exists
ls -la public/keywords/*.ppn
```

Should show at least one `.ppn` file.

### Step 3: Test in Browser

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `WakeWordManager:` messages
4. Check for errors
5. Try saying the wake word
6. Watch for detection messages

### Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "ppn"
4. Check if keyword file loads (should be 200 OK)
5. If 404, file is missing or path is wrong

## Common Issues and Solutions

### Issue: "Wake word not configured"

**Cause:** Missing configuration or keyword file

**Solution:**
1. Set `WAKE_WORD_ENABLED=true` in `.env`
2. Set `WAKE_WORD_ACCESS_KEY` in `.env`
3. Set `PORCUPINE_KEYWORD` in `.env`
4. Place `.ppn` file in `public/keywords/`

### Issue: "Keyword file not found (404)"

**Cause:** `.ppn` file missing or wrong path

**Solution:**
1. Download `.ppn` file from your service provider
2. Place in `public/keywords/` directory
3. Verify filename matches expected pattern
4. Restart dev server

### Issue: "Invalid AccessKey"

**Cause:** Wrong or expired AccessKey

**Solution:**
1. Get new AccessKey from your service provider
2. Update `.env` file
3. Restart dev server

### Issue: "Wake word processor: no audio input"

**Cause:** Microphone not connected or permission denied

**Solution:**
1. Grant microphone permission (click mic button)
2. Check microphone is connected
3. Test microphone in other apps
4. Check browser microphone settings

### Issue: Wake word detected but STT doesn't start

**Cause:** STT activation failed after wake word

**Solution:**
1. Check browser console for STT errors
2. Verify Cartesia API key is set
3. Check network connection
4. Look for `onWakeWordDetected` callback errors

## Advanced Debugging

### Enable Debug Logging

Add to `.env`:
```env
DEBUG_WAKE_WORD=true
```

Or in browser console:
```javascript
window.JARVIS_DEBUG = true;
```

### Check Wake Word Metrics

In browser console:
```javascript
// Get wake word metrics
const metrics = bridge.getWakeWordMetrics();
console.log('Wake word metrics:', metrics);
```

Should show:
- `detectionCount`: Number of detections
- `avgDetectionLatency`: Average detection time
- `uptimeMs`: How long wake word has been active

### Test Wake Word Directly

In browser console:
```javascript
// Check if wake word is enabled
bridge.isWakeWordEnabled(); // Should return true

// Check if waiting for wake word
bridge.isWakeWordWaiting(); // Should return true when waiting

// Get metrics
bridge.getWakeWordMetrics(); // Should return metrics object
```

## Still Not Working?

1. **Check browser compatibility:**
   - Chrome 66+, Safari 14.1+, Firefox 76+, Edge 79+
   - Requires HTTPS or localhost (secure context)

2. **Verify AudioWorklet support:**
   ```javascript
   // In browser console
   typeof AudioWorkletNode !== 'undefined' // Should be true
   ```

3. **Check Porcupine version:**
   - Ensure using latest wake word package
   - Check package.json for version

4. **Review documentation:**
   - [WAKE-WORD-SETUP.md](./WAKE-WORD-SETUP.md)
   - [wAkE wOrD dOcS.md](./wAkE%20wOrD%20dOcS.md)

5. **Check for known issues:**
   - Review [WAKE-WORD-DEBUG-FIXES.md](./WAKE-WORD-DEBUG-FIXES.md)
   - Check GitHub issues

## Summary

Most common issues:
1. **Missing keyword file** - Download `.ppn` from your service provider
2. **Missing AccessKey** - Get from your service provider
3. **Microphone permission** - Grant permission via mic button
4. **Wrong configuration** - Check `.env` file settings

Check browser console for specific error messages - they will guide you to the exact issue.
