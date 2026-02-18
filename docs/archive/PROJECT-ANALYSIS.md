# JARVIS-WEB Project Analysis

## Project Overview

**JARVIS-WEB** is a bidirectional conversational AI application using Cartesia's STT (Speech-to-Text) and TTS (Text-to-Speech) WebSocket APIs. The project provides both a Node.js library and a browser-based chat interface with real-time voice interaction.

### Key Technologies

- **TypeScript** for type-safe backend code
- **Vite** for frontend build tooling
- **Web Audio API** (AudioWorklet) for real-time audio processing
- **Cartesia API** for STT/TTS services
- **n8n** webhook integration for LLM responses
- **VAD (Voice Activity Detection)** for intelligent speech detection

---

## Project Structure

### Core Source Files (`src/`)

#### 1. **`index.ts`** - Main Export

- Exports all public APIs: `CartesiaSTTClient`, `CartesiaTTSClient`, `BidirectionalConversation`, `CARTESIA_CONFIG`
- Entry point for library consumers

#### 2. **`config.ts`** - Configuration

- **CARTESIA_CONFIG**: API credentials, endpoints, model settings
  - TTS: `sonic-turbo` (40ms first byte) or `sonic-3` (90ms, more emotive)
  - STT: `ink-whisper`, 16kHz PCM, 100ms chunks
  - Sample rates: TTS 44100Hz (quality), STT 16000Hz
- **N8N_WEBHOOK_URL**: Default webhook for LLM integration

#### 3. **`stt-client.ts`** - Speech-to-Text Client

- WebSocket client for Cartesia STT API
- Features:
  - Real-time audio streaming (100ms chunks)
  - Partial and final transcript handling
  - Automatic reconnection (up to 5 attempts)
  - Performance latency tracking
  - Configuration via URL query params (not first message)
- Methods:
  - `connect()`: Establish WebSocket connection
  - `sendAudioChunk()`: Stream PCM audio data
  - `finalize()`: Flush remaining audio and get final transcript
  - `done()`: Close session

#### 4. **`tts-client.ts`** - Text-to-Speech Client

- WebSocket client for Cartesia TTS API
- Features:
  - Continuations support (prosody continuity across chunks)
  - Context management per conversation turn
  - First-byte latency tracking
  - Automatic reconnection
- Methods:
  - `connect()`: Establish WebSocket connection
  - `sendText()`: Send text with context ID and continue flag
  - `streamTextChunks()`: Stream multiple sentences with continuations
  - `cancelContext()`: Cancel pending TTS generation

#### 5. **`bidirectional-conversation.ts`** - Conversation Manager

- Orchestrates STT → Processing → TTS flow
- Features:
  - Processes partial transcripts immediately for low latency
  - Context management across conversation turns
  - Sentence splitting for TTS continuations
  - Performance metrics collection
  - Error handling and recovery
- Callbacks:
  - `onUserSpeech()`: User transcript (partial/final)
  - `onAssistantAudio()`: TTS audio chunks
  - `onError()`: Error handling

#### 6. **`types.ts`** - TypeScript Definitions

- Complete type definitions for:
  - TTS requests/responses (chunk, done, error, timestamps)
  - STT requests/responses (transcript, done, error)
  - Callback function types
  - Performance metrics interface

### Frontend (`public/`)

#### 1. **`index.html`** - Chat UI

- Iron Man-themed interface
- Features:
  - Chat history display
  - Text input with send button
  - Microphone button for voice input
  - File attachment (paperclip)
  - PDF export functionality
  - Status indicator (Ready/Listening/Speaking/Error)

#### 2. **`js/app.js`** - Main Application Logic

- Integrates CartesiaAudioBridge with UI
- Features:
  - Text and voice message handling
  - n8n webhook integration for LLM responses
  - File attachment processing (images, audio, documents)
  - OCR tool integration for image text extraction
  - PDF/image/text file creation from n8n responses
  - Session management with unique session IDs
  - Debug mode support (`?debug=1`)

#### 3. **`js/cartesia-audio-bridge.js`** - Audio Bridge

- Browser implementation using Web Audio API
- Features:
  - **VAD-gated streaming STT**: Only streams during speech
  - **Pre-speech buffer**: 800ms buffer for utterance onset
  - **Barge-in support**: User speaking cancels TTS
  - **sonic-turbo TTS**: 40ms first byte latency
  - **Gapless playback**: AudioWorklet for smooth audio
  - **Silence timers**: Auto-stop after silence, closing messages
  - **Input gain control**: Boost quiet microphones (0.5-3x)
  - **Level meter**: Real-time mic input visualization
- AudioWorklet processors:
  - `stt-capture-processor.js`: Captures mic input, converts to PCM
  - `tts-playback-processor.js`: Plays TTS audio chunks

#### 4. **`js/vad-config.js`** - Voice Activity Detection Config

- VAD settings aligned with voice bot design heuristics:
  - `redemptionMs`: 1200ms for responsiveness
  - `minSpeechMs`: Minimum speech duration
  - `preSpeechPadMs`: 800ms buffer before speech
  - `silenceClosingMessageMs`: 10s timeout for closing message
  - `silenceClosingPhrases`: British closing phrases

#### 5. **`js/n8n-payload.js`** - n8n Integration

- Builds payloads for n8n webhook:
  - Message text
  - Session ID for continuity
  - Timestamp, timezone, location
  - Source (voice/text)
  - Attachments (base64 encoded)
- Extracts replies from n8n responses (multiple field names supported)
- Natural language fallbacks for common queries

#### 6. **`js/file-creator.js`** - File Generation

- Creates downloadable files:
  - **PDF**: From title and content (using jsPDF)
  - **Image**: From base64 data
  - **Text**: Plain text files
  - **Audio**: WAV conversion from uploaded files

#### 7. **`js/ocr-tool.js`** - OCR Integration

- Uses Tesseract.js for image text extraction
- Adds OCR text to attachment payloads for n8n

#### 8. **`js/debug.js`** - Debug Utilities

- Conditional debug logging based on `window.JARVIS_DEBUG`
- Trace, error, and info logging

#### 9. **`js/audio-utils.js`** - Audio Utilities

- Base64 PCM decoding
- Audio format conversions

### Build Configuration

#### 1. **`vite.config.js`** - Vite Configuration

- Serves `public/` directory
- Builds to `dist-public/`
- Environment variable injection:
  - `VITE_CARTESIA_API_KEY`
  - `VITE_CARTESIA_VOICE_ID`
  - `VITE_N8N_WEBHOOK_URL`
- Plugins:
  - Static file copying (audio processors, debug HTML)
  - Cartesia WebSocket status checking
  - HTML preservation for builds

#### 2. **`tsconfig.json`** - TypeScript Configuration

- Target: ES2022
- Module: ES2022
- Strict mode enabled
- Output: `dist/` directory
- Source maps and declarations enabled

#### 3. **`jest.config.cjs`** - Test Configuration

- Test environment: Node.js
- Coverage thresholds: 40% branches, 50% functions/lines/statements
- Test files: `tests/`, `debug/tests/`, `debug/live/`
- Transform: ts-jest for TypeScript, babel-jest for JavaScript

#### 4. **`eslint.config.js`** - Linting Configuration

- TypeScript ESLint for `src/` and `tests/`
- Browser globals for `public/js/`
- AudioWorklet globals for processors
- Node.js globals for server files

### Server Files

#### 1. **`server.js`** - Static File Server

- Simple HTTP server for `public/` directory
- Serves on port 3000 (configurable via `PORT` env var)
- Note: HTTPS required for production (AudioWorklet needs secure context)

### Examples (`src/examples/`)

- **`bidirectional-conversation.ts`**: Full conversation example
- **`simple-tts.ts`**: Standalone TTS example
- **`simple-stt.ts`**: Standalone STT example

### Tests

#### Unit Tests (`tests/unit/`)

- Test files for core functionality
- Coverage tracking enabled

#### Integration Tests (`debug/tests/integration/`)

- End-to-end workflow tests

#### Live Tests (`debug/live/`)

- Real API integration tests
- Environment checking tools

### Debug Tools (`debug/`)

- **`tools/`**: Utility scripts for debugging (see `debug/DEBUG-TOOLS-SUMMARY.md` for current tools)
- **`logs/`**: Debug log storage
- **`results/`**: Test run results
- **Documentation**: Extensive debug guides and fix summaries

### Documentation Files

#### Core Documentation

- **`README.md`**: Main project documentation
- **`QUICKSTART.md`**: Quick start guide
- **`cArTeSiA dOcS.md`**: Cartesia API implementation guide
- **`aUdiO dOcS.md`**: AudioWorklet integration details
- **`bOoK oN vOiCe BoT dEsIgN.md`**: VAD and voice bot design heuristics

#### Integration Guides

- **`FRONTEND-INTEGRATION-VERIFICATION.md`**: Frontend integration checklist
- **`INTEGRATION-VERIFICATION.md`**: General integration verification
- **`docs/DEBUG-VOICE.md`**: Voice debugging guide
- **`docs/N8N-POSTGRESQL-SETUP-GUIDE.md`**: n8n database setup

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

2. **Low Latency TTS**:
   - `sonic-turbo` model (40ms first byte)
   - Streaming with continuations
   - `max_buffer_delay_ms: 0` (no server buffering)

3. **VAD Optimization**:
   - Only streams during speech
   - Redemption timer (1200ms) for responsiveness
   - Silence detection for auto-stop

---

## Configuration

### Environment Variables

Create `.env` file:

```env
CARTESIA_API_KEY=sk_car_xxxx
CARTESIA_VOICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_N8N_WEBHOOK_URL=https://n8n.example.com/webhook/xxx
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

*Generated: 2025-02-02*
*Project Version: 1.0.0*
