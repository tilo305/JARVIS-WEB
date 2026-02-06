# JARVIS-WEB — Full-Stack Integration

This doc describes how the **front-end**, **UI**, **back-end** (Cartesia STT/TTS), and **n8n** webhook are connected so everything works at 100%.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (public/index.html + public/js/app.js)                 │
│  ┌─────────────┐  ┌──────────────────────┐  ┌─────────────────┐ │
│  │ UI (status, │  │ CartesiaAudioBridge   │  │ n8n payload     │ │
│  │ mic, chat)  │◄─┤ STT/TTS WebSockets    │  │ buildN8nPayload │ │
│  └─────────────┘  │ AudioWorklets, VAD    │  └────────┬────────┘ │
│         ▲          └──────────────────────┘            │         │
│         │                      │                       │         │
│         └──────────────────────┴───────────────────────┘         │
│                    getConfig() → apiKey, voiceId, n8nWebhookUrl  │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
  Cartesia API (STT/TTS)              n8n webhook (LLM)
  wss://api.cartesia.ai/...           POST JSON → reply + files
```

- **Config**: One source of truth. With **Vite** (`npm run vite`): `vite.config.js` injects `VITE_*` from `.env`. With **static server** (`npm run serve`): `window.JARVIS_CONFIG` in `index.html` (or set before load).
- **Bridge ↔ UI**: `CartesiaAudioBridge` callbacks (`onTranscript`, `onSTTStopped`, `onSpeechStart`/`onSpeechEnd`, etc.) drive status and mic state. `setStatus()` and `syncMicButton()` are the single place for header status and mic button.
- **App ↔ n8n**: `getLLMReply()` builds payload with `buildN8nPayload()`, POSTs to `n8nWebhookUrl`, parses reply with `extractReplyFromJson()` / `extractFilesFromJson()`.

## Cartesia integration (bridged and connected)

Cartesia is the single voice stack: **STT** (speech-to-text) and **TTS** (text-to-speech). It is integrated end-to-end:

| Connection | How it works |
|------------|----------------|
| **Frontend ↔ Cartesia** | `CartesiaAudioBridge` in `public/js/cartesia-audio-bridge.js` holds STT/TTS WebSockets (`wss://api.cartesia.ai/stt/websocket`, `.../tts/websocket`). Config: `apiKey` and `voiceId` from `getConfig()` (Vite `VITE_CARTESIA_*` or `window.JARVIS_CONFIG`). |
| **Bridge ↔ UI** | Bridge callbacks drive the UI: `onTranscript` → `getLLMReply` → `bridge.speakText(reply)` (TTS); `onSTTStarted` / `onSTTStopped` → `syncMicButton()`; `onError` → `setStatus('Error')`. Mic button is disabled when no API key. |
| **Bridge ↔ Open Wake Word** | Bridge owns `OpenWakeWordManager`. Same mic stream feeds wake-word detection and STT. On wake word: `_onWakeWordDetected` → STT activated → same `onTranscript` path → n8n → TTS. No separate voice path for wake word. |
| **Bridge ↔ Backend / n8n** | Voice and text both use `getLLMReply()` → POST to `n8nWebhookUrl`. No Cartesia on the Node server (`server.js` is static only). `src/config.ts` defines `CARTESIA_CONFIG` for Node/TS usage (e.g. examples). |

**Single pipeline**: Mic (or wake word) → Bridge STT → `onTranscript` → n8n → reply → `bridge.speakText()` (Cartesia TTS) → playback. One config source, one bridge, one n8n payload shape.

## Running at 100%

### 1. Environment

- Copy `.env.example` to `.env` and set at least:
  - `VITE_CARTESIA_API_KEY` (or `CARTESIA_API_KEY`) — required for voice
  - `VITE_N8N_WEBHOOK_URL` — required for LLM replies (default in example)
- Optional: wake word (`VITE_WAKE_WORD_ENABLED`, `VITE_USE_OPENWAKEWORD`, `VITE_OPENWAKEWORD_WS_URL`).

### 2. Development (Vite — recommended)

```bash
npm run vite
# or
npm run dev:full
```

- Serves from `public/` with hot reload.
- Injects `VITE_*` from `.env` into the app.
- Cartesia WebSocket check runs at startup and every 30s in the terminal.

### 3. Production build + serve

```bash
npm run vite:build
npm run serve
```

- `vite:build` outputs to `dist-public/`.
- `serve` uses `server.js`: if `dist-public/index.html` exists, it serves **dist-public** (production); otherwise it serves **public/** (dev fallback).

One-shot production:

```bash
npm run serve:prod
```

Builds then runs the same server (serving `dist-public`).

### 4. Static server only (no Vite)

```bash
npm run serve
```

- Serves `public/` when `dist-public` is not present.
- Set `window.JARVIS_CONFIG` in `index.html` or before loading the app (e.g. `apiKey`, `voiceId`, `n8nWebhookUrl`).

## Integration checklist

| Layer        | Responsibility                    | Config / entry point                          |
|-------------|------------------------------------|-----------------------------------------------|
| **UI**      | Chat, mic, status, wake word UX   | Same process as app.js                        |
| **App**     | getConfig(), bridge, n8n calls    | VITE_* (Vite) or JARVIS_CONFIG (static)       |
| **Bridge**  | STT/TTS WebSockets, VAD, wake word | Options from app (apiKey, voiceId, paths)      |
| **n8n**     | LLM + optional files              | `n8nWebhookUrl` from config                   |
| **Server**  | Static files                       | `dist-public` if built, else `public`          |

- **API version**: Cartesia `2025-04-16` in `vite.config.js`, `cartesia-audio-bridge.js`, and `src/config.ts`.
- **AudioWorklet path**: Passed as `audioWorkletBasePath` from app (from `import.meta.url` or fallback `./audio/`).

## Processors, managers, clients — full wiring

All processors, managers, and clients are integrated through a single entry point and the bridge.

| Component | Role | Wired by | Connects to |
|-----------|------|---------|-------------|
| **app.js** | Entry point, config, UI, n8n calls | `index.html` (single `<script type="module" src="./js/app.js">`) | Bridge (callbacks), WakeWordTracker, WakeWordErrorMonitor, buildN8nPayload |
| **CartesiaAudioBridge** | STT/TTS WebSockets, VAD, wake word orchestration, audio graph | app.js (constructor + callbacks) | STT/TTS processors, WakeWordManager, Cartesia API, UI via callbacks |
| **OpenWakeWordManager** | OpenWakeWord wake word, audio for detection | Bridge (`_initOpenWakeWord`) | `wake-word-processor.js` (AudioWorklet), bridge `onWakeWordDetected` |
| **stt-capture-processor.js** | Mic → 16 kHz PCM chunks for STT | Bridge (`init()` loads; `startSTT` / wake-word pre-setup create node) | Bridge receives chunks → `_sendChunkToSTT` → Cartesia STT WebSocket |
| **tts-playback-processor.js** | Cartesia TTS PCM → speaker | Bridge (`init()` loads and creates node) | Bridge sends chunks via `ttsNode.port.postMessage` |
| **wake-word-processor.js** | Mic → 16 kHz frames for openWakeWord | OpenWakeWordManager (`initialize()` loads and creates node) | OpenWakeWordManager → WebSocket → Python openWakeWord server |
| **n8n-payload.js** | Single payload builder and reply/file extraction | app.js `buildPayload` → `getLLMReply` | All user messages (text, voice, wake-word voice) use same payload; n8n webhook |
| **WakeWordTracker** | Header UX: status, metrics, events | app.js (creates, passes status from bridge/tracker) | DOM (`#wakeWordTracker`, etc.); `updateTrackerStatus()` uses `bridge.getWakeWordMetrics()` |
| **WakeWordErrorMonitor** | Auto-handle wake word errors | app.js (when wake word enabled) | Bridge; on fix calls `updateTrackerStatus()` |

**Data flow**

- **Text**: User types → Send → `buildPayload(text, { source: 'text', attachments })` → `getLLMReply` → n8n → reply → TTS (if apiKey) → `appendMessage`.
- **Voice (mic button)**: Click mic → `bridge.startSTT({ skipWakeWordWait: true })` → STT streaming → VAD → final transcript → `onTranscript` → same `buildPayload(..., { source: 'voice', attachments })` → n8n → reply → TTS → optional `startSTT({ skipWakeWordWait: true })` again.
- **Voice (wake word)**: Wake word on → `_onWakeWordDetected` → STT activated (pre-connected WS + pre-set graph) → same `onTranscript` path as mic → same n8n payload and TTS.
- **Backend**: Only n8n webhook (POST JSON). No app-specific backend in `server.js` (static files only). Config from `.env` / `JARVIS_CONFIG`.

**Cleanup**

- `bridge.destroy()` (e.g. on `beforeunload`): stops STT, disconnects TTS, releases WakeWordManager, stops media stream tracks, closes AudioContext.
- app.js `beforeunload`: also clears wake word retries, metrics interval, tracker destroy, error monitor stop.

## Troubleshooting

- **No voice**: Check `apiKey` and Cartesia WebSocket logs in terminal (Vite dev).
- **No LLM reply**: Check `n8nWebhookUrl`, CORS, and n8n “Respond to Webhook” node.
- **Wake word**: Requires `VITE_WAKE_WORD_ENABLED=true`, `VITE_USE_OPENWAKEWORD=true`, and `VITE_OPENWAKEWORD_WS_URL` (e.g. `ws://localhost:8765/ws`). Run `python scripts/openwakeword-server.py`.

Run `JARVIS_DEBUG_CHECK_CONFIG()` in the browser console (with `?debug=1`) to inspect config and mic status.
