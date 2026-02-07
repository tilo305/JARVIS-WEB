# WebSocket Files Parse - Comprehensive Analysis

**Generated:** 2025-02-05  
**Purpose:** Complete parse and analysis of all WebSocket-related files in the JARVIS-WEB project.

---

## File Inventory

### Core Implementation Files

#### 1. **`public/js/openwakeword-client.js`** (258 lines)
**Type:** Browser-side WebSocket client  
**Purpose:** OpenWakeWord WebSocket client for connecting to Python server

**Key Features:**
- Connects to Python openWakeWord server via WebSocket
- Sends 16 kHz 16-bit PCM audio chunks (80 ms = 1280 samples)
- Receives wake word activations as JSON
- Handles reconnection (max 10 attempts, 2s delay)
- Protocol: First message = sample rate (TEXT), then binary PCM chunks
- Server responses: `{"loaded_models": [...]}` on connect, `{"activations": ["hey jarvis"]}` on detection

**WebSocket Endpoint:** `ws://localhost:8765/ws` (configurable via `wsUrl`)

**Key Methods:**
- `connect()` - Establish WebSocket connection
- `sendSampleRate()` - Send sample rate (16000 Hz) as first message
- `sendAudio(chunk)` - Send binary PCM audio data
- `close()` - Close connection gracefully
- `isConnected()` - Check connection status

**Error Handling:**
- Reconnects automatically on failure (max 10 attempts)
- Detailed error messages for code 1006 (abnormal closure)
- Suppresses duplicate error logs during reconnection attempts

---

#### 2. **`src/stt-client.ts`** (413 lines)
**Type:** Node.js/TypeScript STT WebSocket client  
**Purpose:** Cartesia Speech-to-Text WebSocket client

**Key Features:**
- Connects to Cartesia STT WebSocket API
- Sends binary PCM audio data (16 kHz, pcm_s16le)
- Receives transcript responses (partial and final)
- Configuration via URL query parameters (not first message)
- Handles request IDs for tracking latency
- Automatic reconnection with exponential backoff

**WebSocket Endpoint:** `wss://api.cartesia.ai/stt/websocket`

**Configuration (URL params):**
- `api_key` - Cartesia API key
- `cartesia_version` - API version (2025-04-16)
- `model` - STT model (ink-whisper)
- `encoding` - Audio encoding (pcm_s16le)
- `sample_rate` - Sample rate (16000)
- `language` - Language code (en)
- `min_volume` - Minimum volume threshold
- `max_silence_duration_secs` - Max silence duration

**Key Methods:**
- `connect()` - Establish WebSocket connection
- `sendAudio(audioBuffer)` - Send binary audio data
- `sendAudioChunk(audioBuffer)` - Send 100ms audio chunk
- `finalize()` - Send "finalize" command to flush audio
- `done()` - Send "done" command to close session
- `onTranscript(callback)` - Set transcript callback
- `disconnect()` - Close connection

**Message Types:**
- `transcript` - Partial or final transcript
- `flush_done` - Flush acknowledgment
- `done` - Session complete
- `error` - Error response

**Performance Tracking:**
- Tracks partial and final transcript latency
- Request ID tracking for correlation

---

#### 3. **`src/tts-client.ts`** (405 lines)
**Type:** Node.js/TypeScript TTS WebSocket client  
**Purpose:** Cartesia Text-to-Speech WebSocket client

**Key Features:**
- Connects to Cartesia TTS WebSocket API
- Sends text for speech generation
- Receives base64-encoded PCM audio chunks
- Supports continuations (context_id, continue flag)
- Context management for multi-turn conversations
- Automatic reconnection with exponential backoff

**WebSocket Endpoint:** `wss://api.cartesia.ai/tts/websocket`

**Configuration (URL params):**
- `api_key` - Cartesia API key
- `cartesia_version` - API version (2025-04-16)

**Request Format (JSON):**
```json
{
  "model_id": "sonic-turbo",
  "transcript": "Hello world",
  "voice": { "mode": "id", "id": "..." },
  "language": "en",
  "context_id": "unique-context-id",
  "output_format": {
    "container": "raw",
    "encoding": "pcm_s16le",
    "sample_rate": 44100
  },
  "add_timestamps": true,
  "max_buffer_delay_ms": 0,
  "continue": false
}
```

**Key Methods:**
- `connect()` - Establish WebSocket connection
- `sendText(transcript, contextId, isContinue)` - Send text for TTS
- `streamTextChunks(chunks, contextId)` - Stream multiple chunks
- `cancelContext(contextId)` - Cancel pending generation
- `onAudio(callback)` - Set audio chunk callback
- `disconnect()` - Close connection

**Message Types:**
- `chunk` - Audio chunk (base64 PCM)
- `flush_done` - Flush acknowledgment
- `done` - Context complete
- `timestamps` - Word timestamps (optional)
- `error` - Error response

**Context Management:**
- Contexts expire 1 second after last audio output
- All fields except `transcript`, `continue`, and `duration` must remain identical across requests on same context_id

**Performance Tracking:**
- Tracks first byte latency per context

---

#### 4. **`scripts/openwakeword-server.py`** (289 lines)
**Type:** Python WebSocket server  
**Purpose:** OpenWakeWord WebSocket server for wake word detection

**Key Features:**
- aiohttp WebSocket server
- Receives 16 kHz 16-bit PCM audio from browser
- Runs openWakeWord "hey jarvis" model
- Sends activations back to client
- Handles sample rate negotiation
- Optional resampling (requires resampy)
- Model state flushing after detection (prevents false positives)

**WebSocket Endpoint:** `/ws` on port 8765 (default)

**Protocol:**
1. Client sends sample rate as TEXT message (e.g., "16000")
2. Client sends binary PCM chunks (16-bit, little-endian)
3. Server sends `{"loaded_models": [...]}` on connect
4. Server sends `{"activations": ["hey jarvis"]}` on detection

**Configuration:**
- `--port` - Server port (default: 8765)
- `--chunk-size` - Audio chunk size in samples (default: 1280 = 80ms @ 16kHz)
- `--inference-framework` - Backend (onnx or tflite, default: onnx)
- `--threshold` - Activation threshold 0..1 (default: 0.5)
- `--verbose` - Log every prediction
- `--enable-speex` - Enable Speex noise suppression

**Audio Processing:**
- Receives binary PCM (16-bit, little-endian)
- Converts to float32 normalized (-1.0 to 1.0)
- Optional resampling if client sample rate ≠ 16 kHz
- Buffers audio into 1280-sample frames (80ms @ 16kHz)
- Runs openWakeWord prediction on each frame
- Flushes model state after detection (prevents false positives)

**Error Handling:**
- Handles invalid sample rates
- Buffer overflow protection (max 10 frames)
- Graceful error handling and logging

---

#### 5. **`public/js/cartesia-audio-bridge.js`** (2,207 lines)
**Type:** Browser-side audio bridge  
**Purpose:** Main bridge managing all WebSocket connections (STT, TTS, OpenWakeWord)

**Key Features:**
- Manages STT WebSocket connection
- Manages TTS WebSocket connection
- Integrates OpenWakeWord via OpenWakeWordManager
- Pre-connects WebSockets for optimal latency
- Handles reconnection and error recovery
- AudioWorklet pipeline integration

**STT WebSocket:**
- Endpoint: `wss://api.cartesia.ai/stt/websocket`
- Pre-connects when wake word is initialized
- Sends 16 kHz PCM chunks (100ms intervals)
- Receives partial and final transcripts
- Automatic reconnection on failure

**TTS WebSocket:**
- Endpoint: `wss://api.cartesia.ai/tts/websocket`
- Pre-connects when wake word is initialized
- Sends JSON requests with text
- Receives base64-encoded PCM audio chunks
- Context management for continuations

**OpenWakeWord:**
- Uses `OpenWakeWordManager` (which uses `OpenWakeWordClient`)
- WebSocket handled by `openwakeword-client.js`

**Key Methods:**
- `connectSTTWebSocket()` - Connect to STT WebSocket
- `connectTTSWebSocket()` - Connect to TTS WebSocket
- `_sendChunkToSTT(chunk)` - Send audio chunk to STT
- `speakText(text, contextId)` - Send text to TTS
- `closeAllWebSocketsForBfcache()` - Close all WebSockets for bfcache compatibility

**Optimizations:**
- Pre-connects STT and TTS WebSockets when wake word is initialized
- Reduces latency by establishing connections before they're needed
- Handles connection state checking before sending data

---

### Debug and Testing Files

#### 6. **`debug/tools/debug-openwakeword-websocket-live.js`** (501 lines)
**Type:** Node.js CLI debugging tool  
**Purpose:** Comprehensive WebSocket connection testing tool

**Features:**
- Configuration validation (.env file check)
- Server script verification
- Python dependencies check
- LIVE WebSocket connection test
- Error pattern analysis
- Browser-specific issues check
- Detailed fix instructions

**Usage:**
```bash
npm run debug:openwakeword:websocket
# or
node debug/tools/debug-openwakeword-websocket-live.js
```

**Test Flow:**
1. Checks .env configuration
2. Verifies server script exists
3. Checks Python dependencies
4. Tests WebSocket connection (5s timeout)
5. Analyzes error patterns
6. Provides fix suggestions

**Error Detection:**
- ECONNREFUSED - Server not running
- ENOTFOUND - Host not found
- EADDRINUSE - Port in use
- Timeout - Server not responding
- Close code 1006 - Abnormal closure

---

#### 7. **`public/debug/openwakeword-websocket-debug.html`** (538 lines)
**Type:** Browser-based HTML debugging tool  
**Purpose:** Interactive WebSocket connection testing from browser

**Features:**
- Real-time configuration display
- Interactive WebSocket connection test
- Live connection metrics
- Error analysis with close code interpretation
- Automatic reconnect testing (up to 10 attempts)
- Message sending/receiving verification
- Suggested fixes based on error patterns

**Usage:**
1. Start dev server: `npm run vite`
2. Open: `http://localhost:3000/debug/openwakeword-websocket-debug.html`
3. Click "Test WebSocket Connection"

**Metrics Displayed:**
- Connection State (OPEN, CONNECTING, CLOSED, DISCONNECTED)
- Reconnect Attempts
- Messages Sent
- Messages Received

**Error Analysis:**
- Close code interpretation (1006, 1001, 1002, etc.)
- Error pattern matching
- Suggested fixes based on error type

---

#### 8. **`debug/tests/integration/cartesia-websocket-live.test.ts`** (129 lines)
**Type:** Jest integration test  
**Purpose:** Live integration tests for Cartesia WebSocket connectivity

**Features:**
- Tests TTS WebSocket connection
- Tests STT WebSocket connection
- Skips if CARTESIA_API_KEY is missing
- Real endpoint testing (not mocked)

**Test Cases:**
1. TTS WebSocket connection and response
2. STT WebSocket connection and configuration

**Usage:**
```bash
npm test -- debug/tests/integration/cartesia-websocket-live.test.ts
```

**Requirements:**
- `CARTESIA_API_KEY` environment variable
- Valid API key (length >= 10)

---

### Documentation Files

#### 9. **`debug/COMPREHENSIVE-WEBSOCKET-DEBUG-RESEARCH-COMPLETE.md`** (344 lines)
**Type:** Documentation  
**Purpose:** Comprehensive WebSocket debugging research and tools documentation

**Contents:**
- Executive summary of WebSocket debugging tools
- Research scope
- Tools created (Node.js CLI, browser HTML, error monitor)
- Error analysis (code 1006, root causes)
- Fixes applied
- Quick fix guide
- Error code reference
- Integration with existing tools
- Testing verification

---

#### 10. **`debug/OPENWAKEWORD-WEBSOCKET-DEBUG-COMPLETE.md`** (252 lines)
**Type:** Documentation  
**Purpose:** OpenWakeWord WebSocket debugging documentation

**Contents:**
- Overview of WebSocket connection issues
- Tools created (Node.js CLI, browser HTML)
- Error analysis
- Fixes applied
- Quick fix guide
- Verification checklist
- Error code reference
- Integration notes

---

#### 11. **`wEbSoCkEt DoCs.md`** (1 line)
**Type:** Reference note  
**Purpose:** Reference to MDN WebSocket documentation

**Content:**
- Link to MDN WebSocket API documentation for issues/fixes

---

#### 12. **`cArTeSiA wEbSoCkEt.md`** (1 line)
**Type:** Reference note  
**Purpose:** Reference to Cartesia WebSocket documentation

**Content:**
- Link to Cartesia TTS WebSocket API documentation for issues/fixes

---

## WebSocket Architecture Overview

### Connection Flow

```
Browser (JavaScript)
├── OpenWakeWord Client
│   └── WebSocket → ws://localhost:8765/ws (Python server)
│
├── Cartesia STT Client
│   └── WebSocket → wss://api.cartesia.ai/stt/websocket
│
└── Cartesia TTS Client
    └── WebSocket → wss://api.cartesia.ai/tts/websocket
```

### Data Flow

**Wake Word Detection:**
1. Browser captures audio → AudioWorklet processor
2. AudioWorklet → OpenWakeWordClient → WebSocket → Python server
3. Python server → openWakeWord model → activation detection
4. Python server → WebSocket → OpenWakeWordClient → callback

**Speech-to-Text:**
1. Browser captures audio → AudioWorklet processor
2. AudioWorklet → CartesiaAudioBridge → STT WebSocket
3. Cartesia STT API → transcript response → callback

**Text-to-Speech:**
1. Browser → CartesiaAudioBridge → TTS WebSocket → Cartesia TTS API
2. Cartesia TTS API → base64 PCM audio → callback
3. Audio → AudioWorklet processor → playback

---

## WebSocket Protocols

### OpenWakeWord Protocol

**Client → Server:**
1. TEXT: Sample rate (e.g., "16000")
2. BINARY: 16-bit PCM audio chunks (1280 samples = 80ms @ 16kHz)

**Server → Client:**
1. JSON: `{"loaded_models": ["hey jarvis"]}` (on connect)
2. JSON: `{"activations": ["hey jarvis"]}` (on detection)

### Cartesia STT Protocol

**Client → Server:**
- URL params: `api_key`, `cartesia_version`, `model`, `encoding`, `sample_rate`, `language`, `min_volume`, `max_silence_duration_secs`
- BINARY: PCM audio chunks (16 kHz, pcm_s16le)
- TEXT: "finalize" (flush audio)
- TEXT: "done" (close session)

**Server → Client:**
- JSON: `{"type": "transcript", "text": "...", "is_final": false, "request_id": "..."}`
- JSON: `{"type": "flush_done", "request_id": "..."}`
- JSON: `{"type": "done", "request_id": "..."}`
- JSON: `{"type": "error", "error": "...", "request_id": "..."}`

### Cartesia TTS Protocol

**Client → Server:**
- URL params: `api_key`, `cartesia_version`
- JSON: `{"model_id": "...", "transcript": "...", "voice": {...}, "context_id": "...", "output_format": {...}, "continue": false}`
- JSON: `{"context_id": "...", "cancel": true}` (cancel)

**Server → Client:**
- JSON: `{"type": "chunk", "data": "base64...", "context_id": "..."}`
- JSON: `{"type": "flush_done", "context_id": "..."}`
- JSON: `{"type": "done", "context_id": "..."}`
- JSON: `{"type": "timestamps", ...}` (optional)
- JSON: `{"type": "error", "error": "...", "context_id": "..."}`

---

## Error Handling

### Common Error Codes

| Code | Name | Meaning | Fix |
|------|------|---------|-----|
| 1000 | Normal Closure | Connection closed normally | No action needed |
| 1001 | Going Away | Server is shutting down | Restart server |
| 1002 | Protocol Error | Protocol violation | Check implementation |
| 1003 | Unsupported Data | Unsupported data type | Check message format |
| **1006** | **Abnormal Closure** | **Connection closed abnormally** | **Server not running - Start server** |
| 1007 | Invalid Data | Invalid data received | Check data format |
| 1008 | Policy Violation | Policy violation | Check server configuration |
| 1009 | Message Too Big | Message too large | Reduce message size |
| 1010 | Extension Required | Extension negotiation failed | Check WebSocket extensions |
| 1011 | Internal Error | Server error | Check server logs |

### Reconnection Strategy

**OpenWakeWord Client:**
- Max attempts: 10
- Delay: 2 seconds (fixed)
- Exponential backoff: No

**Cartesia STT/TTS Clients:**
- Max attempts: Configurable (default: 5)
- Delay: Exponential backoff (base delay * attempt number)
- Exponential backoff: Yes

---

## Configuration

### Environment Variables

**OpenWakeWord:**
- `VITE_USE_OPENWAKEWORD` - Enable/disable wake word (true/false)
- `VITE_OPENWAKEWORD_WS_URL` - WebSocket URL (default: `ws://localhost:8765/ws`)

**Cartesia:**
- `CARTESIA_API_KEY` - API key for STT/TTS
- `CARTESIA_VOICE_ID` - Voice ID for TTS (default: `95131c95-525c-463b-893d-803bafdf93c4`)

### Server Configuration

**OpenWakeWord Server:**
- Port: 8765 (default, configurable via `--port`)
- Chunk size: 1280 samples (80ms @ 16kHz, configurable via `--chunk-size`)
- Threshold: 0.5 (configurable via `--threshold`)
- Framework: onnx (default, configurable via `--inference-framework`)

---

## Performance Optimizations

### Pre-connection
- STT WebSocket pre-connected when wake word is initialized
- TTS WebSocket pre-connected when wake word is initialized
- Reduces latency by establishing connections before they're needed

### Audio Chunking
- OpenWakeWord: 1280 samples (80ms @ 16kHz) - optimal for wake word detection
- STT: 100ms chunks - optimal for streaming transcription
- TTS: Streaming chunks with continuations - optimal for low latency

### Buffer Management
- OpenWakeWord server: Max buffer size (10 frames) to prevent memory issues
- Model state flushing after detection to prevent false positives

---

## Testing and Debugging

### Tools Available

1. **Node.js CLI Tool** (`debug/tools/debug-openwakeword-websocket-live.js`)
   - Comprehensive connection testing
   - Configuration validation
   - Error pattern analysis

2. **Browser HTML Tool** (`public/debug/openwakeword-websocket-debug.html`)
   - Interactive connection testing
   - Real-time metrics
   - Error analysis

3. **Integration Tests** (`debug/tests/integration/cartesia-websocket-live.test.ts`)
   - Live endpoint testing
   - TTS/STT connectivity verification

### Common Issues and Fixes

**Issue: WebSocket connection failed (code 1006)**
- **Cause:** Server not running
- **Fix:** Start OpenWakeWord server: `python scripts/openwakeword-server.py`

**Issue: Connection timeout**
- **Cause:** Server not responding or firewall blocking
- **Fix:** Check server is running, verify firewall settings

**Issue: Invalid WebSocket URL**
- **Cause:** Incorrect URL in .env file
- **Fix:** Verify `VITE_OPENWAKEWORD_WS_URL` in .env file

**Issue: Port already in use**
- **Cause:** Another service using port 8765
- **Fix:** Use different port: `python scripts/openwakeword-server.py --port 8766`

---

## File Summary

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `public/js/openwakeword-client.js` | JS | 258 | OpenWakeWord WebSocket client |
| `src/stt-client.ts` | TS | 413 | Cartesia STT WebSocket client |
| `src/tts-client.ts` | TS | 405 | Cartesia TTS WebSocket client |
| `scripts/openwakeword-server.py` | Python | 289 | OpenWakeWord WebSocket server |
| `public/js/cartesia-audio-bridge.js` | JS | 2,207 | Main audio bridge (includes WebSocket management) |
| `debug/tools/debug-openwakeword-websocket-live.js` | JS | 501 | CLI debugging tool |
| `public/debug/openwakeword-websocket-debug.html` | HTML | 538 | Browser debugging tool |
| `debug/tests/integration/cartesia-websocket-live.test.ts` | TS | 129 | Integration tests |
| `debug/COMPREHENSIVE-WEBSOCKET-DEBUG-RESEARCH-COMPLETE.md` | MD | 344 | Documentation |
| `debug/OPENWAKEWORD-WEBSOCKET-DEBUG-COMPLETE.md` | MD | 252 | Documentation |
| `wEbSoCkEt DoCs.md` | MD | 1 | Reference note |
| `cArTeSiA wEbSoCkEt.md` | MD | 1 | Reference note |

**Total:** 12 files, ~5,338 lines of code/documentation

---

## References

- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- Cartesia TTS WebSocket: https://docs.cartesia.ai/api-reference/tts/websocket
- Cartesia STT WebSocket: https://docs.cartesia.ai/api-reference/stt/websocket
- OpenWakeWord: https://github.com/dscripka/openWakeWord

---

*This comprehensive parse covers all WebSocket-related files in the JARVIS-WEB project, including implementation files, debugging tools, tests, and documentation.*
