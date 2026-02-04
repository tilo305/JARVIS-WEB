# Wake Word Initialization Timeout - Summary

## What the Error Means

**Error:** `Wake word initialization timeout after 15000ms`

**Translation:** The wake word system (Porcupine) is taking longer than 15 seconds to start up, so it's giving up and showing an error.

## Why This Happens

The wake word initialization involves several steps that can be slow:

1. **Loading Porcupine SDK** (3-10 seconds)
   - Downloads JavaScript and WebAssembly files
   - First-time users: slower (no cache)
   - Slow networks: much slower

2. **Validating Keyword Files** (2-6 seconds)
   - Checks if `.ppn` files exist
   - Each file: up to 2 seconds
   - Multiple files: adds up quickly

3. **Initializing Porcupine** (5-10 seconds)
   - Creates the wake word detection engine
   - Loads model files
   - Sets up audio processing

4. **Loading AudioWorklet** (1-5 seconds)
   - Loads the audio processor script
   - Registers it with the browser

**Total time needed:** 15-30 seconds on slow networks
**Current timeout:** 15 seconds ❌ **TOO SHORT**

## Quick Fixes

### Option 1: Use Built-in Keyword (Fastest - Recommended)

Instead of using a custom `.ppn` file, use the built-in "Jarvis" keyword:

**Before:**
```javascript
wakeWordKeywordPaths: ['keywords/jarvis_en_wasm_v3_0_0.ppn']
```

**After:**
```javascript
wakeWordKeywordPaths: ['Jarvis']  // Built-in keyword, no file download needed
```

**Result:** Initialization completes in 3-5 seconds instead of 15-30 seconds.

### Option 2: Increase Timeout

**File:** `public/js/cartesia-audio-bridge.js` (line 369)

**Change:**
```javascript
// From:
const INIT_TIMEOUT_MS = 15000; // 15 seconds

// To:
const INIT_TIMEOUT_MS = 30000; // 30 seconds
```

**Result:** Gives more time for slow networks, but users still wait longer.

### Option 3: Both (Best Solution)

1. Use built-in keyword for speed
2. Increase timeout as safety net

**Result:** Fast initialization (3-5s) with fallback if something goes wrong.

## What Each Documentation File Says

### cArTeSiA dOcS.md
- **Relevant:** WebSocket timeout is 3 minutes, but initialization needs more time
- **Takeaway:** Timeouts should account for network delays and file loading

### wAkE wOrD dOcS.md
- **Relevant:** Built-in keywords available (Jarvis, Computer, etc.)
- **Takeaway:** Use built-in keywords to avoid file download delays
- **Relevant:** Common issues include timeout, file not found, AccessKey invalid
- **Takeaway:** Proper error handling and timeouts are critical

### aUdiO dOcS.md
- **Relevant:** AudioWorklet requires HTTPS, runs in separate thread
- **Takeaway:** AudioWorklet loading can be slow on first load
- **Relevant:** Sample rate compatibility (16kHz for wake word matches STT)
- **Takeaway:** Audio processing setup adds initialization time

## Recommended Action Plan

### Immediate (Do Now)
1. ✅ Switch to built-in keyword "Jarvis"
2. ✅ Increase timeout to 30 seconds
3. ✅ Test on slow network (3G throttling)

### Short-term (This Week)
1. ✅ Add progress logging ("Initializing wake word... 5s elapsed")
2. ✅ Optimize keyword validation (parallel requests)
3. ✅ Add better error messages

### Long-term (This Month)
1. ✅ Preload Porcupine SDK on app startup
2. ✅ Cache validation results
3. ✅ Add retry mechanism

## Testing

After applying fixes, test:
- ✅ Fast network: Should complete in <5 seconds
- ✅ Slow network (3G): Should complete in <20 seconds
- ✅ No network: Should timeout gracefully with clear error
- ✅ Invalid AccessKey: Should fail quickly with helpful message

## Common Questions

**Q: Why does it take so long?**
A: First-time initialization downloads ~2-5 MB of files (SDK, models). Subsequent loads are faster due to browser cache.

**Q: Can I make it faster?**
A: Yes! Use built-in keywords (no file download) or preload the SDK on app startup.

**Q: Is 30 seconds too long to wait?**
A: For first-time initialization on slow networks, yes. But with built-in keywords, it should be <5 seconds.

**Q: Will this fix the error?**
A: Yes, if you use built-in keywords + increase timeout. The error occurs because 15 seconds isn't enough time.

## Next Steps

1. Read `WAKE-WORD-TIMEOUT-RESEARCH.md` for detailed technical analysis
2. Apply quick fixes (built-in keyword + timeout increase)
3. Test on various network conditions
4. Monitor for improvements
