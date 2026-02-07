# Cartesia Files Parse - Comprehensive Analysis

**Generated:** 2025-02-05  
**Purpose:** Complete parse and analysis of all Cartesia-related files in the JARVIS-WEB project.

---

## File Inventory

### Core Implementation Files

1. **`public/js/cartesia-audio-bridge.js`** (2,207 lines)
   - Main browser-side bridge for STT/TTS integration
   - Handles AudioWorklet pipeline, VAD, wake word, WebSocket connections
   - Key class: `CartesiaAudioBridge`

2. **`src/stt-client.ts`** (413 lines)
   - Node.js/TypeScript STT WebSocket client
   - Key class: `CartesiaSTTClient`
   - Handles STT connection, audio streaming, transcript callbacks

3. **`src/tts-client.ts`** (405 lines)
   - Node.js/TypeScript TTS WebSocket client
   - Key class: `CartesiaTTSClient`
   - Handles TTS connection, text streaming, continuations, audio callbacks

4. **`src/bidirectional-conversation.ts`** (287 lines)
   - Orchestrates STT → Processing → TTS flow
   - Key class: `BidirectionalConversation`
   - Manages conversation context, latency metrics

5. **`src/config.ts`** (46 lines)
   - Centralized Cartesia API configuration
   - Exports: `CARTESIA_CONFIG`, `N8N_WEBHOOK_URL`

### Documentation Files

6. **`cArTeSiA dOcS.md`** (219 lines)
   - Comprehensive WebSocket implementation guide
   - Optimal latency strategies, bidirectional flow patterns
   - API reference, configuration examples

7. **`cArTeSiA wEbSoCkEt.md`** (1 line)
   - Placeholder/research note for Cartesia WebSocket issues

### Test Files

8. **`tests/unit/cartesia-audio-bridge.test.js`** (112 lines)
   - Unit tests for browser bridge
   - Validates API surface, configuration patterns

9. **`debug/tests/integration/cartesia-websocket-live.test.ts`** (129 lines)
   - Live integration tests for WebSocket connectivity
   - Tests real TTS/STT endpoints (skips if no API key)

### Verification Files

10. **`debug/VERIFICATION-CARTESIA-INTEGRATION-2026-02-05.md`** (31 lines)
    - Verification results for integration changes
    - Test results, lint status, build status

---

## Architecture Overview

### Browser Bridge (`cartesia-audio-bridge.js`)

**Purpose:** Unified browser-side interface for Cartesia STT/TTS with AudioWorklet pipeline.

**Key Components:**
- **AudioWorklet Pipeline:**
  - `stt-capture-processor.js` - Mic → 16kHz PCM chunks → STT WebSocket
  - `tts-playback-processor.js` - TTS PCM → AudioWorklet → speakers
  - `wake-word-processor.js` - 16kHz frames → OpenWakeWord detection

- **VAD (Voice Activity Detection):**
  - Uses `@ricky0123/vad-web` (MicVAD)
  - Gates STT streaming with `onSpeechStart`/`onSpeechEnd`
  - Pre-speech buffer (800ms default) for capturing speech onset

- **Wake Word Integration:**
  - OpenWakeWord backend via WebSocket
  - Always-listening mode when enabled
  - Cooldown period (3s default) to prevent re-triggering
  - Pre-connects STT/TTS WebSockets for minimal latency

- **WebSocket Management:**
  - STT: `wss://api.cartesia.ai/stt/websocket`
  - TTS: `wss://api.cartesia.ai/tts/websocket`
  - Configuration via URL query params (not first message)
  - Auto-reconnection, timeout handling (3 minutes)

**Key Methods:**
- `init()` - Initialize AudioContext and AudioWorklet processors
- `startSTT(options)` - Start STT pipeline (with optional wake word wait)
- `stopSTT()` - Stop STT, send final transcript
- `connectTTS()` - Connect TTS WebSocket
- `speakText(transcript, contextId, isContinue)` - Send text to TTS
- `initWakeWord()` - Initialize wake word detection
- `_onWakeWordDetected()` - Handle wake word → activate STT

**Configuration:**
- API version: `2025-04-16`
- STT model: `ink-whisper`
- TTS model: `sonic-3` (90ms first byte) or `sonic-turbo` (40ms)
- STT chunk size: 100ms
- Sample rates: STT 16kHz, TTS 44.1kHz

**State Management:**
- `_sttActive` - Whether STT pipeline is running
- `_sttStreaming` - Whether audio chunks are being sent to STT
- `_wakeWordActive` - Whether wake word triggered STT
- `_preSpeechBuffer` - Buffer for audio before VAD detects speech
- `_pendingFinalTranscript` - Buffered final transcript until mic stops

**Timers:**
- `_silenceStopTimer` - Auto-stop mic after silence (2.5s default)
- `_maxListeningTimer` - Force-stop after max listening time
- `_silenceClosingTimer` - 10s silence → closing message → stop

### Node.js Clients (`src/`)

**STT Client (`stt-client.ts`):**
- WebSocket connection with URL query params for config
- Binary audio streaming (PCM s16le @ 16kHz)
- Text commands: `"finalize"`, `"done"`
- Response types: `transcript`, `flush_done`, `done`, `error`
- Latency tracking (partial/final transcript times)
- Auto-reconnection with exponential backoff

**TTS Client (`tts-client.ts`):**
- WebSocket connection with API key in URL
- Text streaming with continuations (`continue: true/false`)
- Context management (unique `context_id` per conversation turn)
- Base64 PCM audio decoding
- First-byte latency tracking
- Context expiration (1s after last audio output)

**Bidirectional Conversation (`bidirectional-conversation.ts`):**
- Orchestrates STT → `processTranscript()` → TTS
- Handles partial transcripts immediately (low latency)
- Splits text into sentences for TTS continuations
- Performance metrics (STT latency, TTS first byte, end-to-end)
- Conversation history tracking

---

## Configuration Details

### API Endpoints

**STT:**
- Endpoint: `wss://api.cartesia.ai/stt/websocket`
- Config via URL params: `api_key`, `cartesia_version`, `model`, `encoding`, `sample_rate`, `language`, `min_volume`, `max_silence_duration_secs`
- Model: `ink-whisper`
- Encoding: `pcm_s16le`
- Sample rate: `16000` Hz
- Language: `en`
- Min volume: `0.0`
- Max silence: `2.0` seconds (or `4.0` in bridge)

**TTS:**
- Endpoint: `wss://api.cartesia.ai/tts/websocket`
- Config via URL params: `api_key`, `cartesia_version`
- Model: `sonic-3` (default) or `sonic-turbo`
- Voice: `95131c95-525c-463b-893d-803bafdf93c4`
- Encoding: `pcm_s16le`
- Sample rate: `44100` Hz (bridge) or `8000` Hz (optimal latency)
- Container: `raw`
- Max buffer delay: `0` ms (no server buffering)

### Environment Variables

- `CARTESIA_API_KEY` / `VITE_CARTESIA_API_KEY`
- `CARTESIA_VOICE_ID` / `VITE_CARTESIA_VOICE_ID`
- `N8N_WEBHOOK_URL` / `VITE_N8N_WEBHOOK_URL`
- `VITE_USE_OPENWAKEWORD` (for wake word)
- `VITE_OPENWAKEWORD_WS_URL` (wake word WebSocket URL)

---

## Key Implementation Patterns

### 1. STT Configuration (URL Query Params)

**Bridge Implementation:**
```javascript
const url = new URL(STT_ENDPOINT);
url.searchParams.set('api_key', this.apiKey);
url.searchParams.set('cartesia_version', CARTESIA_VERSION);
url.searchParams.set('model', 'ink-whisper');
url.searchParams.set('encoding', 'pcm_s16le');
url.searchParams.set('sample_rate', '16000');
url.searchParams.set('language', this.language);
url.searchParams.set('min_volume', '0.0');
url.searchParams.set('max_silence_duration_secs', '4.0');
```

**Node.js Client:**
```typescript
url.searchParams.set('model', CARTESIA_CONFIG.STT.MODEL);
url.searchParams.set('encoding', CARTESIA_CONFIG.STT.ENCODING);
url.searchParams.set('sample_rate', String(CARTESIA_CONFIG.STT.SAMPLE_RATE));
// ... etc
```

### 2. TTS Continuations

**Pattern:**
```javascript
// First chunk
{ transcript: "Hello, ", continue: true, context_id: "ctx_123", ... }

// Intermediate chunk
{ transcript: "I'm streaming ", continue: true, context_id: "ctx_123", ... }

// Final chunk
{ transcript: "inputs.", continue: false, context_id: "ctx_123", ... }
```

**Bridge Implementation:**
```javascript
async speakText(transcript, contextId = null, isContinue = false) {
  await this.connectTTS();
  const ctxId = contextId || `ctx_${++this.contextIdCounter}_${Date.now()}`;
  this.ttsWs.send(JSON.stringify({
    model_id: this.ttsModel,
    transcript,
    voice: { mode: 'id', id: this.voiceId },
    language: this.language,
    context_id: ctxId,
    output_format: {
      container: 'raw',
      encoding: 'pcm_s16le',
      sample_rate: 44100,
    },
    add_timestamps: true,
    continue: isContinue,
    max_buffer_delay_ms: 0,
  }));
}
```

### 3. Pre-Speech Buffer (VAD)

**Purpose:** Capture audio before VAD detects speech (reduces latency).

**Implementation:**
```javascript
this._preSpeechMaxChunks = Math.ceil((VAD_CONFIG.preSpeechPadMs || 800) / STT_CHUNK_MS);
// Buffer audio chunks before speech detected
if (this._sttStreaming) {
  this._sendChunkToSTT(buf);
} else {
  this._preSpeechBuffer.push(buf);
  if (this._preSpeechBuffer.length > this._preSpeechMaxChunks) {
    this._preSpeechBuffer.shift();
  }
}
// Flush on speech start
this._flushPreSpeechBuffer();
```

### 4. Wake Word Optimization

**Pre-connection Strategy:**
- Pre-connects STT WebSocket during wake word init
- Pre-connects TTS WebSocket (lightweight, no audio graph)
- Pre-sets up STT audio graph (AudioWorklet nodes)
- Pre-starts VAD for low latency

**Activation Flow:**
1. Wake word detected → `_onWakeWordDetected()`
2. Check cooldown period (3s default)
3. Activate STT immediately (everything pre-setup)
4. Flush pre-speech buffer (captures audio during detection)
5. Start streaming immediately (VAD gates if no speech)

### 5. Barge-In (User Interrupts TTS)

**Implementation:**
```javascript
_bargeIn() {
  this.clearTTSBuffer();
  const ctxIds = [...this._ttsDoneResolvers.keys()];
  ctxIds.forEach((id) => {
    this.cancelTTS(id);
    const r = this._ttsDoneResolvers.get(id);
    if (r) r.reject(new Error('Barge-in: user spoke'));
    this._ttsDoneResolvers.delete(id);
  });
}
```

Called in `onSpeechStart()` to cancel TTS when user speaks.

### 6. Silence-Based Auto-Stop

**Timers:**
- `_silenceStopTimer`: After speech ends, wait 2.5s silence → stop mic
- `_maxListeningTimer`: Force-stop after max listening time
- `_silenceClosingTimer`: 10s silence → closing message → stop

**Flow:**
1. User speaks → VAD `onSpeechStart` → clear timers
2. User stops → VAD `onSpeechEnd` → send `finalize` → start silence timer
3. Silence timer fires → `_stopSTTAndSendTranscript()`
4. Send final transcript to agent via `onTranscript()`

---

## Error Handling

### WebSocket Errors

**Bridge:**
- Connection timeout: 3 minutes (180s)
- Reconnection: Not implemented in bridge (handled by app)
- Error callbacks: `onError()` for user-facing messages

**Node.js Clients:**
- Auto-reconnection with exponential backoff
- Max attempts: 5
- Reconnect delay: 1000ms * attempt number

### Audio Errors

**Microphone:**
- `checkRecordingSupport()` - Validates secure context, mediaDevices
- `getMicrophoneErrorMessage()` - User-friendly error messages
- Handles: NotAllowedError, NotFoundError, NotReadableError, etc.

**AudioWorklet:**
- Processor load errors → throws with file path
- Node creation errors → throws with context
- Message handling errors → logged, doesn't crash

### STT/TTS Errors

**STT:**
- Server errors → `onError()` callback
- Connection lost → attempts reconnection
- Invalid audio → logged, skipped

**TTS:**
- Server errors → `onError()` callback, rejects promise
- Context errors → logged, context cancelled
- Invalid text → logged, skipped

---

## Performance Optimizations

### Latency Reduction

1. **Pre-connection:** STT/TTS WebSockets pre-connected during wake word init
2. **Pre-speech buffer:** Captures 800ms audio before VAD detects speech
3. **Immediate streaming:** STT starts streaming immediately on wake word (VAD gates)
4. **Partial transcripts:** Process `is_final: false` immediately (don't wait for final)
5. **TTS streaming:** Stream text chunks as soon as available (continuations)
6. **No server buffering:** `max_buffer_delay_ms: 0` for TTS

### Memory Management

1. **Pre-speech buffer:** Limited to `_preSpeechMaxChunks` (8 chunks @ 100ms = 800ms)
2. **Audio recording:** Limited to 15MB (prevents huge payloads)
3. **Context cleanup:** TTS contexts expire 1s after last audio
4. **Timer cleanup:** All timers cleared on stop/destroy

### CPU Optimization

1. **Chunk size:** 100ms chunks (balance between latency and overhead)
2. **Backpressure:** STT skips chunks if `bufferedAmount > 256KB`
3. **VAD throttling:** Only processes when STT active
4. **Level meter:** 80ms interval (not every frame)

---

## Testing

### Unit Tests (`tests/unit/cartesia-audio-bridge.test.js`)

**Coverage:**
- Class export validation
- Method existence checks
- Configuration pattern validation (URL params, VAD config)
- Wake word support checks
- Audio graph reuse validation

**Key Assertions:**
- STT config must use URL query params (not first message)
- VAD config must use `silenceAfterSpeechToStopMicMs`
- `onSpeechStart` must always clear silence timer (unconditional)
- `destroy()` must release wake word manager and stop media stream

### Integration Tests (`debug/tests/integration/cartesia-websocket-live.test.ts`)

**Coverage:**
- Live TTS WebSocket connection
- Live STT WebSocket connection
- Real API endpoint validation
- Message format validation

**Skipping:**
- Tests skip if `CARTESIA_API_KEY` not set or invalid
- Uses real WebSocket connections (requires network)

---

## Known Issues & Limitations

### From Documentation

1. **TTS Cancel:** Only halts requests that haven't begun generating (currently generating requests continue)
2. **Context Expiration:** Contexts expire 1s after last audio output (must reuse within 1s for continuations)
3. **WebSocket Timeout:** Auto-disconnects if no data sent for 3 minutes (resets with each message)

### From Code Analysis

1. **Bridge Reconnection:** No auto-reconnection in bridge (handled by app layer)
2. **TTS Pre-connect:** Pre-connects WebSocket but doesn't set up audio graph (done in `connectTTS()`)
3. **Wake Word Cooldown:** Fixed 3s cooldown (configurable via `setWakeWordCooldown()`)
4. **Audio Recording:** Limited to 15MB (may truncate long conversations)

---

## Dependencies

### Browser Bridge

- `@ricky0123/vad-web` - Voice Activity Detection
- `./audio-utils.js` - Audio format conversion
- `./vad-config.js` - VAD configuration
- `./openwakeword-manager.js` - Wake word detection
- `./debug.js` - Debug logging
- `./wake-word-console.js` - Wake word error logging

### Node.js Clients

- `ws` - WebSocket library
- `./config.js` - Configuration
- `./types.js` - TypeScript types

---

## API Surface Summary

### CartesiaAudioBridge (Browser)

**Initialization:**
- `constructor(options)`
- `init()` - Initialize AudioContext and processors
- `initWakeWord()` - Initialize wake word detection
- `ensureWakeWordListening()` - Request mic permission and start wake word

**STT Control:**
- `startSTT(options)` - Start STT pipeline
- `stopSTT()` - Stop STT and send transcript
- `isSTTActive()` - Check if STT is running
- `connectSTTWebSocket()` - Connect STT WebSocket

**TTS Control:**
- `connectTTS()` - Connect TTS WebSocket
- `speakText(transcript, contextId, isContinue)` - Send text to TTS
- `streamTextChunks(chunks, contextId)` - Stream multiple chunks
- `cancelTTS(contextId)` - Cancel TTS generation
- `clearTTSBuffer()` - Clear TTS audio buffer
- `disconnectTTS()` - Disconnect TTS WebSocket

**Wake Word:**
- `isWakeWordEnabled()` - Check if wake word is enabled
- `isWakeWordWaiting()` - Check if waiting for wake word
- `getWakeWordMetrics()` - Get performance metrics
- `resetWakeWordMetrics()` - Reset metrics
- `setWakeWordCooldown(cooldownMs)` - Set cooldown period

**Audio:**
- `setInputGain(value)` - Set mic input gain (0.5-3)
- `getInputGain()` - Get current input gain
- `startLevelMeter(callback)` - Start mic level reporting
- `stopLevelMeter()` - Stop level reporting
- `getRecordedAudioBase64()` - Get recorded audio as base64
- `clearRecordedAudio()` - Clear recorded audio

**Timers:**
- `startAgentSilenceTimer()` - Start 10s silence timer (closing message)

**Cleanup:**
- `destroy()` - Clean up all resources
- `closeAllWebSocketsForBfcache()` - Close WebSockets for bfcache

**Static:**
- `checkRecordingSupport()` - Check browser support
- `getMicrophoneErrorMessage(err)` - Get user-friendly error message

### CartesiaSTTClient (Node.js)

**Connection:**
- `connect()` - Connect to STT WebSocket
- `disconnect()` - Disconnect from WebSocket
- `connected` - Get connection status
- `readyState` - Get WebSocket readyState
- `isReady()` - Check if ready for operations

**Audio Streaming:**
- `sendAudio(audioBuffer)` - Send audio data
- `sendAudioChunk(audioBuffer)` - Send audio chunk (alias)
- `finalize()` - Finalize current request
- `done()` - Close session

**Callbacks:**
- `onTranscript(callback)` - Set transcript callback
- `onDone(callback)` - Set done callback
- `onError(callback)` - Set error callback

**Metrics:**
- `getAveragePartialLatency()` - Get average partial latency
- `getAverageFinalLatency()` - Get average final latency

### CartesiaTTSClient (Node.js)

**Connection:**
- `connect()` - Connect to TTS WebSocket
- `disconnect()` - Disconnect from WebSocket
- `connected` - Get connection status
- `readyState` - Get WebSocket readyState
- `isReady()` - Check if ready for operations

**Text Streaming:**
- `sendText(transcript, contextId, isContinue)` - Send text for TTS
- `streamTextChunks(chunks, contextId)` - Stream multiple chunks
- `cancelContext(contextId)` - Cancel context

**Callbacks:**
- `onAudio(callback)` - Set audio callback
- `onDone(callback)` - Set done callback
- `onError(callback)` - Set error callback

**Metrics:**
- `getFirstByteLatency(contextId)` - Get first byte latency

### BidirectionalConversation (Node.js)

**Initialization:**
- `constructor(processTranscript?)` - Create conversation manager
- `initialize()` - Connect STT and TTS WebSockets

**Control:**
- `sendAudio(audioBuffer)` - Send audio to STT
- `finalizeSTT()` - Finalize STT request
- `cancelTTS()` - Cancel TTS generation
- `disconnect()` - Disconnect both clients

**Callbacks:**
- `onUserSpeech(callback)` - Set user speech callback
- `onAssistantAudio(callback)` - Set assistant audio callback
- `onError(callback)` - Set error callback

**Data:**
- `getMetrics()` - Get performance metrics
- `getHistory()` - Get conversation history

---

## File Relationships

```
cartesia-audio-bridge.js (browser)
  ├── Uses: audio-utils.js, vad-config.js, openwakeword-manager.js
  ├── Connects to: STT/TTS WebSockets
  └── Used by: app.js (main UI)

stt-client.ts (Node.js)
  ├── Uses: config.ts, types.ts
  └── Used by: bidirectional-conversation.ts

tts-client.ts (Node.js)
  ├── Uses: config.ts, types.ts
  └── Used by: bidirectional-conversation.ts

bidirectional-conversation.ts (Node.js)
  ├── Uses: stt-client.ts, tts-client.ts, types.ts
  └── Orchestrates: STT → Processing → TTS flow

config.ts
  └── Used by: All Cartesia clients
```

---

## Documentation References

- **cArTeSiA dOcS.md:** Comprehensive WebSocket guide, optimal latency strategies
- **cArTeSiA wEbSoCkEt.md:** Research note for Cartesia WebSocket issues
- **VERIFICATION-CARTESIA-INTEGRATION-2026-02-05.md:** Integration verification results

---

## Summary

**Total Files:** 10  
**Total Lines of Code:** ~3,500+  
**Primary Languages:** JavaScript (browser), TypeScript (Node.js)  
**Key Integration Points:** AudioWorklet pipeline, WebSocket connections, VAD, wake word  
**Architecture:** Browser bridge (unified interface) + Node.js clients (modular)  
**Performance Focus:** Low latency, pre-connection, streaming, continuations

---

**End of Parse**
