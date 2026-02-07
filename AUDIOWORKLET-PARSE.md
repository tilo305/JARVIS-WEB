# AudioWorklet Files Parse

This document provides a comprehensive analysis of all AudioWorklet processor files in the codebase.

---

## Overview

The codebase contains **3 AudioWorklet processors** located in `public/audio/`:

1. **wake-word-processor.js** - Wake word detection processor
2. **tts-playback-processor.js** - Text-to-speech playback processor
3. **stt-capture-processor.js** - Speech-to-text capture processor

---

## 1. Wake Word Processor (`wake-word-processor.js`)

### Purpose
Processes microphone audio for wake word detection. Shared by Porcupine (512-sample frames) and openWakeWord (1280-sample/80ms frames).

### Key Specifications
- **Input Sample Rate**: Context rate (typically 48kHz)
- **Output Sample Rate**: 16kHz (matches Cartesia STT pipeline)
- **Default Frame Length**: 512 samples (32ms @ 16kHz)
- **Configurable Frame Length**: Can be set via `postMessage({ type: 'config', frameLength })`
- **Output Format**: Int16 PCM

### Class: `WakeWordProcessor`

#### Constructor
- Initializes with context sample rate detection
- Calculates resample ratio: `contextSampleRate / 16000`
- Initializes buffer, frame length, and state flags
- Sets up message handler for:
  - `config`: Sets frame length and enabled state
  - `enable`: Toggles enabled state
  - `frame`: Processes pre-processed frames for Porcupine

#### Methods

**`floatToInt16(float32Array)`**
- Converts Float32Array (-1 to 1) to Int16Array (-32768 to 32767)
- Clamps values to [-1, 1] range
- Handles signed conversion: `s < 0 ? s * 0x8000 : s * 0x7FFF`

**`resampleTo16k(float32Array)`**
- Linear interpolation resampling from context rate to 16kHz
- Formula: `outLength = floor(inputLength / resampleRatio)`
- Uses fractional indexing with linear interpolation

**`process(inputs, _outputs, _parameters)`**
- Main processing loop (called every 128 sample-frames)
- Validates input (Float32Array, non-empty)
- Validates frame length (0 < frameLength <= 4096)
- Resamples input to 16kHz
- Converts to Int16
- Buffers samples until full frame is available
- Implements buffer overflow protection (max 10 frames)
- Sends complete frames to main thread via `postMessage`
- Returns `true` to keep processor alive

#### Message Types

**From Main Thread:**
- `{ type: 'config', frameLength: number, enabled: boolean }` - Configure processor
- `{ type: 'enable', enabled: boolean }` - Enable/disable processor
- `{ type: 'frame', frame: ArrayBuffer }` - Pre-processed frame for Porcupine

**To Main Thread:**
- `{ type: 'configAck', frameLength: number, enabled: boolean }` - Configuration acknowledgment
- `{ type: 'audioFrame', frame: ArrayBuffer }` - Complete audio frame
- `{ type: 'debug', message: string }` - Debug messages
- `{ type: 'error', error: string }` - Error messages
- `{ type: 'processFrame', frame: ArrayBuffer }` - Processed frame for Porcupine

#### Registration
```javascript
registerProcessor('wake-word-processor', WakeWordProcessor);
```

---

## 2. TTS Playback Processor (`tts-playback-processor.js`)

### Purpose
Receives Int16 PCM audio from Cartesia TTS at 44.1kHz, resamples to context rate (typically 48kHz), converts to Float32, and outputs gapless audio playback.

### Key Specifications
- **Input Sample Rate**: 44.1kHz (Cartesia TTS output)
- **Output Sample Rate**: Context rate (typically 48kHz)
- **Input Format**: Int16 PCM
- **Output Format**: Float32 (-1 to 1)
- **Upsample Ratio**: `contextRate / 44100`

### Class: `TTSPlaybackProcessor`

#### Constructor
- Initializes empty buffer array
- Calculates upsample ratio: `contextRate / 44100`
- Sets up message handler for:
  - `audio`: Receives audio samples (supports Array, Int16Array, ArrayBuffer, ArrayBufferView)
  - `clear`: Clears the buffer

#### Methods

**`int16ToFloat(s)`**
- Converts Int16 PCM sample to Float32 (-1 to 1)
- Handles both signed and unsigned Int16
- Formula: `n >= 0x8000 ? -(0x10000 - n) / 0x8000 : n / 0x7FFF`
- Handles NaN values (defaults to 0)

**`process(inputs, outputs, _parameters)`**
- Main processing loop (called every 128 sample-frames)
- Reads from internal buffer (populated via messages)
- Upsamples from 44.1kHz to context rate using linear interpolation
- Converts Int16 to Float32 for each sample
- Outputs to `outputs[0][0]`
- Removes consumed samples from buffer
- Returns `true` to keep processor alive

#### Message Types

**From Main Thread:**
- `{ type: 'audio', samples: Int16Array|Array|ArrayBuffer|ArrayBufferView }` - Audio data to play
- `{ type: 'clear' }` - Clear playback buffer

**To Main Thread:**
- None (one-way communication from main thread to processor)

#### Registration
```javascript
registerProcessor('tts-playback-processor', TTSPlaybackProcessor);
```

---

## 3. STT Capture Processor (`stt-capture-processor.js`)

### Purpose
Captures microphone audio, resamples from context rate (typically 48kHz) to 16kHz, converts Float32 to Int16, and buffers ~100ms chunks for optimal Cartesia STT latency.

### Key Specifications
- **Input Sample Rate**: Context rate (typically 48kHz)
- **Output Sample Rate**: 16kHz (Cartesia STT requirement)
- **Chunk Size**: 100ms = 1600 samples @ 16kHz
- **Input Format**: Float32 (-1 to 1)
- **Output Format**: Int16 PCM

### Class: `STTCaptureProcessor`

#### Constructor
- Detects context sample rate (defaults to 48kHz)
- Calculates resample ratio: `contextSampleRate / 16000`
- Initializes empty buffer array

#### Methods

**`floatToInt16(float32Array)`**
- Converts Float32Array (-1 to 1) to Int16Array (-32768 to 32767)
- Clamps values to [-1, 1] range
- Handles signed conversion: `s < 0 ? s * 0x8000 : s * 0x7FFF`

**`resampleTo16k(float32Array)`**
- Linear interpolation resampling from context rate to 16kHz
- Formula: `outLength = floor(inputLength / resampleRatio)`
- Uses fractional indexing with linear interpolation

**`process(inputs, _outputs, _parameters)`**
- Main processing loop (called every 128 sample-frames)
- Reads from `inputs[0][0]` (microphone input)
- Resamples input to 16kHz
- Converts to Int16
- Buffers samples until 100ms chunk (1600 samples) is available
- Sends complete chunks to main thread via `postMessage` with transferable ArrayBuffer
- Returns `true` to keep processor alive

#### Message Types

**From Main Thread:**
- None (one-way communication from processor to main thread)

**To Main Thread:**
- `{ type: 'audio', data: ArrayBuffer }` - 100ms audio chunk (Int16 PCM, 16kHz)

#### Registration
```javascript
registerProcessor('stt-capture-processor', STTCaptureProcessor);
```

---

## Common Patterns & Architecture

### Shared Characteristics

1. **All processors extend `AudioWorkletProcessor`**
   - Must implement `process()` method
   - Must return `true` to keep processor alive

2. **Sample Rate Handling**
   - All processors detect context sample rate dynamically
   - Use fallback: `typeof sampleRate !== 'undefined' ? sampleRate : (globalThis.sampleRate ?? 48000)`

3. **Resampling**
   - Wake word and STT processors: Downsample (48kHz → 16kHz)
   - TTS processor: Upsample (44.1kHz → 48kHz)
   - All use linear interpolation with fractional indexing

4. **Format Conversion**
   - Float32 ↔ Int16 conversion is consistent across processors
   - Int16 range: -32768 to 32767
   - Float32 range: -1.0 to 1.0

5. **Buffering Strategy**
   - Wake word: Frame-based buffering (configurable frame length)
   - TTS: Continuous buffering with consumption tracking
   - STT: Chunk-based buffering (100ms = 1600 samples)

6. **Message Passing**
   - All use `this.port.postMessage()` for main thread communication
   - Transferable ArrayBuffers used for efficient data transfer
   - Structured message format with `type` field

### Processing Flow

**Wake Word Detection:**
```
Microphone (48kHz Float32) 
  → WakeWordProcessor 
  → Resample to 16kHz 
  → Convert to Int16 
  → Buffer frames 
  → Send to main thread (Porcupine/openWakeWord)
```

**STT Capture:**
```
Microphone (48kHz Float32) 
  → STTCaptureProcessor 
  → Resample to 16kHz 
  → Convert to Int16 
  → Buffer 100ms chunks 
  → Send to main thread (Cartesia STT WebSocket)
```

**TTS Playback:**
```
Main thread (Cartesia TTS: 44.1kHz Int16) 
  → TTSPlaybackProcessor (via message) 
  → Buffer samples 
  → Upsample to 48kHz 
  → Convert to Float32 
  → Output to speakers
```

---

## Dependencies & Integration

### Main Thread Integration Points

1. **Wake Word Processor**
   - Used by: `openwakeword-manager.js`, Porcupine integration
   - Loaded via: `audioContext.audioWorklet.addModule('wake-word-processor.js')`
   - Node creation: `new AudioWorkletNode(audioContext, 'wake-word-processor')`

2. **TTS Playback Processor**
   - Used by: `cartesia-audio-bridge.js` (likely)
   - Loaded via: `audioContext.audioWorklet.addModule('tts-playback-processor.js')`
   - Node creation: `new AudioWorkletNode(audioContext, 'tts-playback-processor')`

3. **STT Capture Processor**
   - Used by: `cartesia-audio-bridge.js` (likely)
   - Loaded via: `audioContext.audioWorklet.addModule('stt-capture-processor.js')`
   - Node creation: `new AudioWorkletNode(audioContext, 'stt-capture-processor')`

### External Dependencies

- **Cartesia API**: STT and TTS WebSocket connections
- **Porcupine**: Wake word detection (runs on main thread, receives frames from processor)
- **openWakeWord**: Alternative wake word detection (runs on server, receives frames from processor)

---

## Performance Characteristics

### Latency

- **Block Size**: 128 sample-frames (Web Audio API standard)
- **At 48kHz**: 128 / 48000 ≈ 2.67ms per block
- **At 44.1kHz**: 128 / 44100 ≈ 2.9ms per block

### Memory Management

- **Wake Word**: Buffer overflow protection (max 10 frames)
- **TTS**: Continuous buffering with consumption tracking
- **STT**: Fixed chunk size (1600 samples = ~100ms)

### CPU Efficiency

- All processors run in separate thread (AudioWorkletGlobalScope)
- No blocking operations
- Efficient resampling using linear interpolation
- Transferable ArrayBuffers for zero-copy message passing

---

## Error Handling

### Wake Word Processor
- Input validation (Float32Array check)
- Frame length validation (0 < length <= 4096)
- Buffer overflow protection with logging
- Frame length mismatch detection

### TTS Playback Processor
- NaN handling in `int16ToFloat()`
- Empty buffer handling (outputs silence)

### STT Capture Processor
- Empty input handling (returns early)
- No explicit error handling (relies on Web Audio API)

---

## Testing

Test file: `tests/unit/audioworklet-processors.test.js`

---

## Documentation References

- `aUdiO dOcS.md` - Comprehensive AudioWorklet implementation guide
- `wAkE wOrD dOcS.md` - Wake word detection documentation
- `docs/OPENWAKEWORD.md` - openWakeWord integration guide

---

## Summary

All three AudioWorklet processors follow consistent patterns:
- Dynamic sample rate detection
- Linear interpolation resampling
- Float32 ↔ Int16 conversion
- Message-based communication with main thread
- Efficient buffering strategies
- Low-latency processing in separate thread

The processors form a complete audio pipeline:
- **Input**: Microphone → STT Capture + Wake Word Detection
- **Output**: TTS Playback → Speakers

All processors are designed for low-latency, bidirectional conversational flows with Cartesia STT/TTS APIs.
