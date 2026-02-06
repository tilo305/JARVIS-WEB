# Wake Word vs Mic and Text — Implementation Research

## Summary

**Text** and **mic** work because they use a single, clear path: user action → get what’s needed (typed text or mic stream) → send to n8n / STT. **Wake word** does not work reliably because it depends on getting a **microphone stream** before any user gesture (on page load), which browsers block. Wake word should be implemented **the same way as the mic**: use the **same stream** and the **same entry point** (mic click) so that wake word is initialized only after the user has granted permission.

---

## How Text and Mic Are Implemented

### Text flow (works)

1. **Entry**: User types in `#textInput` and clicks Send or presses Enter.
2. **Data**: `textInput.value` (no microphone).
3. **Action**: `getLLMReply(text, { source: 'text', attachments })` → POST to n8n webhook.
4. **Response**: Reply shown; if `apiKey` is set, `bridge.speakText(replyText)` for TTS.
5. **No mic**: No `getUserMedia`, no stream, no permission.

**Relevant code**: `app.js` — `btnSend` click handler, `getLLMReply()`, `buildPayload(..., { source: 'text' })`.

### Mic flow (works)

1. **Entry**: User clicks `#btnMic` (user gesture).
2. **Permission**: `bridge.startSTT()` → `navigator.mediaDevices.getUserMedia({ audio: {...} })` (allowed because of the click).
3. **Stream**: `this.mediaStream = stream` in `cartesia-audio-bridge.js`.
4. **Pipeline**: Same stream → `createMediaStreamSource(stream)` → gain → `stt-capture-processor` AudioWorklet → STT WebSocket + VAD.
5. **Result**: Speech → transcript → `onTranscript` → `getLLMReply(..., { source: 'voice' })` → TTS.

**Relevant code**: `app.js` — `btnMic` click → `bridge.startSTT()`; `cartesia-audio-bridge.js` — `startSTT()`, getUserMedia, STT graph, VAD, `onTranscript`.

---

## How Wake Word Is Implemented (and Why It Fails)

### Intended design

- **Always-listening**: Wake word should listen continuously and, on “Jarvis”, activate the STT pipeline (same as mic) without a second click.
- **Same audio**: Wake word and STT both need the **same microphone stream** (same source, same permission).

### Current flow

1. **On load (no user gesture)**  
   - After ~500 ms, `app.js` calls `bridge.initWakeWord()`.  
   - `initWakeWord()` calls `getUserMedia()` to get a stream for wake word.  
   - Browsers require a user gesture for mic access → **getUserMedia fails** (e.g. permission denied or not allowed without gesture).  
   - Wake word init fails; `wakeWordManager` stays `null`; UI shows “Wake word not configured” or “Microphone permission needed”.

2. **On first mic click**  
   - User clicks mic → `startSTT()` runs.  
   - `getUserMedia()` **succeeds** (user gesture).  
   - `this.mediaStream = stream` is set.  
   - **If** `wakeWordManager` is null and wake word is enabled, `startSTT()` creates a new `WakeWordManager` and calls `wakeWordManager.initialize(audioContext, stream, ...)`.  
   - So wake word **can** be initialized here with the same stream as the mic.

3. **After that**  
   - When wake word is enabled and manager exists, `startSTT()` leaves STT in “wait for wake word” mode (`_sttActive = false`) and keeps the wake word manager enabled.  
   - Saying “Jarvis” should trigger `_onWakeWordDetected` → activate STT (e.g. `_sttActive = true`, start streaming to STT).

So:

- **Text** and **mic** work because they only need data that is available at the moment of the user action (text in the box, or stream from getUserMedia on click).
- **Wake word** fails when we try to init it **on load** without a user gesture; it can work **only after** the user has already clicked the mic and granted permission, and only if init in `startSTT()` succeeds.

---

## Does Wake Word Need to Be Implemented “the Same Way” as Mic/Text?

**Yes, for the part that needs the microphone.**

- **Same permission model**: Mic and wake word both need `getUserMedia()`. That must happen on a **user gesture** (e.g. mic button click). So wake word should **not** rely on init on page load; it should rely on the **same gesture** as the mic.
- **Same stream**: Wake word and STT should share the **same** `MediaStream` from a single `getUserMedia()` call. The code already does this when wake word is created inside `startSTT()`.
- **Single entry point**: For “click to start listening, then wake word or speech”: one click → get stream once → init both STT pipeline and wake word with that stream. No separate “wake word init” that runs without a stream or without permission.

So:

- **Text** stays as-is (no mic).
- **Mic** stays as-is (click → stream → STT).
- **Wake word** should be implemented **the same way as the mic** in the sense: **use the same stream and the same entry point (mic click)**. It should **not** be implemented as “init on load with a separate getUserMedia”.

---

## Recommended Changes

1. **Do not init wake word on load** (or treat it as best-effort only).  
   - Either remove the delayed `initWakeWord()` on load or keep it only as a “try once, ignore failure” so that in rare cases (e.g. persisted permission) it might work without a click.  
   - Do **not** depend on this for normal operation.

2. **Always init wake word from the same place as the mic stream**  
   - In `startSTT()`, after `getUserMedia()` succeeds and `this.mediaStream` is set, call **one** wake word init path (e.g. `initWakeWord()` or the same logic) so that:
     - Wake word is created/initialized with `this.mediaStream`.
     - There is no duplicated init logic; one code path handles “we have a stream, ensure wake word is ready”.

3. **Make the UX explicit**  
   - e.g. “Click the mic to start listening; then say ‘Jarvis’ or speak.”  
   - So users know the first click grants permission and enables both mic and wake word.

4. **Optional**: If you want “wake word without clicking first” on a later visit (e.g. after permission was granted before), you can **retry** `initWakeWord()` when the app gains focus or on a later user gesture, using the same `initWakeWord()` that uses `this.mediaStream` when available (and only then calling getUserMedia if needed). That still avoids relying on init on first load without a gesture.

---

## File-Level Reference

| Feature   | Entry point      | Data / permission        | Key files                          |
|----------|------------------|---------------------------|------------------------------------|
| Text     | Send / Enter     | `#textInput` value        | `app.js` (Send, getLLMReply)       |
| Mic      | Mic button click | getUserMedia on click     | `app.js` (btnMic), `cartesia-audio-bridge.js` (startSTT) |
| Wake word| Same as mic      | Same stream as mic        | `cartesia-audio-bridge.js` (initWakeWord, startSTT), `wake-word-manager.js`, `public/audio/wake-word-processor.js` |

Wake word is already wired to use the same stream when it is initialized inside `startSTT()`. The fix is to **rely on that path** and **not** on load-time init without a user gesture, and to **unify** init so there is a single place that “inits wake word when we have a stream” (the same way the mic uses that stream).

---

## Changes applied

1. **Unified wake word init in `cartesia-audio-bridge.js`**  
   In `startSTT()`, after `getUserMedia()` and setting `this.mediaStream`, the previous inline creation of `WakeWordManager` and `initialize(...)` was replaced with a single call to `initWakeWord()`. So:
   - One code path: `initWakeWord()` always runs when we have a stream (either from load with permission, or from mic click).
   - Wake word uses the same stream as the mic, every time.

2. **UX in `app.js`**  
   When wake word init fails on load (e.g. no mic permission), the tracker now shows: **“Click the mic button to enable wake word”** instead of a generic error, so users know the first click enables both mic and wake word.
