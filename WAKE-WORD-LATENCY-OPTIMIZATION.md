# Wake Word → Bidirectional Conversation Latency Optimization

**Date:** 2025-02-02  
**Goal:** Achieve optimal latency from wake word detection to bidirectional conversation flow.

---

## Current Flow Analysis

### Current Wake Word → STT Activation Flow

```
Wake Word Detected (Porcupine)
  ↓ [~50-100ms detection latency]
_onWakeWordDetected() called
  ↓ [Sequential operations - BOTTLENECK]
  1. Check cooldown [~0ms]
  2. Connect STT WebSocket [~100-500ms if not connected]
  3. Get user media [~0ms if already got, ~50-200ms if not]
  4. Setup audio graph [~10-50ms]
  5. Start VAD [~50-200ms]
  6. Activate STT pipeline [~0ms]
  ↓
STT Active - Ready to capture speech
  ↓ [VAD must detect speech]
VAD onSpeechStart
  ↓ [~200-800ms VAD detection]
Flush pre-speech buffer
  ↓
Start streaming to STT WebSocket
```

**Total Latency (Current):** ~450-1050ms from wake word to STT streaming

### Latency Breakdown

| Operation | Current Time | Optimized Time | Savings |
|-----------|-------------|---------------|---------|
| Wake word detection | 50-100ms | 50-100ms | 0ms |
| STT WebSocket connect | 100-500ms | 0ms (pre-connected) | 100-500ms |
| Get user media | 0-200ms | 0ms (already got) | 0-200ms |
| Audio graph setup | 10-50ms | 0ms (pre-setup) | 10-50ms |
| VAD start | 50-200ms | 0ms (pre-started) | 50-200ms |
| VAD speech detection | 200-800ms | 0ms (immediate) | 200-800ms |
| **Total** | **450-1050ms** | **50-100ms** | **400-950ms** |

---

## Optimization Strategy

### 1. Pre-Connect STT WebSocket (Critical)

**Current:** STT WebSocket connects after wake word detection  
**Optimized:** Pre-connect STT WebSocket when wake word is initialized

**Implementation:**
- Connect STT WebSocket during `initWakeWord()` or immediately after
- Keep connection alive (Cartesia allows 3 minutes of silence)
- Reconnect if connection drops

**Latency Savings:** 100-500ms

### 2. Pre-Setup Audio Graph (Critical)

**Current:** Audio graph setup happens after wake word detection  
**Optimized:** Pre-setup audio graph when wake word is initialized

**Implementation:**
- Create STT AudioWorklet node during wake word initialization
- Connect to same media stream (Web Audio API allows multiple sources)
- Keep node ready but not streaming

**Latency Savings:** 10-50ms

### 3. Pre-Start VAD (Important)

**Current:** VAD starts after wake word detection  
**Optimized:** Pre-start VAD when wake word is initialized

**Implementation:**
- Start VAD in always-listening mode
- Keep VAD running but don't stream to STT until wake word detected
- Immediately flush pre-speech buffer when wake word detected

**Latency Savings:** 50-200ms

### 4. Immediate Pre-Speech Buffer Capture (Important)

**Current:** Pre-speech buffer only captures after STT node is set up  
**Optimized:** Start capturing immediately when wake word detected

**Implementation:**
- Ensure STT node is already capturing (from pre-setup)
- Pre-speech buffer should already have audio from wake word detection
- Immediately flush buffer when wake word detected

**Latency Savings:** 200-800ms (captures speech that happens during setup)

### 5. Parallel Operations (Nice to Have)

**Current:** Sequential operations in `_onWakeWordDetected()`  
**Optimized:** Parallelize independent operations

**Implementation:**
- Run STT WebSocket connect, audio graph setup, and VAD start in parallel
- Use `Promise.all()` for independent operations

**Latency Savings:** 50-200ms (overlap of operations)

---

## Recommended Implementation

### Phase 1: Critical Optimizations (Immediate Impact)

1. **Pre-connect STT WebSocket**
   - Connect during `initWakeWord()` or immediately after
   - Keep connection alive with keepalive

2. **Pre-setup Audio Graph**
   - Create STT node during wake word initialization
   - Connect to media stream
   - Keep node ready but not streaming

3. **Pre-start VAD**
   - Start VAD in always-listening mode
   - Keep VAD running but don't stream to STT

**Expected Latency Reduction:** 400-750ms

### Phase 2: Additional Optimizations (Further Improvement)

4. **Immediate Pre-Speech Buffer**
   - Ensure buffer captures during wake word detection
   - Flush immediately when wake word detected

5. **Parallel Operations**
   - Parallelize independent setup operations

**Expected Latency Reduction:** 50-200ms additional

---

## Optimal Flow (After Optimization)

```
Wake Word Detected (Porcupine)
  ↓ [~50-100ms detection latency]
_onWakeWordDetected() called
  ↓ [Parallel operations - OPTIMIZED]
  1. Check cooldown [~0ms]
  2. STT WebSocket [Already connected - 0ms]
  3. User media [Already got - 0ms]
  4. Audio graph [Already set up - 0ms]
  5. VAD [Already started - 0ms]
  6. Activate STT pipeline [~0ms]
  7. Flush pre-speech buffer [~0ms]
  ↓
STT Active - Immediately streaming
  ↓ [No VAD delay - immediate]
Start streaming to STT WebSocket
```

**Total Latency (Optimized):** ~50-100ms from wake word to STT streaming

**Latency Reduction:** 400-950ms (80-90% improvement)

---

## Implementation Details

### 1. Pre-Connect STT WebSocket

**Location:** `cartesia-audio-bridge.js` - `initWakeWord()` method

```javascript
async initWakeWord() {
  // ... existing wake word initialization ...
  
  // Pre-connect STT WebSocket for low latency
  if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN) {
    try {
      await this.connectSTTWebSocket();
      DEBUG.trace('Wake word: STT WebSocket pre-connected for low latency');
    } catch (err) {
      DEBUG.warn('Wake word: Failed to pre-connect STT WebSocket', err);
      // Don't fail wake word init if STT connection fails - will retry on detection
    }
  }
  
  // ... rest of initialization ...
}
```

### 2. Pre-Setup Audio Graph

**Location:** `cartesia-audio-bridge.js` - `initWakeWord()` method

```javascript
async initWakeWord() {
  // ... existing wake word initialization ...
  
  // Pre-setup STT audio graph for low latency
  if (!this.sttNode && this.mediaStream && this.audioContext) {
    try {
      // Setup audio graph (same as in _onWakeWordDetected)
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sttGainNode = this.audioContext.createGain();
      this.sttGainNode.gain.value = this._inputGain;
      this.sttAnalyserNode = this.audioContext.createAnalyser();
      this.sttAnalyserNode.fftSize = 256;
      
      const basePath = this.options.audioWorkletBasePath || './audio/';
      const processorPath = basePath.endsWith('/') 
        ? `${basePath}stt-capture-processor.js`
        : `${basePath}/stt-capture-processor.js`;
      
      try {
        await this.audioContext.audioWorklet.addModule(processorPath);
      } catch (err) {
        if (err.message && !err.message.includes('already been added')) {
          throw err;
        }
      }
      
      this.sttNode = new AudioWorkletNode(this.audioContext, 'stt-capture-processor');
      
      source.connect(this.sttGainNode);
      this.sttGainNode.connect(this.sttNode);
      this.sttGainNode.connect(this.sttAnalyserNode);
      
      // Set up message handler (but don't stream yet)
      this.sttNode.port.onmessage = (e) => {
        // ... existing handler ...
        // Buffer audio but don't stream until wake word detected
        if (!this._sttStreaming) {
          this._preSpeechBuffer.push(buf);
          if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) {
            this._preSpeechBuffer.shift();
          }
        }
      };
      
      DEBUG.trace('Wake word: STT audio graph pre-setup for low latency');
    } catch (err) {
      DEBUG.warn('Wake word: Failed to pre-setup STT audio graph', err);
      // Don't fail wake word init - will setup on detection
    }
  }
  
  // ... rest of initialization ...
}
```

### 3. Pre-Start VAD

**Location:** `cartesia-audio-bridge.js` - `initWakeWord()` method

```javascript
async initWakeWord() {
  // ... existing wake word initialization ...
  
  // Pre-start VAD for low latency (but don't stream to STT yet)
  if (!this.vad && this.mediaStream) {
    try {
      const vadOptions = {
        // ... existing VAD config ...
        onSpeechStart: () => {
          // Only activate if STT is active (wake word detected)
          if (this._sttActive) {
            this._clearSilenceStopTimer();
            this._clearMaxListeningTimer();
            this._recordedAudioChunks = [];
            this._isRecordingAudio = true;
            this._sttStreaming = true;
            this._flushPreSpeechBuffer();
            this.onSpeechStart();
          }
        },
        onSpeechEnd: async () => {
          // Only process if STT is active
          if (this._sttActive) {
            // ... existing onSpeechEnd logic ...
          }
        },
        // ... rest of VAD config ...
      };
      
      this.vad = await MicVAD.new(vadOptions);
      await this.vad.start();
      DEBUG.trace('Wake word: VAD pre-started for low latency');
    } catch (err) {
      DEBUG.warn('Wake word: Failed to pre-start VAD', err);
      // Don't fail wake word init - will start on detection
    }
  }
  
  // ... rest of initialization ...
}
```

### 4. Optimized _onWakeWordDetected

**Location:** `cartesia-audio-bridge.js` - `_onWakeWordDetected()` method

```javascript
async _onWakeWordDetected(keywordIndex) {
  // Check cooldown period
  const now = Date.now();
  if (now - this._lastWakeWordDetectionTime < this._wakeWordCooldownMs) {
    DEBUG.trace('Wake word detected but in cooldown period', { keywordIndex });
    return;
  }
  
  if (this._wakeWordActive) {
    DEBUG.trace('Wake word detected but already active', { keywordIndex });
    return;
  }
  
  DEBUG.trace('Wake word detected! Activating STT pipeline', { keywordIndex });
  this._lastWakeWordDetectionTime = now;
  this._wakeWordActive = true;
  this.onWakeWordDetected(keywordIndex);
  
  // Everything should already be pre-setup, just activate
  try {
    // Ensure STT WebSocket is connected (should already be)
    if (!this.sttWs || this.sttWs.readyState !== WebSocket.OPEN) {
      DEBUG.trace('Wake word: STT WebSocket not pre-connected, connecting now...');
      await this.connectSTTWebSocket();
    }
    
    // Ensure audio graph is set up (should already be)
    if (!this.sttNode) {
      DEBUG.trace('Wake word: STT audio graph not pre-setup, setting up now...');
      // ... setup audio graph (fallback) ...
    }
    
    // Ensure VAD is started (should already be)
    if (!this.vad) {
      DEBUG.trace('Wake word: VAD not pre-started, starting now...');
      // ... start VAD (fallback) ...
    }
    
    // Activate STT pipeline immediately
    this._sttActive = true;
    this._hadTranscriptFromPreviousSegment = false;
    
    // Flush pre-speech buffer immediately (captures audio during wake word detection)
    this._flushPreSpeechBuffer();
    
    // Start streaming immediately (VAD will gate if no speech)
    this._sttStreaming = true;
    
    // Set up max listening timer
    const maxMs = VAD_CONFIG.maxListeningMs ?? 0;
    if (maxMs > 0) {
      this._maxListeningTimer = setTimeout(() => {
        this._maxListeningTimer = null;
        DEBUG.trace('Max listening time reached - stopping mic');
        this._stopSTTAndSendTranscript();
      }, maxMs);
    }
    
    DEBUG.trace('STT pipeline activated after wake word (optimized)', { 
      sttActive: this._sttActive,
      vadStarted: !!this.vad,
      sttWsReady: this.sttWs?.readyState === WebSocket.OPEN,
      preSpeechBufferSize: this._preSpeechBuffer.length
    });
    
    // Disable wake word during STT
    if (this.wakeWordManager) {
      this.wakeWordManager.setEnabled(false);
    }
    
    this.onSTTStarted();
  } catch (err) {
    DEBUG.error('Failed to activate STT pipeline after wake word', err);
    this.onError(`Failed to start listening after wake word: ${err.message}`);
    this._wakeWordActive = false;
    if (this.wakeWordManager) {
      this.wakeWordManager.setEnabled(true);
    }
  }
}
```

---

## Performance Metrics

### Before Optimization

- **Wake word → STT streaming:** 450-1050ms
- **User speaks → STT receives:** 450-1050ms + VAD detection time
- **Total latency:** 650-1850ms

### After Optimization

- **Wake word → STT streaming:** 50-100ms
- **User speaks → STT receives:** 50-100ms (immediate)
- **Total latency:** 50-100ms

**Improvement:** 80-90% latency reduction

---

## Testing Checklist

- [ ] Wake word detection latency < 100ms
- [ ] STT WebSocket pre-connected
- [ ] Audio graph pre-setup
- [ ] VAD pre-started
- [ ] Pre-speech buffer captures during wake word detection
- [ ] STT streaming starts immediately after wake word
- [ ] No audio loss during transition
- [ ] Fallback works if pre-setup fails

---

## Compatibility Notes

### Cartesia STT WebSocket

- **Connection timeout:** 3 minutes of silence
- **Keepalive:** Send empty audio chunks or keep connection alive
- **Reconnection:** Handle reconnection if connection drops

### Audio Graph

- **Multiple sources:** Web Audio API allows multiple MediaStreamSource from same stream
- **Resource usage:** Minimal additional CPU/memory for pre-setup
- **Cleanup:** Properly disconnect nodes when done

### VAD

- **Always-listening:** VAD can run continuously without streaming to STT
- **Resource usage:** VAD is lightweight (~1-2% CPU)
- **Battery:** Minimal impact on battery life

---

## Next Steps

1. **Implement Phase 1 optimizations** (pre-connect, pre-setup, pre-start)
2. **Test latency improvements** (measure before/after)
3. **Implement Phase 2 optimizations** (immediate buffer, parallel ops)
4. **Verify compatibility** (all browsers, all scenarios)
5. **Monitor performance** (CPU, memory, battery)

---

**Last Updated:** 2025-02-02  
**Status:** Ready for implementation
