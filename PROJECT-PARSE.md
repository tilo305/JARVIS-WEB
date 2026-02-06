# JARVIS-WEB Project Parse

## Project Overview

**JARVIS-WEB** is a bidirectional conversational AI application using Cartesia's STT (Speech-to-Text) and TTS (Text-to-Speech) WebSocket APIs. It features a browser-based chat interface with voice input/output, wake word detection, and n8n LLM integration.

## Project Structure

### Root Directory

```
JARVIS-WEB/
├── src/                    # TypeScript source (Node.js backend)
├── public/                 # Browser frontend (HTML/JS/CSS)
├── tests/                  # Jest test suite
├── debug/                  # Debug tools and documentation
├── docs/                   # Project documentation
├── scripts/                # Build and utility scripts
├── dist/                   # Compiled TypeScript output
├── dist-public/            # Vite production build
├── coverage/               # Test coverage reports
└── node_modules/           # Dependencies
```

## Core Components

### 1. Backend (TypeScript - `src/`)

#### `src/config.ts`
- Cartesia API configuration
- TTS/STT endpoint URLs and parameters
- n8n webhook URL configuration
- Audio format settings (sample rates, encoding)

#### `src/stt-client.ts`
- **CartesiaSTTClient**: WebSocket client for Speech-to-Text
- Real-time audio streaming (100ms chunks)
- Partial and final transcript handling
- Performance latency tracking
- Automatic reconnection logic

#### `src/tts-client.ts`
- **CartesiaTTSClient**: WebSocket client for Text-to-Speech
- Streaming with continuations for prosody
- Context management
- First-byte latency tracking
- Context cancellation support

#### `src/bidirectional-conversation.ts`
- **BidirectionalConversation**: Orchestrates STT → Processing → TTS flow
- Handles partial transcripts for low latency
- Sentence splitting for continuations
- Performance metrics collection
- Error handling and recovery

#### `src/types.ts`
- TypeScript type definitions for:
  - TTS request/response types
  - STT request/response types
  - Callback function types
  - Performance metrics interface

#### `src/index.ts`
- Main entry point for Node.js usage

#### `src/examples/`
- Example implementations:
  - `bidirectional-conversation.ts`
  - `simple-stt.ts`
  - `simple-tts.ts`

### 2. Frontend (Browser - `public/`)

#### `public/index.html`
- Iron Man-themed chat interface
- Glassmorphism UI design
- Wake word tracker inline display
- Console error capture system

#### `public/js/app.js`
- **Main application logic** (1,471 lines)
- Chat UI management
- Mic button and text input handling
- n8n webhook integration
- File attachment support
- Wake word integration
- Conversation history management
- Agentic patterns (Memory, Routing, Context Engineering)

#### `public/js/cartesia-audio-bridge.js`
- **CartesiaAudioBridge**: Core audio processing bridge
- AudioWorklet integration
- VAD (Voice Activity Detection) integration
- STT/TTS WebSocket management
- Wake word manager coordination
- Audio recording for n8n payloads
- Level meter support
- Input gain control
- Silence detection and auto-stop

#### `public/js/agentic-patterns.js`
- Conversation history management
- Intent classification
- Input validation
- Retry logic with exponential backoff
- Context enrichment

#### `public/js/n8n-payload.js`
- Builds n8n webhook payloads
- Extracts replies from n8n responses
- File creation specs handling

#### `public/js/file-creator.js`
- PDF generation (jsPDF)
- Image creation from base64
- Text file creation
- Audio file handling
- Download utilities

#### `public/js/ocr-tool.js`
- Tesseract.js integration
- Image OCR processing
- Attachment enhancement

#### `public/js/vad-config.js`
- VAD configuration aligned with voice bot design heuristics
- `redemptionMs`, `minSpeechMs`, `preSpeechPadMs` settings

#### `public/js/openwakeword-manager.js`
- OpenWakeWord WebSocket client
- Wake word detection coordination
- Error handling and recovery

#### `public/js/openwakeword-client.js`
- Low-level OpenWakeWord WebSocket client

#### `public/js/wake-word-tracker.js`
- UI component for wake word status
- Detection metrics display
- Event logging

#### `public/js/wake-word-error-monitor.js`
- Automatic error detection and fixing
- Error history tracking

#### `public/js/wake-word-console.js`
- Wake word error logging
- Console error filtering

#### `public/js/debug.js`
- Debug logging utilities
- Conditional debug output

#### `public/js/audio-utils.js`
- Audio format conversion utilities
- Base64 PCM decoding

### 3. AudioWorklet Processors (`public/audio/`)

#### `public/audio/stt-capture-processor.js`
- Captures microphone audio
- Converts to 16kHz PCM s16le
- Streams 100ms chunks to STT WebSocket
- Pre-speech buffer (800ms)

#### `public/audio/tts-playback-processor.js`
- Plays TTS audio chunks
- Gapless playback
- Handles 44.1kHz PCM audio

#### `public/audio/wake-word-processor.js`
- Processes audio for wake word detection
- Converts to 16kHz Int16 frames
- Sends to OpenWakeWord server

### 4. Server & Build

#### `server.js`
- Static file server
- Serves `dist-public/` (production) or `public/` (development)
- Blocks `.env` file access
- Port 3000 default

#### `vite.config.js`
- Vite build configuration
- Environment variable injection
- Static asset copying
- Cartesia WebSocket status checking
- HTML preservation plugin

#### `package.json`
- **Scripts**:
  - `npm run vite` - Dev server with OpenWakeWord
  - `npm run serve` - Static server
  - `npm run build` - TypeScript compilation
  - `npm run test` - Jest test suite
  - `npm run lint` - ESLint checking
- **Dependencies**:
  - `@ricky0123/vad-web` - Voice Activity Detection
  - `ws` - WebSocket client
  - `tesseract.js` - OCR
  - `jspdf` - PDF generation
  - `dotenv` - Environment variables

### 5. Testing (`tests/`)

#### Test Files
- `jest-verification.test.ts` - Test suite verification
- `setup.js` - Jest setup configuration
- `unit/` - Unit tests:
  - `agentic-patterns.test.js`
  - `audio-utils.test.ts`
  - `audioworklet-processors.test.js`
  - `cartesia-audio-bridge.test.js`
  - `config.test.ts`
  - `file-creator.test.js`
  - `n8n-payload.test.js`
  - `ocr-tool.test.js`
  - `vad-config.test.js`

#### `jest.config.cjs`
- TypeScript + JavaScript test support
- Coverage thresholds: 40% branches, 50% functions/lines/statements
- Module resolution configuration

### 6. Configuration Files

#### `tsconfig.json`
- TypeScript compiler configuration
- ES2022 target
- ESM modules
- Strict mode enabled

#### `tsconfig.eslint.json`
- ESLint TypeScript project reference

#### `eslint.config.js`
- Multi-environment ESLint config
- TypeScript, Node.js, Browser, AudioWorklet rules
- Separate rules for different file types

#### `babel.config.cjs`
- Babel configuration for Jest

### 7. Documentation (`docs/`)

- `PROJECT-PARSE-ANALYSIS.md` - Project analysis
- `DEBUG-VOICE.md` - Voice debugging guide
- `OPENWAKEWORD.md` - Wake word documentation
- `INTEGRATION.md` - Integration guide
- `N8N-POSTGRESQL-SETUP-GUIDE.md` - n8n setup
- Archive folder with historical documentation

### 8. Debug Tools (`debug/`)

- Debug HTML pages for testing
- Debug scripts and tools
- Comprehensive debugging documentation
- Test verification reports

### 9. Scripts (`scripts/`)

#### `scripts/kill-port-then-vite.mjs`
- Kills port 3000 before starting Vite

#### `scripts/load-env-everywhere.mjs`
- Loads `.env` files across the project

#### `scripts/start-openwakeword-server.mjs`
- Starts Python OpenWakeWord server

#### `scripts/openwakeword-server.py`
- Python server for wake word detection

#### `scripts/sync-env.mjs`
- Environment variable synchronization

## Key Features

### 1. Voice Input/Output
- **STT**: Real-time speech-to-text via Cartesia WebSocket
- **TTS**: Text-to-speech with sonic-3 (90ms) or sonic-turbo (40ms) models
- **VAD**: Voice Activity Detection for turn-taking
- **Barge-in**: User speaking cancels TTS playback

### 2. Wake Word Detection
- **OpenWakeWord**: "Hey Jarvis" wake word detection
- Python server integration
- WebSocket-based communication
- Cooldown period (3 seconds)
- Error monitoring and auto-recovery

### 3. Chat Interface
- Iron Man-themed UI with glassmorphism
- Text input with Enter key support
- Mic button for voice input
- File attachments (images, audio, text)
- PDF export of chat history
- Real-time status indicators

### 4. n8n Integration
- Webhook-based LLM responses
- Session management
- Conversation history
- File creation support (PDF, images, text)
- Error handling and retries

### 5. Agentic Patterns
- **Memory**: Conversation history management
- **Routing**: Intent classification
- **Context Engineering**: Context enrichment
- **Retry Logic**: Exponential backoff

### 6. Audio Processing
- **AudioWorklet**: Low-latency audio processing
- **Pre-speech Buffer**: 800ms buffer for utterance onset
- **Input Gain**: Adjustable mic boost (0.5-3x)
- **Level Meter**: Real-time audio level visualization
- **Audio Recording**: Captures audio for n8n payloads

## Technology Stack

### Frontend
- **Vanilla JavaScript** (ES2022 modules)
- **AudioWorklet API** for audio processing
- **Web Audio API** for audio capture/playback
- **WebSocket API** for real-time communication
- **Vite** for build tooling

### Backend
- **TypeScript** (ES2022)
- **Node.js** WebSocket client
- **Cartesia API** (STT/TTS WebSockets)

### Libraries
- `@ricky0123/vad-web` - Voice Activity Detection
- `tesseract.js` - OCR
- `jspdf` - PDF generation
- `ws` - WebSocket client
- `dotenv` - Environment variables

### Testing
- **Jest** - Test framework
- **ts-jest** - TypeScript support
- **babel-jest** - JavaScript support

### Build Tools
- **TypeScript Compiler** - Type checking and compilation
- **Vite** - Frontend bundler
- **ESLint** - Linting
- **Babel** - JavaScript transpilation

## Data Flow

### Voice Input Flow
1. User speaks → Microphone
2. AudioWorklet (`stt-capture-processor.js`) → 16kHz PCM
3. VAD gates streaming → STT WebSocket
4. Cartesia STT → Partial/Final transcripts
5. `onTranscript` → `app.js`
6. n8n webhook → LLM response
7. TTS WebSocket → Audio chunks
8. AudioWorklet (`tts-playback-processor.js`) → Speakers

### Wake Word Flow
1. Microphone → AudioWorklet (`wake-word-processor.js`)
2. 16kHz Int16 frames → OpenWakeWord WebSocket
3. Python server → Detection
4. `onWakeWordDetected` → Activate STT pipeline
5. Continue with voice input flow

### Text Input Flow
1. User types → Text input
2. Send button → `app.js`
3. n8n webhook → LLM response
4. TTS WebSocket → Audio playback
5. Chat UI → Display message

## Configuration

### Environment Variables (`.env`)
```env
CARTESIA_API_KEY=sk_car_xxxx
CARTESIA_VOICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_N8N_WEBHOOK_URL=https://n8n.hempstarai.com/webhook/...
VITE_WAKE_WORD_ENABLED=true
VITE_USE_OPENWAKEWORD=true
VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws
```

### Audio Format Requirements
- **STT Input**: PCM s16le, 16kHz, 100ms chunks
- **TTS Output**: PCM s16le, 44.1kHz (or 8kHz for lower latency)
- **Wake Word**: 16kHz Int16 frames

## Performance Targets

- **TTS First Byte**: < 100ms (sonic-3) or < 50ms (sonic-turbo)
- **STT Partial**: < 500ms from audio chunk
- **STT Final**: < 1000ms from audio end
- **End-to-End**: < 2000ms (user speaks → response starts)

## Development Workflow

### Setup
```bash
npm install
npm run build
```

### Development
```bash
npm run vite          # Dev server + OpenWakeWord
npm run serve         # Static server only
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Linting
```bash
npm run lint          # Check
npm run lint:fix      # Auto-fix
```

### Production Build
```bash
npm run vite:build    # Build frontend
npm run serve:prod    # Serve production build
```

## Architecture Patterns

### 1. Bridge Pattern
- `CartesiaAudioBridge` bridges AudioWorklet and WebSocket APIs
- Single source of truth for audio state

### 2. Callback Pattern
- Event-driven architecture
- Callbacks for transcripts, audio, errors

### 3. Singleton Pattern
- Single AudioContext per bridge instance
- Single media stream for all audio processing

### 4. Factory Pattern
- Context ID generation
- Request ID generation

### 5. Observer Pattern
- Wake word tracker updates
- Status updates
- Error monitoring

## Security Considerations

- `.env` files blocked from HTTP serving
- API keys not exposed in frontend (Vite env injection)
- CORS handling for n8n webhooks
- Secure WebSocket connections (WSS)

## Browser Compatibility

- **Required**: Modern browser with AudioWorklet support
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Requires HTTPS for AudioWorklet

## Known Limitations

1. **AudioWorklet requires HTTPS** in production
2. **Microphone permission** required for voice features
3. **Wake word** requires Python 3.8+ and OpenWakeWord server
4. **n8n webhook** must return specific JSON format
5. **File size limits**: 15MB max for attachments

## Future Enhancements

- Multi-language support
- Custom wake words
- Voice cloning
- Enhanced error recovery
- Offline mode support
- Mobile app version

## License

MIT
