# Quick Start Guide - Cartesia Implementation

## What Was Implemented

This implementation includes everything from `cArTeSiA dOcS.md`:

### ✅ Core Components

1. **TTS Client** (`src/tts-client.ts`)
   - WebSocket connection with authentication
   - Optimal latency configuration (sonic-3/sonic-turbo)
   - Input streaming with continuations
   - Context management
   - Automatic buffering control
   - Performance tracking

2. **STT Client** (`src/stt-client.ts`)
   - WebSocket connection with authentication
   - Real-time audio streaming (100ms chunks)
   - Partial and final transcript handling
   - Voice activity detection
   - Performance tracking

3. **Bidirectional Conversation Manager** (`src/bidirectional-conversation.ts`)
   - Orchestrates STT → Processing → TTS flow
   - Handles partial transcripts for ultra-low latency
   - Context management across conversation turns
   - Performance metrics collection
   - Error handling and recovery

### ✅ Features Implemented

- ✅ Optimal latency configuration (90ms TTS, real-time STT)
- ✅ Bidirectional streaming with continuations
- ✅ Context management for prosody continuity
- ✅ Automatic reconnection on failures
- ✅ Error handling and recovery
- ✅ Performance metrics tracking
- ✅ TypeScript types for all APIs
- ✅ Example implementations

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Basic Usage

### 1. Bidirectional Conversation (Recommended)

```typescript
import { BidirectionalConversation } from './dist/bidirectional-conversation.js';

// Create conversation with your transcript processor
const conversation = new BidirectionalConversation(async (userText) => {
  // Your LLM or processing logic here
  return `I heard: ${userText}`;
});

// Initialize connections
await conversation.initialize();

// Setup callbacks
conversation.onUserSpeech((text, isFinal) => {
  console.log(`User: ${text} (${isFinal ? 'final' : 'partial'})`);
});

conversation.onAssistantAudio((audioData) => {
  // Play audio or save to file
  playAudio(audioData);
});

// Send audio chunks (PCM s16le, 16000 Hz, 100ms chunks)
conversation.sendAudio(audioBuffer);
conversation.finalizeSTT(); // When user stops speaking
```

### 2. Standalone TTS

```typescript
import { CartesiaTTSClient } from './dist/tts-client.js';

const tts = new CartesiaTTSClient();
await tts.connect();

tts.onAudio((audioData, contextId) => {
  // Handle audio chunks
});

// Single message
tts.sendText('Hello!', 'context-1', false);

// Streaming with continuations
tts.streamTextChunks(['Hello, ', 'world!'], 'context-2');
```

### 3. Standalone STT

```typescript
import { CartesiaSTTClient } from './dist/stt-client.js';

const stt = new CartesiaSTTClient();
await stt.connect();

stt.onTranscript((text, isFinal, requestId) => {
  console.log(`${isFinal ? 'Final' : 'Partial'}: ${text}`);
});

// Send audio (PCM s16le, 16000 Hz, 100ms chunks)
stt.sendAudioChunk(audioBuffer);
stt.finalize(); // When done
```

## Configuration

All configuration is in `src/config.ts`:

```typescript
export const CARTESIA_CONFIG = {
  API_KEY: 'sk_car_GYAnGSmHkAFGYbr52wL9HG',
  VOICE_ID: '95131c95-525c-463b-893d-803bafdf93c4',
  // ... more settings
};
```

## Audio Format Requirements

### STT Input
- **Format**: PCM s16le (signed 16-bit little-endian)
- **Sample Rate**: 16000 Hz
- **Chunk Size**: 100ms (1600 samples = 3200 bytes per chunk)

### TTS Output
- **Format**: PCM s16le
- **Sample Rate**: 8000 Hz (configurable)
- **Encoding**: Base64 in WebSocket messages

## Running Examples

```bash
# Build first
npm run build

# Bidirectional conversation
npm run example

# Simple TTS
node dist/examples/simple-tts.js

# Simple STT
node dist/examples/simple-stt.js
```

## Key Implementation Details

### Continuations for Seamless Audio
- Use same `context_id` for related text chunks
- Set `continue: true` for intermediate chunks
- Set `continue: false` for final chunk
- Maintains prosody across streamed inputs

### Low Latency Strategy
1. **STT**: Process `is_final: false` transcripts immediately
2. **TTS**: Stream inputs as soon as received
3. **Buffering**: Use `max_buffer_delay_ms: 0` if client-side buffering
4. **Chunks**: Send 100ms audio chunks for optimal STT latency

### Error Handling
- Automatic reconnection (up to 5 attempts)
- Context cancellation on errors
- WebSocket timeout handling (3 minutes)
- Graceful degradation

## Performance Monitoring

```typescript
const metrics = conversation.getMetrics();
console.log(`TTS First Byte: ${metrics.ttsFirstByteLatency}ms`);
console.log(`STT Partial: ${metrics.sttPartialLatency}ms`);
console.log(`STT Final: ${metrics.sttFinalLatency}ms`);
console.log(`End-to-End: ${metrics.endToEndLatency}ms`);
```

## n8n LLM Integration

The project includes an n8n webhook for LLM responses. Configure `N8N_WEBHOOK_URL` in `src/config.ts` (default: `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4`).

- **Request**: POST JSON `{ "message": "<user text>" }`
- **Response**: Your n8n workflow should return JSON with a reply field: `output`, `reply`, `result`, `text`, or `message`

The chat UI (`public/js/app.js`) and the bidirectional-conversation example both use this webhook.

## Next Steps

1. Integrate microphone input (e.g., `node-record-lpcm16`)
2. Add audio playback (e.g., `speaker` package)
3. Configure your n8n workflow to handle the webhook and return LLM replies
4. Customize configuration in `src/config.ts`
5. Add your own error handling and logging

## Debugging Voice / Microphone

If the mic only responds with the "10 seconds of silence" message:

1. **Enable debug logging**: Open the app with `?debug=1` (e.g. `http://localhost:3000/?debug=1`) and check DevTools Console.
2. **Run voice pipeline checks**: Open `http://localhost:3000/debug/voice-pipeline-debug.html` and click "Run all checks".
3. **Verify n8n webhook**: `npm run debug:n8n`

See `docs/DEBUG-VOICE.md` for the full debug guide.

## Documentation

- Full API documentation: `cArTeSiA dOcS.md`
- Type definitions: `src/types.ts`
- Configuration: `src/config.ts`
