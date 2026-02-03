# Sample Rate Issue — Complete Research & Fix

**Symptom:** `[JARVIS] [ERROR] STT server error Invalid sample rate: The sample rate is not valid, make sure it is a whole number.`  
**Impact:** Mic starts, VAD detects speech, but STT fails → no transcript → no n8n call → no text or voice response in chat.

---

## Root Cause Research

### Cartesia STT API (2025-04-16)

- **Endpoint:** `wss://api.cartesia.ai/stt/websocket`
- **Config:** Sent as JSON on connection open
- **sample_rate:** Required field for audio format

### Conflicting Documentation

| Source | sample_rate Type | Notes |
|--------|------------------|-------|
| **docs.cartesia.ai (2025-04-16)** | `string` | API reference: "Type: string" |
| **cArTeSiA dOcS.md (project)** | `"16000"` (string) | Example shows string |
| **errors-and-fixes.md (project)** | integer | Previously: "Cartesia rejects string, expects integer" |

### Error Message

> "Invalid sample rate: The sample rate is not valid, make sure it is a whole number."

- **"Whole number"** → integer (e.g. 16000) or string representing integer ("16000")
- **Not valid** → could mean: wrong type, wrong value, or mismatch with audio

### Previous Fix (2025-02-02)

- **Before:** `sample_rate: '16000'` (string) → error
- **After:** `sample_rate: 16000` (integer) → supposed to fix
- **Result:** User still reports error

### Current Fix (2025-02-02) — Conclusive

- **Root cause:** Cartesia STT expects config in **URL query parameters**, NOT as first WebSocket message.
- **Fix:** Pass `model`, `encoding`, `sample_rate`, `language`, etc. as URL search params. No config JSON after connect.
- **Reference:** @cartesia/cartesia-js SDK (`wrapper/SttWebsocket.js`) uses query params only.

---

## Files Changed

| File | Change |
|------|--------|
| `public/js/cartesia-audio-bridge.js` | Config via URL query params (model, encoding, sample_rate, etc.); no first message |
| `tests/unit/cartesia-audio-bridge.test.js` | Updated test to expect URL query params |
| `debug/errors-and-fixes.md` | Document final fix |

---

## Verification

1. Reload app with `?debug=1`
2. Click mic button
3. Speak into mic
4. **Expected:** No "Invalid sample rate" error; STT receives config; transcripts appear; reply in chat + voice

**If still failing:**
- Try reverting to integer: `sample_rate: 16000` (or `parseInt(16000, 10)`)
- Check Cartesia API changelog for 2025-04-16
- Verify audio from stt-capture-processor is 16kHz (SAMPLE_RATE_OUT = 16000)

---

## Audio Pipeline (16kHz)

- **stt-capture-processor.js:** Resamples mic (48kHz) → 16kHz, outputs Int16 PCM
- **CHUNK_MS:** 100ms
- **SAMPLES_PER_CHUNK:** 1600 (16000 * 0.1)
- **Cartesia STT:** Expects pcm_s16le at 16kHz

The audio we send MUST match `sample_rate` in the config. We send 16kHz; config must say 16kHz (as string or integer per API).
