# JARVIS-WEB Project Parse Analysis

**Generated:** 2025-02-02  
**Project Version:** 1.0.0

## Executive Summary

**JARVIS-WEB** is a comprehensive bidirectional conversational AI application that integrates Cartesia's STT (Speech-to-Text) and TTS (Text-to-Speech) WebSocket APIs. The project provides both a Node.js library for programmatic use and a browser-based chat interface with real-time voice interaction, featuring an Iron Man-themed UI.

### Key Capabilities
- **Real-time STT**: VAD-gated streaming with partial transcripts
- **Low-latency TTS**: sonic-turbo (40ms) or sonic-3 (90ms) models
- **Bidirectional flow**: Seamless STT → Processing → TTS pipeline
- **Barge-in support**: User speech cancels TTS playback
- **Wake word detection**: Optional Porcupine integration
- **Multimodal support**: Text, voice, file attachments (images, audio, documents)
- **n8n integration**: LLM responses via webhook
- **File generation**: PDF, image, text file creation from responses

---

## Project Structure

### Core Source Files (`src/`)

#### 1. **`index.ts`** - Main Export
- **Purpose**: Public API entry point
- **Exports**:
  - `CartesiaSTTClient` - STT WebSocket client
  - `CartesiaTTSClient` - TTS WebSocket client
  - `BidirectionalConversation` - Conversation orchestrator
  - `CARTESIA_CONFIG` - Configuration object
  - All types from `types.ts`

#### 2. **`config.ts`** - Configuration
- **CARTESIA_CONFIG**: Centralized configuration
  - **API Credentials**: API key, voice ID, API version (2025-04-16)
  - **TTS Settings**:
    - Model: `sonic-3` (90ms, emotive) or `sonic-turbo` (40ms, real-time)
    - Sample rate: 44100 Hz (quality) or 8000 Hz (latency)
    - Encoding: `pcm_s16le`
    - `max_buffer_delay_ms: 0` (no server buffering for streaming)
  - **STT Settings**:
    - Model: `ink-whisper`
    - Sample rate: 16000 Hz
    - Encoding: `pcm_s16le`
    - Chunk size: 100ms intervals
    - VAD settings: min_volume, max_silence_duration_secs
  - **WebSocket Settings**:
    - Reconnect delay: 1000ms
    - Max reconnect attempts: 5
    - Timeout: 180000ms (3 minutes)
- **N8N_WEBHOOK_URL**: Default webhook for LLM integration

#### 3. **`stt-client.ts`** - Speech-to-Text Client
- **Class**: `CartesiaSTTClient`
- **Features**:
  - WebSocket connection to Cartesia STT API
  - Configuration via URL query params (not first message)
  - Real-time audio streaming (100ms chunks)
  - Partial and final transcript handling
  - Automatic reconnection (up to 5 attempts)
  - Performance latency tracking
  - Request ID management
- **Key Methods**:
  - `connect()`: Establish WebSocket with URL params
  - `sendAudioChunk()`: Stream PCM audio data (binary)
  - `finalize()`: Flush remaining audio ("finalize" command)
  - `done()`: Close session ("done" command)
  - `onTranscript()`: Set transcript callback
  - `disconnect()`: Clean shutdown
- **State Management**:
  - Connection state tracking
  - Request ID generation and tracking
  - Latency metrics (partial/final)

#### 4. **`tts-client.ts`** - Text-to-Speech Client
- **Class**: `CartesiaTTSClient`
- **Features**:
  - WebSocket connection to Cartesia TTS API
  - Continuations support (prosody continuity)
  - Context management per conversation turn
  - First-byte latency tracking
  - Automatic reconnection
  - Context cancellation support
- **Key Methods**:
  - `connect()`: Establish WebSocket connection
  - `sendText()`: Send text with context ID and continue flag
  - `streamTextChunks()`: Stream multiple sentences with continuations
  - `cancelContext()`: Cancel pending TTS generation
  - `onAudio()`: Set audio chunk callback
  - `disconnect()`: Clean shutdown
- **Context Management**:
  - Unique context IDs per conversation turn
  - Config persistence across chunks
  - Automatic expiration (1 second after last audio)

#### 5. **`bidirectional-conversation.ts`** - Conversation Manager
- **Class**: `BidirectionalConversation`
- **Purpose**: Orchestrates STT → Processing → TTS flow
- **Features**:
  - Processes partial transcripts immediately (low latency)
  - Context management across conversation turns
  - Sentence splitting for TTS continuations
  - Performance metrics collection
  - Error handling and recovery
  - Conversation history tracking
- **Key Methods**:
  - `initialize()`: Connect both STT and TTS in parallel
  - `sendAudio()`: Forward audio to STT
  - `finalizeSTT()`: Finalize current STT request
  - `cancelTTS()`: Cancel current TTS generation
  - `onUserSpeech()`: Set transcript callback
  - `onAssistantAudio()`: Set TTS audio callback
  - `getMetrics()`: Get performance metrics
  - `disconnect()`: Clean shutdown
- **Processing Flow**:
  1. STT receives audio → partial/final transcripts
  2. Partial transcripts processed immediately (optional)
  3. Final transcript → `processTranscript()` callback
  4. Response text → TTS with continuations
  5. Audio chunks → `onAssistantAudio()` callback

#### 6. **`types.ts`** - TypeScript Definitions
- **TTS Types**:
  - `TTSConfig`: Configuration structure
  - `TTSRequest`: Request message
  - `TTSResponse`: Union of all response types
    - `TTSChunkResponse`: Audio chunk (base64 PCM)
    - `TTSDoneResponse`: Generation complete
    - `TTSFlushDoneResponse`: Flush acknowledgment
    - `TTSTimestampsResponse`: Word timestamps
    - `TTSErrorResponse`: Error message
- **STT Types**:
  - `STTConfig`: Configuration structure
  - `STTResponse`: Union of all response types
    - `STTTranscriptResponse`: Transcript (partial/final)
    - `STTDoneResponse`: Request complete
    - `STTFlushDoneResponse`: Flush acknowledgment
    - `STTErrorResponse`: Error message
- **Callback Types**:
  - `TTSAudioCallback`, `TTSDoneCallback`, `TTSErrorCallback`
  - `STTTranscriptCallback`, `STTDoneCallback`, `STTErrorCallback`
- **Performance Metrics**:
  - `PerformanceMetrics`: Latency tracking interface

### Frontend (`public/`)

#### 1. **`index.html`** - Chat UI
- **Theme**: Iron Man-inspired (gold/red color scheme)
- **Features**:
  - Glassmorphism design with modern UI
  - Chat history display (scrollable)
  - Text input with send button
  - Microphone button (voice input)
  - File attachment button (paperclip)
  - PDF export button (header)
  - Status indicator (Ready/Listening/Speaking/Error)
  - Wake word tracker panel (optional)
  - Mic boost slider (0.5x - 3x)
  - Level meter visualization
- **Styling**:
  - CSS variables for theming
  - Responsive design
  - Smooth animations and transitions
  - Custom fonts (Outfit, Inter)

#### 2. **`js/app.js`** - Main Application Logic
- **Purpose**: Integrates CartesiaAudioBridge with UI
- **Features**:
  - Text and voice message handling
  - n8n webhook integration for LLM responses
  - File attachment processing (images, audio, documents)
  - OCR tool integration (Tesseract.js) for image text extraction
  - PDF/image/text file creation from n8n responses
  - Session management with unique session IDs
  - Debug mode support (`?debug=1`)
  - Mic boost persistence (localStorage)
  - Wake word integration
- **Key Functions**:
  - `sendMessage()`: Send text message
  - `handleVoiceMessage()`: Process voice transcript
  - `handleFileAttachment()`: Process file uploads
  - `addMessageToChat()`: Update UI with message
  - `setStatus()`: Update status indicator
  - `syncMicButton()`: Sync mic button state

#### 3. **`js/cartesia-audio-bridge.js`** - Audio Bridge
- **Class**: `CartesiaAudioBridge`
- **Purpose**: Browser implementation using Web Audio API
- **Features**:
  - **VAD-gated streaming STT**: Only streams during speech
  - **Pre-speech buffer**: 800ms buffer for utterance onset
  - **Barge-in support**: User speaking cancels TTS
  - **sonic-turbo TTS**: 40ms first byte latency
  - **Gapless playback**: AudioWorklet for smooth audio
  - **Silence timers**: Auto-stop after silence, closing messages
  - **Input gain control**: Boost quiet microphones (0.5-3x)
  - **Level meter**: Real-time mic input visualization
  - **Audio recording**: Capture audio during STT for attachments
  - **Wake word integration**: Optional Porcupine wake word detection
- **AudioWorklet Processors**:
  - `stt-capture-processor.js`: Captures mic input, converts to PCM
  - `tts-playback-processor.js`: Plays TTS audio chunks
  - `wake-word-processor.js`: Wake word detection (Porcupine)
- **State Management**:
  - STT active/inactive state
  - TTS playback state
  - Wake word active state
  - Silence timers and buffers
  - Pre-speech buffer management

#### 4. **`js/vad-config.js`** - Voice Activity Detection Config
- **Purpose**: VAD settings aligned with voice bot design heuristics
- **Configuration**:
  - `redemptionMs`: 1200ms for responsiveness
  - `minSpeechMs`: Minimum speech duration
  - `preSpeechPadMs`: 800ms buffer before speech
  - `silenceClosingMessageMs`: 10s timeout for closing message
  - `silenceClosingPhrases`: British closing phrases array
  - `maxListeningMs`: Maximum listening duration

#### 5. **`js/n8n-payload.js`** - n8n Integration
- **Purpose**: Builds payloads for n8n webhook
- **Features**:
  - Message text formatting
  - Session ID for continuity
  - Timestamp, timezone, location
  - Source (voice/text)
  - Attachments (base64 encoded)
  - Reply extraction (multiple field names supported)
  - Natural language fallbacks for common queries
- **Key Functions**:
  - `buildN8nPayload()`: Create webhook payload
  - `extractReplyFromJson()`: Extract reply from response
  - `extractFilesFromJson()`: Extract file creation requests
  - `getNaturalFallback()`: Natural language fallbacks

#### 6. **`js/file-creator.js`** - File Generation
- **Purpose**: Creates downloadable files
- **Supported Types**:
  - **PDF**: From title and content (using jsPDF)
  - **Image**: From base64 data
  - **Text**: Plain text files
  - **Audio**: WAV conversion from uploaded files
- **Key Functions**:
  - `createPdfBlob()`: Generate PDF blob
  - `createImageBlobFromBase64()`: Generate image blob
  - `createTextBlob()`: Generate text blob
  - `createWavBlobFromAudioFile()`: Convert audio to WAV
  - `downloadBlob()`: Trigger download

#### 7. **`js/ocr-tool.js`** - OCR Integration
- **Purpose**: Uses Tesseract.js for image text extraction
- **Features**:
  - Adds OCR text to attachment payloads for n8n
  - Supports multiple image formats
  - Progress tracking

#### 8. **`js/wake-word-manager.js`** - Wake Word Manager
- **Purpose**: Manages Porcupine wake word detection
- **Features**:
  - Porcupine integration
  - Keyword file loading
  - Cooldown period management (3 seconds)
  - Debug mode support

#### 9. **`js/wake-word-tracker.js`** - Wake Word Tracker
- **Purpose**: UI component for wake word status
- **Features**:
  - Visual status indicator
  - Detection count display
  - Error state handling

#### 10. **`js/debug.js`** - Debug Utilities
- **Purpose**: Conditional debug logging
- **Features**:
  - `DEBUG.trace()`: Trace logging
  - `DEBUG.error()`: Error logging
  - `DEBUG.info()`: Info logging
  - Controlled by `window.JARVIS_DEBUG` or `?debug=1`

#### 11. **`js/audio-utils.js`** - Audio Utilities
- **Purpose**: Audio format conversions
- **Features**:
  - Base64 PCM decoding
  - Audio format conversions
  - Sample rate conversion utilities

### AudioWorklet Processors (`public/audio/`)

#### 1. **`stt-capture-processor.js`**
- **Purpose**: Captures microphone input and converts to PCM
- **Features**:
  - Real-time audio capture
  - PCM conversion (pcm_s16le, 16kHz)
  - 100ms chunk streaming
  - Pre-speech buffer management
  - Input gain application
  - Audio recording for attachments

#### 2. **`tts-playback-processor.js`**
- **Purpose**: Plays TTS audio chunks
- **Features**:
  - Gapless playback
  - PCM decoding (base64 → ArrayBuffer)
  - Sample rate conversion (if needed)
  - Barge-in detection

#### 3. **`wake-word-processor.js`**
- **Purpose**: Wake word detection using Porcupine
- **Features**:
  - Porcupine keyword detection
  - Cooldown period management
  - Debug logging

### Build Configuration

#### 1. **`vite.config.js`** - Vite Configuration
- **Root**: `public/` directory
- **Build Output**: `dist-public/`
- **Plugins**:
  - `preserveIndexHtmlPlugin`: Preserves full HTML in builds
  - `viteStaticCopy`: Copies audio processors, debug HTML, keywords
  - `cartesiaWebSocketStatusPlugin`: Checks Cartesia WebSocket reachability
- **Environment Variables**:
  - `VITE_CARTESIA_API_KEY`
  - `VITE_CARTESIA_VOICE_ID`
  - `VITE_N8N_WEBHOOK_URL`
  - `VITE_PICOVOICE_ACCESS_KEY`
  - `VITE_PORCUPINE_KEYWORD`
  - `VITE_PORCUPINE_SENSITIVITY`
  - `VITE_WAKE_WORD_ENABLED`
  - `VITE_DEBUG_WAKE_WORD`
- **Server**: Port 3000 (configurable via `PORT`)

#### 2. **`tsconfig.json`** - TypeScript Configuration
- **Target**: ES2022
- **Module**: ES2022
- **Output**: `dist/` directory
- **Features**:
  - Strict mode enabled
  - Source maps and declarations
  - ES module interop

#### 3. **`jest.config.cjs`** - Test Configuration
- **Preset**: ts-jest
- **Environment**: Node.js
- **Coverage**:
  - Thresholds: 40% branches, 50% functions/lines/statements
  - Reporters: text, lcov, html
- **Test Files**: `tests/`, `debug/tests/`, `debug/live/`
- **Transform**: ts-jest for TypeScript, babel-jest for JavaScript

#### 4. **`eslint.config.js`** - Linting Configuration
- **TypeScript ESLint**: For `src/` and `tests/`
- **Browser Globals**: For `public/js/`
- **AudioWorklet Globals**: For processors
- **Node.js Globals**: For server files
- **Rules**: Customized per file type

### Server Files

#### 1. **`server.js`** - Static File Server
- **Purpose**: Simple HTTP server for `public/` directory
- **Port**: 3000 (configurable via `PORT` env var)
- **Features**:
  - Serves static files
  - MIME type handling
  - Security: Path traversal protection
- **Note**: HTTPS required for production (AudioWorklet needs secure context)

### Examples (`src/examples/`)

#### 1. **`bidirectional-conversation.ts`**
- Full conversation example
- Demonstrates STT → Processing → TTS flow
- Shows callback usage

#### 2. **`simple-tts.ts`**
- Standalone TTS example
- Shows basic TTS usage
- Demonstrates continuations

#### 3. **`simple-stt.ts`**
- Standalone STT example
- Shows basic STT usage
- Demonstrates audio streaming

### Tests

#### Unit Tests (`tests/unit/`)
- Test files for core functionality
- Coverage tracking enabled

#### Integration Tests (`debug/tests/integration/`)
- End-to-end workflow tests
- Real API integration

#### Live Tests (`debug/live/`)
- Real API integration tests
- Environment checking tools

### Debug Tools (`debug/`)

#### Tools (`debug/tools/`)
- `check-n8n-webhook.js`: Test n8n webhook connectivity
- `check-stt-sample-rate.js`: Verify STT audio format
- `open-app-debug-send.mjs`: Debug message sending
- `validate-config.js`: Configuration validation

#### Documentation (`debug/`)
- Extensive debug guides and fix summaries
- Troubleshooting documentation
- Error analysis and solutions

---

## Architecture

### Data Flow

```
User Speech → Microphone → AudioWorklet → PCM Conversion → STT WebSocket
                                                              ↓
                                                         Transcript
                                                              ↓
                                                         n8n Webhook → LLM
                                                              ↓
                                                         Response Text
                                                              ↓
                                                         TTS WebSocket → PCM Audio
                                                              ↓
                                                         AudioWorklet → Speakers
```

### Key Design Patterns

1. **Bridge Pattern**: `CartesiaAudioBridge` abstracts Web Audio API from Cartesia WebSocket clients
2. **Observer Pattern**: Callbacks for transcripts, audio chunks, errors
3. **State Management**: UI state synced with bridge state (mic button, status)
4. **Error Recovery**: Automatic reconnection, graceful degradation

### Performance Optimizations

1. **Low Latency STT**:
   - 100ms audio chunks
   - Partial transcript processing
   - Pre-speech buffer (800ms)
   - VAD-gated streaming (only during speech)

2. **Low Latency TTS**:
   - `sonic-turbo` model (40ms first byte) or `sonic-3` (90ms)
   - Streaming with continuations
   - `max_buffer_delay_ms: 0` (no server buffering)
   - Gapless playback via AudioWorklet

3. **VAD Optimization**:
   - Only streams during speech
   - Redemption timer (1200ms) for responsiveness
   - Silence detection for auto-stop
   - Pre-speech buffer for utterance onset

---

## Configuration

### Environment Variables

Create `.env` file:

```env
CARTESIA_API_KEY=sk_car_xxxx
CARTESIA_VOICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xxx
VITE_PICOVOICE_ACCESS_KEY=xxxx
VITE_PORCUPINE_KEYWORD=jarvis
VITE_PORCUPINE_SENSITIVITY=0.5
VITE_WAKE_WORD_ENABLED=false
VITE_DEBUG_WAKE_WORD=false
PORT=3000
```

### n8n Webhook Response Format

n8n workflow should return JSON with one of these fields:
- `output`
- `reply`
- `result`
- `text`
- `message`

Optional file creation:
```json
{
  "reply": "Here's your document",
  "files": [
    {
      "type": "pdf",
      "title": "Report",
      "content": "Body text",
      "filename": "report.pdf"
    }
  ]
}
```

---

## Scripts

### Development
- `npm run dev`: TypeScript watch mode
- `npm run vite`: Start Vite dev server
- `npm run serve`: Start static file server

### Building
- `npm run build`: Compile TypeScript
- `npm run vite:build`: Build frontend with Vite

### Testing
- `npm test`: Run Jest tests
- `npm run test:coverage`: Generate coverage report
- `npm run test:watch`: Watch mode

### Linting
- `npm run lint`: Check code
- `npm run lint:fix`: Auto-fix issues
- `npm run lint:check`: Fail on warnings

### Debugging
- `npm run debug`: Run debug suite
- `npm run debug:n8n`: Test n8n webhook
- `npm run debug:stt`: Check STT sample rate
- `npm run debug:config`: Validate configuration

---

## Dependencies

### Production
- `@picovoice/porcupine-web`: Wake word detection
- `@ricky0123/vad-web`: Voice Activity Detection
- `jspdf`: PDF generation
- `tesseract.js`: OCR for images
- `ws`: WebSocket client (Node.js)

### Development
- `typescript`: TypeScript compiler
- `vite`: Frontend build tool
- `jest`: Testing framework
- `eslint`: Linting
- `ts-jest`: TypeScript Jest transformer

---

## Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Limited (AudioWorklet support varies)
- **HTTPS Required**: AudioWorklet needs secure context (localhost OK for development)

---

## Performance Targets

- **TTS First Byte**: < 50ms (sonic-turbo) or < 100ms (sonic-3)
- **STT Partial**: < 500ms from audio chunk
- **STT Final**: < 1000ms from audio end
- **End-to-End**: < 2000ms (user speaks → response starts)

---

## Security Considerations

1. **API Keys**: Never commit `.env` file
2. **CORS**: Configure n8n webhook for cross-origin requests
3. **HTTPS**: Required for production (AudioWorklet)
4. **File Size Limits**: 15MB max attachment size
5. **Path Traversal**: Server protects against directory traversal

---

## Known Issues & Solutions

See `debug/` directory for extensive troubleshooting:
- **N8N-RESPOND-TO-WEBHOOK-FIX.md**: n8n response format issues
- **DEBUG-VOICE.md**: Voice/microphone debugging
- **SILENCE-AND-CONVERSATION-TIMER-FIXES.md**: Timer-related fixes

---

## Future Enhancements

Potential improvements:
- Multi-language support
- Custom voice training
- Conversation history persistence
- Advanced error recovery
- WebRTC for peer-to-peer audio
- Mobile app support

---

## License

MIT

---

*This analysis was generated by parsing the entire project structure, source files, configuration, and documentation.*
