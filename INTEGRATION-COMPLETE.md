# JARVIS-WEB — Integration Complete

This document confirms the full integration of **AudioWorklet**, **VAD**, **Cartesia**, **Frontend**, **Vite/Backend**, **UI**, **Processors**, **Clients**, **Managers**, and **Bridges**.

## Build & Serve

- **Backend (TypeScript)**: `npm run build` compiles `src/` → `dist/` (Cartesia STT/TTS clients, config, types). Debug test files are excluded from the main build.
- **Frontend (Vite)**: `npm run vite:build` builds `public/` → `dist-public/` (index.html, bundled JS, copied `audio/`, `js/n8n-payload.js`, `debug/*.html`).
- **Server**: `npm run serve` serves **dist-public** when `dist-public/index.html` exists (production), otherwise **public** (development). Logs which directory is used at startup.

## Integration Points

| Layer | Implementation | Connection |
|-------|----------------|------------|
| **AudioWorklet** | `public/audio/stt-capture-processor.js`, `tts-playback-processor.js` | Bridge loads via `audioWorkletBasePath` (runtime `new URL('../audio/', import.meta.url)`); Vite copies `audio/*` into `dist-public/audio/`. |
| **VAD** | `@ricky0123/vad-web` MicVAD + `public/js/vad-config.js` | Bridge constructs MicVAD in `startSTT()` with `VAD_CONFIG` and `getStream()`; callbacks `onSpeechStart`/`onSpeechEnd`/`onVADMisfire` drive UI and STT streaming. |
| **Cartesia** | STT/TTS WebSockets in `cartesia-audio-bridge.js` | Bridge connects to `wss://api.cartesia.ai/stt/websocket` and `.../tts/websocket`; API version `2025-04-16`; config from `getConfig()` (Vite env or `window.JARVIS_CONFIG`). |
| **Frontend** | `public/index.html` + `public/js/app.js` | Single entry: `<script type="module" src="./js/app.js">`; app creates `CartesiaAudioBridge`, wires callbacks, and exposes `window.JARVIS_BRIDGE`. |
| **Vite** | `vite.config.js` (root `public`, env, static copy, Cartesia WS check) | Injects `VITE_*` at build time; dev server runs Cartesia WebSocket reachability check; production build outputs to `dist-public`. |
| **UI** | Status, mic button, chat, Ready button, copy-log, export PDF | `setStatus()` / `syncMicButton()` from bridge callbacks; Ready button uses `window.JARVIS_BRIDGE.stopSTT()` and `window.JARVIS_BRIDGE.stopTTS()`. |
| **Processors** | STT capture (16 kHz PCM), TTS playback (44.1 kHz → context) | Bridge creates `AudioWorkletNode`s and connects graph: mic → gain → analyser, gain → stt-node; TTS node → destination. |
| **Clients** | Node `src/stt-client.ts`, `tts-client.ts`, `bidirectional-conversation.ts` | Exported from `src/index.ts` for programmatic use; browser uses bridge + WebSockets directly. |
| **Managers** | — | Bridge uses MicVAD for speech detection; mic button for manual activation. |
| **Bridges** | `CartesiaAudioBridge` | Central bridge: STT/TTS WebSockets, VAD, AudioWorklet graph, recording, barge-in, silence timers; `stopTTS()` alias for Ready/reset. |

## Changes Made

1. **`window.JARVIS_BRIDGE`** — Exposed in `app.js` after bridge construction so the Ready button and external scripts can call `stopSTT()` / `stopTTS()`.
2. **`stopTTS()` on bridge** — Added alias that calls `cancelTTS()` so the Ready button in `index.html` works.
3. **Server** — Uses `dist-public` when `dist-public/index.html` exists, else `public`; logs which directory is served; path resolution uses `normalize()` for security.
4. **TypeScript** — `tsconfig.json` excludes `debug` so `npm run build` only compiles `src/` and `tests/`, fixing Jest-related type errors in `debug/`.
5. **Duplicate `escapeHtml`** — Removed from `public/js/debug.js` so Vite build succeeds.
6. **Audio worklet URL** — Left as runtime `new URL('../audio/', import.meta.url)` with optional `@vite-ignore` comment; Vite build copies `audio/*` into `dist-public/audio/`.

## Quick Commands

```bash
npm install
npm run build          # TypeScript (src → dist)
npm run vite:build     # Frontend (public → dist-public)
npm run serve          # Serve dist-public or public on PORT
npm run serve:prod     # Build then serve (dist-public)
npm run vite           # Dev server (Vite, public/)
```

## Latency & bidirectional flow (Vite)

Optimized for low latency and natural back-and-forth:

- **TTS**: `sonic-turbo` (40ms first-byte), TTS WebSocket pre-connected on STT start and in parallel while waiting for n8n; `max_buffer_delay_ms: 0`; multi-sentence replies use `streamTextChunks()` with `continue: true` for prosody.
- **STT**: 100ms chunks, `finalize` on VAD speech end; optional **send on final** via `VITE_SEND_TRANSCRIPT_ON_FINAL=true` (send to agent as soon as STT returns final, skip silence wait).
- **Barge-in**: User speech cancels TTS immediately; silence timers paused during TTS so they don’t block barge-in; STT kept active during TTS when possible.
- **VAD**: Tuned in `vad-config.js` (redemptionMs 900, preSpeechPadMs 600, minSpeechMs 300, silenceAfterSpeechToStopMicMs 2500).

Vite build adds no artificial delay; env is injected at build time.

## Environment

- `.env`: Set `VITE_CARTESIA_API_KEY` (or `CARTESIA_API_KEY`) and `VITE_N8N_WEBHOOK_URL` for full voice + LLM flow.
- Optional: `VITE_SEND_TRANSCRIPT_ON_FINAL=true` for minimal latency (send to agent on STT final instead of after silence).
- Production: Use HTTPS; AudioWorklet and microphone require a secure context.

All listed components are wired and connected; the project builds and is ready for development and production serve.
