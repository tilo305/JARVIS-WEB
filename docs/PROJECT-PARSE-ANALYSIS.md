# JARVIS-WEB — Full Project Parse

**Generated:** 2025-02-05  
**Purpose:** Single reference for project structure, entry points, data flow, and key files.

---

## 1. Project Overview

**Name:** `jarvis-web-cartesia`  
**Type:** Bidirectional voice + chat web app (Iron Man–themed “JARVIS”)  
**Stack:** TypeScript (Node/backend), JavaScript (browser), Vite (frontend build), Cartesia STT/TTS WebSockets, OpenWakeWord (wake word), n8n (LLM webhook).

- **Live real-time STT:** VAD-gated streaming, 100ms chunks, 16 kHz PCM, partial + final transcripts.
- **TTS:** Cartesia sonic-3 (or sonic-turbo), gapless playback via AudioWorklet.
- **Barge-in:** User speech cancels TTS and processes new input.
- **Wake word (optional):** OpenWakeWord "hey jarvis" to start listening.
- **Chat UI:** Text input, mic, paperclip (attachments), n8n webhook for LLM; optional PDF/image/text file creation from reply.

---

## 2. Repository Layout

```
JARVIS-WEB/
├── .cursor/rules/          # Cursor rules (e.g. Wake word AccessKey)
├── .env.example            # Env template (VITE_*, CARTESIA_*, N8N_*, WAKE_WORD_*, etc.)
├── public/                 # Vite root — static assets and browser app
│   ├── index.html          # Single-page chat UI (Iron Man theme)
│   ├── js/
│   │   ├── app.js          # Main UI: bridge, n8n, wake word, chat, file handling
│   │   ├── cartesia-audio-bridge.js   # STT/TTS/VAD/wake word orchestration
│   │   ├── openwakeword-manager.js    # OpenWakeWord init & detection
│   │   ├── wake-word-tracker.js       # UI tracker (status, metrics, events)
│   │   ├── wake-word-error-monitor.js # Error monitoring
│   │   ├── wake-word-console.js       # Wake word error logging
│   │   ├── n8n-payload.js             # Webhook payload + reply/files extraction
│   │   ├── file-creator.js            # PDF/image/text blobs + download
│   │   ├── ocr-tool.js                # OCR for image attachments
│   │   ├── vad-config.js              # VAD tuning (redemptionMs, preSpeechPadMs, etc.)
│   │   ├── audio-utils.js             # decodeBase64PCM, floatTo16BitPCM, etc.
│   │   └── debug.js                   # DEBUG trace/warn/error
│   ├── audio/              # AudioWorklet processors
│   │   ├── stt-capture-processor.js   # Mic → 16kHz, 100ms chunks → STT
│   │   ├── tts-playback-processor.js  # TTS PCM playback
│   │   └── wake-word-processor.js     # 16kHz frames for OpenWakeWord
│   ├── debug/              # Debug HTML pages (wake word test, console errors, etc.)
│   └── keywords/           # (deprecated) Previously used for Porcupine .ppn files; now using OpenWakeWord
├── src/                    # TypeScript (Node / backend / examples)
│   ├── config.ts           # N8N_WEBHOOK_URL, CARTESIA_CONFIG (TTS/STT/WS)
│   ├── index.ts            # Re-exports (STT, TTS, BidirectionalConversation, config, types)
│   ├── stt-client.ts       # Cartesia STT WebSocket client
│   ├── tts-client.ts       # Cartesia TTS WebSocket client
│   ├── bidirectional-conversation.ts  # STT → process → TTS orchestration
│   ├── types.ts            # Shared types
│   └── examples/           # simple-tts, simple-stt, bidirectional-conversation
├── server.js               # Static file server (dist-public or public), loads .env via scripts
├── scripts/
│   ├── load-env-everywhere.mjs  # Load .env from project root (used by server, Vite)
│   ├── sync-env.mjs             # Env sync helper
│   └── kill-port-then-vite.mjs  # Kill port then run Vite (dev or build)
├── tests/
│   ├── setup.js
│   ├── jest-verification.test.ts
│   └── unit/               # app logic, n8n payload, bridge, config, file-creator, etc.
├── debug/                  # Debug docs + tools (wake word verification, activation flow)
├── docs/                   # Integration, troubleshooting, archive
├── package.json
├── vite.config.js          # Vite config: root=public, env, static copy, Cartesia WS check
├── tsconfig.json
├── jest.config.cjs
└── eslint.config.js
```

---

## 3. Entry Points & Scripts

| Script | Purpose |
|--------|--------|
| `npm run vite` | Vite dev server (root=public), port from PORT or 3000 |
| `npm run serve` | Node static server (dist-public if present, else public) |
| `npm run serve:prod` | Kill port, Vite build, then serve |
| `npm run build` | TypeScript compile (src → dist) |
| `npm run start` | Run `node dist/index.js` (Node entry) |
| `npm run example` | Run bidirectional-conversation example |
| `npm run test` / `npm run test:unit` | Jest tests |
| `npm run test:wakeword` | Verify wake word setup |
| `npm run test:wakeword:activation` | Test wake word activation flow |
| `npm run lint` / `lint:fix` / `lint:check` | ESLint |
| `npm run verify` | lint:check + build + test |
| `npm run check` | lint + build + test + vite:build |

**Browser app entry:** `public/index.html` → `<script type="module" src="./js/app.js">`.  
**Node entry:** `src/index.ts` (re-exports); examples under `src/examples/`.

---

## 4. Configuration

- **Single source of env:** `.env` at project root. Loaded by:
  - `scripts/load-env-everywhere.mjs` (server, Vite via `vite.config.js`).
  - Vite injects `VITE_*` (and mirrored names) into `import.meta.env` / `define` in `vite.config.js`.
- **Static server / non-Vite:** `window.JARVIS_CONFIG` in `index.html` can override apiKey, voiceId, n8nWebhookUrl, wake word options.
- **Key env vars (see `.env.example`):**
  - Cartesia: `CARTESIA_API_KEY`, `CARTESIA_VOICE_ID` (or `VITE_*`)
  - n8n: `N8N_WEBHOOK_URL` (or `VITE_N8N_WEBHOOK_URL`)
  - Wake word: `WAKE_WORD_ENABLED`, `WAKE_WORD_ACCESS_KEY`, `PORCUPINE_KEYWORD`, `PORCUPINE_SENSITIVITY`, `DEBUG_WAKE_WORD` (and `VITE_*` forms)
  - Server: `PORT`

**Code config:**
- `src/config.ts`: `N8N_WEBHOOK_URL`, `CARTESIA_CONFIG` (API version, TTS/STT endpoints, sample rates, chunk sizes, WS timeouts).
- `public/js/app.js` `getConfig()`: reads env + `JARVIS_CONFIG`, resolves keyword paths (built-in vs custom .ppn).

---

## 5. Data Flow (Browser)

1. **Page load:** `app.js` runs → `getConfig()` → creates `CartesiaAudioBridge`, `WakeWordTracker`, wires UI (mic, send, paperclip, export PDF).
2. **Voice pipeline:**
   - User clicks mic (or wake word fires if enabled) → bridge starts STT.
   - Mic → AudioWorklet `stt-capture-processor.js` → 48kHz→16kHz, 100ms chunks → bridge → Cartesia STT WebSocket.
   - Optional: `wake-word-processor.js` feeds 16kHz frames; OpenWakeWord runs via WebSocket to Python server; on detection, bridge turns on STT (with cooldown).
   - STT partial/final → bridge callbacks → `onTranscript` / `onPartialTranscript` → UI (status, input line).
   - Final transcript (or timeout) → app builds n8n payload (`n8n-payload.js`: `buildN8nPayload`, session, timezone, attachments) → POST to n8n webhook.
   - n8n response → `extractReplyFromJson` / `extractFilesFromJson` → reply text + optional file specs → TTS (bridge sends text to Cartesia TTS WS) + file creation (file-creator.js) + chat bubbles.
   - TTS audio → `tts-playback-processor.js` → playback; barge-in stops TTS and processes new speech.
3. **Text send:** User types and clicks send → same n8n POST + reply + TTS + file handling as above.
4. **Attachments:** Paperclip → file input; images can get OCR (`ocr-tool.js`); payload includes base64 or references; n8n can return `files`/`createFiles` for PDF/image/text generation and download.

---

## 6. Key Modules

| Module | Role |
|--------|------|
| **app.js** | Chat UI, bridge lifecycle, n8n send, wake word tracker wiring, status/mic state, export PDF, file handling. |
| **cartesia-audio-bridge.js** | One bridge for STT + TTS: AudioContext, VAD (MicVAD), WakeWordManager, STT/TTS WebSockets, pre-speech buffer, silence timers, barge-in, level meter, optional recorded audio. |
| **openwakeword-manager.js** | OpenWakeWord init, AudioWorklet wake-word-processor, WebSocket to Python server, frame queue, cooldown, retry logic. |
| **wake-word-tracker.js** | UI: status text, indicator, last error, metrics (detections, latency, uptime), events list. |
| **n8n-payload.js** | `buildN8nPayload`, `extractReplyFromJson`, `extractFilesFromJson`, `getClientLocation`, `getNaturalFallback`. |
| **file-creator.js** | `createPdfBlob`, `createImageBlobFromBase64`, `createTextBlob`, `downloadBlob`, `isAudioFile`, `safeFilename`; WAV from uploads for internal use. |
| **vad-config.js** | VAD options (redemptionMs, minSpeechMs, preSpeechPadMs, etc.) per voice bot design. |
| **audio-utils.js** | Base64 PCM decode, float↔int16 conversion for STT/wake word. |

---

## 7. Audio Pipeline (Specs)

- **STT input:** PCM s16le, 16 kHz, 100ms chunks (1600 samples).  
  Captured by `stt-capture-processor.js` (resample from context sample rate, then chunk).
- **TTS output:** PCM s16le, 44.1 kHz (config in `config.ts`), base64 in WebSocket messages; played by `tts-playback-processor.js`.
- **Wake word:** 16 kHz, frame length 512; `wake-word-processor.js` resamples and buffers; frames sent via WebSocket to OpenWakeWord Python server.

---

## 8. n8n Contract

- **Request:** POST JSON to `N8N_WEBHOOK_URL`. Payload includes `message`, `session_id`, timezone/locale, optional attachments (e.g. base64 images, audio refs). See `buildN8nPayload` in `n8n-payload.js`.
- **Reply:** First of `output`, `reply`, `result`, `text`, `message`, … (see `N8N_REPLY_KEYS`). Can be top-level, inside array item, or in `item.json` (n8n item format).
- **Files:** Optional `files` / `createFiles` array; each item has `type` (`pdf`|`image`|`text`) and type-specific fields (e.g. `content`, `data` base64, `filename`). App creates blobs and triggers download.

---

## 9. Tests

- **Unit (Jest):** `tests/unit/` — config, n8n-payload, cartesia-audio-bridge, file-creator, ocr-tool, audio-utils, vad-config, audioworklet-processors, css-embedded.
- **Debug / wake word:** `debug/tools/` (e.g. `verify-wake-word-setup.js`, `test-wake-word-activation-flow.js`, `wake-word-activation-test-cli.js`).
- **Lint:** ESLint (root + src/public/server configs).

---

## 10. Documentation (In-Repo)

- **README.md:** Features, install, Chat UI (Vite), config, usage (bidirectional, TTS, STT), audio formats, performance targets, architecture diagram, browser demo, VAD.
- **Root .md files:** Various specs (e.g. `aUdiO dOcS.md`, `cArTeSiA dOcS.md`, `wAkE wOrD dOcS.md`, `viTe DoCs.md`, etc.).
- **docs/:** INTEGRATION.md, WAKE-WORD-TROUBLESHOOTING.md, N8N-POSTGRESQL-SETUP-GUIDE.md, WAKE-WORD research, archive.
- **debug/:** README, STATUS, wake word verification and activation test docs.

---

## 11. Cursor / Project Rules

- **.cursor/rules/wake-word-accesskey.mdc:** Do not suggest changing or re-getting the AccessKey for wake word issues; debug only code/config/env/integration.

---

## 12. Quick Reference

| Want to… | Look at |
|----------|--------|
| Change TTS/STT params or n8n URL | `src/config.ts`, `.env` |
| Change UI or chat behavior | `public/js/app.js` |
| Change STT/TTS/wake word pipeline | `public/js/cartesia-audio-bridge.js`, `openwakeword-manager.js` |
| Change n8n request/response shape | `public/js/n8n-payload.js` |
| Change VAD (turn-taking, pre-speech) | `public/js/vad-config.js` |
| Add/modify file types from n8n | `public/js/file-creator.js`, `extractFilesFromJson` in n8n-payload.js |
| Run Node-side conversation | `src/bidirectional-conversation.ts`, `src/examples/` |
| Serve production build | `npm run serve:prod` (builds then serves `dist-public`) |

This parse is the single place to understand the whole project structure and flow.
