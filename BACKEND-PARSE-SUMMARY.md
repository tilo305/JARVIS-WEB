# Backend TypeScript Files Parse Summary

This document provides a comprehensive overview of all TypeScript backend files in the JARVIS-WEB project, organized by purpose and functionality.

**Generated:** 2025-02-05  
**Total Files:** 9  
**Total Size:** 49.07 KB  
**Total Lines:** 1,663

---

## Table of Contents

1. [Core Backend Files](#core-backend-files)
2. [Type Definitions](#type-definitions)
3. [Example Files](#example-files)
4. [Summary Statistics](#summary-statistics)

---

## Core Backend Files

### `src/index.ts`
**Purpose:** Main entry point for Node.js backend module  
**Size:** 0.32 KB (10 lines)  
**Exports:** 1 namespace export

- Re-exports all public APIs from the backend modules
- Exports: `CartesiaSTTClient`, `CartesiaTTSClient`, `BidirectionalConversation`, `CARTESIA_CONFIG`, and all types

### `src/config.ts`
**Purpose:** Cartesia API configuration and environment variables  
**Size:** 1.78 KB (46 lines)  
**Exports:** 2 constants  
**Constants:** `N8N_WEBHOOK_URL`, `CARTESIA_CONFIG`

**Key Configuration:**
- **API Version:** `2025-04-16`
- **TTS Endpoint:** `wss://api.cartesia.ai/tts/websocket`
  - Model: `sonic-3` (90ms first byte) or `sonic-turbo` (40ms first byte)
  - Sample Rate: 44100 Hz
  - Encoding: `pcm_s16le`
  - Max Buffer Delay: 0ms (optimal latency)
- **STT Endpoint:** `wss://api.cartesia.ai/stt/websocket`
  - Model: `ink-whisper`
  - Sample Rate: 16000 Hz
  - Encoding: `pcm_s16le`
  - Audio Chunk: 100ms
- **WebSocket Settings:**
  - Reconnect Delay: 1000ms
  - Max Reconnect Attempts: 5
  - Timeout: 180000ms (3 minutes)

### `src/stt-client.ts`
**Purpose:** Cartesia Speech-to-Text WebSocket client  
**Size:** 12.32 KB (413 lines)  
**Class:** `CartesiaSTTClient`  
**Dependencies:** `ws`, `./config.js`

**Key Features:**
- Real-time audio streaming (100ms chunks)
- Partial and final transcript handling
- Performance latency tracking (partial and final)
- Automatic reconnection logic
- Request ID management
- Error handling and recovery

**Public Methods:**
- `connect()` - Connect to STT WebSocket
- `sendAudio(audioData: ArrayBuffer)` - Send audio chunk
- `sendAudioChunk(chunk: ArrayBuffer)` - Send single audio chunk
- `finalize()` - Finalize current STT request
- `onTranscript(callback)` - Register transcript callback
- `onDone(callback)` - Register done callback
- `onError(callback)` - Register error callback
- `getAveragePartialLatency()` - Get average partial transcript latency
- `getAverageFinalLatency()` - Get average final transcript latency
- `disconnect()` - Disconnect from WebSocket
- `isReady()` - Check if client is ready

**Performance Tracking:**
- Tracks partial transcript latency
- Tracks final transcript latency
- Stores request start times

### `src/tts-client.ts`
**Purpose:** Cartesia Text-to-Speech WebSocket client  
**Size:** 11.87 KB (405 lines)  
**Class:** `CartesiaTTSClient`  
**Dependencies:** `ws`, `./config.js`

**Key Features:**
- Streaming TTS with continuations for prosody
- Context management (unique context_id per turn)
- First-byte latency tracking
- Context cancellation support
- Multi-sentence text splitting
- Error handling and recovery

**Public Methods:**
- `connect()` - Connect to TTS WebSocket
- `sendText(text: string, contextId?: string, continue?: boolean)` - Send text for TTS
- `streamTextChunks(texts: string[], contextId?: string)` - Stream multiple text chunks
- `cancelContext(contextId: string)` - Cancel ongoing TTS for a context
- `onAudio(callback)` - Register audio callback
- `onDone(callback)` - Register done callback
- `onError(callback)` - Register error callback
- `getFirstByteLatency(contextId: string)` - Get first byte latency for a context
- `disconnect()` - Disconnect from WebSocket
- `isReady()` - Check if client is ready

**Performance Tracking:**
- Tracks first-byte latency per context
- Stores context start times

### `src/bidirectional-conversation.ts`
**Purpose:** Orchestrates STT → Processing → TTS flow  
**Size:** 8.48 KB (287 lines)  
**Class:** `BidirectionalConversation`  
**Dependencies:** `./stt-client.js`, `./tts-client.js`

**Key Features:**
- Orchestrates complete bidirectional conversation flow
- Handles partial transcripts for low latency
- Sentence splitting for TTS continuations
- Performance metrics collection
- Error handling and recovery
- Conversation history management

**Public Methods:**
- `initialize()` - Initialize and connect both STT and TTS clients
- `sendAudio(audioData: ArrayBuffer)` - Send audio to STT
- `sendAudioChunk(chunk: ArrayBuffer)` - Send audio chunk to STT
- `finalizeSTT()` - Finalize current STT request
- `speakText(text: string)` - Send text to TTS
- `cancelTTS()` - Cancel ongoing TTS
- `onUserSpeech(callback)` - Register user speech callback
- `onAssistantAudio(callback)` - Register assistant audio callback
- `onError(callback)` - Register error callback
- `getMetrics()` - Get performance metrics
- `getHistory()` - Get conversation history
- `disconnect()` - Disconnect both clients

**Performance Metrics:**
- TTS first-byte latency
- STT partial latency
- STT final latency
- End-to-end latency

---

## Type Definitions

### `src/types.ts`
**Purpose:** TypeScript type definitions for Cartesia WebSocket APIs  
**Size:** 3.06 KB (143 lines)  
**Interfaces:** 13  
**Types:** 8  
**Exports:** 21

**TTS Types:**
- `TTSConfig` - TTS configuration interface
- `TTSRequest` - TTS request interface
- `TTSChunkResponse` - TTS audio chunk response
- `TTSFlushDoneResponse` - TTS flush done response
- `TTSDoneResponse` - TTS done response
- `TTSTimestampsResponse` - TTS word timestamps response
- `TTSErrorResponse` - TTS error response
- `TTSResponse` - Union type of all TTS responses
- `TTSAudioCallback` - Audio data callback type
- `TTSDoneCallback` - Done callback type
- `TTSErrorCallback` - Error callback type

**STT Types:**
- `STTConfig` - STT configuration interface
- `STTTranscriptResponse` - STT transcript response
- `STTFlushDoneResponse` - STT flush done response
- `STTDoneResponse` - STT done response
- `STTErrorResponse` - STT error response
- `STTResponse` - Union type of all STT responses
- `STTTranscriptCallback` - Transcript callback type
- `STTDoneCallback` - Done callback type
- `STTErrorCallback` - Error callback type

**Performance Types:**
- `PerformanceMetrics` - Performance metrics interface

---

## Example Files

### `src/examples/bidirectional-conversation.ts`
**Purpose:** Example implementation of bidirectional conversation  
**Size:** 7.29 KB (216 lines)  
**Imports:** 5  
**Dependencies:** `node:url`, `node:path`, `fs`

**Features:**
- Demonstrates full bidirectional conversation flow
- Shows how to process transcripts with n8n webhook
- Example session management
- File I/O examples

### `src/examples/simple-stt.ts`
**Purpose:** Simple STT client example  
**Size:** 1.80 KB (62 lines)  
**Imports:** 1

**Features:**
- Basic STT client usage
- Audio file reading example
- Transcript handling

### `src/examples/simple-tts.ts`
**Purpose:** Simple TTS client example  
**Size:** 2.15 KB (81 lines)  
**Imports:** 2  
**Dependencies:** `fs`

**Features:**
- Basic TTS client usage
- Text-to-speech conversion
- Audio file writing example

---

## Summary Statistics

### Code Structure
- **Classes:** 3
  - `CartesiaSTTClient` (413 lines)
  - `CartesiaTTSClient` (405 lines)
  - `BidirectionalConversation` (287 lines)
- **Interfaces:** 13 (all in `types.ts`)
- **Types:** 8 (all in `types.ts`)
- **Constants:** 3
- **Exports:** 27
- **Imports:** 14

### Documentation
- **Comments:** 96
- **JSDoc Comments:** 67

### Dependencies
- **External Dependencies:**
  - `ws` - WebSocket client library
  - `node:url` - Node.js URL utilities
  - `node:path` - Node.js path utilities
  - `fs` - Node.js file system

### File Breakdown
1. **Core Files (5):**
   - `index.ts` - Entry point
   - `config.ts` - Configuration
   - `stt-client.ts` - STT client
   - `tts-client.ts` - TTS client
   - `bidirectional-conversation.ts` - Conversation orchestrator

2. **Type Definitions (1):**
   - `types.ts` - All TypeScript types

3. **Examples (3):**
   - `examples/bidirectional-conversation.ts`
   - `examples/simple-stt.ts`
   - `examples/simple-tts.ts`

### Key Patterns
- **WebSocket Management:** All clients handle connection, reconnection, and error recovery
- **Performance Tracking:** Latency metrics collected for optimization
- **Callback-based API:** Event-driven architecture with callbacks
- **Type Safety:** Comprehensive TypeScript types for all APIs
- **Error Handling:** Robust error handling with automatic recovery

---

## Architecture Overview

```
src/
├── index.ts                    # Public API exports
├── config.ts                   # Configuration & environment
├── types.ts                    # Type definitions
├── stt-client.ts               # STT WebSocket client
├── tts-client.ts               # TTS WebSocket client
├── bidirectional-conversation.ts # Conversation orchestrator
└── examples/
    ├── bidirectional-conversation.ts
    ├── simple-stt.ts
    └── simple-tts.ts
```

**Data Flow:**
1. Audio → `CartesiaSTTClient` → Transcripts
2. Transcripts → `BidirectionalConversation` → Processing
3. Processed Text → `CartesiaTTSClient` → Audio

**Key Design Decisions:**
- Separate clients for STT and TTS for modularity
- `BidirectionalConversation` orchestrates the flow
- Performance metrics tracked at each stage
- Type-safe interfaces for all operations
- Callback-based event handling for real-time processing

---

## Notes

- All backend code is written in TypeScript (ES2022)
- Uses Node.js WebSocket client (`ws`) for server-side connections
- Configuration supports both `VITE_*` and non-prefixed environment variables
- Comprehensive error handling with automatic reconnection
- Performance metrics enable latency optimization
- Examples demonstrate real-world usage patterns
