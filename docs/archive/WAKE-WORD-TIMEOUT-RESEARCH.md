# Wake Word Initialization Timeout - Comprehensive Research

## Error Analysis

**Error Message:**
```
[JARVIS] [ERROR] Wake word initialization failed or timed out
Error: Wake word initialization timeout after 15000ms
at cartesia-audio-bridge.js:372:16
```

## Root Cause Analysis

### 1. Timeout Configuration

**Location:** `public/js/cartesia-audio-bridge.js:369`
- **Current Timeout:** 15 seconds (15000ms)
- **Purpose:** Prevents indefinite hanging during wake word initialization
- **Issue:** Multiple nested operations can exceed this timeout

### 2. Initialization Flow Breakdown

The wake word initialization involves several sequential operations, each with potential delays:

```
initWakeWord() [15s total timeout]
  └─> _initWakeWordInternal()
      ├─> init() [AudioContext initialization]
      ├─> getUserMedia() [Microphone permission]
      └─> WakeWordManager.initialize()
          ├─> Validate AccessKey [instant]
          ├─> Validate keyword paths [2s timeout per file × N files]
          │   └─> fetch(HEAD) for each .ppn file
          ├─> Porcupine.create() [10s timeout]
          │   └─> Load Porcupine Web SDK
          │   └─> Download model files (if needed)
          │   └─> Initialize WebAssembly
          └─> AudioWorklet.addModule() [5s timeout]
              └─> Load wake-word-processor.js
```

### 3. Potential Bottlenecks

#### A. Network Delays (Most Common)
- **Keyword file validation:** Each `.ppn` file requires a HEAD request (2s timeout per file)
  - If multiple files: `2s × N files` can add up
  - Slow network: Each request can take 1-2 seconds
  - **Example:** 3 keyword files = up to 6 seconds just for validation

#### B. Porcupine.create() Initialization
- **Location:** `public/js/wake-word-manager.js:287-299`
- **Timeout:** 10 seconds (internal)
- **Operations:**
  1. Load Porcupine Web SDK (network request)
  2. Download model files (if not cached)
  3. Initialize WebAssembly runtime
  4. Load keyword files (.ppn)
  5. Initialize audio processing pipeline

**Common Issues:**
- First-time initialization: Downloads can take 5-10 seconds
- Slow network: Model files are ~1-3 MB
- Browser cache: May not be available on first load
- WebAssembly compilation: Can take 1-3 seconds

#### C. AudioWorklet Module Loading
- **Location:** `public/js/wake-word-manager.js:320-327`
- **Timeout:** 5 seconds
- **Operations:**
  1. Load `wake-word-processor.js` file
  2. Parse and compile JavaScript
  3. Register processor in AudioWorklet context

**Common Issues:**
- File path incorrect: 404 errors cause immediate failure
- Slow network: File loading can take 2-5 seconds
- CORS issues: External files may fail to load

### 4. Timeout Calculation

**Worst-case scenario:**
```
Keyword validation:     2s × 3 files = 6s
Porcupine.create():     10s (max timeout)
AudioWorklet loading:   5s (max timeout)
Network overhead:       2-3s
─────────────────────────────────────
Total:                  23-24 seconds
```

**Current timeout: 15 seconds** ❌ **INSUFFICIENT**

## Solutions

### Solution 1: Increase Overall Timeout (Quick Fix)

**File:** `public/js/cartesia-audio-bridge.js:369`

```javascript
// Current: 15 seconds
const INIT_TIMEOUT_MS = 15000;

// Recommended: 30 seconds (accounts for slow networks)
const INIT_TIMEOUT_MS = 30000;
```

**Pros:**
- Simple one-line change
- Handles slow network conditions
- Accounts for first-time initialization

**Cons:**
- Users wait longer before seeing error
- Doesn't fix underlying performance issues

### Solution 2: Optimize Keyword File Validation (Recommended)

**File:** `public/js/wake-word-manager.js:142-250`

**Current Issues:**
- Sequential HEAD requests (blocking)
- 2-second timeout per file
- No caching of validation results

**Optimizations:**

#### A. Parallel Validation
```javascript
// Instead of sequential:
for (let i = 0; i < this.keywordPaths.length; i++) {
  await validateFile(path); // Blocks until complete
}

// Use parallel:
const validationPromises = this.keywordPaths.map(path => validateFile(path));
const results = await Promise.allSettled(validationPromises);
```

#### B. Reduce Timeout Per File
```javascript
// Current: 2 seconds per file
const fetchTimeout = setTimeout(() => fetchController.abort(), 2000);

// Optimized: 1 second per file (files should load quickly if they exist)
const fetchTimeout = setTimeout(() => fetchController.abort(), 1000);
```

#### C. Skip Validation for Built-in Keywords
```javascript
// Built-in keywords don't need file validation
if (BUILT_IN_KEYWORDS.includes(path)) {
  validatedPaths.push(path);
  continue; // Skip file validation
}
```

#### D. Cache Validation Results
```javascript
// Cache successful validations in sessionStorage
const cacheKey = `wake-word-validated-${path}`;
const cached = sessionStorage.getItem(cacheKey);
if (cached === 'true') {
  fileExists = true;
  continue;
}
// ... after successful validation:
sessionStorage.setItem(cacheKey, 'true');
```

### Solution 3: Optimize Porcupine Initialization

**File:** `public/js/wake-word-manager.js:279-307`

**Current Issues:**
- 10-second timeout may be insufficient for slow networks
- No progress feedback
- No retry mechanism

**Optimizations:**

#### A. Increase Porcupine Timeout
```javascript
// Current: 10 seconds
const porcupineTimeout = 10000;

// Recommended: 20 seconds (for slow networks + first-time download)
const porcupineTimeout = 20000;
```

#### B. Add Progress Logging
```javascript
DEBUG.trace('WakeWordManager: Creating Porcupine instance (this may take 10-20 seconds on first load)...');
// Log progress at intervals
const progressInterval = setInterval(() => {
  const elapsed = (performance.now() - porcupineInitStartTime) / 1000;
  DEBUG.trace(`WakeWordManager: Porcupine initialization in progress... (${elapsed.toFixed(1)}s)`);
}, 3000);
```

#### C. Preload Porcupine SDK
```javascript
// Preload SDK on app startup (before wake word is needed)
async preloadPorcupine() {
  if (this._porcupinePreloaded) return;
  try {
    // Load SDK without initializing
    await import('@porcupine-web');
    this._porcupinePreloaded = true;
  } catch (err) {
    DEBUG.warn('WakeWordManager: Failed to preload Porcupine SDK', err);
  }
}
```

### Solution 4: Optimize AudioWorklet Loading

**File:** `public/js/wake-word-manager.js:311-333`

**Current Issues:**
- 5-second timeout may be insufficient
- No fallback mechanism
- File path errors cause immediate failure

**Optimizations:**

#### A. Increase AudioWorklet Timeout
```javascript
// Current: 5 seconds
const workletTimeout = 5000;

// Recommended: 10 seconds (for slow networks)
const workletTimeout = 10000;
```

#### B. Validate File Path Before Loading
```javascript
// Check if file exists before attempting to load
const fileExists = await this._checkFileExists(wakeWordPath);
if (!fileExists) {
  DEBUG.error('WakeWordManager: AudioWorklet file not found', { path: wakeWordPath });
  return this._initializeMainThreadProcessing(mediaStream);
}
```

#### C. Preload AudioWorklet Module
```javascript
// Preload on app startup
async preloadAudioWorklet(audioContext, basePath) {
  const wakeWordPath = `${basePath}wake-word-processor.js`;
  try {
    await audioContext.audioWorklet.addModule(wakeWordPath);
    this._workletPreloaded = true;
  } catch (err) {
    DEBUG.warn('WakeWordManager: Failed to preload AudioWorklet', err);
  }
}
```

### Solution 5: Implement Progressive Timeout Strategy

**File:** `public/js/cartesia-audio-bridge.js:366-391`

Instead of a single timeout, use progressive timeouts with user feedback:

```javascript
async initWakeWord() {
  // ... existing code ...
  
  const INIT_TIMEOUT_MS = 30000; // 30 seconds total
  const PROGRESS_INTERVALS = [5000, 10000, 20000]; // Log progress at these intervals
  
  const progressPromises = PROGRESS_INTERVALS.map(interval => 
    new Promise(resolve => {
      setTimeout(() => {
        DEBUG.trace(`Wake word initialization in progress... (${interval/1000}s elapsed)`);
        resolve();
      }, interval);
    })
  );
  
  try {
    const result = await Promise.race([
      this._initWakeWordInternal(),
      Promise.all(progressPromises).then(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Wake word initialization timeout after ${INIT_TIMEOUT_MS}ms`)), INIT_TIMEOUT_MS)
        )
      )
    ]);
    return result;
  } catch (err) {
    // ... error handling ...
  }
}
```

### Solution 6: Use Built-in Keywords (Fastest)

**Per wAkE wOrD dOcS.md Section 7:**
- Built-in keywords don't require file downloads
- Initialization is much faster (~2-5 seconds vs 15-30 seconds)
- No network requests needed

**Available Built-in Keywords:**
- `"Jarvis"` (recommended for this project)
- `"Computer"`
- `"Alexa"`
- `"Hey Google"`
- `"Hey Siri"`
- `"Okay Google"`
- `"Porcupine"`
- `"Terminator"`
- And more...

**Implementation:**
```javascript
// In app.js or config
const wakeWordKeywords = ['Jarvis']; // Use built-in keyword
// Instead of: ['keywords/jarvis_en_wasm_v3_0_0.ppn']
```

## Recommended Implementation Plan

### Phase 1: Quick Fix (Immediate)
1. ✅ Increase overall timeout to 30 seconds
2. ✅ Use built-in keyword "Jarvis" instead of file path
3. ✅ Add progress logging

### Phase 2: Optimization (Short-term)
1. ✅ Parallel keyword file validation
2. ✅ Reduce per-file timeout to 1 second
3. ✅ Skip validation for built-in keywords
4. ✅ Increase Porcupine timeout to 20 seconds
5. ✅ Increase AudioWorklet timeout to 10 seconds

### Phase 3: Advanced (Long-term)
1. ✅ Preload Porcupine SDK on app startup
2. ✅ Preload AudioWorklet module on app startup
3. ✅ Cache validation results
4. ✅ Implement retry mechanism with exponential backoff
5. ✅ Add user-facing progress indicator

## Testing Checklist

- [ ] Test on fast network (should complete in <5 seconds)
- [ ] Test on slow network (3G throttling, should complete in <30 seconds)
- [ ] Test with built-in keyword (should complete in <5 seconds)
- [ ] Test with custom .ppn file (should complete in <30 seconds)
- [ ] Test with multiple keyword files (should complete in <30 seconds)
- [ ] Test with missing .ppn file (should fallback gracefully)
- [ ] Test with invalid AccessKey (should fail quickly with clear error)
- [ ] Test with no network (should timeout gracefully)
- [ ] Test first-time initialization (downloads should complete)
- [ ] Test subsequent initializations (should use cache)

## Related Documentation References

### cArTeSiA dOcS.md
- **Section 2 (STT):** Sample rate 16kHz, encoding pcm_s16le (matches wake word requirements)
- **Section 3 (Timeout Behavior):** WebSocket timeout is 3 minutes, but initialization needs more time
- **Section 4 (Error Handling):** Implement reconnection logic and proper error messages

### wAkE wOrD dOcS.md
- **Section 7 (Installation):** Built-in keywords available, no file download needed
- **Section 9 (Error Handling):** Common issues include AccessKey invalid, model file not found, timeout
- **Section 19 (Best Practices):** Frame processing, resource cleanup, browser compatibility

### aUdiO dOcS.md
- **Section 1 (AudioWorklet):** Low-latency audio processing, requires HTTPS
- **Section 4 (Architecture):** AudioWorklet runs in separate thread, doesn't block main thread
- **Section 8 (Best Practices):** Always use AudioWorklet, handle sample rate mismatches

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Wake word initialization timeout after 15000ms` | Overall timeout exceeded | Increase timeout to 30s, optimize operations |
| `Porcupine.create() timeout after 10000ms` | Porcupine initialization slow | Increase timeout to 20s, check network |
| `AudioWorklet loading timeout after 5000ms` | File loading slow | Increase timeout to 10s, check file path |
| `Keyword file not found` | .ppn file missing | Use built-in keyword or fix file path |
| `Invalid AccessKey` | AccessKey incorrect | Verify from your service provider |
| `CORS error` | File served from different origin | Fix CORS headers or use same origin |

## Performance Targets

| Operation | Current | Target | Notes |
|-----------|---------|--------|-------|
| Built-in keyword init | 5-10s | <5s | Should be fast |
| Custom .ppn file init | 15-30s | <20s | With optimizations |
| Keyword validation | 2s × N | <1s × N | Parallel + reduced timeout |
| Porcupine.create() | 5-10s | <10s | First-time: 10-15s acceptable |
| AudioWorklet loading | 1-3s | <2s | Should be fast if file exists |
| **Total (built-in)** | 5-10s | **<5s** | ✅ Achievable |
| **Total (custom file)** | 15-30s | **<20s** | ✅ With optimizations |

## Conclusion

The timeout issue is caused by:
1. **Insufficient timeout duration** (15s is too short for slow networks)
2. **Sequential operations** (keyword validation blocks)
3. **Network delays** (file downloads, SDK loading)
4. **First-time initialization** (no cache available)

**Recommended immediate fix:**
- Increase timeout to 30 seconds
- Use built-in keyword "Jarvis" (fastest option)
- Add progress logging for user feedback

**Long-term optimization:**
- Parallel operations
- Preloading
- Caching
- Better error messages
