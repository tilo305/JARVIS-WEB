# Wake Word Initialization Timeout Fix

## Issue

Wake word initialization was timing out with error:
```
[JARVIS] [ERROR] Wake word initialization timeout - updating status anyway
```

## Root Cause

The `initWakeWord()` method in `cartesia-audio-bridge.js` could return `undefined` in several cases:
1. When wake word was not enabled
2. When wake word was already initialized
3. When `getUserMedia()` failed (mic permission denied)
4. When no keyword paths were provided

The code in `app.js` was treating `initWakeWord()` as a promise, but when it returned `undefined`, the promise never resolved, causing the timeout.

## Solution

### 1. Fixed `initWakeWord()` to Always Return a Promise

**File:** `public/js/cartesia-audio-bridge.js`

- Changed `initWakeWord()` to always return a promise with `{success: boolean, reason?: string}`
- Added internal timeout handling (10 seconds) using `Promise.race()`
- Split initialization logic into `_initWakeWordInternal()` for better error handling
- All code paths now return a result object instead of `undefined`

### 2. Updated `app.js` to Handle Promise Results

**File:** `public/js/app.js`

- Removed redundant timeout code (now handled in bridge)
- Updated to handle the new promise result format `{success, reason}`
- Improved error messages and status updates

### 3. Created Debugging Tools

**New Files:**
- `debug/tools/debug-wake-word-initialization.js` - Comprehensive configuration and initialization debugging
- `debug/live/wake-word-initialization-live.test.js` - Live test for wake word initialization with timeout detection

## Changes Made

### `cartesia-audio-bridge.js`

```javascript
// Before: Could return undefined
async initWakeWord() {
  if (!this.options.wakeWordEnabled) {
    return; // ❌ Returns undefined
  }
  // ...
}

// After: Always returns promise with result
async initWakeWord() {
  if (!this.options.wakeWordEnabled) {
    return { success: false, reason: 'Wake word not enabled' }; // ✅ Always returns
  }
  
  // Add timeout wrapper
  const INIT_TIMEOUT_MS = 10000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Wake word initialization timeout after ${INIT_TIMEOUT_MS}ms`));
    }, INIT_TIMEOUT_MS);
  });
  
  try {
    const result = await Promise.race([
      this._initWakeWordInternal(),
      timeoutPromise
    ]);
    return result;
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
```

### `app.js`

```javascript
// Before: Timeout handling in app.js
const initPromise = Promise.resolve(bridge.initWakeWord());
const initTimeout = setTimeout(() => {
  DEBUG.error('Wake word initialization timeout');
  updateTrackerStatus();
}, 5000);

// After: Timeout handled in bridge, just handle result
bridge.initWakeWord().then(result => {
  if (result.success) {
    DEBUG.trace('Wake word initialized successfully');
  } else {
    DEBUG.warn('Wake word initialization failed', { reason: result.reason });
    wakeWordTracker.setStatus('error', `Failed: ${result.reason}`);
  }
  updateTrackerStatus();
});
```

## Testing

### Manual Testing

1. **Test with built-in keyword:**
   ```javascript
   // In browser console
   window.testWakeWordInitialization({
     accessKey: 'your-access-key',
     keywordPaths: ['Jarvis'],
     sensitivities: [0.5],
     timeoutMs: 10000
   });
   ```

2. **Run comprehensive tests:**
   ```javascript
   window.runWakeWordInitializationTests();
   ```

### Automated Testing

```bash
# Run configuration check
node debug/tools/debug-wake-word-initialization.js

# Run live test (in browser)
# Open app with ?debug=1, tests auto-run after 2 seconds
```

## Debugging Tools

### 1. Configuration Checker

```bash
node debug/tools/debug-wake-word-initialization.js
```

Checks:
- ✅ .env file and configuration
- ✅ Keyword files (.ppn) or built-in keywords
- ✅ Dependencies (wake word package)
- ✅ Timeout configuration
- ✅ Common issues and fixes

### 2. Live Test Tool

```javascript
// In browser console (when ?debug=1)
window.testWakeWordInitialization({
  accessKey: 'your-key',
  keywordPaths: ['Jarvis'],
  sensitivities: [0.5]
});
```

Tests:
- ✅ Configuration validation
- ✅ Bridge creation
- ✅ Initialization with timeout detection
- ✅ Error handling
- ✅ Cleanup

## Timeout Configuration

- **Default timeout:** 10 seconds (configurable in `cartesia-audio-bridge.js`)
- **Timeout location:** Internal to `initWakeWord()` method
- **Timeout behavior:** Returns `{success: false, reason: 'timeout message'}`

## Error Messages

### Before Fix
```
[JARVIS] [ERROR] Wake word initialization timeout - updating status anyway
```

### After Fix
```
[JARVIS] [WARN] Wake word initialization failed: Wake word initialization timeout after 10000ms
```

More specific error messages:
- `"Wake word not enabled or access key missing"`
- `"Microphone permission needed: Permission denied"`
- `"No keyword paths provided"`
- `"WakeWordManager.initialize returned null"`
- `"Wake word initialization timeout after 10000ms"`

## Verification

✅ **Fixed:** `initWakeWord()` always returns a promise
✅ **Fixed:** Timeout handling prevents hanging
✅ **Fixed:** Better error messages and status updates
✅ **Added:** Comprehensive debugging tools
✅ **Added:** Live test tools for timeout detection

## Related Files

- `public/js/cartesia-audio-bridge.js` - Main fix
- `public/js/app.js` - Updated to handle new promise format
- `debug/tools/debug-wake-word-initialization.js` - Debugging tool
- `debug/live/wake-word-initialization-live.test.js` - Live test
- `wAkE wOrD dOcS.md` - Wake word documentation

## Next Steps

If you still experience timeout issues:

1. **Check configuration:**
   ```bash
   node debug/tools/debug-wake-word-initialization.js
   ```

2. **Check browser console** for detailed error messages

3. **Test with built-in keyword** (no file needed):
   ```javascript
   window.JARVIS_CONFIG = {
     porcupineKeyword: 'Jarvis' // Built-in, no .ppn file needed
   };
   ```

4. **Increase timeout** if needed (in `cartesia-audio-bridge.js`):
   ```javascript
   const INIT_TIMEOUT_MS = 20000; // Increase to 20 seconds
   ```

5. **Check network** if using custom .ppn files (file loading might be slow)
