do comprehensive research on docs.cartesia.ai for any issues. then do comprehensive research in this doc. do not do the research, just add the words i wrote

**API Reference:** https://docs.cartesia.ai/api-reference/tts/websocket

# Comprehensive Cartesia WebSocket Implementation Guide
## Optimal Latency & Bidirectional Conversational Flow for STT & TTS

**API Credentials:**
- `CARTESIA_API_KEY=sk_car_GYAnGSmHkAFGYbr52wL9HG`
- `CARTESIA_VOICE_ID=95131c95-525c-463b-893d-803bafdf93c4`

---

## 1. TTS (Text-to-Speech) WebSocket Implementation

### Connection Setup
- **Endpoint:** `wss://api.cartesia.ai/tts/websocket`
- **Authentication:** Pass API key as query parameter: `?api_key=sk_car_GYAnGSmHkAFGYbr52wL9HG`
- **API Version:** Use `?cartesia_version=2025-04-16` (latest version for optimal performance)
- **Note:** For browser WebSockets, use query parameters instead of headers (WebSockets don't support headers)

### Optimal Low-Latency Configuration
```json
{
  "model_id": "sonic-3",
  "transcript": "Your text here",
  "voice": {
    "mode": "id",
    "id": "95131c95-525c-463b-893d-803bafdf93c4"
  },
  "language": "en",
  "context_id": "unique-context-id",
  "output_format": {
    "container": "raw",
    "encoding": "pcm_s16le",
    "sample_rate": 8000
  },
  "add_timestamps": true,
  "continue": false,
  "max_buffer_delay_ms": 3000
}
```

### Key Performance Parameters:
- **Model:** `sonic-3` - First byte latency: 90ms (fastest, most emotive)
- **Alternative:** `sonic-turbo` - First byte latency: 40ms (if real-time performance is top priority)
- **Encoding:** `pcm_s16le` - Recommended for best performance
- **Sample Rate:** `8000` Hz - Optimal for low latency
- **Container:** `raw` - No container overhead

### Bidirectional Flow with Input Streaming (Continuations)

**How Continuations Work:**
- Use `context_id` to maintain prosody between multiple inputs
- Set `continue: true` for intermediate transcript chunks
- Set `continue: false` for the final chunk
- This prevents sudden changes in prosody and creates seamless audio

**Example Streaming Pattern:**
```json
// First chunk
{"transcript": "Hello, Sonic!", "continue": true, "context_id": "conversation-123", ...}

// Intermediate chunk
{"transcript": " I'm streaming ", "continue": true, "context_id": "conversation-123", ...}

// Final chunk
{"transcript": "inputs.", "continue": false, "context_id": "conversation-123", ...}
```

**Critical Rules:**
1. All fields except `transcript`, `continue`, and `duration` must remain identical across requests on the same `context_id`
2. Transcripts are concatenated verbatim - include proper spacing and punctuation
3. Contexts automatically expire 1 second after the last audio output
4. Outputs are always in order of inputs you streamed

### Automatic Buffering (`max_buffer_delay_ms`)
- **Default:** 3000ms
- **Range:** 0-5000ms
- **Purpose:** Buffers incoming text chunks until optimal transcript length or delay elapses
- **Use Cases:**
  - Set to `0` if you have custom client-side buffering
  - Increase if experiencing choppiness even at 3000ms
- **Note:** When streaming word-by-word from STT, this prevents choppy audio

### Response Types
- `type: "chunk"` - Audio data (base64 encoded PCM), `status_code: 206`
- `type: "flush_done"` - Acknowledgment that flush command was received
- `type: "done"` - Generation completion signal (`done: true`)
- `type: "timestamps"` - Word-level timing data (if `add_timestamps: true`)

### Cancelling Requests
```json
{"context_id": "conversation-123", "cancel": true}
```
- Only halts requests that haven't begun generating
- Currently generating requests continue until completion

---

## 2. STT (Speech-to-Text) WebSocket Implementation

### Connection Setup
- **Endpoint:** `wss://api.cartesia.ai/stt/websocket`
- **Authentication:** Pass API key as query parameter: `?api_key=sk_car_GYAnGSmHkAFGYbr52wL9HG`
- **API Version:** Use `?cartesia_version=2025-04-16`

### Initial Configuration Message
```json
{
  "model": "ink-whisper",
  "language": "en",
  "encoding": "pcm_s16le",
  "sample_rate": "16000",
  "min_volume": "0.0",
  "max_silence_duration_secs": "2.0"
}
```

### Optimal Low-Latency Configuration
- **Model:** `ink-whisper` - Optimized for conversational AI, handles telephony artifacts, background noise, accents
- **Encoding:** `pcm_s16le` - Recommended for best performance
- **Sample Rate:** `16000` Hz - Recommended for best performance
- **min_volume:** `0.0-1.0` - Volume threshold for voice activity detection (higher = more aggressive filtering)
- **max_silence_duration_secs:** Maximum silence before endpointing (higher = longer pauses allowed)

### Audio Streaming Best Practices
1. **Send audio in small chunks** (e.g., 100ms intervals) for optimal latency
2. **Send binary WebSocket messages** containing raw audio data matching the encoding/sample_rate
3. **Send text commands:**
   - `"finalize"` - Flush remaining audio, receive `flush_done` acknowledgment
   - `"done"` - Flush remaining audio, close session, receive `done` acknowledgment

### Response Types
- `type: "transcript"` - Transcription results with:
  - `is_final: false/true` - Indicates if transcription is final
  - `text` - Transcribed text
  - `words` - Array with word-level timestamps (`start`, `end`)
  - `duration` - Audio duration
  - `language` - Detected language
- `type: "flush_done"` - Acknowledgment that finalize command was received
- `type: "done"` - Session closing acknowledgment
- `type: "error"` - Error information

### Timeout Behavior
- WebSocket automatically disconnects if no audio data is sent for 3 minutes
- Timeout resets with each message (audio data or text command)

---

## 3. Bidirectional Conversational Flow Architecture

### Complete Flow Pattern

**STT → Processing → TTS Pipeline:**

1. **STT WebSocket:** Stream audio chunks → Receive transcript chunks
2. **Process Transcripts:** 
   - Use `is_final: false` for intermediate results (can start TTS early)
   - Use `is_final: true` for final results
   - Stream to LLM if needed
3. **TTS WebSocket:** Stream text chunks using continuations → Receive audio chunks

### Optimal Latency Strategy

**For Minimal End-to-End Latency:**

1. **STT Side:**
   - Send audio in 100ms chunks
   - Process `is_final: false` transcripts immediately (don't wait for final)
   - Use appropriate `max_silence_duration_secs` to balance responsiveness vs. accuracy

2. **TTS Side:**
   - Use `sonic-turbo` model for 40ms first-byte latency (if available)
   - Stream inputs as soon as you receive them from STT/LLM
   - Use `continue: true` for all intermediate chunks
   - Set `max_buffer_delay_ms: 0` if you're already buffering client-side
   - Use `pcm_s16le` encoding at 8000 Hz for minimal overhead

3. **Context Management:**
   - Use unique `context_id` per conversation turn
   - Monitor context expiration (1 second after audio output)
   - Reuse contexts within the same conversation for prosody continuity

### Error Handling
- Monitor `status_code` in responses (206 for partial, 200 for complete)
- Handle `type: "error"` responses appropriately
- Implement reconnection logic for WebSocket timeouts
- Cancel contexts if user interrupts conversation

### Performance Metrics to Monitor
- **TTS First Byte Latency:** Target < 100ms (sonic-3) or < 50ms (sonic-turbo)
- **STT Partial Result Latency:** Time from audio chunk to `is_final: false` transcript
- **STT Final Result Latency:** Time from audio end to `is_final: true` transcript
- **End-to-End Latency:** User speaks → Audio response starts

---

## 4. Implementation Checklist

- [ ] Set up TTS WebSocket with proper authentication and version
- [ ] Set up STT WebSocket with optimal encoding/sample rate
- [ ] Implement context management for TTS continuations
- [ ] Handle both `is_final: false` and `is_final: true` STT responses
- [ ] Stream TTS inputs as soon as STT transcripts arrive
- [ ] Configure `max_buffer_delay_ms` appropriately
- [ ] Implement proper error handling and reconnection
- [ ] Monitor latency metrics
- [ ] Test bidirectional flow with interruptions
- [ ] Optimize audio chunk sizes (100ms for STT, appropriate for TTS)

---

## 5. Reference Links

- TTS WebSocket API: https://docs.cartesia.ai/api-reference/tts/websocket
- STT WebSocket API: https://docs.cartesia.ai/api-reference/stt/stt
- Contexts Guide: https://docs.cartesia.ai/api-reference/tts/working-with-web-sockets/contexts
- Continuations Guide: https://docs.cartesia.ai/build-with-cartesia/capability-guides/stream-inputs-using-continuations
- API Conventions: https://docs.cartesia.ai/use-the-api/api-conventions
