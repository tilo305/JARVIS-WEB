# JARVIS-WEB - Cartesia Bidirectional Conversation

Complete implementation of bidirectional conversational AI using Cartesia's STT and TTS WebSocket APIs with optimal latency configuration.

## Features

- ✅ **Live Real-Time STT**: VAD-gated streaming; partial transcripts as user speaks; 800ms pre-speech buffer
- ✅ **Optimal Latency TTS**: sonic-turbo (40ms first byte); gapless playback via AudioWorklet
- ✅ **Barge-in**: User speaking cancels TTS and processes new input
- ✅ **Bidirectional Flow**: Seamless STT → Processing → TTS pipeline
- ✅ **Continuations**: Maintain prosody across streamed text inputs
- ✅ **Error Handling**: Automatic reconnection and error recovery
- ✅ **Performance Monitoring**: Track latency metrics
- ✅ **TypeScript**: Fully typed implementation

## Installation

```bash
npm install
npm run build
```

### Chat UI (Vite)

Create a `.env` file in the project root with your Cartesia credentials (required for voice in the chat UI):

```
CARTESIA_API_KEY=sk_car_xxxx
CARTESIA_VOICE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_N8N_WEBHOOK_URL=https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96
```

**n8n LLM integration:** The chat UI sends user messages to the n8n webhook (POST JSON `{ "message": "..." }`). Your n8n workflow should return a JSON response with a reply field (`output`, `reply`, `result`, `text`, or `message`). The webhook URL is configured in `src/config.ts` and defaults to the value above; override with `VITE_N8N_WEBHOOK_URL` in `.env`.

**File creation:** When the user asks for a PDF, image, or text file, your n8n workflow can return a `files` array (or `createFiles`) alongside the reply. Each item must have `type` and type-specific fields; the app will generate and trigger a download. Supported types:

- **pdf**: `{ type: "pdf", title?: "Title", content: "Body text", filename?: "report.pdf" }`.
- **image**: `{ type: "image", data: "base64...", mime?: "image/png", filename?: "image.png" }`.
- **text**: `{ type: "text", content: "...", filename?: "notes.txt" }`.

**Audio files** are created from **uploads**: attach an audio file (e.g. MP3, WebM, OGG) with the paperclip; in the message you’ll see **Download** to save the file in its original format. WAV conversion from uploaded audio is available internally (e.g. for n8n or programmatic use) via `createWavBlobFromAudioFile` in `public/js/file-creator.js`.

The UI also has **Export chat to PDF** (header) for one-click export.

Then run the Vite dev server:

```bash
npm run vite
```

Opens at `http://localhost:3000` with the Iron Man–themed chat: chat history, mic (STT), send (text + TTS), and paperclip (multimodal attachments). Uses AudioWorklet + Cartesia STT/TTS per `aUdiO dOcS.md` and `cArTeSiA dOcS.md`.

## Configuration

Edit `src/config.ts` to customize (aligned with **cArTeSiA dOcS.md** for optimal latency):

- API key and voice ID
- **n8n webhook URL** (`N8N_WEBHOOK_URL`) for LLM responses
- **TTS model**: default `sonic-turbo` (40ms first byte) for live real-time; use `sonic-3` for 90ms
- **max_buffer_delay_ms**: 0 for streaming client-side (no server buffering)
- STT: 100ms chunks, ink-whisper, pcm_s16le 16kHz; sample rates and encoding

## Usage

### Bidirectional Conversation

```typescript
import { BidirectionalConversation } from './src/bidirectional-conversation.js';

const conversation = new BidirectionalConversation(async (userText) => {
  // Process user input (e.g., call LLM)
  return `Response to: ${userText}`;
});

await conversation.initialize();

// Send audio chunks (PCM s16le, 16000 Hz, 100ms chunks)
conversation.sendAudio(audioBuffer);
conversation.finalizeSTT(); // When user stops speaking
```

### Standalone TTS

```typescript
import { CartesiaTTSClient } from './src/tts-client.js';

const tts = new CartesiaTTSClient();
await tts.connect();

// Single message
tts.sendText('Hello, world!', 'context-1', false);

// Streaming with continuations
tts.streamTextChunks(['Hello, ', 'this is ', 'streaming.'], 'context-2');
```

### Standalone STT

```typescript
import { CartesiaSTTClient } from './src/stt-client.js';

const stt = new CartesiaSTTClient();
await stt.connect();

// Send audio chunks (PCM s16le, 16000 Hz)
stt.sendAudioChunk(audioBuffer);
stt.finalize(); // When done
```

## Examples

Run the example files:

```bash
# Bidirectional conversation
npm run example

# Simple TTS
node dist/src/examples/simple-tts.js

# Simple STT
node dist/src/examples/simple-stt.js
```

## Audio Format Requirements

### STT Input

- **Format**: PCM s16le (signed 16-bit little-endian)
- **Sample Rate**: 16000 Hz
- **Chunk Size**: 100ms intervals (1600 samples = 3200 bytes)

### TTS Output

- **Format**: PCM s16le
- **Sample Rate**: 8000 Hz (configurable)
- **Encoding**: Base64 encoded in WebSocket messages

## Performance Targets

- **TTS First Byte**: < 100ms (sonic-3) or < 50ms (sonic-turbo)
- **STT Partial**: < 500ms from audio chunk
- **STT Final**: < 1000ms from audio end
- **End-to-End**: < 2000ms (user speaks → response starts)

## Architecture

```
User Audio → STT WebSocket → Transcript Processing → TTS WebSocket → Audio Output
              (100ms chunks)    (LLM/Logic)          (Continuations)
```

## Browser Demo (AudioWorklet + VAD)

A browser-based implementation using Web Audio API AudioWorklet and Voice Activity Detection:

```bash
npm run serve
# Open http://localhost:3000
```

Features:

- **Live streaming STT**: VAD gates when to stream; stt-capture-processor streams 100ms chunks during speech; pre-speech buffer (800ms) for utterance onset
- **Partial transcripts**: `onPartialTranscript` delivers live text as user speaks
- **Barge-in**: User speaking cancels TTS playback and processes new input
- **sonic-turbo TTS**: 40ms first byte; gapless playback via AudioWorklet
- **VAD** (per `bOoK oN vOiCe BoT dEsIgN.md`): Turn-taking; `redemptionMs` 1200ms for responsiveness

VAD config (`public/js/vad-config.js`) aligns with Voice Bot Design heuristics: `redemptionMs`, `minSpeechMs`, `preSpeechPadMs`, etc.

See `aUdiO dOcS.md` for implementation details. See `bOoK oN vOiCe BoT dEsIgN.md` for VAD rationale.

## Electron (desktop app)

The same chat UI runs as a desktop app via Electron. The main process loads the Vite dev server in development or the built `dist-public` when packaged; the preload script exposes `window.electronAPI` (e.g. `isElectron`, `platform`, `invokeN8nWebhook`) so the renderer can use the n8n webhook without CORS.

**Development (Vite + Electron):**

```bash
npm run electron
```

Starts the Vite dev server and launches Electron once `http://localhost:3000` is ready. Uses the same `.env` (Vite injects `VITE_*` at build/dev).

**Run built app (no dev server):**

```bash
npm run vite:build
npm run electron:built
```

**Build for Electron (one shot):**

```bash
npm run electron:build
```

**Package as local app (installers):**

Create distributable installers for Windows, macOS, or Linux:

```bash
npm install
npm run dist        # Build for current platform
npm run dist:win    # Windows: .exe installer + portable
npm run dist:mac    # macOS: .dmg
npm run dist:linux  # Linux: AppImage
```

Output goes to `release/`. For packaged builds, put a `.env` file (with `CARTESIA_API_KEY`, `VITE_N8N_WEBHOOK_URL`, etc.) next to the installed executable to override defaults.

---

Validates paths with `node debug/tools/validate-electron-paths.js` after a build. See `docs/ELECTRON-DOCS.md` for official Electron docs and this project’s setup.

## Documentation

See `cArTeSiA dOcS.md` for comprehensive implementation guide and API details.  
See `aUdiO dOcS.md` for AudioWorklet + Cartesia integration.

## License

MIT
