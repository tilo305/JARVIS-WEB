Do comprehensive research on docs.cartesia.ai for all issues before you do comprehensive research in this doc.

# aUdiO dOcS

---

# Comprehensive AudioWorklet + Cartesia Implementation Guide

## Optimal Latency & Bidirectional Conversational Flow

This document synthesizes research on the [Web Audio API AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet), Cartesia TTS/STT WebSocket APIs, and best practices for building low-latency, bidirectional conversational flows.

---

## 1. AudioWorklet Fundamentals

### What is AudioWorklet?

The **AudioWorklet** interface of the Web Audio API supplies custom audio processing scripts that execute in a **separate thread**, providing **very low latency** audio processing. Unlike the deprecated `ScriptProcessorNode` (which ran on the main thread and blocked execution), AudioWorklet runs on the Web Audio rendering thread.

- **Global scope:** `AudioWorkletGlobalScope`
- **Access:** `BaseAudioContext.audioWorklet`
- **Secure context only:** HTTPS required
- **Browser support:** Widely available since April 2021

### Core Components

| Component | Purpose |
|-----------|---------|
| `AudioWorkletProcessor` | Runs in worklet thread; implements `process()`; receives 128 sample-frames per call |
| `AudioWorkletNode` | Lives on main thread; connects to audio graph; communicates via `port` |
| `registerProcessor()` | Registers processor class in the worklet module |

### Latency Characteristics

- **Block size:** 128 sample-frames (per Web Audio API spec; may vary in future)
- **At 48 kHz:** 128 / 48000 ≈ **2.67 ms** per block
- **At 44.1 kHz:** 128 / 44100 ≈ **2.9 ms** per block
- **Result:** AudioWorklet provides the **lowest-latency** browser-based audio option vs. HTML `<audio>`, `ScriptProcessorNode`, or MediaRecorder.

### Key References

- [AudioWorklet - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [AudioWorkletNode - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode)
- [AudioWorkletProcessor - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor)
- [Background audio processing using AudioWorklet - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)

---

## 2. Cartesia Specs (from cArTeSiA dOcS.md)

### TTS WebSocket

| Parameter | Value | Notes |
|-----------|-------|-------|
| Endpoint | `wss://api.cartesia.ai/tts/websocket` |
| Auth | `?api_key=...&cartesia_version=2025-04-16` |
| Model | `sonic-3` (90ms first byte) / `sonic-turbo` (40ms first byte) |
| Encoding | `pcm_s16le` | Recommended |
| Sample rate | `8000` Hz | Optimal for low latency |
| Container | `raw` | No container overhead |

### STT WebSocket

| Parameter | Value | Notes |
|-----------|-------|-------|
| Endpoint | `wss://api.cartesia.ai/stt/websocket` |
| Model | `ink-whisper` | Optimized for conversational AI |
| Encoding | `pcm_s16le` | Recommended |
| Sample rate | `16000` Hz | Recommended |

### Critical Mismatch: Sample Rates

| Source | Sample Rate | Format |
|--------|-------------|--------|
| Web Audio API (device) | 44.1 kHz or 48 kHz | Float32, -1.0 to 1.0 |
| Cartesia TTS output | 8 kHz | Int16 PCM |
| Cartesia STT input | 16 kHz | Int16 PCM |

**Implication:** Resampling and format conversion are required at the boundaries.

---

## 3. Format Conversion

### Float32 ↔ Int16 (PCM)

Web Audio uses Float32 in `[-1, 1]`. Cartesia uses `pcm_s16le` (Int16, little-endian).

**Float32 → Int16:**

```javascript
function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}
```

**Int16 → Float32 (for TTS playback):**

```javascript
function int16ToFloat32(int16Array) {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int = int16Array[i];
    float32Array[i] = (int >= 0x8000) ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
  }
  return float32Array;
}
```

### Resampling

Web Audio does not support arbitrary sample rates for live streams. You must resample manually or use `OfflineAudioContext` for offline resampling.

**Downsampling (e.g., 48 kHz → 16 kHz for STT):**

- Ratio: 48000 / 16000 = 3 → take every 3rd sample (or average blocks of 3)
- 100 ms at 16 kHz = 1600 samples = 3200 bytes

**Upsampling (e.g., 8 kHz TTS → 48 kHz playback):**

- Ratio: 48000 / 8000 = 6 → interpolate (e.g., linear) between samples
- Or: create `AudioBuffer` with 8 kHz and let Web Audio resample (createBuffer accepts custom sample rates)

---

## 4. Optimal Implementation Architecture

### STT Path (Microphone → Cartesia)

```
getUserMedia (mic)
    → MediaStreamAudioSourceNode
    → AudioWorkletNode (capture processor)
        [Float32 → Int16, 48kHz → 16kHz, buffer 100ms chunks]
    → WebSocket (binary) → Cartesia STT
```

**AudioWorklet STT Processor responsibilities:**

1. Receive Float32 from `process(inputs, outputs, parameters)`
2. Convert to Int16
3. Resample 48 kHz → 16 kHz (or 44.1 → 16)
4. Buffer until ~100 ms (Cartesia recommends small chunks for optimal latency)
5. Send binary via `port.postMessage()` to main thread, which forwards to WebSocket

**Chunk sizing for STT:**

- **Ultra-low latency:** 10–20 ms (~320–640 bytes @ 16 kHz mono)
- **Balanced:** 50–100 ms (~1600–3200 bytes @ 16 kHz)
- **Cartesia recommendation:** ~100 ms intervals

### TTS Path (Cartesia → Speakers)

```
WebSocket (base64 PCM chunks)
    → Decode base64 → Int16
    → Int16 → Float32
    → AudioWorkletNode (playback processor) or AudioBufferSourceNode
    → destination
```

**Options for TTS playback:**

1. **AudioWorklet playback processor:** Maintain a ring buffer; main thread pushes decoded PCM; processor reads and outputs. Lowest latency, most control.
2. **AudioBufferSourceNode:** Create buffers from chunks, schedule with `start()`. Simpler but may have gaps between chunks.
3. **ScriptProcessorNode (deprecated):** Avoid; blocks main thread.

**Recommended:** AudioWorklet with a shared buffer for gapless streaming.

### Bidirectional Flow (STT ↔ Processing ↔ TTS)

```
User speaks → STT WebSocket → Transcript (is_final: false/true)
    → LLM / pipeline
    → TTS WebSocket (continue: true/false, context_id)
    → Audio chunks → Playback
```

**Latency targets:**

- TTS first byte: < 100 ms (sonic-3) or < 50 ms (sonic-turbo)
- STT partial: Time from audio chunk to `is_final: false`
- End-to-end: User speaks → Audio response starts

---

## 5. AudioWorklet Processor Skeletons

### STT Capture Processor (`stt-capture-processor.js`)

```javascript
// Runs in AudioWorkletGlobalScope
const SAMPLE_RATE_OUT = 16000;
const CONTEXT_SAMPLE_RATE = 48000; // or 44100
const CHUNK_MS = 100;
const SAMPLES_PER_CHUNK = (SAMPLE_RATE_OUT * CHUNK_MS) / 1000;

class STTCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.resampleRatio = CONTEXT_SAMPLE_RATE / SAMPLE_RATE_OUT;
  }

  floatToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  resample48to16(float32Array) {
    // Simplified: decimate by ratio (or use proper resampling)
    const outLength = Math.floor(float32Array.length / this.resampleRatio);
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * this.resampleRatio;
      out[i] = float32Array[Math.floor(srcIdx)];
    }
    return out;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    const resampled = this.resample48to16(input);
    const int16 = this.floatToInt16(resampled);
    for (let i = 0; i < int16.length; i++) this.buffer.push(int16[i]);

    while (this.buffer.length >= SAMPLES_PER_CHUNK) {
      const chunk = new Int16Array(SAMPLES_PER_CHUNK);
      for (let i = 0; i < SAMPLES_PER_CHUNK; i++) chunk[i] = this.buffer.shift();
      this.port.postMessage({ type: 'audio', data: chunk.buffer });
    }
    return true;
  }
}
registerProcessor('stt-capture-processor', STTCaptureProcessor);
```

### TTS Playback Processor (`tts-playback-processor.js`)

```javascript
// Receives Int16 PCM at 8 kHz; outputs Float32 at context sample rate
class TTSPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') this.buffer.push(...e.data.samples);
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0][0];
    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      if (this.buffer.length > 0) {
        const int16 = this.buffer.shift();
        output[i] = int16 >= 0x8000 ? -(0x10000 - int16) / 0x8000 : int16 / 0x7FFF;
      } else {
        output[i] = 0;
      }
    }
    return true;
  }
}
registerProcessor('tts-playback-processor', TTSPlaybackProcessor);
```

**Note:** TTS is 8 kHz; Web Audio is typically 48 kHz. Either resample in the processor or use an `AudioBuffer` with `sampleRate: 8000` and let the engine handle playback resampling.

---

## 6. Main Thread Integration

### Setup

```javascript
const audioContext = new AudioContext();
await audioContext.audioWorklet.addModule('stt-capture-processor.js');
await audioContext.audioWorklet.addModule('tts-playback-processor.js');

// STT
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const source = audioContext.createMediaStreamSource(stream);
const sttNode = new AudioWorkletNode(audioContext, 'stt-capture-processor');
source.connect(sttNode);

sttNode.port.onmessage = (e) => {
  if (e.data.type === 'audio') {
    sttWebSocket.send(e.data.data); // binary
  }
};

// TTS playback
const ttsNode = new AudioWorkletNode(audioContext, 'tts-playback-processor');
ttsNode.connect(audioContext.destination);

// When TTS chunk arrives:
const pcmInt16 = decodeBase64PCM(chunk.data);
ttsNode.port.postMessage({ type: 'audio', samples: Array.from(pcmInt16) });
```

---

## 7. Cartesia-Specific Integration

### TTS Continuations (from cArTeSiA dOcS)

- Use `context_id` for prosody continuity.
- `continue: true` for intermediate chunks, `continue: false` for final.
- Stream as soon as STT/LLM produces text.
- `max_buffer_delay_ms: 0` if you buffer client-side.

### STT Commands

- Send binary PCM matching `encoding: "pcm_s16le"`, `sample_rate: "16000"`.
- Text commands: `"finalize"` (flush), `"done"` (close).
- Process `is_final: false` immediately for low latency.

### Sample Rate Mapping

| Direction | Cartesia | Web Audio | Action |
|-----------|----------|-----------|--------|
| STT (mic → API) | 16 kHz Int16 | 48 kHz Float32 | Resample down, convert |
| TTS (API → speakers) | 8 kHz Int16 | 48 kHz Float32 | Convert, resample up (or use AudioBuffer with 8 kHz) |

---

## 8. Best Practices Summary

1. **Always use AudioWorklet** for capture and playback; avoid ScriptProcessorNode.
2. **128 samples per block:** Do not assume fixed block size; check array lengths.
3. **Return `true` from `process()`** to keep the node alive (Chrome compatibility).
4. **Resample in the worklet** when possible to avoid main-thread cost.
5. **Buffer STT audio** in ~100 ms chunks per Cartesia guidance.
6. **Stream TTS** as soon as chunks arrive; use continuations for seamless prosody.
7. **Handle sample rate mismatch** explicitly (8 kHz TTS, 16 kHz STT, 48 kHz device).
8. **Consider WebAssembly** for heavy resampling or DSP in the processor.
9. **Ensure HTTPS** (AudioWorklet requires secure context).
10. **Resume AudioContext** after user gesture if suspended.

---

## 9. References

### MDN

- [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [AudioWorkletNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode)
- [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor)
- [Using AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [BaseAudioContext.createBuffer](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createBuffer)

### Cartesia

- [TTS WebSocket](https://docs.cartesia.ai/api-reference/tts/websocket)
- [STT Streaming](https://docs.cartesia.ai/api-reference/stt/stt)
- [Contexts](https://docs.cartesia.ai/api-reference/tts/working-with-web-sockets/contexts)

### Other

- [web.dev: Microphone audio processing](https://web.dev/patterns/media/microphone-process)
- [Float32 to Int16 conversion (Stack Overflow)](https://stackoverflow.com/questions/33738873/float32-to-int16-javascript-web-audio-api)
