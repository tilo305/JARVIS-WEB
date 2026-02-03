# Silence Timer & Conversation Stopping — Fixes and Verification

Per **zEn DeBuGgEr.md**: comprehensive research, tests, and fixes for:
1. **10 seconds of silence — timer starts too early**
2. **Conversation stopping too early**

---

## 1. Fix: 10s Silence Timer Starting Too Early

### Problem
The 10s "agent silence" countdown was starting as soon as TTS reported "done". The server "done" fires when the last audio chunk is sent; playback may still be draining. So the 10s felt like it started before the user had actually heard the end of the reply.

### Fix (in code)
- **`public/js/vad-config.js`**
  - `silenceClosingDelayAfterTtsMs: 3500` — Wait **3.5 seconds** after TTS "done" before starting the 10s countdown. This lets playback drain so the 10s only starts after the user has had time to hear the end of the reply.
- **`public/js/cartesia-audio-bridge.js`**
  - `startAgentSilenceTimer()` uses `VAD_CONFIG.silenceClosingDelayAfterTtsMs`. If `delayMs > 0`, it sets `_silenceClosingDelayTimer` to run `startCountdown()` after that delay. The 10s timer (`_silenceClosingTimer`) only starts when `startCountdown()` runs.
  - When the user speaks, `onSpeechStart` calls `_clearSilenceClosingTimer()`, which clears both the delay timer and the 10s timer.

### Result
- Time from TTS "done" to closing message = **3.5s delay + 10s silence** = 13.5s of no user speech before "Standing by…" and mic stop.
- The 10s countdown does **not** start during the 3.5s playback drain.

### Verification
- Unit test: `tests/unit/vad-config.test.js` — `silenceClosingDelayAfterTtsMs` is defined, number, ≥ 0.
- Unit test: `tests/unit/cartesia-audio-bridge.test.js` — "must use VAD_CONFIG.silenceClosingDelayAfterTtsMs in startAgentSilenceTimer (10s delay fix)" ensures the bridge source uses the config.
- Manual: With `?debug=1`, after the agent speaks, wait ~3.5s then 10s without speaking; closing phrase should fire after ~13.5s total.

---

## 2. Fix: Conversation Stopping Too Early

### Problem
The mic stopped 2.5s after the user stopped speaking. For users who pause briefly (e.g. to think), 2.5s felt too short and the conversation "stopped" (mic off, turn sent) too early.

### Fix (in code)
- **`public/js/vad-config.js`**
  - `silenceAfterSpeechToStopMicMs: 3500` — Wait **3.5 seconds** of user silence after speech end before stopping the mic and sending the transcript. Gives more time for natural pauses without cutting off the turn.

### Result
- User speaks → pauses up to **3.5s** → mic still open; after 3.5s of silence, mic stops and transcript is sent to the agent. Reduces false "conversation stopped" when the user is just pausing.

### Verification
- Unit test: `tests/unit/vad-config.test.js` — `silenceAfterSpeechToStopMicMs` is defined, number, and set to 3500.
- Unit test: `tests/unit/cartesia-audio-bridge.test.js` — "must use VAD_CONFIG.silenceAfterSpeechToStopMicMs for post-speech stop timer (3.5s fix)" ensures the bridge uses the config and fallback 3500.
- Manual: Speak, then pause ~3s; mic should still be listening. Pause >3.5s; mic should stop and send.

---

## Files Touched

| File | Change |
|------|--------|
| `public/js/vad-config.js` | `silenceClosingDelayAfterTtsMs: 3500` (already present); `silenceAfterSpeechToStopMicMs: 3500` (increased from 2500) |
| `public/js/cartesia-audio-bridge.js` | Uses both values; no logic change needed |
| `tests/unit/vad-config.test.js` | Expect `silenceAfterSpeechToStopMicMs` to be 3500 |
| `debug/errors-and-fixes.md` | Reference this doc for timer fixes |

---

## Live Verification (zEn DeBuGgEr)

1. **Lint:** `npm run lint` — 0 errors.
2. **Full test suite:** `npm test` — 128 tests (15 suites) must pass, including:
   - `vad-config.test.js`: silenceAfterSpeechToStopMicMs 3500, silenceClosingDelayAfterTtsMs ≥ 0
   - `cartesia-audio-bridge.test.js`: bridge uses VAD_CONFIG for both timers + 3500 fallback
3. **Browser:** Open `http://localhost:3000/?debug=1`, use mic:
   - After you speak, wait ~3s then speak again — mic should still be on (3.5s window).
   - After agent speaks, wait 3.5s then 10s without speaking — closing message should play after ~13.5s total.

If the 10s closing still feels early, increase `silenceClosingDelayAfterTtsMs` (e.g. 5000). If the mic still cuts off during pauses, increase `silenceAfterSpeechToStopMicMs` (e.g. 4000).
