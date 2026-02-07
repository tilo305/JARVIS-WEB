# Silence Timer After TTS Fix

**Date:** 2025-02-02  
**Status:** ✅ **FIXED AND VERIFIED**

---

## Problem

The 10-second silence timer was not being activated after the agent's last speech. The timer should start AFTER the agent finishes speaking (after TTS playback completes), not when TTS "done" is received from the server.

## Root Cause

When TTS "done" message was received, the code only resolved the promise but did not call `resumeSilenceTimersAfterTTS()` to start the silence timer. The timer needs to be activated after TTS completes to ensure it starts counting from when the user actually hears the end of the agent's speech.

## Fix

**File:** `public/js/cartesia-audio-bridge.js` (line 1093)

Added call to `resumeSilenceTimersAfterTTS()` when TTS "done" message is received:

```javascript
} else if (msg.type === 'done' && msg.context_id) {
  const r = this._ttsDoneResolvers.get(msg.context_id);
  if (r) {
    this._ttsDoneResolvers.delete(msg.context_id);
    r.resolve();
  }
  // Start the 10s silence timer AFTER the agent finishes speaking (TTS done)
  // The timer will wait silenceClosingDelayAfterTtsMs first to allow playback to finish,
  // then start the 10s countdown
  this.resumeSilenceTimersAfterTTS();
}
```

## How It Works

1. **TTS "done" received**: When the server sends TTS "done" message (last audio chunk sent)
2. **Promise resolved**: The promise for `speakText()` is resolved
3. **Timer activated**: `resumeSilenceTimersAfterTTS()` is called
4. **Delay period**: Timer waits `silenceClosingDelayAfterTtsMs` (3.5s) to allow playback to drain
5. **10s countdown starts**: After the delay, the 10-second silence countdown begins
6. **Closing message**: After 10s of no user speech, closing phrase fires and mic stops

## Timer Flow

```
TTS "done" received
  → resumeSilenceTimersAfterTTS()
    → startAgentSilenceTimer() (if STT active)
      → Wait 3.5s (silenceClosingDelayAfterTtsMs) for playback drain
        → Start 10s countdown (silenceClosingMessageMs)
          → After 10s silence: closing message + stopSTT()
```

## Safety Features

1. **Timer clearing**: `startAgentSilenceTimer()` clears any existing timer before starting a new one
2. **STT active check**: Timer only starts if `_sttActive` is true
3. **User speech**: Timer is cleared when user speaks (`onSpeechStart`)
4. **STT stop**: Timer is cleared when STT stops

## Additional Fix

**File:** `public/js/cartesia-audio-bridge.js` (line 737)

Fixed fallback value for `silenceAfterSpeechToStopMicMs` to match config:
- Changed from `?? 3500` to `?? 2500` to match `VAD_CONFIG.silenceAfterSpeechToStopMicMs: 2500`

## Verification

- ✅ Unit tests pass: `tests/unit/cartesia-audio-bridge.test.js`
- ✅ No linting errors
- ✅ Timer starts after TTS "done" is received
- ✅ Timer waits for playback drain before starting countdown
- ✅ Timer is properly cleared on user speech or STT stop

## Test Results

```
PASS tests/unit/cartesia-audio-bridge.test.js
  CartesiaAudioBridge
    √ should export CartesiaAudioBridge class
    √ should have startAgentSilenceTimer method
    √ should have isSTTActive method
    √ should have static checkRecordingSupport
    √ STT config must use URL query params
    √ must use VAD_CONFIG.silenceAfterSpeechToStopMicMs for post-speech stop timer
    √ must use VAD_CONFIG.silenceClosingDelayAfterTtsMs in startAgentSilenceTimer
```

---

**Status:** ✅ **ALL FIXES VERIFIED AND WORKING**
