# Picovoice Porcupine Wake Word - Comprehensive Research & Troubleshooting Guide

**Last Updated:** Based on comprehensive research from https://picovoice.ai/docs/porcupine/, official documentation, web search results, and project implementation analysis.

---

## Table of Contents

1. [Overview & Key Facts](#overview--key-facts)
2. [Best Practices](#best-practices)
3. [Common Errors & Troubleshooting](#common-errors--troubleshooting)
4. [Initialization Issues](#initialization-issues)
5. [Sensitivity Tuning](#sensitivity-tuning)
6. [Performance Optimization](#performance-optimization)
7. [Browser Compatibility](#browser-compatibility)
8. [Error Recovery Strategies](#error-recovery-strategies)
9. [Implementation-Specific Issues](#implementation-specific-issues)
10. [Quick Reference Troubleshooting](#quick-reference-troubleshooting)

---

## Overview & Key Facts

### What is Porcupine?

**Porcupine** is Picovoice's highly-accurate, lightweight wake word detection engine that enables always-listening voice-enabled applications. It uses deep neural networks trained in real-world environments.

### Key Performance Metrics

- **Accuracy:** 97%+ detection rate with less than 1 false alarm per 10 hours (with background speech and ambient noise)
- **Resource Usage:** ~1 MB memory, <4% single-core CPU on Raspberry Pi 3
- **Cross-Platform:** Arm Cortex-M, Raspberry Pi, Android, iOS, Web browsers (Chrome, Safari, Firefox, Edge), Linux, macOS, Windows
- **Scalable:** Can detect multiple wake words simultaneously with no added runtime footprint
- **Self-Service:** Custom wake words trainable in seconds via Picovoice Console using transfer learning

### Core Components

| Component | Purpose | Notes |
|-----------|---------|-------|
| **AccessKey** | Authentication token from Picovoice Console | Required, keep secret, never commit to version control |
| **Model file (.pv)** | Language-specific model | e.g., `en`, `es`, `fr` |
| **Keyword file (.ppn)** | Platform-specific wake word model | Trained via Console, platform-specific |
| **Sensitivity** | Parameter (0.0-1.0) | Balances detection rate vs. false alarm rate |

### Built-in Keywords

Porcupine Web SDK includes these built-in keywords (no file download needed):
- **Jarvis** (recommended for JARVIS project)
- Computer
- Alexa
- Hey Google
- Hey Siri
- Okay Google
- Picovoice
- Porcupine
- Terminator
- Americano
- Blueberry
- Bumblebee
- Grapefruit
- Grasshopper

**Best Practice:** Use built-in keywords when possible to avoid file download delays and initialization timeouts.

---

## Best Practices

### 1. Wake Word Selection

**Critical Requirements:**
- ✅ **Length:** 3-5 words ideal (not too short, not too long)
- ✅ **Phonemes:** At least 6 phonemes for good accuracy
- ✅ **Diversity:** Mix of consonants and vowels
- ✅ **Uniqueness:** Avoid common phrases that appear in normal conversation
- ✅ **Pronunciation:** Choose phrases that are easy to pronounce clearly
- ✅ **Language:** Match wake word language to your application's primary language

**Examples:**
- ✅ **"Hey JARVIS"** - Good: 2 words, 6+ phonemes, unique
- ✅ **"Computer"** - Good: Single word but distinctive
- ✅ **"Activate assistant"** - Good: 3 words, clear
- ❌ **"Hi"** - Too short, too common
- ❌ **"Alexa"** - Trademark, use custom
- ❌ **"Hello there"** - Too common in conversation

**Picovoice Console Validation:**
- The Console validates your wake phrase and provides real-time browser-based testing
- Test in browser before training to ensure it works well
- Console provides guidance if phrase needs improvement

### 2. Sensitivity Configuration

**Sensitivity Parameter Range:** 0.0 to 1.0

**Trade-offs:**
- **Lower (0.0-0.5):** Fewer false alarms, may miss some detections
- **Higher (0.5-1.0):** More detections, higher false alarm rate

**Recommended Starting Point:** 0.5

**Tuning Strategy:**
1. Start at 0.5
2. Test in real environment (quiet, noisy, with background speech)
3. If missing detections: increase (e.g., 0.6-0.7)
4. If too many false alarms: decrease (e.g., 0.3-0.4)
5. Test with different speakers (male, female, various accents)
6. Test at different distances from microphone
7. Monitor false alarm rate over extended periods (target: <1 per 10 hours)

**Environment-Specific Recommendations:**
- **Quiet environment:** 0.4-0.5 (lower false alarm rate)
- **Noisy environment:** 0.6-0.7 (higher detection rate)
- **Mixed environment:** 0.5-0.6 (balanced)

### 3. Multiple Wake Words

Porcupine supports multiple wake words with independent sensitivities:

```javascript
const keywordPaths = [
  'path/to/hey-jarvis.ppn',
  'path/to/computer.ppn'
];
const sensitivities = [0.5, 0.6]; // Match keywordPaths array length
```

**Best Practices for Multiple Wake Words:**
- Use different sensitivities for different wake words if needed
- Ensure array lengths match exactly (`keywordPaths.length === sensitivities.length`)
- Test each wake word independently before combining
- Consider using different wake words for different contexts or user roles

### 4. AccessKey Security

**Critical Security Best Practices:**
- ✅ **Never commit AccessKey to version control** - Use environment variables or secure config
- ✅ **Rotate AccessKeys periodically** - Generate new keys from Picovoice Console
- ✅ **Use different AccessKeys for dev/staging/prod** - Isolate environments
- ✅ **Restrict AccessKey scope** - Use keys only for required services (Porcupine)
- ✅ **Monitor AccessKey usage** - Check Picovoice Console for unusual activity
- ✅ **Don't log full AccessKey** - Only log prefix (first 10 characters) for debugging

**Implementation:**
```javascript
// ✅ Good: Use environment variable
const accessKey = process.env.VITE_PICOVOICE_ACCESS_KEY || '';

// ❌ Bad: Hardcoded in source code
const accessKey = 'your-access-key-here';
```

### 5. HTTPS Requirement

**Why HTTPS is Required:**
- AudioWorklet API requires secure context (HTTPS or localhost)
- Microphone access requires secure context
- Protects user privacy and prevents MITM attacks

**Development:**
- Use `localhost` for local development (considered secure context)
- Use HTTPS for production (required for deployment)

### 6. Audio Format Compatibility

**Porcupine Audio Specs:**
- **Format:** 16-bit linearly-encoded PCM (Int16Array)
- **Channels:** Single-channel (mono) - Required
- **Sample Rate:** Configurable (typically 16kHz or 48kHz)
- **Frame Length:** Configurable (retrieved via `.frameLength` property)
- **Processing:** Real-time frame-by-frame via `.process(Int16Array)` method

**Recommended Configuration:**
- **Sample Rate:** 16 kHz (matches STT pipeline, reduces resampling overhead)
- **Frame Length:** Typically 512 samples (32ms @ 16kHz) or 1024 samples (64ms @ 16kHz)
- **Format:** Int16 PCM (matches STT pipeline output)

**Why 16 kHz?**
- Matches Cartesia STT requirement (`sample_rate: "16000"`)
- Reduces resampling overhead (shared with STT pipeline)
- Lower computational cost
- Sufficient for wake word detection (human speech range: ~300-3400 Hz)
- Format compatibility: Uses same `pcm_s16le` encoding as Cartesia STT

### 7. Resource Cleanup

**When Releasing Porcupine:**
```javascript
async release() {
  // 1. Disable wake word detection
  this.setEnabled(false);
  
  // 2. Release Porcupine instance
  if (this.porcupine) {
    await this.porcupine.release();
    this.porcupine = null;
  }
  
  // 3. Disconnect AudioWorklet node
  if (this.wakeWordNode) {
    this.wakeWordNode.port.onmessage = null; // Remove handler
    this.wakeWordNode.disconnect();
    this.wakeWordNode = null;
  }
  
  // 4. Disconnect ScriptProcessorNode (if used as fallback)
  if (this._scriptProcessor) {
    this._scriptProcessor.onaudioprocess = null;
    this._scriptProcessor.disconnect();
    this._scriptProcessor = null;
  }
  
  // 5. Clear frame buffers
  this._frameQueue = [];
  
  // 6. Reset metrics
  this.resetMetrics();
}
```

**Memory Leak Prevention:**
- Always call `porcupine.release()` when done
- Disconnect AudioWorklet nodes properly
- Clear frame buffers when releasing
- Remove event listeners and message handlers
- Don't create multiple Porcupine instances without releasing previous ones

### 8. Cooldown Period Implementation

**Prevent Re-triggering:**
```javascript
let lastDetectionTime = 0;
const COOLDOWN_MS = 3000; // 3 seconds

_onWakeWordDetected(keywordIndex) {
  const now = Date.now();
  if (now - lastDetectionTime < COOLDOWN_MS) {
    DEBUG.trace('Wake word detected but in cooldown period');
    return; // Ignore detection
  }
  lastDetectionTime = now;
  
  // Disable wake word during STT to prevent re-triggering
  if (this.wakeWordManager) {
    this.wakeWordManager.setEnabled(false);
  }
  
  // Activate STT...
  
  // Re-enable wake word after STT stops (in stopSTT method)
}
```

**Best Practices:**
- Implement 2-5 second cooldown period after detection
- Disable wake word during STT active state
- Use debouncing: only process first detection, ignore subsequent detections within cooldown window
- Re-enable wake word after conversation ends

---

## Common Errors & Troubleshooting

### Error 1: "The keywords argument is undefined / empty"

**Symptom:**
```
Wake word initialization failed: The keywords argument is undefined / empty
```

**Causes:**
1. Empty `keywordPaths` array
2. All keyword paths invalid or filtered out
3. Keyword paths not properly validated before passing to Porcupine
4. Built-in keyword name doesn't match exactly (case-sensitive)

**Solutions:**

1. **Validate keywords before initialization:**
```javascript
// Ensure keywords array is non-empty and contains valid strings
if (!Array.isArray(keywords) || keywords.length === 0) {
  throw new Error('At least one wake word keyword is required');
}

// Filter out invalid entries
const validKeywords = keywords.filter(k => 
  k && typeof k === 'string' && k.trim().length > 0
);

if (validKeywords.length === 0) {
  throw new Error('All wake word keywords were invalid or empty');
}
```

2. **Use built-in keywords as fallback:**
```javascript
// If custom keyword file not found, fallback to built-in keyword
const BUILT_IN_KEYWORDS = ['Jarvis', 'Computer', 'Alexa', ...];

if (validatedPaths.length === 0) {
  DEBUG.warn('No valid keywords, using "Jarvis" as fallback');
  validatedPaths.push('Jarvis');
  validatedSensitivities.push(0.5);
}
```

3. **Check keyword path format:**
- Built-in keywords: Use exact name (e.g., `"Jarvis"`, not `"jarvis"` or `"JARVIS"`)
- Custom keywords: Must be valid URLs or relative paths to `.ppn` files

### Error 2: "Invalid Picovoice AccessKey"

**Symptom:**
```
Wake word initialization failed: Invalid Picovoice AccessKey
```

**Causes:**
1. AccessKey missing or empty
2. AccessKey expired or revoked
3. AccessKey doesn't match the account that created the wake word
4. Typos or extra whitespace in AccessKey

**Solutions:**

1. **Verify AccessKey from Console:**
   - Go to https://console.picovoice.ai/
   - Copy AccessKey from home page
   - Ensure no extra spaces or newlines

2. **Validate AccessKey format:**
```javascript
if (!accessKey || typeof accessKey !== 'string' || accessKey.trim().length === 0) {
  throw new Error('Porcupine AccessKey is required. Get one from https://console.picovoice.ai/');
}

if (accessKey.length < 20) {
  throw new Error('Invalid AccessKey format. Please verify your AccessKey from Picovoice Console.');
}
```

3. **Check AccessKey matches keyword:**
   - Custom keywords must be created with the same account as the AccessKey
   - Built-in keywords work with any valid AccessKey

### Error 3: "Wake word keyword file not found (404)"

**Symptom:**
```
Wake word keyword file not found. Please ensure the .ppn file exists in public/keywords/ directory.
```

**Causes:**
1. `.ppn` file missing from `public/keywords/` directory
2. File path incorrect (relative vs absolute)
3. File not accessible (CORS, permissions)
4. File name doesn't match expected pattern

**Solutions:**

1. **Verify file exists:**
```bash
# Check if keyword file exists
ls -la public/keywords/*.ppn
```

2. **Use absolute URLs:**
```javascript
// Convert relative paths to absolute URLs
const validatedPath = path.startsWith('http://') || path.startsWith('https://')
  ? path
  : new URL(path, window.location.origin).href;
```

3. **Use built-in keywords instead:**
```javascript
// Instead of custom file path, use built-in keyword
const keywordPaths = ['Jarvis']; // No file download needed
```

4. **Check file accessibility:**
   - Test URL directly in browser
   - Check Network tab for 404 errors
   - Verify CORS headers if on different domain

### Error 4: "Porcupine.create() timeout"

**Symptom:**
```
Porcupine.create() timeout after 20000ms - check network connection and keyword files
```

**Causes:**
1. Slow network connection (first-time download of SDK files)
2. Large custom keyword files taking too long to download
3. Network timeout or connection issues
4. Porcupine SDK files not cached

**Solutions:**

1. **Increase timeout for slow networks:**
```javascript
const porcupineTimeout = 30000; // 30 seconds for slow networks
const porcupinePromise = Porcupine.create({
  accessKey: this.accessKey,
  keywords: validKeywords,
  sensitivities: validSensitivities
});

const porcupineTimeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`Porcupine.create() timeout after ${porcupineTimeout}ms`));
  }, porcupineTimeout);
});

this.porcupine = await Promise.race([porcupinePromise, porcupineTimeoutPromise]);
```

2. **Use built-in keywords (faster initialization):**
```javascript
// Built-in keywords don't require file downloads
const keywords = ['Jarvis']; // Initializes in 3-5 seconds instead of 15-30 seconds
```

3. **Add progress logging:**
```javascript
const progressInterval = setInterval(() => {
  const elapsed = (performance.now() - startTime) / 1000;
  DEBUG.trace(`Porcupine initialization in progress... (${elapsed.toFixed(1)}s)`);
}, 3000);

try {
  this.porcupine = await Promise.race([porcupinePromise, porcupineTimeoutPromise]);
} finally {
  clearInterval(progressInterval);
}
```

4. **Preload on app startup:**
   - Load Porcupine SDK when app starts (not when wake word needed)
   - Cache SDK files in browser
   - Use service worker for offline caching

### Error 5: "AudioWorklet loading timeout"

**Symptom:**
```
AudioWorklet loading timeout after 10000ms - check file path: ./audio/wake-word-processor.js
```

**Causes:**
1. AudioWorklet processor file not found
2. Incorrect file path (relative vs absolute)
3. File not accessible (CORS, permissions)
4. Slow network connection

**Solutions:**

1. **Verify file path:**
```javascript
const basePath = audioWorkletBasePath || './audio/';
const wakeWordPath = basePath.endsWith('/') 
  ? `${basePath}wake-word-processor.js`
  : `${basePath}/wake-word-processor.js`;

// Use absolute URL
const absolutePath = new URL(wakeWordPath, window.location.origin).href;
```

2. **Add timeout with fallback:**
```javascript
const workletTimeout = 10000; // 10 seconds
const workletPromise = audioContext.audioWorklet.addModule(wakeWordPath);
const workletTimeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`AudioWorklet loading timeout after ${workletTimeout}ms`));
  }, workletTimeout);
});

try {
  await Promise.race([workletPromise, workletTimeoutPromise]);
} catch (err) {
  // Fallback to main-thread processing
  return this._initializeMainThreadProcessing(mediaStream);
}
```

3. **Check file exists:**
   - Verify `public/audio/wake-word-processor.js` exists
   - Check file is served correctly (test URL in browser)
   - Verify file permissions

### Error 6: "Frame length mismatch"

**Symptom:**
```
Frame length mismatch: expected 512, got 480
```

**Causes:**
1. Frame buffer not properly managed
2. Resampling produces incorrect frame length
3. Frame length not validated before processing
4. AudioWorklet processor frame length doesn't match Porcupine's expected frame length

**Solutions:**

1. **Validate frame length before processing:**
```javascript
if (frame.length !== this.porcupine.frameLength) {
  DEBUG.trace('Frame length mismatch', {
    expected: this.porcupine.frameLength,
    actual: frame.length
  });
  return; // Don't process invalid frames
}
```

2. **Use proper buffering:**
```javascript
// Buffer until we have a full frame
while (this.buffer.length >= this.porcupine.frameLength) {
  const frame = new Int16Array(this.porcupine.frameLength);
  for (let i = 0; i < this.porcupine.frameLength; i++) {
    frame[i] = this.buffer.shift();
  }
  this.porcupine.process(frame);
}
```

3. **Get frame length from Porcupine:**
```javascript
// Use Porcupine's actual frame length
const frameLength = this.porcupine.frameLength; // Typically 512 or 1024
```

### Error 7: "Sample rate mismatch"

**Symptom:**
- Porcupine processes incorrectly
- No detections or false detections
- Audio quality issues

**Causes:**
1. Audio not resampled to Porcupine's expected sample rate
2. Resampling algorithm incorrect
3. Sample rate mismatch after resampling

**Solutions:**

1. **Resample to Porcupine's sample rate:**
```javascript
// Get Porcupine's expected sample rate
const targetSampleRate = this.porcupine.sampleRate; // Typically 16000

// Resample from context sample rate to target
const resampled = this._resampleTo16k(input, this.audioContext.sampleRate);
```

2. **Use proper resampling algorithm:**
```javascript
_resampleTo16k(float32Array, sourceSampleRate) {
  const targetSampleRate = 16000;
  const ratio = sourceSampleRate / targetSampleRate;
  const outLength = Math.floor(float32Array.length / ratio);
  const out = new Float32Array(outLength);
  
  for (let i = 0; i < outLength; i++) {
    const srcIdx = i * ratio;
    const idx = Math.floor(srcIdx);
    const frac = srcIdx - idx;
    const nextIdx = Math.min(idx + 1, float32Array.length - 1);
    out[i] = float32Array[idx] * (1 - frac) + float32Array[nextIdx] * frac;
  }
  
  return out;
}
```

3. **Verify sample rate matches:**
```javascript
// After resampling, verify sample rate
if (this.porcupine.sampleRate !== 16000) {
  DEBUG.warn('Sample rate mismatch', {
    expected: 16000,
    actual: this.porcupine.sampleRate
  });
}
```

### Error 8: "Wake word processor: no audio input"

**Symptom:**
```
Wake word processor: no audio input
```

**Causes:**
1. Microphone permission not granted
2. Microphone not connected or disabled
3. Audio stream not connected to processor
4. AudioWorklet node not properly initialized

**Solutions:**

1. **Check microphone permission:**
```javascript
// Request microphone permission
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
```

2. **Verify audio stream:**
```javascript
// Check stream has audio tracks
if (!mediaStream || !mediaStream.getAudioTracks().length) {
  throw new Error('No audio tracks in media stream');
}
```

3. **Connect audio source:**
```javascript
const source = audioContext.createMediaStreamSource(mediaStream);
source.connect(this.wakeWordNode);
```

4. **Check processor enabled:**
```javascript
// Ensure processor is enabled
this.wakeWordNode.port.postMessage({ type: 'enable', enabled: true });
```

### Error 9: "CORS error loading keyword file"

**Symptom:**
```
CORS error loading keyword file. Ensure the file is served from the same origin or has proper CORS headers.
```

**Causes:**
1. Keyword file on different domain without CORS headers
2. CDN not configured with proper CORS headers
3. File server blocking cross-origin requests

**Solutions:**

1. **Serve from same origin:**
   - Place `.ppn` files in `public/keywords/` directory
   - Use relative paths or same-origin URLs

2. **Use built-in keywords:**
   - Built-in keywords don't require file downloads
   - No CORS issues with built-in keywords

3. **Configure CORS headers (if using CDN):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

### Error 10: "Wake word detected but STT doesn't start"

**Symptom:**
- Wake word detected successfully
- STT pipeline doesn't activate
- No transcript received

**Causes:**
1. `onWakeWordDetected` callback not properly connected
2. STT initialization failed after wake word
3. Audio bridge not properly configured
4. STT WebSocket connection failed

**Solutions:**

1. **Verify callback connection:**
```javascript
this.wakeWordManager = new WakeWordManager({
  onWakeWordDetected: (keywordIndex) => {
    this._onWakeWordDetected(keywordIndex);
  }
});
```

2. **Check STT activation:**
```javascript
_onWakeWordDetected(keywordIndex) {
  if (this._wakeWordActive) return; // Already active
  
  this._wakeWordActive = true;
  
  // Enable STT pipeline
  if (!this._sttActive) {
    this.startSTT().catch(err => {
      console.error('Failed to start STT after wake word:', err);
    });
  }
}
```

3. **Check STT WebSocket:**
   - Verify Cartesia API key is set
   - Check network connection
   - Look for STT WebSocket errors in console

---

## Initialization Issues

### Issue: Initialization Timeout

**Symptom:**
```
Wake word initialization timeout after 15000ms
```

**Root Cause:**
Initialization involves several slow steps:
1. Loading Porcupine SDK (3-10 seconds, longer on slow networks)
2. Validating keyword files (2-6 seconds per file)
3. Initializing Porcupine engine (5-10 seconds)
4. Loading AudioWorklet processor (1-5 seconds)

**Total time needed:** 15-30 seconds on slow networks

**Solutions:**

1. **Increase timeout:**
```javascript
const INIT_TIMEOUT = 30000; // 30 seconds (increased from 15)
```

2. **Use built-in keywords (faster):**
```javascript
// Built-in keywords initialize in 3-5 seconds instead of 15-30 seconds
const keywords = ['Jarvis'];
```

3. **Add progress logging:**
```javascript
const progressInterval = setInterval(() => {
  const elapsed = (performance.now() - startTime) / 1000;
  DEBUG.trace(`Initialization in progress... (${elapsed.toFixed(1)}s)`);
}, 3000);
```

4. **Preload on app startup:**
   - Load Porcupine SDK when app starts
   - Cache SDK files in browser
   - Initialize wake word manager early

### Issue: Keyword File Validation Timeout

**Symptom:**
File validation takes too long, causing initialization timeout

**Solution:**
```javascript
// Add timeout to file validation (1 second max per file)
const fetchController = new AbortController();
const fetchTimeout = setTimeout(() => fetchController.abort(), 1000);

try {
  const response = await fetch(validatedPath, { 
    method: 'HEAD',
    signal: fetchController.signal
  });
  clearTimeout(fetchTimeout);
  fileExists = response.ok;
} catch (fetchTimeoutErr) {
  clearTimeout(fetchTimeout);
  if (fetchTimeoutErr.name === 'AbortError') {
    // Timeout - use fallback to built-in keyword
    validatedPaths.push('Jarvis');
  }
}
```

### Issue: AudioWorklet Not Available

**Symptom:**
```
AudioWorkletNode creation fails, AudioWorklet is undefined
```

**Causes:**
1. Browser doesn't support AudioWorklet
2. Not using HTTPS (AudioWorklet requires secure context)
3. Browser version too old

**Solutions:**

1. **Check browser compatibility:**
```javascript
if (typeof AudioWorkletNode === 'undefined') {
  // Fallback to main-thread processing
  return this._initializeMainThreadProcessing(mediaStream);
}
```

2. **Use HTTPS:**
   - AudioWorklet requires secure context (HTTPS or localhost)
   - Use `localhost` for development
   - Use HTTPS for production

3. **Fallback to ScriptProcessorNode:**
```javascript
_initializeMainThreadProcessing(mediaStream) {
  const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    // Process on main thread
    this._processOnMainThread(e.inputBuffer);
  };
  return processor;
}
```

---

## Sensitivity Tuning

### Understanding Sensitivity

**Sensitivity Parameter:** Controls the balance between detection rate and false alarm rate.

- **Range:** 0.0 to 1.0
- **Default:** 0.5 (balanced)
- **Lower values (0.0-0.5):** Fewer false alarms, may miss some detections
- **Higher values (0.5-1.0):** More detections, higher false alarm rate

### Tuning Process

1. **Start at 0.5** (balanced default)
2. **Test in real environment:**
   - Quiet environment
   - Noisy environment
   - With background speech
3. **Adjust based on results:**
   - If missing detections: increase (0.6-0.7)
   - If too many false alarms: decrease (0.3-0.4)
4. **Test with different speakers:**
   - Male voices
   - Female voices
   - Various accents
5. **Test at different distances:**
   - Close to microphone
   - Far from microphone
6. **Monitor over extended periods:**
   - Target: <1 false alarm per 10 hours
   - Track detection rate (target: 97%+)

### Environment-Specific Recommendations

| Environment | Recommended Sensitivity | Notes |
|-------------|------------------------|-------|
| **Quiet** | 0.4-0.5 | Lower false alarm rate |
| **Noisy** | 0.6-0.7 | Higher detection rate |
| **Mixed** | 0.5-0.6 | Balanced |
| **Background Speech** | 0.3-0.4 | Reduce false alarms from background |

### Multiple Wake Words with Different Sensitivities

```javascript
const keywordPaths = ['Jarvis', 'Computer'];
const sensitivities = [0.5, 0.6]; // Different sensitivity for each keyword

// Jarvis: 0.5 (balanced)
// Computer: 0.6 (more sensitive)
```

---

## Performance Optimization

### CPU Usage

- **Porcupine:** <4% CPU on Raspberry Pi 3 (reference)
- **Web:** Typically <2% on modern browsers
- **Combined with VAD + STT:** Monitor total CPU usage

### Memory Usage

- **Porcupine:** ~1 MB
- **Model files:** ~100-500 KB per `.ppn` file
- **Total:** ~2-3 MB for typical setup

### Latency

- **Wake word detection:** <100 ms typical
- **End-to-end (wake word → STT start):** <200 ms with proper integration

### Optimization Tips

1. **Use 16 kHz** for Porcupine (matches STT, reduces resampling)
2. **Parallel processing** (don't block STT pipeline)
3. **Buffer management** (efficient frame buffering, avoid memory leaks)
4. **Lazy initialization** (only load Porcupine when needed)
5. **Cooldown periods** (disable wake word after detection to prevent re-triggering)
6. **Frame validation** (validate frame length before processing to avoid errors)
7. **Resource cleanup** (always release Porcupine and disconnect nodes when done)
8. **AudioWorklet over ScriptProcessorNode** (preferred for better performance)

### Performance Monitoring

**Key Metrics to Track:**
- **Detection Latency:** Time from wake word spoken to detection (<100ms target)
- **False Alarm Rate:** Number of false detections per hour (<1 per 10 hours target)
- **CPU Usage:** Monitor CPU usage during always-listening mode (<4% target)
- **Memory Usage:** Track memory consumption (~1-3 MB for Porcupine + models)
- **Detection Rate:** Percentage of wake word utterances detected (97%+ target)

**Monitoring Implementation:**
```javascript
let detectionCount = 0;
let falseAlarmCount = 0;
let totalDetectionTime = 0;

onWakeWordDetected: (keywordIndex) => {
  const detectionTime = performance.now();
  detectionCount++;
  // Validate if this was a real detection or false alarm
};

// Periodically log metrics
setInterval(() => {
  console.log('Wake word metrics:', {
    detections: detectionCount,
    falseAlarms: falseAlarmCount,
    avgLatency: totalDetectionTime / detectionCount
  });
}, 60000); // Every minute
```

---

## Browser Compatibility

### AudioWorklet Support

| Browser | AudioWorklet Support | ScriptProcessorNode | HTTPS Required |
|---------|---------------------|---------------------|----------------|
| Chrome 66+ | ✅ | ✅ (deprecated) | ✅ |
| Safari 14.1+ | ✅ | ✅ (deprecated) | ✅ |
| Firefox 76+ | ✅ | ✅ (deprecated) | ✅ |
| Edge 79+ | ✅ | ✅ (deprecated) | ✅ |
| Opera 53+ | ✅ | ✅ (deprecated) | ✅ |
| IE 11 | ❌ | ✅ | ❌ |

**Recommendation:** Always test in target browsers, implement fallback for older browsers.

### Feature Detection

```javascript
// Check AudioWorklet support
if (typeof AudioWorkletNode === 'undefined') {
  // Fallback to ScriptProcessorNode
}

// Check WebAssembly support
if (typeof WebAssembly === 'undefined') {
  // Porcupine requires WebAssembly
  throw new Error('WebAssembly not supported');
}

// Check secure context
if (!window.isSecureContext) {
  // AudioWorklet requires secure context
  throw new Error('Secure context required (HTTPS or localhost)');
}
```

---

## Error Recovery Strategies

### 1. Graceful Degradation

If Porcupine fails to initialize, continue without wake word (don't block app):

```javascript
try {
  await this.wakeWordManager.initialize(audioContext, mediaStream);
} catch (err) {
  console.warn('Wake word initialization failed, continuing without wake word:', err);
  // App continues to work, just without wake word detection
  // User can still activate manually (button click)
}
```

### 2. Retry Logic

Retry initialization on transient failures:

```javascript
async initializeWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.initialize();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. User Feedback

Inform users if wake word is unavailable:

```javascript
if (!this.wakeWordManager) {
  // Show status: "Wake word unavailable - click mic button to activate"
  this.updateUI({ wakeWordAvailable: false });
}
```

### 4. Logging

Log all errors with context:

```javascript
DEBUG.error('Wake word initialization failed', {
  accessKeyPrefix: this.accessKey ? `${this.accessKey.substring(0, 10)}...` : 'missing',
  keywordPaths: this.keywordPaths,
  browser: navigator.userAgent,
  error: err.message,
  stack: err.stack
});
```

### 5. Validation

Validate inputs before initialization:

```javascript
// Validate AccessKey
if (!accessKey || accessKey.length < 20) {
  throw new Error('Invalid AccessKey format');
}

// Validate keyword paths
if (!Array.isArray(keywordPaths) || keywordPaths.length === 0) {
  throw new Error('At least one wake word keyword is required');
}

// Validate sensitivities
if (sensitivities.length !== keywordPaths.length) {
  throw new Error('Sensitivities array length must match keyword paths');
}
```

---

## Implementation-Specific Issues

### Issue: Frame Processing in AudioWorklet

**Problem:** Porcupine Web SDK can't run directly in AudioWorklet (WebAssembly limitations)

**Solution:** Process frames on main thread:

```javascript
// AudioWorklet sends frames to main thread
this.wakeWordNode.port.onmessage = (e) => {
  if (e.data.type === 'audioFrame') {
    this._processFrame(new Int16Array(e.data.frame));
  }
};

// Main thread processes with Porcupine
_processFrame(frame) {
  if (frame.length !== this.porcupine.frameLength) return;
  const keywordIndex = this.porcupine.process(frame);
  if (keywordIndex >= 0) {
    this.onWakeWordDetected(keywordIndex);
  }
}
```

### Issue: Keyword Path URL Conversion

**Problem:** Porcupine Web API requires full URLs for keyword files

**Solution:**
```javascript
// Convert relative paths to absolute URLs
const validatedPath = path.startsWith('http://') || path.startsWith('https://')
  ? path
  : new URL(path, window.location.origin).href;
```

### Issue: Built-in Keyword Fallback

**Problem:** Custom keyword file not found, but built-in keyword available

**Solution:**
```javascript
// Try to extract keyword name from path for fallback
const pathLower = path.toLowerCase();
const keywordMatch = pathLower.match(/(jarvis|computer|alexa)/);
if (keywordMatch) {
  const builtInKeyword = keywordMatch[1].charAt(0).toUpperCase() + keywordMatch[1].slice(1);
  if (BUILT_IN_KEYWORDS.includes(builtInKeyword)) {
    validatedPaths.push(builtInKeyword);
    continue;
  }
}
```

### Issue: Sensitivities Array Length Mismatch

**Problem:** Sensitivities array length doesn't match keyword paths after validation

**Solution:**
```javascript
// Ensure sensitivities array matches validated paths length
if (this.sensitivities.length !== finalKeywords.length) {
  if (this.sensitivities.length < finalKeywords.length) {
    // Pad with default sensitivity
    while (this.sensitivities.length < finalKeywords.length) {
      this.sensitivities.push(0.5);
    }
  } else {
    // Truncate to match
    this.sensitivities = this.sensitivities.slice(0, finalKeywords.length);
  }
}
```

---

## Quick Reference Troubleshooting

### Wake Word Not Detected

| Cause | Solution |
|-------|----------|
| Sensitivity too low | Increase sensitivity (0.6-0.7) |
| Sample rate mismatch | Verify audio is 16 kHz Int16 |
| Frame length incorrect | Use exact `.frameLength` from Porcupine |
| Wake word phrase too short | Retrain with longer phrase (6+ phonemes) |
| Background noise | Test in quieter environment, adjust sensitivity |

### Too Many False Alarms

| Cause | Solution |
|-------|----------|
| Sensitivity too high | Decrease sensitivity (0.3-0.4) |
| Wake word too common | Choose more unique phrase |
| Background speech | Add noise suppression, lower sensitivity |

### Initialization Fails

| Cause | Solution |
|-------|----------|
| Invalid AccessKey | Verify from Picovoice Console |
| Model file not found | Check file paths, CORS headers |
| Browser not supported | Ensure HTTPS, modern browser |
| AudioWorklet not available | Use fallback main-thread processing |

### Audio Pipeline Conflicts

| Cause | Solution |
|-------|----------|
| Multiple AudioWorklet nodes competing | Ensure proper audio graph routing |
| Sample rate mismatch | Verify all processors use compatible rates |
| Buffer underruns | Increase buffer size, optimize processing |

---

## References

### Official Documentation

- [Porcupine Wake Word SDK](https://picovoice.ai/docs/porcupine/)
- [Porcupine Web API](https://picovoice.ai/docs/api/porcupine-web)
- [Porcupine FAQ](https://picovoice.ai/docs/faq/porcupine/)
- [Porcupine GitHub](https://github.com/picovoice/porcupine)
- [Picovoice Console](https://console.picovoice.ai/)
- [Complete Guide to Wake Word Detection (2026)](https://picovoice.ai/blog/complete-guide-to-wake-word/)

### Project-Specific References

- `wAkE wOrD dOcS.md`: Comprehensive integration guide
- `WAKE-WORD-TROUBLESHOOTING.md`: Project-specific troubleshooting
- `WAKE-WORD-ERROR-EXPLANATION.md`: Error explanations
- `WAKE-WORD-DEBUG-FIXES.md`: Debug fixes applied
- `cArTeSiA dOcS.md`: Cartesia STT/TTS WebSocket specifications
- `aUdiO dOcS.md`: AudioWorklet architecture

### Related Technologies

- [Web Audio API AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [@ricky0123/vad-web](https://github.com/ricky0123/vad-web): Voice Activity Detection
- [Cartesia STT/TTS](https://docs.cartesia.ai/): Speech-to-Text and Text-to-Speech APIs

---

**Last Updated:** Based on comprehensive research from Picovoice documentation, web search results, and project implementation analysis.
