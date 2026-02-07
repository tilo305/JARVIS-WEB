# JavaScript Files Parse Summary

This document provides a comprehensive overview of all JavaScript files in the JARVIS-WEB project, organized by category and purpose.

## Table of Contents
1. [Configuration Files](#configuration-files)
2. [Server Files](#server-files)
3. [Main Application Files](#main-application-files)
4. [Core Functionality Modules](#core-functionality-modules)
5. [Utility Modules](#utility-modules)
6. [Audio Processors](#audio-processors)
7. [Test Files](#test-files)
8. [Debug Tools](#debug-tools)
9. [Scripts](#scripts)

---

## Configuration Files

### `vite.config.js`
**Purpose**: Vite build configuration for the project
- **Key Features**:
  - Configures Vite with plugins for preserving `index.html`, blocking `.env` files in dev
  - Static asset copying (audio files, debug pages, keywords)
  - Cartesia WebSocket status monitoring plugin
  - Environment variable exposure to frontend (VITE_* and non-VITE_ variants)
  - Defines Cartesia API version (2025-04-16)
- **Important Constants**:
  - `CARTESIA_VERSION`: '2025-04-16'
  - `STT_WS`: 'wss://api.cartesia.ai/stt/websocket'
  - `TTS_WS`: 'wss://api.cartesia.ai/tts/websocket'

### `eslint.config.js`
**Purpose**: ESLint configuration for code quality
- **Key Features**:
  - TypeScript support with project-based type checking
  - Separate rules for Node.js files, browser JavaScript, AudioWorklet processors
  - Debug scripts and test files have relaxed rules
  - Global ignores for node_modules, dist, coverage

### `babel.config.cjs`
**Purpose**: Babel transpilation configuration
- **Key Features**:
  - Uses `@babel/preset-env` targeting current Node.js version
  - Ensures compatibility across Node.js versions

### `jest.config.cjs`
**Purpose**: Jest testing configuration
- **Key Features**:
  - TypeScript support via ts-jest
  - Coverage collection and thresholds
  - Module name mapping for path aliases
  - Test timeout: 30 seconds
  - Setup file: `tests/setup.js`

---

## Server Files

### `server.js`
**Purpose**: Simple static file server for the browser AudioWorklet demo
- **Key Features**:
  - Serves `dist-public/` if available (production build), otherwise `public/` (development)
  - Blocks serving `.env` files for security
  - Handles MIME types for HTML, JS, CSS, JSON, ICO
  - Port: 3000 (configurable via `PORT` env var)
  - Security: Never serves `.env` or `.env.*` files

---

## Main Application Files

### `public/js/app.js` (2,055 lines)
**Purpose**: Main client-side JavaScript for the JARVIS chat application
- **Key Features**:
  - UI interactions (send button, mic button, file attachments)
  - Cartesia STT/TTS integration via `CartesiaAudioBridge`
  - n8n webhook payload building and response parsing
  - Wake word detection integration
  - Conversation history management
  - Debug utilities (exposed via `window.JARVIS_DEBUG_*`)
  - Payload verification and monitoring
- **Key Functions**:
  - `getLLMReply()`: Sends payload to n8n and extracts reply
  - `buildPayload()`: Builds n8n payload with agentic patterns
  - `processFileSpecs()`: Handles file creation from n8n responses
  - `appendMessage()`: Adds messages to chat UI
  - `syncMicButton()`: Keeps mic button UI in sync with STT state
- **Event Handlers**:
  - Send button click
  - Mic button click (toggles STT)
  - File attachment handling
  - Keyboard shortcuts (Enter to send, DevTools shortcuts preserved)

---

## Core Functionality Modules

### `public/js/cartesia-audio-bridge.js` (~2,200 lines)
**Purpose**: Central orchestrator for all audio-related functionalities
- **Key Features**:
  - Manages microphone access, VAD, STT, TTS
  - Integration with `OpenWakeWordManager` for wake word detection
  - Real-time bidirectional audio flow
  - Barge-in support (interrupt TTS with user speech)
  - Audio recording for voice attachments
  - Input gain control
  - Level meter for mic input visualization
- **Key Methods**:
  - `init()`: Initialize AudioContext and media stream
  - `startSTT()`: Start speech-to-text with VAD gating
  - `stopSTT()`: Stop STT and send final transcript
  - `speakText()`: Text-to-speech via Cartesia TTS WebSocket
  - `initWakeWord()`: Initialize wake word detection
  - `getWakeWordMetrics()`: Get wake word performance metrics
  - `getRecordedAudioBase64()`: Get recorded audio as base64 for attachments

### `public/js/openwakeword-client.js`
**Purpose**: WebSocket client for openWakeWord Python server
- **Key Features**:
  - Connects to Python `openWakeWord` server
  - Sends 16 kHz 16-bit PCM audio chunks (1280 samples = 80ms)
  - Receives activation events
  - Automatic reconnection with exponential backoff
  - Max reconnect attempts: 10
- **Protocol**:
  - First message: sample rate (text: "16000")
  - Subsequent messages: binary PCM chunks
  - Server responses: JSON with `activations` array

### `public/js/openwakeword-manager.js`
**Purpose**: High-level interface for openWakeWord detection
- **Key Features**:
  - Initializes `wake-word-processor` AudioWorklet
  - Connects to `OpenWakeWordClient`
  - Handles wake word detection events
  - Cooldown management (prevents re-triggering)
  - Metrics tracking (detection count, latency, uptime)
- **Key Methods**:
  - `initialize()`: Set up AudioWorklet and WebSocket client
  - `setEnabled()`: Enable/disable wake word detection
  - `getMetrics()`: Get performance metrics
  - `setCooldownMs()`: Set cooldown period

### `public/js/n8n-payload.js`
**Purpose**: Shared utility for building n8n payloads and parsing responses
- **Key Features**:
  - Builds full payload with session ID, timestamp, location, attachments
  - Extracts reply from n8n JSON responses (handles multiple key formats)
  - Extracts file specifications from responses
  - Natural fallback replies when n8n doesn't return proper reply
  - Client location/timezone detection
- **Key Functions**:
  - `buildN8nPayload()`: Build complete payload with all fields
  - `extractReplyFromJson()`: Extract reply text from response
  - `extractFilesFromJson()`: Extract file creation specs
  - `getNaturalFallback()`: Generate fallback replies for common phrases

### `public/js/payload-verification.js`
**Purpose**: Validates payload and response structures
- **Key Features**:
  - Validates payload structure before sending
  - Validates response structure after receiving
  - `PayloadMonitor` class tracks all sends/receives
  - Comprehensive flow verification
- **Key Functions**:
  - `validatePayload()`: Check payload structure
  - `validateResponse()`: Check response structure
  - `verifyPayloadFlow()`: Comprehensive health check
- **Exports**:
  - `payloadMonitor`: Global instance for tracking

### `public/js/wake-word-tracker.js`
**Purpose**: UI component for displaying wake word detection status
- **Key Features**:
  - Real-time detection event display
  - Metrics display (detections, latency, uptime)
  - Status indicator (active/waiting/error)
  - Event history with timestamps
- **Key Methods**:
  - `setStatus()`: Update status indicator
  - `recordDetection()`: Record a detection event
  - `updateMetrics()`: Update metrics from bridge
  - `clearEvents()`: Clear event history

### `public/js/wake-word-error-monitor.js` (~1,200 lines)
**Purpose**: Monitors and auto-fixes wake word errors
- **Key Features**:
  - Intercepts console errors/warnings
  - Detects wake word-related errors using comprehensive regex patterns
  - Attempts automatic fixes (reinitialization, configuration changes)
  - Error categorization (20+ error types)
  - Fix history tracking
- **Error Types Detected**:
  - Invalid access key, activation refused, keyword file not found
  - Initialization timeout, frame/sample rate mismatch
  - AudioWorklet errors, CORS errors, network errors
  - WebSocket connection errors, Porcupine errors
  - Microphone permission, AudioContext errors
  - And more...

### `public/js/wake-word-console.js`
**Purpose**: Centralized logging for wake word errors/warnings
- **Key Features**:
  - Consistent console tagging: "[JARVIS Wake Word Error]" / "[JARVIS Wake Word]"
  - Deduplication to prevent log spam (10 second window)
  - Error history tracking (max 20 recent errors)
  - Listener system for UI updates
- **Key Functions**:
  - `logWakeWordError()`: Log error with deduplication
  - `logWakeWordWarn()`: Log warning with deduplication
  - `onWakeWordError()`: Subscribe to new errors
  - `getLastError()`: Get most recent error
  - `getRecentErrors()`: Get error history

---

## Utility Modules

### `public/js/audio-utils.js`
**Purpose**: Audio format conversion utilities
- **Key Functions**:
  - `floatTo16BitPCM()`: Convert Float32Array to Int16 PCM
  - `int16ToFloat32()`: Convert Int16 PCM to Float32Array
  - `float32ToInt16()`: Alias for floatTo16BitPCM
  - `decodeBase64PCM()`: Decode base64 PCM from Cartesia TTS

### `public/js/debug.js`
**Purpose**: Debug logger utility
- **Key Features**:
  - Enable via `window.JARVIS_DEBUG = true` or `?debug=1` URL parameter
  - Methods: `log()`, `warn()`, `error()`, `trace()`
  - HTML escaping utility: `escapeHtml()`

### `public/js/vad-config.js`
**Purpose**: Voice Activity Detection configuration
- **Key Features**:
  - VAD model: 'v5' (Silero)
  - Thresholds: positiveSpeechThreshold (0.3), negativeSpeechThreshold (0.25)
  - Timing: redemptionMs (1200ms), preSpeechPadMs (800ms), minSpeechMs (400ms)
  - Silence handling: silenceAfterSpeechToStopMicMs (2500ms)
  - Closing message: 10s silence triggers British closing phrase
  - CDN paths for ONNX model and WASM

### `public/js/file-creator.js`
**Purpose**: File creation and download utilities
- **Key Features**:
  - WAV blob creation from audio files or raw PCM
  - PDF creation from title and content
  - Image blob creation from base64
  - Text file creation
  - Safe filename generation
  - Download trigger utility
- **Key Functions**:
  - `createWavBlob()`: Create WAV from PCM samples
  - `createWavBlobFromAudioFile()`: Decode audio file to WAV
  - `createPdfBlob()`: Create PDF using jsPDF
  - `createImageBlobFromBase64()`: Create image blob
  - `createTextBlob()`: Create text file blob
  - `downloadBlob()`: Trigger download
  - `safeFilename()`: Sanitize filename

### `public/js/ocr-tool.js`
**Purpose**: Optical Character Recognition for image attachments
- **Key Features**:
  - Uses Tesseract.js for browser-based OCR
  - Image preprocessing (upscaling, grayscale)
  - Configurable Page Segmentation Mode (PSM)
  - Automatic rotation detection
  - Supports PNG, JPEG, GIF, WebP, BMP
- **Key Functions**:
  - `preprocessImageForOcr()`: Upscale and grayscale image
  - `runOcrOnImage()`: Run OCR on base64 image
  - `addOcrToAttachments()`: Add OCR text to attachment array
  - `isOcrSupportedType()`: Check if MIME type is supported

### `public/js/agentic-patterns.js`
**Purpose**: Client-side implementations of agentic design patterns
- **Key Features**:
  - **Memory**: `ConversationHistory` class for maintaining context
  - **Routing**: `classifyIntent()` for intent classification
  - **Guardrails**: `validateInput()`, `sanitizeOutput()` for safety
  - **Exception Handling**: `runWithRetry()` with exponential backoff
  - **Context Engineering**: `getContextEnrichment()` for device/layout hints
  - **Parallelization**: `runParallel()` for concurrent operations
- **Key Classes/Functions**:
  - `ConversationHistory`: In-memory conversation history
  - `classifyIntent()`: Rule-based intent classification
  - `validateInput()`: Input validation and sanitization
  - `sanitizeOutput()`: Output sanitization for XSS prevention
  - `runWithRetry()`: Retry logic with exponential backoff
  - `getContextEnrichment()`: Add viewport/userAgent context

---

## Audio Processors

### `public/audio/wake-word-processor.js`
**Purpose**: AudioWorklet processor for wake word detection
- **Key Features**:
  - Runs in dedicated audio thread
  - Captures microphone audio
  - Resamples to 16 kHz
  - Converts to Int16 PCM
  - Buffers into configurable frames (default: 512 samples, openWakeWord: 1280 samples)
  - Sends frames to main thread for processing
- **Configuration**:
  - Frame length set via `postMessage({ type: 'config', frameLength })`
  - Enable/disable via `postMessage({ type: 'enable', enabled })`

### `public/audio/tts-playback-processor.js`
**Purpose**: AudioWorklet processor for TTS playback
- **Key Features**:
  - Receives Int16 PCM chunks at 44.1 kHz from Cartesia
  - Resamples to AudioContext sample rate (typically 48 kHz)
  - Converts to Float32 for Web Audio API
  - Outputs gapless audio playback
- **Methods**:
  - Receives audio via `postMessage({ type: 'audio', samples })`
  - Clear buffer via `postMessage({ type: 'clear' })`

### `public/audio/stt-capture-processor.js`
**Purpose**: AudioWorklet processor for STT capture
- **Key Features**:
  - Captures microphone audio
  - Resamples from AudioContext rate (e.g., 48 kHz) to 16 kHz
  - Converts to Int16 PCM
  - Buffers into 100ms chunks (1600 samples @ 16 kHz) for optimal Cartesia STT latency
- **Constants**:
  - `SAMPLE_RATE_OUT`: 16000
  - `CHUNK_MS`: 100
  - `SAMPLES_PER_CHUNK`: 1600

---

## Test Files

### `tests/setup.js`
**Purpose**: Jest global setup file
- **Key Features**:
  - Sets `NODE_ENV` to 'test'
  - Optional console suppression (via `JEST_SILENT=1`)
  - Global `testUtils` for creating mock requests/responses
  - Lifecycle hooks (beforeAll, afterAll, beforeEach, afterEach)

### Test Files in `tests/unit/`:
- `payload-verification.test.js`: Tests payload and response validation
- `cartesia-audio-bridge.test.js`: Tests audio bridge functionality
- `vad-config.test.js`: Tests VAD configuration
- `ocr-tool.test.js`: Tests OCR functionality
- `n8n-payload.test.js`: Tests payload building and parsing
- `file-creator.test.js`: Tests file creation utilities
- `css-embedded.test.js`: Tests embedded CSS in HTML
- `copy-log-capture.test.js`: Tests console log capture
- `audioworklet-processors.test.js`: Tests AudioWorklet processors
- `agentic-patterns.test.js`: Tests agentic design patterns

---

## Debug Tools

### Debug Tools in `debug/tools/`:
- `debug-openwakeword-websocket-live.js`: Live WebSocket debugging
- `test-vite-openwakeword-integration.js`: Verify Vite + OpenWakeWord setup
- `test-text-response-fix.js`: Verify text response handling
- `test-python-installation.js`: Test Python environment
- `debug-openwakeword-config-live.js`: Comprehensive config debugging
- `wake-word-activation-test-cli.js`: Interactive wake word testing
- `debug-wake-word-keyword-validation-live.js`: Keyword validation testing
- `debug-wake-word-initialization.js`: Wake word initialization debugging
- `test-wake-word-activation-flow.js`: Test wake word → STT activation flow
- `verify-wake-word-setup.js`: High-level setup verification
- `check-console-errors.js`: Check for potential console errors

### Debug Tests in `debug/tests/`:
- `openwakeword-live.test.js`: Live OpenWakeWord integration tests
- `audio/format-boundary-live.test.js`: Audio format conversion boundary tests

### Debug Live Tests in `debug/live/`:
- `wake-word-initialization-live.test.js`: Browser-based wake word initialization test

### Debug Config in `public/debug/`:
- `wake-word-test-config.js`: Configuration for wake word tests

---

## Scripts

### Scripts in `scripts/` (`.mjs` files):
- `load-env-everywhere.mjs`: Load `.env` from project root
- `parse-env.mjs`: Parse and validate environment variables
- `test-env-loading.mjs`: Test environment variable loading
- `start-openwakeword-server.mjs`: Start OpenWakeWord Python server
- `sync-env.mjs`: Sync environment variables
- `kill-port-then-vite.mjs`: Kill port then start Vite

### Other Scripts:
- `parse-json-files.js`: Utility to parse all JSON files in project

---

## Summary Statistics

- **Total JavaScript Files**: 48 `.js` files, 7 `.mjs` files, 2 `.cjs` files
- **Main Application**: `app.js` (2,055 lines) - Core UI and interaction logic
- **Core Bridge**: `cartesia-audio-bridge.js` (~2,200 lines) - Audio pipeline orchestrator
- **Error Monitor**: `wake-word-error-monitor.js` (~1,200 lines) - Comprehensive error handling
- **Audio Processors**: 3 AudioWorklet processors for wake word, STT, and TTS
- **Test Coverage**: 10+ unit test files covering core functionality
- **Debug Tools**: 10+ debugging and diagnostic tools

---

## Key Architecture Patterns

1. **Audio Pipeline**: AudioWorklet processors run in dedicated threads for real-time audio processing
2. **Wake Word Detection**: openWakeWord backend (Python) via WebSocket for "Hey Jarvis" detection
3. **Payload Flow**: Structured payloads to n8n webhook with validation and monitoring
4. **Agentic Patterns**: Client-side implementations of Memory, Routing, Guardrails, Exception Handling
5. **Error Handling**: Comprehensive error monitoring and auto-fixing for wake word issues
6. **Multimodal Support**: OCR for images, file creation (PDF, images, text), audio attachments

---

## Dependencies

- **Cartesia API**: STT and TTS via WebSocket
- **n8n**: Backend workflow automation
- **openWakeWord**: Python server for wake word detection
- **@ricky0123/vad-web**: Voice Activity Detection
- **Tesseract.js**: OCR for images
- **jsPDF**: PDF generation
- **Vite**: Build tool and dev server

---

*Generated by parsing all JavaScript files in the JARVIS-WEB project*
