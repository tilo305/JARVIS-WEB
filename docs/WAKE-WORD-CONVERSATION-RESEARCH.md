# Wake Word — Conversation History Research & Fixes

## What Was Implemented in This Conversation

1. **Unified init path**  
   In `cartesia-audio-bridge.js`, `startSTT()` no longer creates `WakeWordManager` inline. It calls `initWakeWord()` after setting `this.mediaStream`, so wake word always uses the same stream as the mic.

2. **Automatic on load**  
   In `app.js`, wake word is initialized ~200ms after load. If the site already has mic permission (e.g. return visit), it works with no click. If not, the app retries on an interval and on first user gesture (`ensureWakeWordListening()`).

3. **No “click mic” requirement**  
   Wake word is not gated on the mic button. The mic button is for manual “click to talk” only.

---

## Bugs That Broke Wake Word (Current Code)

### 1. **Premature “Wake word failed” in app.js**

- **Where:** Right after the wake word tracker is created, and again when wake word is configured.
- **What:** When wake word **is** enabled and configured, a `setTimeout(..., 100)` still sets `wakeWordTracker.setStatus('error', 'Wake word failed')`. So the UI shows “Wake word failed” before init has run.
- **Effect:** Users (and you) think wake word is broken even when init might succeed.
- **Fix:** When wake word is configured, do **not** set “Wake word failed” at 100ms. Set “Initializing…” or leave it for the init flow.

### 2. **“Wake word failed” at start of init block**

- **Where:** In the `setTimeout(() => { ... tryWakeWordInit() ... }, 200)` block, the first line sets `wakeWordTracker.setStatus('error', 'Wake word failed')`.
- **What:** The tracker is set to failed **before** `tryWakeWordInit()` runs.
- **Effect:** UI shows failure as soon as we start initializing.
- **Fix:** Set status to `'waiting'` and message to `'Initializing wake word...'` at the start of that block.

### 3. **Missing `getStream` in VAD fallback (bridge)**

- **Where:** In `cartesia-audio-bridge.js`, inside `_onWakeWordDetected`, when we create VAD in the fallback path (`if (!this.vad)`), we build `vadOptions` **without** `getStream`.
- **What:** `MicVAD.new(vadOptions)` expects `getStream` to provide the media stream. In `startSTT()` we pass `getStream: () => Promise.resolve(stream)`. In the wake-word fallback we don’t.
- **Effect:** When wake word is inited **only on load** (no `startSTT()`), saying “Jarvis” triggers `_onWakeWordDetected`, we create VAD without `getStream`, and VAD either fails or gets no audio. So “wake word worked” (Porcupine fired) but “listening after wake word” didn’t.
- **Fix:** In the `_onWakeWordDetected` fallback, add to `vadOptions`:  
  `getStream: () => Promise.resolve(this.mediaStream)`  
  (and ensure `this.mediaStream` is set when wake word was inited on load).

### 4. **Generic “Wake word failed” on init failure**

- **Where:** In `tryWakeWordInit()`, when `result.success` is false we set `wakeWordTracker.setStatus('error', 'Wake word failed')` and drop the real reason.
- **What:** We don’t show permission vs other errors.
- **Effect:** Hard to see that it’s “allow microphone” vs config/network.
- **Fix:** Use `result.reason` and set a permission-friendly message when the reason is permission-related (e.g. “Allow microphone — wake word will start automatically” or “Allow microphone — will retry”).

### 5. **onFirstUserGesture shows “Wake word failed” before trying**

- **Where:** In `onFirstUserGesture`, we set `wakeWordTracker.setStatus('error', 'Wake word failed')` **before** calling `bridge.ensureWakeWordListening()`.
- **What:** User clicks; we immediately show failure, then try to init.
- **Effect:** Confusing; looks like we gave up before using the gesture.
- **Fix:** Set something like “Starting…” (or “Initializing…”) before the call; set “Wake word failed” only if the promise rejects or returns failure.

### 6. **Success message when wake word is ready**

- **Where:** When `tryWakeWordInit()` or `ensureWakeWordListening()` succeeds, we set `setStatus('Ready', '')`.
- **What:** “Ready” doesn’t tell the user they can say “Jarvis”.
- **Effect:** Users may not know wake word is active.
- **Fix:** When wake word becomes active on load or after first gesture, set main status to e.g. `setStatus('Say "Jarvis" to start', '')` so it’s clear wake word is on.

---

## Checklist of Fixes Applied

- [x] **app.js**: In the “wake word configured” branch (else after “not configured”), do not set “Wake word failed” at 100ms; set “Initializing…” or leave for init.
- [x] **app.js**: At the start of the init `setTimeout(200)` block, set tracker to `'waiting'`, `'Initializing wake word...'` instead of `'error'`, `'Wake word failed'`.
- [x] **app.js**: In `tryWakeWordInit()`, on success call `setStatus('Say "Jarvis" to start', '')`; on failure set tracker message from `result.reason` and use a permission-friendly message when reason is permission-related.
- [x] **app.js**: In `onFirstUserGesture`, set tracker to “Starting…” (or similar) before `ensureWakeWordListening()`; set “Wake word failed” only on actual failure.
- [x] **cartesia-audio-bridge.js**: In `_onWakeWordDetected`, in the `if (!this.vad)` block, add `getStream: () => Promise.resolve(this.mediaStream)` to `vadOptions` so VAD works when wake word was inited on load only.

---

## Flow That Should Work After Fixes

1. **Load**  
   After ~200ms, try `initWakeWord()`. Tracker shows “Initializing wake word…”.

2. **Already have permission**  
   `getUserMedia` and Porcupine succeed. Tracker shows “Wake word active” (or similar). Main status: “Say ‘Jarvis’ to start”. User says “Jarvis” → `_onWakeWordDetected` → STT graph + VAD (with `getStream`) → listening.

3. **No permission yet**  
   Init fails; tracker shows “Allow microphone — wake word will start automatically” (or “will retry”). Retries run; on first gesture we call `ensureWakeWordListening()`. When user allows, next try succeeds and we’re in the same state as (2).

4. **Saying “Jarvis” when only wake word is inited**  
   Bridge has `wakeWordManager` and `mediaStream`, but no `sttNode`/`vad` yet. `_onWakeWordDetected` creates them. The critical fix is adding `getStream: () => Promise.resolve(this.mediaStream)` in that fallback so VAD gets the same stream and listening works.

---

## Files Touched in This Conversation

| File | Changes |
|------|--------|
| `public/js/cartesia-audio-bridge.js` | Unified wake word init in `startSTT()` via `initWakeWord()`; added `ensureWakeWordListening()`. **Bug:** VAD fallback in `_onWakeWordDetected` missing `getStream`. |
| `public/js/app.js` | Automatic init on load; retries and first-gesture init; removed “click mic” messaging. **Bugs:** Premature “Wake word failed”; wrong status at start of init; no `getStream` in bridge fallback. |
| `docs/WAKE-WORD-RESEARCH-MIC-TEXT-COMPARISON.md` | Research on mic vs text vs wake word. |
| `docs/WAKE-WORD-CONVERSATION-RESEARCH.md` | This document. |
