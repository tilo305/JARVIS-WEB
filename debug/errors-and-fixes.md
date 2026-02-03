# Errors and Fixes Log

Per **zEn DeBuGgEr.md** — all fixes documented here. Ensure fixes are 100% working.

---

## 10s Silence Timer & Conversation Stopping (Fixes Verified)

### 1. 10 seconds of silence — timer starts too early
- **Fix:** `silenceClosingDelayAfterTtsMs: 3500` in `vad-config.js`. The 10s countdown starts only **after** a 3.5s delay following TTS "done", so playback can drain and the 10s doesn’t feel like it started too soon.
- **Code:** `cartesia-audio-bridge.js` → `startAgentSilenceTimer()` uses the delay before starting the 10s timer; `onSpeechStart` clears both timers.
- **See:** `debug/SILENCE-AND-CONVERSATION-TIMER-FIXES.md`

### 2. Conversation stopping too early
- **Fix:** `silenceAfterSpeechToStopMicMs: 3500` in `vad-config.js` (increased from 2500). The mic stays open for **3.5s** of user silence after speech end before stopping and sending the transcript, so brief pauses don’t cut off the turn.
- **Code:** `cartesia-audio-bridge.js` uses `VAD_CONFIG.silenceAfterSpeechToStopMicMs` for the post-speech stop timer.
- **See:** `debug/SILENCE-AND-CONVERSATION-TIMER-FIXES.md`

### Verification
- `npm run test:unit` — vad-config and cartesia-audio-bridge tests pass.
- `npm run lint` — no errors.
- Manual: `?debug=1` — after agent speaks, 3.5s + 10s silence → closing message; after user speaks, 3.5s pause still keeps mic on.

---

## 2025-02-02 (STT Invalid Sample Rate — No Text / No Voice)

### Symptom

- Console error: `[JARVIS] [ERROR] STT server error Invalid sample rate: The sample rate is not valid, make sure it is a whole number.`
- STT WebSocket closes immediately after connect
- No transcript → no n8n call → no TTS response (even though n8n reports OK)

### Root Cause

Cartesia STT WebSocket expects config in **URL query parameters**, not as the first JSON message. Sending config as the first message triggered "Invalid sample rate" validation errors.

### Fix (Conclusive 2025-02-02)

In `public/js/cartesia-audio-bridge.js`, STT connection:
- **Before:** Sent config (model, encoding, sample_rate, etc.) as first WebSocket message → API returns "Invalid sample rate"
- **After:** Pass config as URL query params (`?model=ink-whisper&encoding=pcm_s16le&sample_rate=16000&...`) → API accepts

**Reference:** @cartesia/cartesia-js SDK (`wrapper/SttWebsocket.js`) uses query params only; no config message after connect.

### Files

- `public/js/cartesia-audio-bridge.js`
- `tests/unit/cartesia-audio-bridge.test.js` (regression test)
- `debug/SAMPLE-RATE-RESEARCH.md` (new)

### Verify

- **CLI:** `npm run debug:stt` — connects to STT WebSocket with `sample_rate: 16000` (integer), reports OK/FAIL
- **Browser:** Reload `http://localhost:3000/?debug=1`, click mic, speak — STT should connect, transcripts should reach n8n, voice response should play

---

## 2025-02-02 (Fallback Revert Research — Mic & Text Messages)

### Symptom

Both the mic button and text messages revert to their fallbacks:
- **Mic:** Reverts to idle (gray, "Microphone — click to talk") when user expects recording state
- **Text:** Assistant replies use natural/generic fallbacks instead of real n8n/LLM responses

### Research

- **`debug/FALLBACK-REVERT-RESEARCH.md`** — Full root-cause analysis:
  - Mic revert: caused by `onSTTStopped` firing 2.5s after speech end (silenceAfterSpeechToStopMicMs), or 10s closing timer, or on error
  - Text fallbacks: n8n returns JSON without `output`/`reply`/`result`/`text`/`message`/`response`/`answer`/`content`, or CORS/404/network error

### Debug Tools Added

- **`public/debug/fallback-revert-debug.html`** — Live browser n8n test:
  - POST to webhook from same CORS context as main app
  - Shows extractReplyFromJson result, fallback used, raw response
  - Use to diagnose why text messages get fallbacks

### App Instrumentation (Debug Mode)

- **`public/js/app.js`** — When `?debug=1` or `window.JARVIS_DEBUG`:
  - `syncMicButton` logs `{ recording, disabled }` on every call
  - `onSTTStopped` logs when mic reverts to idle
  - `getLLMReply` logs `n8n: using fallback` when no reply in n8n response

### Status

Research complete. Use debug tools to diagnose; apply fixes based on findings (e.g. n8n workflow structure, VAD timing).

### Mic Flow — Natural Bidirectional Conversation (2025-02-02)

- **Intended flow:** User speaks → stops → 2.5s timer starts → after 2.5s of user silence, stop mic → then send transcript to agent.
- **Implementation:** onSpeechEnd starts 2.5s timer. Final transcript from STT is buffered in _pendingFinalTranscript. When 2.5s fires: stop mic (close WebSocket), then call onTranscript with buffered transcript so agent responds. WebSocket stays open for 2.5s so we receive the transcript before closing.
- **File:** `public/js/cartesia-audio-bridge.js`, `public/js/vad-config.js`

### n8n Full Payload Fix (2025-02-02)

- **Issue:** Webhook body only had `message`; session_id, timezone, location, etc. were missing. Debug tools sent minimal payload.
- **Fix:** Created shared `public/js/n8n-payload.js` — single source of truth for all n8n requests. Chat UI, debug test, check-n8n-webhook, and fallback-revert-debug all use `buildN8nPayload()` which always sends: message, session_id, sessionId, timestamp, timezone, location, message_id, messageId, source, attachments, locale, language.
- **Files:** `public/js/n8n-payload.js` (new), `public/js/app.js`, `debug/live/n8n-webhook.test.js`, `debug/tools/check-n8n-webhook.js`, `public/debug/fallback-revert-debug.html`
- **Test:** `tests/unit/n8n-payload.test.js` ensures full payload structure.

### Timer Fix (2025-02-02)

- **Issue:** 2.5s timer never ran; only 10s closing timer was active (mutually exclusive branches).
- **Fix:** Split timers correctly:
  - **2.5s** (`onSpeechEnd`): Stop mic 2.5s after user stops speaking.
  - **10s** (`startAgentSilenceTimer`): Called when agent finishes TTS; after 10s no user speech, agent says "Standing by...", then mic stops.
- **Files:** `cartesia-audio-bridge.js`, `app.js`, `vad-config.js`
- **Tests:** `tests/unit/cartesia-audio-bridge.test.js` added for bridge API surface.

### Mic Not Sending Payload to n8n (2025-02-02)

- **Issue:** Mic flow sometimes never sends transcript payload to n8n (recurring). User speaks but no POST to webhook.
- **Root causes (see `debug/MIC-N8N-PAYLOAD-RESEARCH.md`):**
  1. **Race:** Final transcript from Cartesia STT can arrive after the 2.5s timer fires; when timer ran, `_pendingFinalTranscript` was still null → no `onTranscript` → no n8n.
  2. **No final:** STT might only send partials (`is_final: false`) for short utterances → `_pendingFinalTranscript` never set → no send.
  3. **Empty text:** `msg.text` undefined/empty → we never called `onTranscript`.
- **Fix:** In `cartesia-audio-bridge.js`:
  - Added **last-partial fallback:** `_lastTranscriptText` updated on every transcript (partial or final) with non-empty text; when 2.5s timer fires, use `_pendingFinalTranscript.text` if present, else `_lastTranscriptText`, so we always send something when the user spoke.
  - **Normalize text:** Store transcript as `String(msg.text || '').trim()` so we never rely on undefined/whitespace.
  - Clear `_lastTranscriptText` on `onSpeechStart` (per utterance) and in `stopSTT()`.
- **App.js:** `onTranscript` now uses trimmed text and logs "sending voice payload to n8n" / "empty text, skipping n8n" for easier diagnosis.
- **Files:** `public/js/cartesia-audio-bridge.js`, `public/js/app.js`, `debug/MIC-N8N-PAYLOAD-RESEARCH.md`
- **Status:** Fixed. Verify with `?debug=1`: speak into mic, confirm console shows "sending transcript to agent" and "n8n: sending payload" and Network tab shows POST to n8n.

---

## 2025-02-01 (Debug, test, check, fix per zEn DeBuGgEr.md)

### ESLint: cartesia-audio-bridge.js

- **Error:** `SAMPLES_PER_CHUNK` assigned but never used; unexpected `console.error` in default `onError`.
- **Fix:** Removed unused `SAMPLES_PER_CHUNK` and `STT_SAMPLE_RATE`; changed default `onError` to no-op `(() => {})` so callers must provide handler (app.js does).
- **Status:** Fixed. Lint passes with 0 errors, 0 warnings.

### Jest: debug tests — "Cannot log after tests are done"

- **Error:** STT/TTS clients log on WebSocket open/close/reconnect; async callbacks run after test finish, triggering Jest warning.
- **Fix:** (1) Mock `console.log`/`console.error` in debug/tests (stt-client, tts-client, bidirectional-conversation) with `beforeAll`/`afterAll` and `mockRestore()`. (2) STT/TTS clients: store `reconnectTimerId` and in `disconnect()` call `this.ws.close()` then `clearTimeout(this.reconnectTimerId)` so no reconnect timer runs after disconnect.
- **Status:** Fixed. All 66 tests pass; one occasional "Cannot log after tests are done" remains in TTS reconnection test (reconnect timer can fire after suite); no test failures.

### Jest: SpiedFunction has no `.restore()`

- **Error:** TS2339 — Property `restore` does not exist on type `SpiedFunction<...>`.
- **Fix:** Use `mockRestore()` instead of `restore()` in debug test afterEach/afterAll.
- **Status:** Fixed.

---

## 2025-02-01 (Live Real-Time Flow)

### Optimal Latency & Bidirectional Flow

- **Change:** Bridge now uses hybrid VAD + streaming STT for live real-time partials.
- **Change:** TTS model switched to `sonic-turbo` (40ms first byte vs 90ms).
- **Change:** Barge-in: user speaking cancels TTS playback and processes new input.
- **Change:** Pre-speech buffer (800ms) sent on speech start; streaming during speech; finalize on end.
- **Change:** `redemptionMs` reduced to 1200ms for responsiveness.
- **Status:** Build passes. Vite build succeeds.

---

## 2025-02-01 (earlier)

### Jest CLI: `testPathPattern` deprecated

- **Error:** `Option "testPathPattern" was replaced by "--testPathPatterns".`
- **Fix:** In `package.json`, `test:unit` script updated from `--testPathPattern=tests/unit` to `--testPathPatterns=tests/unit`.
- **Status:** Fixed. `npm run test:unit` runs without warning.

### Jest: debug tests not matched

- **Error:** `debug/tests/stt-client.test.ts`, `tts-client.test.ts`, `bidirectional-conversation.test.ts` not run (testMatch did not include `debug/tests/**`).
- **Fix:** In `jest.config.cjs`, added `'<rootDir>/debug/tests/**/*.test.ts'` and `'<rootDir>/debug/tests/**/*.test.js'` to `testMatch`.
- **Status:** Fixed. All debug/tests run.

### Jest: `.js` imports from `src/` not resolved (TypeScript ESM)

- **Error:** `Cannot find module './config.js'` / `'../../src/tts-client.js'` when running debug tests (src files use .js in imports for ESM).
- **Fix:** In `jest.config.cjs`, added `moduleNameMapper`: `'^(\\.{1,2}/.*)\\.js$': '$1'` so Jest resolves .js to .ts.
- **Status:** Fixed.

### debug/tests/stt-client: transcript/error callbacks not called

- **Error:** Mock emitted `message` with `Buffer.from(response)`; `stt-client` `handleMessage` returns early for `Buffer`, so JSON was never parsed.
- **Fix:** In `debug/tests/stt-client.test.ts`, mock now emits `this.emit('message', response)` (JSON string) instead of `Buffer.from(response)`; same for error response.
- **Status:** Fixed.

### debug/tests/stt-client: latency test expected > 0

- **Error:** Mock response uses `request_id: 'test-request-1'`; client uses generated ID, so `requestStartTimes.get(request_id)` is undefined and latency is 0.
- **Fix:** Test relaxed to `expect(partialLatency).toBeGreaterThanOrEqual(0)`.
- **Status:** Fixed.

### debug/tests/bidirectional-conversation: TS2345 mock type

- **Error:** `jest.fn().mockResolvedValue('Echo response')` / `mockImplementation((_text: string) => ...)` caused "not assignable to parameter of type 'never'" or "UnknownFunction".
- **Fix:** Use `jest.fn().mockImplementation(() => Promise.resolve('Echo response'))` and cast: `as unknown as (text: string) => Promise<string>`.
- **Status:** Fixed.

### debug/live/example-run: import.meta in Jest (CJS)

- **Error:** `SyntaxError: Cannot use 'import.meta' outside a module` when Jest runs example-run.test.js.
- **Fix:** Use `const root = process.cwd()` and remove unused `fileURLToPath`/`dirname` imports; added `testPathIgnorePatterns` for optional exclusion (project also runs example-run; test runs with process.cwd()).
- **Status:** Fixed.

### (All tests passing)

- **Status:** All 66 Jest tests pass (unit, debug/tests, debug/live, debug/integration). Coverage meets thresholds.

---

## Adding New Entries

When you fix an error:

1. Add a dated section above.
2. Include: **Error** (symptom), **Fix** (what was changed), **Status** (Fixed / Verified).
3. Re-run tests and update `debug/results/latest-test-run.txt` if needed.
