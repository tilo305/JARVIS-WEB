# Wake Word Initialization Timeout - Error Explanation

## What You're Seeing

**Console Error:**
```
[JARVIS] [ERROR] Wake word initialization failed or timed out
Error: Wake word initialization timeout after 15000ms
at cartesia-audio-bridge.js:372:16
```

## What This Means

The wake word detection system (Porcupine) is trying to start up, but it's taking longer than 15 seconds, so it gives up and shows this error.

## Why This Happens

The wake word initialization involves several steps that can be slow:

### 1. Loading Porcupine SDK (3-10 seconds)
- Downloads JavaScript and WebAssembly files from the internet
- **First-time users:** Slower because browser has no cache
- **Slow networks:** Much slower (can take 10+ seconds)

### 2. Validating Keyword Files (2-6 seconds)
- Checks if `.ppn` files exist on the server
- Each file check: up to 2 seconds
- Multiple files: time adds up

### 3. Initializing Porcupine Engine (5-10 seconds)
- Creates the wake word detection engine
- Loads model files
- Sets up audio processing pipeline

### 4. Loading AudioWorklet Processor (1-5 seconds)
- Loads the audio processor script
- Registers it with the browser's audio system

**Total time needed:** 15-30 seconds on slow networks  
**Current timeout:** 15 seconds ❌ **TOO SHORT**

## The Fix Applied

✅ **Increased timeout from 15 seconds to 30 seconds**

This gives the system enough time to:
- Download files on slow networks
- Complete first-time initialization
- Handle network delays gracefully

**File changed:** `public/js/cartesia-audio-bridge.js` (line 369)

## How to Make It Even Faster

### Option 1: Use Built-in Keyword (Recommended)

Instead of using a custom `.ppn` file, use the built-in "Jarvis" keyword:

**In your environment variables or config:**
```javascript
VITE_PORCUPINE_KEYWORD=Jarvis
```

**Or in `window.JARVIS_CONFIG`:**
```javascript
window.JARVIS_CONFIG = {
  porcupineKeyword: 'Jarvis'  // Built-in keyword, no file download needed
};
```

**Result:** Initialization completes in 3-5 seconds instead of 15-30 seconds.

### Option 2: Preload on App Startup

The system can preload Porcupine SDK when the app starts, so wake word initialization is faster when needed.

## What the Documentation Says

### cArTeSiA dOcS.md
- WebSocket timeout is 3 minutes, but initialization needs more time for file loading
- Network delays should be accounted for in timeouts

### wAkE wOrD dOcS.md
- Built-in keywords available: "Jarvis", "Computer", "Alexa", etc.
- Use built-in keywords to avoid file download delays
- Common issues include timeout, file not found, AccessKey invalid

### aUdiO dOcS.md
- AudioWorklet requires HTTPS, runs in separate thread
- AudioWorklet loading can be slow on first load
- Sample rate compatibility (16kHz for wake word matches STT)

## Testing

After the fix, test:
- ✅ Fast network: Should complete in <5 seconds (with built-in keyword)
- ✅ Slow network (3G): Should complete in <30 seconds
- ✅ No network: Should timeout gracefully with clear error
- ✅ Invalid AccessKey: Should fail quickly with helpful message

## Next Steps

1. ✅ **Fix applied:** Timeout increased to 30 seconds
2. **Optional:** Switch to built-in keyword "Jarvis" for faster initialization
3. **Optional:** Preload Porcupine SDK on app startup
4. **Monitor:** Check if errors still occur after fix

## Related Files

- `WAKE-WORD-TIMEOUT-RESEARCH.md` - Detailed technical analysis
- `WAKE-WORD-TIMEOUT-SUMMARY.md` - Quick reference guide
- `public/js/cartesia-audio-bridge.js` - Main implementation
- `public/js/wake-word-manager.js` - Porcupine integration
