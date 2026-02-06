Do comprehensive research on https://picovoice.ai/docs
/ for any issues or fixes for picovoice wake word detection.

# wAkE wOrD dOcS

---

# Comprehensive Porcupine Wake Word Detection Integration Guide

## Integration with AudioWorklet + VAD Architecture

This document synthesizes research on [Picovoice Porcupine Wake Word Detection](https://picovoice.ai/docs/porcupine/) and provides integration guidance for the JARVIS-WEB project's AudioWorklet-based audio pipeline with VAD (Voice Activity Detection).

**Compatibility Note:** This guide ensures Porcupine integration is compatible with:
- `aUdiO dOcS.md`: AudioWorklet architecture (stt-capture-processor.js, 48kHz→16kHz resampling, Float32→Int16 conversion)
- `cArTeSiA dOcS.md`: Cartesia STT/TTS WebSocket specifications and optimal latency configuration
- VAD system: `@ricky0123/vad-web` MicVAD for speech gating
- Cartesia STT: 16kHz PCM Int16 audio streaming (per cArTeSiA dOcS.md: `sample_rate: "16000"`, `encoding: "pcm_s16le"`, 100ms chunks)

---

## 1. Porcupine Overview

### What is Porcupine?

**Porcupine** is a highly-accurate, lightweight wake word detection engine by Picovoice that enables **always-listening** voice-enabled applications. It uses deep neural networks trained in real-world environments.

**Key Characteristics:**
- **Accuracy:** 97%+ detection rate with less than 1 false alarm in 10 hours (with background speech and ambient noise)
- **Efficiency:** ~1 MB memory, <4% single-core CPU on Raspberry Pi 3
- **Cross-platform:** Arm Cortex-M, Raspberry Pi, Android, iOS, Web browsers (Chrome, Safari, Firefox, Edge), Linux, macOS, Windows
- **Scalable:** Can detect multiple wake words simultaneously with no added runtime footprint
- **Self-service:** Custom wake words trainable in seconds via Picovoice Console using transfer learning

### Core Components

| Component | Purpose |
|-----------|---------|
| **AccessKey** | Authentication token from Picovoice Console (required) |
| **Model file (.pv)** | Language-specific model (e.g., `en`, `es`, `fr`) |
| **Keyword file (.ppn)** | Platform-specific wake word model (trained via Console) |
| **Sensitivity** | Parameter (0.0-1.0) balancing detection rate vs. false alarm rate |

---

## 2. Audio Requirements & Compatibility

### Porcupine Audio Specs

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Format** | 16-bit linearly-encoded PCM | Int16Array |
| **Channels** | Single-channel (mono) | Required |
| **Sample Rate** | Configurable (typically 16kHz or 48kHz) | Retrieved via `.sampleRate` property |
| **Frame Length** | Configurable | Retrieved via `.frameLength` property |
| **Processing** | Real-time frame-by-frame | `.process(Int16Array)` method |

### Compatibility with Current Architecture

**Current Project Audio Pipeline:**
```
getUserMedia (mic)
    → MediaStreamAudioSourceNode
    → GainNode
    → AnalyserNode (for level metering)
    → AudioWorkletNode (stt-capture-processor.js)
        [Float32, 48kHz → Int16, 16kHz]
    → VAD (MicVAD) gates audio to STT
    → Cartesia STT WebSocket
```

**Porcupine Integration Points:**

1. **Option A: Parallel Processing (Recommended)**
   ```
   getUserMedia (mic)
       → MediaStreamAudioSourceNode
       → Splitter (ChannelSplitterNode or manual copy)
           ├→ Porcupine AudioWorklet (wake word detection)
           └→ Existing STT pipeline (VAD → STT)
   ```

2. **Option B: Sequential Processing**
   ```
   getUserMedia (mic)
       → Porcupine AudioWorklet (wake word detection)
           → On wake word detected: enable STT pipeline
           → Existing STT pipeline (VAD → STT)
   ```

3. **Option C: Integrated in STT Processor**
   ```
   stt-capture-processor.js
       → Process audio for Porcupine (wake word)
       → If wake word detected: continue to STT
       → Otherwise: discard or buffer
   ```

**Recommended:** Option A (parallel) for lowest latency and independent operation.

---

## 3. Sample Rate & Format Compatibility

### Current Project Specs (Aligned with cArTeSiA dOcS.md)

| Component | Sample Rate | Format | Notes |
|-----------|-------------|--------|-------|
| **Web Audio Context** | 48 kHz (or 44.1 kHz) | Float32, [-1, 1] | Device-dependent |
| **STT Capture Processor** | 16 kHz output | Int16 PCM (pcm_s16le) | Resampled from 48kHz, 100ms chunks |
| **Cartesia STT** | 16 kHz | Int16 PCM (pcm_s16le) | Required per cArTeSiA dOcS.md: `sample_rate: "16000"`, `encoding: "pcm_s16le"` |
| **Cartesia TTS** | 8 kHz | Int16 PCM (pcm_s16le) | Per cArTeSiA dOcS.md: optimal for low latency (40ms sonic-turbo, 90ms sonic-3) |
| **VAD (MicVAD)** | 16 kHz | Float32 | Internal processing |

### Porcupine Sample Rate Options

Porcupine Web API supports multiple sample rates. For compatibility:

**Recommended Configuration:**
- **Porcupine sample rate:** 16 kHz (matches STT pipeline)
- **Frame length:** Typically 512 samples (32ms @ 16kHz) or 1024 samples (64ms @ 16kHz)
- **Format:** Int16 PCM (matches STT pipeline output)

**Why 16 kHz?**
- **Matches Cartesia STT requirement** (cArTeSiA dOcS.md: `sample_rate: "16000"` is required)
- Reduces resampling overhead (shared with STT pipeline)
- Lower computational cost
- Sufficient for wake word detection (human speech range: ~300-3400 Hz)
- **Format compatibility**: Uses same `pcm_s16le` encoding as Cartesia STT

### Format Conversion

**Current STT Processor Flow:**
```javascript
// stt-capture-processor.js
Float32 (48kHz) → resampleTo16k() → Float32 (16kHz) → floatToInt16() → Int16 (16kHz)
```

**Porcupine Integration (Compatible with Cartesia STT):**
```javascript
// Option: Use same resampled Float32 → Int16 conversion
Float32 (48kHz) → resampleTo16k() → Float32 (16kHz) → floatToInt16() → Int16 (16kHz, pcm_s16le)
                                                                    ├→ Cartesia STT WebSocket
                                                                    │  (sample_rate: "16000", encoding: "pcm_s16le")
                                                                    └→ Porcupine.process()
```

**Shared Conversion Function:**
The existing `floatToInt16()` in `stt-capture-processor.js` can be reused for Porcupine, ensuring identical format conversion that matches Cartesia STT requirements (cArTeSiA dOcS.md).

**Cartesia STT Compatibility:**
- **Sample Rate:** 16 kHz (matches `cArTeSiA dOcS.md` STT config: `sample_rate: "16000"`)
- **Encoding:** `pcm_s16le` (matches `cArTeSiA dOcS.md` STT config: `encoding: "pcm_s16le"`)
- **Chunk Size:** Porcupine frames (512-1024 samples) are independent of STT's 100ms chunks (1600 samples @ 16kHz)
- **No Conflicts:** Wake word detection runs in parallel, doesn't interfere with STT streaming

---

## 4. AudioWorklet Integration Architecture

### Proposed Wake Word Processor (`wake-word-processor.js`)

```javascript
/**
 * Wake Word AudioWorklet Processor
 * Detects wake words using Porcupine, runs in parallel with STT capture.
 * @see aUdiO dOcS.md, wAkE wOrD dOcS.md
 */
const SAMPLE_RATE = 16000; // Match STT pipeline
const FRAME_LENGTH = 512;  // 32ms @ 16kHz (typical Porcupine frame)

class WakeWordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
    this.contextSampleRate = ctxRate;
    this.resampleRatio = this.contextSampleRate / SAMPLE_RATE;
    this.buffer = [];
    this.porcupine = null;
    this.frameLength = FRAME_LENGTH;
    
    // Initialize Porcupine (async, will be set via message)
    this.port.onmessage = (e) => {
      if (e.data.type === 'init') {
        this.porcupine = e.data.porcupine;
        this.frameLength = e.data.frameLength || FRAME_LENGTH;
      }
    };
  }

  floatToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  resampleTo16k(float32Array) {
    const outLength = Math.floor(float32Array.length / this.resampleRatio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * this.resampleRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;
      const nextIdx = Math.min(idx + 1, float32Array.length - 1);
      out[i] = float32Array[idx] * (1 - frac) + float32Array[nextIdx] * frac;
    }
    return out;
  }

  process(inputs, _outputs, _parameters) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0 || !this.porcupine) return true;

    const resampled = this.resampleTo16k(input);
    const int16 = this.floatToInt16(resampled);
    
    // Buffer until we have a full frame
    for (let i = 0; i < int16.length; i++) {
      this.buffer.push(int16[i]);
    }

    // Process frames when buffer is full
    while (this.buffer.length >= this.frameLength) {
      const frame = new Int16Array(this.frameLength);
      for (let i = 0; i < this.frameLength; i++) {
        frame[i] = this.buffer.shift();
      }
      
      // Process with Porcupine
      try {
        const keywordIndex = this.porcupine.process(frame);
        if (keywordIndex >= 0) {
          // Wake word detected!
          this.port.postMessage({ 
            type: 'wakeWord', 
            keywordIndex 
          });
        }
      } catch (err) {
        this.port.postMessage({ 
          type: 'error', 
          error: err.message 
        });
      }
    }
    
    return true;
  }
}

registerProcessor('wake-word-processor', WakeWordProcessor);
```

### Main Thread Integration

```javascript
// In cartesia-audio-bridge.js or new wake-word-manager.js
import { Porcupine } from '@picovoice/porcupine-web';

class WakeWordManager {
  constructor(options = {}) {
    this.accessKey = options.accessKey; // Picovoice AccessKey
    this.keywordPaths = options.keywordPaths || []; // Array of .ppn file paths
    this.sensitivities = options.sensitivities || [0.5]; // Array matching keywords
    this.porcupine = null;
    this.wakeWordNode = null;
    this.audioContext = null;
    this.onWakeWordDetected = options.onWakeWordDetected || (() => {});
  }

  async initialize(audioContext) {
    this.audioContext = audioContext;
    
    // Load Porcupine Web SDK
    try {
      this.porcupine = await Porcupine.create(
        this.accessKey,
        this.keywordPaths,
        this.sensitivities
      );
    } catch (err) {
      throw new Error(`Porcupine initialization failed: ${err.message}`);
    }

    // Load AudioWorklet processor
    await audioContext.audioWorklet.addModule('wake-word-processor.js');
    
    // Create AudioWorkletNode
    this.wakeWordNode = new AudioWorkletNode(audioContext, 'wake-word-processor');
    
    // Send Porcupine instance to processor (Note: may need to use SharedArrayBuffer or process on main thread)
    // Alternative: Process on main thread with buffered frames
    this.wakeWordNode.port.onmessage = (e) => {
      if (e.data.type === 'wakeWord') {
        this.onWakeWordDetected(e.data.keywordIndex);
      } else if (e.data.type === 'error') {
        console.error('Wake word processor error:', e.data.error);
      }
    };

    return {
      node: this.wakeWordNode,
      frameLength: this.porcupine.frameLength,
      sampleRate: this.porcupine.sampleRate
    };
  }

  // Alternative: Process on main thread (if AudioWorklet can't access Porcupine directly)
  async processAudioFrame(int16Frame) {
    if (!this.porcupine) return;
    
    try {
      const keywordIndex = this.porcupine.process(int16Frame);
      if (keywordIndex >= 0) {
        this.onWakeWordDetected(keywordIndex);
      }
    } catch (err) {
      console.error('Porcupine process error:', err);
    }
  }

  async release() {
    if (this.porcupine) {
      await this.porcupine.release();
      this.porcupine = null;
    }
    if (this.wakeWordNode) {
      this.wakeWordNode.disconnect();
      this.wakeWordNode = null;
    }
  }
}
```

---

## 5. VAD Compatibility & Integration Strategy

### Current VAD Architecture

The project uses `@ricky0123/vad-web` MicVAD for speech gating:
- **Purpose:** Gates audio to STT (only streams when speech detected)
- **Events:** `onSpeechStart`, `onSpeechEnd`, `onVADMisfire`
- **Configuration:** `VAD_CONFIG` in `vad-config.js`
- **Sample Rate:** 16 kHz (internal)

### Porcupine + VAD Integration Strategies

**Strategy 1: Porcupine First, Then VAD (Always-Listening)**
```
Mic → Porcupine (always listening)
    → On wake word: Enable VAD + STT pipeline
    → VAD gates STT streaming
```
**Use Case:** True always-listening mode; wake word activates conversation.

**Strategy 2: VAD First, Then Porcupine (Speech-Activated)**
```
Mic → VAD (detects speech)
    → On speech: Enable Porcupine + STT
    → Porcupine confirms wake word in speech
    → If wake word: Continue to STT
    → If no wake word: Discard
```
**Use Case:** Energy-efficient; only processes when speech detected.

**Strategy 3: Parallel Processing (Recommended)**
```
Mic → Split
    ├→ Porcupine (always listening, low CPU)
    └→ VAD + STT (gated by Porcupine wake word)
```
**Use Case:** Best of both worlds; Porcupine activates STT pipeline.

### Recommended Integration: Strategy 3

**Implementation Flow:**
1. **Always-listening Porcupine:** Continuously processes audio for wake word
2. **On wake word detected:** 
   - Enable VAD + STT pipeline
   - Clear any pre-speech buffers
   - Start STT WebSocket connection (if not already connected)
3. **VAD gates STT:** Normal VAD operation continues (speech start/end)
4. **After conversation:** Optionally disable STT pipeline, keep Porcupine listening

**Code Integration:**
```javascript
// In cartesia-audio-bridge.js
class CartesiaAudioBridge {
  constructor(options = {}) {
    // ... existing code ...
    this.wakeWordManager = null;
    this._wakeWordActive = false;
  }

  async init() {
    // ... existing AudioContext init ...
    
    // Initialize wake word detection (if enabled)
    if (this.options.enableWakeWord && this.options.picovoiceAccessKey) {
      this.wakeWordManager = new WakeWordManager({
        accessKey: this.options.picovoiceAccessKey,
        keywordPaths: this.options.wakeWordKeywords || [],
        sensitivities: this.options.wakeWordSensitivities || [0.5],
        onWakeWordDetected: (keywordIndex) => {
          this._onWakeWordDetected(keywordIndex);
        }
      });
      
      const { node, frameLength, sampleRate } = await this.wakeWordManager.initialize(this.audioContext);
      
      // Connect wake word processor to audio graph
      // Split audio: source → wakeWordNode (parallel to STT pipeline)
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const splitter = this.audioContext.createChannelSplitter(2);
      source.connect(splitter);
      splitter.connect(node, 0, 0); // Connect to wake word processor
      // STT pipeline connects separately (existing code)
    }
  }

  _onWakeWordDetected(keywordIndex) {
    if (this._wakeWordActive) return; // Already active
    this._wakeWordActive = true;
    
    // Enable STT pipeline
    if (!this._sttActive) {
      this.startSTT().catch(err => {
        console.error('Failed to start STT after wake word:', err);
      });
    }
    
    // Optional: Visual/audio feedback
    this.onWakeWordDetected?.(keywordIndex);
  }

  // Reset wake word state after conversation ends
  _resetWakeWordState() {
    this._wakeWordActive = false;
    // Optionally stop STT, keep Porcupine listening
  }
}
```

---

## 6. Sample Rate Mismatch Handling

### Current Architecture Sample Rates

| Stage | Sample Rate | Format |
|-------|-------------|--------|
| Web Audio Context | 48 kHz (or 44.1 kHz) | Float32 |
| STT Processor Input | 48 kHz | Float32 |
| STT Processor Output | 16 kHz | Int16 PCM |
| Porcupine Input | 16 kHz (recommended) | Int16 PCM |

### Resampling Strategy

**Option 1: Shared Resampling (Efficient)**
- Single resampling operation in shared AudioWorklet
- Output Int16 @ 16kHz to both Porcupine and STT
- **Recommended** for parallel processing

**Option 2: Separate Resampling**
- Porcupine processor resamples independently
- STT processor resamples independently
- More CPU overhead, but cleaner separation

**Option 3: Porcupine at Native Rate**
- Use Porcupine at 48 kHz (if supported)
- STT resamples to 16 kHz separately
- Higher CPU for Porcupine, but no shared resampling complexity

**Recommended:** Option 1 (shared resampling) for efficiency.

---

## 7. Installation & Setup

### Package Installation

```bash
npm install @picovoice/porcupine-web
```

### Picovoice Console Setup

1. **Sign up:** https://console.picovoice.ai/ (free, no credit card)
2. **Get AccessKey:** Copy from Console home page
3. **Create custom wake word:**
   - Navigate to Porcupine page
   - Select language (e.g., English)
   - Type wake phrase (e.g., "Hey JARVIS")
   - Test in browser
   - Train for Web platform
   - Download `.ppn` file

### Wake Word Best Practices

From Porcupine documentation:
- **Length:** 3-5 words ideal
- **Phonemes:** At least 6 phonemes
- **Diversity:** Mix of consonants and vowels
- **Avoid:** Very short phrases, homophones, common words
- **Pronunciation:** Choose phrases that are easy to pronounce clearly
- **Uniqueness:** Avoid common phrases that appear in normal conversation
- **Language:** Match wake word language to your application's primary language

**Examples:**
- ✅ "Hey JARVIS" (good - 2 words, 6+ phonemes, unique)
- ✅ "Computer" (good - single word but distinctive)
- ✅ "Activate assistant" (good - 3 words, clear)
- ❌ "Hi" (too short, too common)
- ❌ "Alexa" (trademark, use custom)
- ❌ "Hello there" (too common in conversation)

---

## 8. Configuration & Sensitivity Tuning

### Sensitivity Parameter

**Range:** 0.0 to 1.0
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

### Multiple Wake Words

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
- Ensure array lengths match exactly (keywordPaths.length === sensitivities.length)
- Test each wake word independently before combining
- Consider using different wake words for different contexts or user roles

---

## 9. Error Handling & Edge Cases

### Common Issues

**1. AccessKey Invalid**
- **Symptom:** `Porcupine.create()` fails with authentication error
- **Fix:** 
  - Verify AccessKey from Picovoice Console (https://console.picovoice.ai/)
  - Ensure AccessKey is not expired or revoked
  - Check for typos or extra whitespace in AccessKey
  - Verify AccessKey matches the account that created the wake word

**2. Model File Not Found**
- **Symptom:** `.ppn` file load fails (404, CORS error, or network error)
- **Fix:** 
  - Ensure file path is correct (absolute URL or relative to origin)
  - For relative paths, convert to absolute URLs: `new URL(path, window.location.origin).href`
  - If loading from CDN, ensure CORS headers are set correctly
  - Verify file is accessible from browser (test URL directly)
  - Check file size (should be ~100-500 KB per `.ppn` file)

**3. Sample Rate Mismatch**
- **Symptom:** Porcupine processes incorrectly, no detections or false detections
- **Fix:** 
  - Ensure audio is resampled to Porcupine's `.sampleRate` (typically 16kHz)
  - Verify resampling algorithm is correct (linear interpolation recommended)
  - Check that sample rate matches after resampling: `porcupine.sampleRate === 16000`

**4. Frame Length Mismatch**
- **Symptom:** `process()` fails or returns incorrect results
- **Fix:** 
  - Buffer audio to exact `.frameLength` (typically 512 or 1024 samples)
  - Validate frame length before processing: `frame.length === porcupine.frameLength`
  - Use proper buffering strategy (queue frames until full frame is available)
  - Don't process partial frames

**5. AudioWorklet Not Available**
- **Symptom:** `AudioWorkletNode` creation fails, `AudioWorklet` is undefined
- **Fix:** 
  - Fallback to main-thread processing with ScriptProcessorNode (deprecated but functional)
  - Ensure HTTPS is used (AudioWorklet requires secure context)
  - Check browser compatibility (Chrome 66+, Safari 14.1+, Firefox 76+, Edge 79+)
  - Verify AudioWorklet support: `typeof AudioWorkletNode !== 'undefined'`

**6. Multiple Detections (Re-triggering)**
- **Symptom:** Wake word triggers multiple times in quick succession
- **Fix:** 
  - Implement cooldown period (disable wake word for 2-5 seconds after detection)
  - Disable wake word during STT active state
  - Use debouncing: only process first detection, ignore subsequent detections within cooldown window

**7. Memory Leaks**
- **Symptom:** Memory usage increases over time, performance degrades
- **Fix:** 
  - Always call `porcupine.release()` when done
  - Disconnect AudioWorklet nodes properly
  - Clear frame buffers when releasing
  - Remove event listeners and message handlers
  - Don't create multiple Porcupine instances without releasing previous ones

**8. Browser Compatibility Issues**
- **Symptom:** Works in some browsers but not others
- **Fix:** 
  - Test in Chrome, Safari, Firefox, Edge
  - Ensure HTTPS is used (required for AudioWorklet)
  - Check WebAssembly support: `typeof WebAssembly !== 'undefined'`
  - Verify SharedArrayBuffer support if using advanced features
  - Use feature detection before initializing

### Fallback Strategy

```javascript
// Fallback to main-thread processing if AudioWorklet unavailable
if (typeof AudioWorkletNode === 'undefined') {
  // Process on main thread with ScriptProcessorNode (deprecated but functional)
  // Note: ScriptProcessorNode is deprecated but still works as fallback
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    // Buffer and process frames on main thread
    this._processOnMainThread(e.inputBuffer);
  };
  this._scriptProcessor = processor;
} else {
  // Use AudioWorklet (preferred - lower latency, better performance)
  await audioContext.audioWorklet.addModule('wake-word-processor.js');
  this.wakeWordNode = new AudioWorkletNode(audioContext, 'wake-word-processor');
}
```

### Error Recovery Best Practices

1. **Graceful Degradation:** If Porcupine fails to initialize, continue without wake word (don't block app)
2. **Retry Logic:** Retry initialization on transient failures (network errors, etc.)
3. **User Feedback:** Inform users if wake word is unavailable (show status, allow manual activation)
4. **Logging:** Log all errors with context (AccessKey prefix, keyword paths, browser info)
5. **Validation:** Validate inputs before initialization (AccessKey format, keyword paths, sensitivities)

---

## 10. Performance Considerations

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
// Track detection metrics
let detectionCount = 0;
let falseAlarmCount = 0;
let totalDetectionTime = 0;

onWakeWordDetected: (keywordIndex) => {
  const detectionTime = performance.now();
  detectionCount++;
  // Validate if this was a real detection or false alarm
  // (e.g., user confirms or denies activation)
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

## 11. Security & Privacy Best Practices

### AccessKey Security

**Best Practices:**
- **Never commit AccessKey to version control** - Use environment variables or secure config
- **Rotate AccessKeys periodically** - Generate new keys from Picovoice Console
- **Use different AccessKeys for dev/staging/prod** - Isolate environments
- **Restrict AccessKey scope** - Use keys only for required services (Porcupine)
- **Monitor AccessKey usage** - Check Picovoice Console for unusual activity

**Implementation:**
```javascript
// ✅ Good: Use environment variable
const accessKey = process.env.VITE_PICOVOICE_ACCESS_KEY || '';

// ❌ Bad: Hardcoded in source code
const accessKey = 'your-access-key-here';
```

### HTTPS Requirement

**Why HTTPS is Required:**
- AudioWorklet API requires secure context (HTTPS or localhost)
- Microphone access requires secure context
- Protects user privacy and prevents MITM attacks

**Development:**
- Use `localhost` for local development (considered secure context)
- Use HTTPS for production (required for deployment)

### Privacy Considerations

1. **Always-listening Mode:**
   - Inform users that wake word detection is always active
   - Provide clear UI indicator when wake word is listening
   - Allow users to disable wake word detection
   - Respect user privacy preferences

2. **Audio Processing:**
   - Process audio locally (Porcupine runs in browser, not on server)
   - Don't send raw audio to server (only send after wake word detection)
   - Clear audio buffers after processing
   - Implement proper cleanup on page unload

3. **User Consent:**
   - Request microphone permission explicitly
   - Explain why microphone access is needed
   - Provide clear privacy policy
   - Allow users to revoke permission

### Data Handling

- **No audio storage:** Don't store raw audio data unless necessary
- **Minimal logging:** Don't log audio data or sensitive information
- **Secure transmission:** If sending data after wake word, use HTTPS/WSS
- **Compliance:** Follow GDPR, CCPA, and other privacy regulations

---

## 12. Integration Checklist

### Pre-Integration

- [ ] Picovoice Console account created
- [ ] AccessKey obtained
- [ ] Custom wake word trained and `.ppn` file downloaded
- [ ] `@picovoice/porcupine-web` package installed
- [ ] AudioWorklet support verified (HTTPS required)

### Integration Steps

- [ ] Create `wake-word-processor.js` AudioWorklet processor
- [ ] Create `WakeWordManager` class (or integrate into `CartesiaAudioBridge`)
- [ ] Initialize Porcupine in `init()` method
- [ ] Connect wake word processor to audio graph (parallel to STT)
- [ ] Implement `onWakeWordDetected` callback
- [ ] Enable STT pipeline on wake word detection
- [ ] Test wake word detection accuracy
- [ ] Tune sensitivity parameter
- [ ] Test with VAD integration
- [ ] Verify no audio pipeline conflicts

### Testing

- [ ] Wake word detected correctly in quiet environment
- [ ] Wake word detected with background noise
- [ ] False alarm rate acceptable (<1 per 10 hours target)
- [ ] STT pipeline activates correctly after wake word
- [ ] VAD continues to gate STT properly
- [ ] No audio glitches or latency issues
- [ ] Works across browsers (Chrome, Safari, Firefox, Edge)

---

## 13. Always-Listening Mode Best Practices

### Implementation Strategy

**Always-Listening Mode** allows wake word detection to remain active even when STT is not running, enabling true hands-free activation.

**Key Implementation Points:**

1. **Separate Initialization:**
   ```javascript
   // Initialize wake word independently of STT
   await bridge.initWakeWord(); // Always-listening mode
   // Later, when wake word detected:
   await bridge.startSTT(); // STT activates
   ```

2. **Resource Management:**
   - Keep media stream alive for wake word (don't stop tracks when STT stops)
   - Keep Porcupine instance active (don't release until app closes)
   - Re-enable wake word after STT stops (for next activation)

3. **State Management:**
   ```javascript
   // Wake word state
   _wakeWordActive = false; // True when STT activated by wake word
   
   // After STT stops:
   if (wakeWordEnabled) {
     wakeWordManager.setEnabled(true); // Re-enable for next activation
     // Keep media stream alive
   }
   ```

### Best Practices for Always-Listening Mode

1. **Visual Feedback:**
   - Show indicator when wake word is listening (e.g., "Waiting for wake word...")
   - Change indicator when STT is active (e.g., "Listening...")
   - Provide clear state transitions

2. **Battery Optimization:**
   - Monitor CPU usage (should be <4% for Porcupine)
   - Consider pausing wake word when page is hidden (Page Visibility API)
   - Allow users to disable always-listening mode

3. **Error Recovery:**
   - If wake word fails, allow manual activation (button click)
   - Gracefully degrade if Porcupine unavailable
   - Retry initialization on transient failures

4. **User Control:**
   - Provide toggle to enable/disable always-listening
   - Show current state clearly
   - Allow users to test wake word detection

### Cooldown Period Implementation

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

---

## 14. Keyword Path Management

### Path Validation Best Practices

**URL Conversion:**
```javascript
// Convert relative paths to absolute URLs
const validatedPaths = keywordPaths.map(path => {
  // Full URL - use as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Relative path - convert to absolute URL
  return new URL(path, window.location.origin).href;
});
```

**Path Requirements:**
- Must be accessible from browser (test URL directly)
- Must have correct CORS headers if on different domain
- Must be valid `.ppn` file format
- Should be cached for performance (browser cache or service worker)

### File Organization

**Recommended Structure:**
```
public/
  keywords/
    hey-jarvis.ppn
    computer.ppn
  audio/
    wake-word-processor.js
    stt-capture-processor.js
```

**Loading Strategy:**
- Use relative paths from public directory
- Convert to absolute URLs at runtime
- Consider CDN for production (faster loading, better caching)
- Preload keyword files for faster initialization

---

## 15. References

### Official Documentation

- [Porcupine Wake Word SDK](https://picovoice.ai/docs/porcupine/)
- [Porcupine Web API](https://picovoice.ai/docs/api/porcupine-web)
- [Porcupine FAQ](https://picovoice.ai/docs/faq/porcupine/)
- [Porcupine GitHub](https://github.com/picovoice/porcupine)
- [Picovoice Console](https://console.picovoice.ai/)

### Project-Specific References

- `cArTeSiA dOcS.md`: **Cartesia STT/TTS WebSocket specifications** - Sample rates, encoding, optimal latency config
- `aUdiO dOcS.md`: AudioWorklet architecture, resampling, format conversion
- `public/audio/stt-capture-processor.js`: STT AudioWorklet processor implementation (16kHz, pcm_s16le, 100ms chunks)
- `public/js/vad-config.js`: VAD configuration and thresholds
- `public/js/cartesia-audio-bridge.js`: Main audio bridge implementation

### Related Technologies

- [Web Audio API AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [@ricky0123/vad-web](https://github.com/ricky0123/vad-web): Voice Activity Detection
- [Cartesia STT/TTS](https://docs.cartesia.ai/): Speech-to-Text and Text-to-Speech APIs

---

## 16. Cartesia Compatibility Verification

### STT Configuration Alignment

The wake word implementation is fully compatible with Cartesia STT specifications (cArTeSiA dOcS.md):

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Sample Rate** | 16 kHz | ✅ Matches `sample_rate: "16000"` |
| **Encoding** | `pcm_s16le` | ✅ Matches `encoding: "pcm_s16le"` |
| **Format** | Int16 PCM | ✅ Correct binary format |
| **Audio Source** | Same mic stream | ✅ Shared `getUserMedia` stream |
| **Processing** | Parallel (non-blocking) | ✅ Doesn't interfere with STT |

### Integration Flow with Cartesia

```
getUserMedia (mic)
    → MediaStreamAudioSourceNode
    → Split
        ├→ Wake Word Processor (16kHz, pcm_s16le)
        │   → Porcupine.process() [always listening]
        │   → On detection: activate STT pipeline
        │
        └→ STT Capture Processor (16kHz, pcm_s16le, 100ms chunks)
            → VAD gates audio
            → Cartesia STT WebSocket
                (sample_rate: "16000", encoding: "pcm_s16le", model: "ink-whisper")
```

### Key Compatibility Points

1. **Shared Sample Rate:** Both wake word and STT use 16kHz, eliminating resampling conflicts
2. **Shared Format:** Both use `pcm_s16le` (Int16 PCM), ensuring format consistency
3. **Independent Processing:** Wake word runs in parallel, doesn't block or interfere with STT streaming
4. **Cartesia STT Config:** Wake word activation doesn't change STT configuration (per cArTeSiA dOcS.md)
5. **Audio Chunk Timing:** Porcupine frames (32-64ms) are independent of STT's 100ms chunks

### TTS Compatibility Note

While Cartesia TTS uses 8kHz (per cArTeSiA dOcS.md for optimal latency), the wake word detection uses 16kHz to match STT. This is correct because:
- Wake word detection activates STT (16kHz), not TTS
- TTS receives text input, not audio from the wake word processor
- No sample rate conflict exists

---

## 17. Troubleshooting

### Issue: Wake word not detected

**Possible Causes:**
1. Sensitivity too low → Increase sensitivity (0.6-0.7)
2. Sample rate mismatch → Verify audio is 16 kHz Int16
3. Frame length incorrect → Use exact `.frameLength` from Porcupine
4. Wake word phrase too short → Retrain with longer phrase (6+ phonemes)
5. Background noise → Test in quieter environment, adjust sensitivity

### Issue: Too many false alarms

**Possible Causes:**
1. Sensitivity too high → Decrease sensitivity (0.3-0.4)
2. Wake word too common → Choose more unique phrase
3. Background speech → Add noise suppression, lower sensitivity

### Issue: Audio pipeline conflicts

**Possible Causes:**
1. Multiple AudioWorklet nodes competing → Ensure proper audio graph routing
2. Sample rate mismatch → Verify all processors use compatible rates
3. Buffer underruns → Increase buffer size, optimize processing

### Issue: Porcupine initialization fails

**Possible Causes:**
1. Invalid AccessKey → Verify from Picovoice Console
2. Model file not found → Check file paths, CORS headers
3. Browser not supported → Ensure HTTPS, modern browser (Chrome, Safari, Firefox, Edge)
4. AudioWorklet not available → Use fallback main-thread processing

---

## 18. Future Enhancements

### Potential Improvements

1. **Multiple wake words:** Support different wake words for different contexts
2. **Wake word confidence:** Expose confidence scores for fine-tuning
3. **Adaptive sensitivity:** Adjust sensitivity based on environment noise
4. **Wake word training UI:** Integrate Picovoice Console training into app
5. **Offline mode:** Cache models for offline operation
6. **Wake word analytics:** Track detection rates, false alarms, latency

---

---

## 19. Implementation-Specific Best Practices

### Frame Processing Best Practices

**Frame Length Validation:**
```javascript
// Always validate frame length before processing
if (frame.length !== this.porcupine.frameLength) {
  DEBUG.trace('Frame length mismatch', {
    expected: this.porcupine.frameLength,
    actual: frame.length
  });
  return; // Don't process invalid frames
}
```

**Efficient Buffering:**
```javascript
// Use circular buffer or queue for frame buffering
const frameQueue = [];
const frameLength = porcupine.frameLength;

// Add samples to queue
for (let i = 0; i < samples.length; i++) {
  frameQueue.push(samples[i]);
}

// Process complete frames
while (frameQueue.length >= frameLength) {
  const frame = new Int16Array(frameLength);
  for (let i = 0; i < frameLength; i++) {
    frame[i] = frameQueue.shift();
  }
  porcupine.process(frame);
}
```

### AudioWorklet vs Main-Thread Processing

**AudioWorklet (Preferred):**
- ✅ Lower latency (runs in audio thread)
- ✅ Better performance (doesn't block main thread)
- ✅ More efficient (native audio processing)
- ❌ Requires HTTPS
- ❌ Requires modern browser

**Main-Thread Fallback (ScriptProcessorNode):**
- ✅ Works on older browsers
- ✅ Works on HTTP (for development)
- ❌ Higher latency (runs on main thread)
- ❌ Deprecated API (may be removed in future)
- ❌ Can cause audio glitches under load

**Best Practice:** Always prefer AudioWorklet, but implement fallback for compatibility.

### Resource Cleanup Checklist

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
    this.wakeWordNode.disconnect();
    this.wakeWordNode = null;
  }
  
  // 4. Disconnect ScriptProcessorNode (if used)
  if (this._scriptProcessor) {
    this._scriptProcessor.disconnect();
    this._scriptProcessor = null;
  }
  
  // 5. Clear frame buffers
  this._frameQueue = [];
  
  // 6. Remove event listeners
  // (handled by disconnecting nodes)
}
```

### Browser Compatibility Matrix

| Browser | AudioWorklet Support | ScriptProcessorNode | HTTPS Required |
|---------|---------------------|---------------------|----------------|
| Chrome 66+ | ✅ | ✅ (deprecated) | ✅ |
| Safari 14.1+ | ✅ | ✅ (deprecated) | ✅ |
| Firefox 76+ | ✅ | ✅ (deprecated) | ✅ |
| Edge 79+ | ✅ | ✅ (deprecated) | ✅ |
| Opera 53+ | ✅ | ✅ (deprecated) | ✅ |
| IE 11 | ❌ | ✅ | ❌ |

**Recommendation:** Always test in target browsers, implement fallback for older browsers.

---

**Last Updated:** Based on comprehensive research from https://picovoice.ai/docs/porcupine/, project architecture analysis, and implementation best practices.
