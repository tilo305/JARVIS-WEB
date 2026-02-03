# STT Capture Pipeline Inspection

**Purpose:** Verify the audio pipeline produces 16 kHz PCM output matching Cartesia STT config.

---

## Pipeline Overview

```
Mic (getUserMedia) → MediaStream
       ↓
MediaStreamSource (AudioContext)
       ↓
stt-capture-processor (AudioWorklet)
  - Input: Float32 at context sample rate (48kHz or 44.1kHz)
  - Resample to 16 kHz
  - Convert Float32 → Int16 (pcm_s16le)
  - Buffer and emit 1600-sample chunks (~100ms)
       ↓
cartesia-audio-bridge (port.onmessage)
  - Buffers pre-speech (VAD gating)
  - When VAD detects speech: stream chunks to STT WebSocket
       ↓
Cartesia STT WebSocket (binary)
  - Expects: pcm_s16le @ 16 kHz
  - Config sent on connect: sample_rate: 16000
```

---

## Constants (stt-capture-processor.js)

| Constant | Value | Meaning |
|----------|-------|---------|
| SAMPLE_RATE_OUT | 16000 | Output sample rate (must match Cartesia config) |
| CHUNK_MS | 100 | Chunk duration in ms |
| SAMPLES_PER_CHUNK | 1600 | Math.floor(16000 * 100 / 1000) = 1600 samples per chunk |

**Math:** 1600 samples at 16 kHz = 100 ms ✓

---

## Resampling Logic

**Input:** Float32 from `process(inputs)` — 128 samples per render quantum (Web Audio default).

**Context sample rate:** From `AudioWorkletGlobalScope.sampleRate` (matches `AudioContext.sampleRate`). Typically:
- 48000 Hz (most desktop)
- 44100 Hz (some devices)
- Fallback: 48000 if undefined

**Resample ratio:** `contextSampleRate / SAMPLE_RATE_OUT`
- 48 kHz → 48000/16000 = 3.0
- 44.1 kHz → 44100/16000 = 2.75625

**Output samples per quantum:** `Math.floor(128 / resampleRatio)`
- At 48 kHz: floor(128/3) = 42 samples
- At 44.1 kHz: floor(128/2.75625) ≈ 46 samples

**Accumulation:** Buffer fills until ≥ 1600 samples, then emits one chunk. Each chunk = exactly 1600 Int16 samples = 100 ms at 16 kHz.

---

## Verification

### 1. Chunk size

- Every emitted chunk has exactly 1600 samples.
- 1600 samples at 16 kHz = 100 ms duration.
- Cartesia expects continuous 16 kHz PCM; chunk boundaries are fine.

### 2. Config alignment

- **Processor output:** 16 kHz (SAMPLE_RATE_OUT = 16000)
- **Bridge STT config:** `sample_rate: parseInt(16000, 10)`
- These match ✓

### 3. Encoding

- **Processor:** Int16, little-endian (pcm_s16le)
- **Cartesia config:** `encoding: 'pcm_s16le'`
- These match ✓

---

## Potential Issues

### A. `sampleRate` in AudioWorkletGlobalScope

```javascript
const ctxRate = typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000);
```

- `sampleRate` is defined in the spec and should match `BaseAudioContext.sampleRate`.
- If undefined, we assume 48000, which can slightly mis-resample on 44.1 kHz contexts. Output remains 16 kHz; quality may be marginally affected, but format is correct.

### B. Cartesia "Invalid sample rate" error

This error occurs when the **config** message is sent (on WebSocket open), not when audio is sent. So:

- The problem is with the `sample_rate` value in the JSON config.
- The pipeline and audio format are separate from this error.
- We send `sample_rate: parseInt(16000, 10)` (integer 16000).

If the error persists, likely causes:

1. **API expectation:** Cartesia may expect a string (e.g. `"16000"`) instead of a number.
2. **API version:** Different `cartesia_version` may change validation.
3. **Proxies/serialization:** Something may alter the value before it reaches Cartesia.

### C. VAD audio path

- VAD uses `getStream: () => stream` (same mic stream).
- STT capture uses `createMediaStreamSource(stream)` (same stream).
- Both use the same mic; no sample-rate conflict.

---

## Recommendations

1. **Config:** Try both formats if the error continues:
   - Integer: `sample_rate: 16000`
   - String: `sample_rate: "16000"`

2. **Processor:** Keep current pipeline; it produces valid 16 kHz pcm_s16le.

3. **Debugging:** Add a one-time log when the processor starts to confirm context sample rate (e.g. post `sampleRate` to the main thread and log it).
