# Comprehensive Research: Mic Not Sending Payload to n8n

**Date:** 2025-02-02  
**Issue:** Microphone flow does not send transcript payload to n8n webhook (recurring).

---

## 1. Intended Flow (Mic → n8n)

```
User speaks
  → VAD detects speech (onSpeechStart) → STT streaming
  → User stops → VAD onSpeechEnd
  → Bridge: send "finalize" to Cartesia STT, start 2.5s timer
  → Cartesia STT (async): processes remaining audio, sends transcript with is_final: true
  → Bridge: stores in _pendingFinalTranscript
  → 2.5s timer fires
  → Bridge: if _pendingFinalTranscript has text → onTranscript(text, true)
  → app.js: onTranscript → getLLMReply(text, { source: 'voice' }) → buildN8nPayload → fetch(n8nWebhookUrl)
  → n8n returns reply → TTS speaks
```

**Single point where payload is sent:** `app.js` `getLLMReply()` → `fetch(n8nWebhookUrl, { body: JSON.stringify(buildPayload(...)) })`.  
So if the mic “isn’t sending payload,” either **onTranscript is never called** or **getLLMReply is not reached / fails**.

---

## 2. Root Causes (Why Payload Might Never Be Sent)

### 2.1 Race: Final transcript arrives after 2.5s

- **Where:** `cartesia-audio-bridge.js` — onSpeechEnd starts a 2.5s timer; when it fires we read `_pendingFinalTranscript` and then call `stopSTT()`.
- **Problem:** Cartesia STT sends the final transcript asynchronously after `"finalize"`. If the server or network is slow, the final transcript can arrive **after** the 2.5s timer has already fired. When the timer ran, `_pendingFinalTranscript` was still `null`, so we never call `onTranscript` and never send to n8n.
- **Result:** User spoke, but no payload is sent.

### 2.2 No final transcript (is_final never true)

- **Where:** STT WebSocket handler only sets `_pendingFinalTranscript` when `msg.type === 'transcript'` and `msg.is_final === true`.
- **Problem:** For short utterances or certain API behavior, Cartesia might only send partials (`is_final: false`) and never a final. Then `_pendingFinalTranscript` stays null; when the 2.5s timer fires we don’t call `onTranscript`.
- **Result:** No payload sent even though the user spoke.

### 2.3 Empty or missing text

- **Where:** Bridge sets `_pendingFinalTranscript = { text: msg.text, request_id: ... }`. Timer checks `pending && pending.text && String(pending.text).trim()`.
- **Problem:** If `msg.text` is `undefined`, `""`, or whitespace, we never call `onTranscript`.
- **Result:** No payload sent.

### 2.4 onSpeechEnd clears pending at start

- **Where:** In `onSpeechEnd` we set `_pendingFinalTranscript = null` at the beginning.
- **Effect:** We correctly “reset” for the new utterance so we don’t send an old final. This is correct; the risk is only that we have **no fallback** if the new final never arrives or arrives late (see 2.1, 2.2).

### 2.5 stopSTT() clears pending

- **Where:** `stopSTT()` sets `_pendingFinalTranscript = null`.
- **Effect:** If something calls `stopSTT()` before the 2.5s timer (e.g. onError, user clicks stop), we clear pending and never send. That’s intentional for “user cancelled”; for errors we might want to still send the last thing we heard — optional follow-up.

---

## 3. Fix Strategy (Implemented)

1. **Last-partial fallback:**  
   - Keep a `_lastTranscriptText` that is updated on **every** transcript (partial or final) with non-empty text.  
   - When the 2.5s timer fires, use `_pendingFinalTranscript.text` if present and non-empty; otherwise use `_lastTranscriptText`.  
   - Call `onTranscript(textToSend, true)` so n8n **always** gets a payload when the user said something, even if the final arrived late or never.

2. **Normalize text:**  
   - When storing final or last partial, use `String(msg.text || '').trim()` so we never store `undefined` and we ignore whitespace-only.

3. **Clear last partial per utterance:**  
   - Clear `_lastTranscriptText` on `onSpeechStart` so we only accumulate for the current utterance, and clear again when we send or in `stopSTT()`.

4. **Debug visibility:**  
   - In app.js, ensure debug mode logs when we’re about to send to n8n (payload message preview) and when we skip (empty text), so future “mic not sending” issues are easy to trace.

---

## 4. Files Touched

| File | Change |
|------|--------|
| `public/js/cartesia-audio-bridge.js` | Add `_lastTranscriptText`; update on every transcript; when 2.5s timer fires use final or `_lastTranscriptText`; normalize text; clear on speech start / stopSTT. |
| `public/js/app.js` | Optional: extra DEBUG.trace when calling getLLMReply for voice and when skipping (empty text). |
| `debug/errors-and-fixes.md` | Log this research and fix. |

---

## 5. How to Verify

1. **With `?debug=1`:** Speak into mic; in console confirm:  
   - `onTranscript: final text received, sending to n8n` (or equivalent),  
   - `n8n: sending payload` with `source: 'voice'`.
2. **Network tab:** After speaking, see a POST to the n8n webhook URL with JSON body containing `message`, `session_id`, `source: 'voice'`, etc.
3. **Short utterance:** Say one word; confirm a payload is still sent (last-partial fallback).
4. **Slow network:** If possible, throttle network and speak; confirm payload is sent (either from final or last partial).

---

## 6. STT Server Error (Cartesia)

If the console shows **`[JARVIS] [ERROR] STT server error`**, Cartesia’s Speech-to-Text API is rejecting the request. No transcript is produced, so no payload is sent to n8n.

**Common causes:**
- **Missing or invalid API key** — Set `VITE_CARTESIA_API_KEY` in `.env` (Vite build) or `window.JARVIS_CONFIG.apiKey` (static HTML). The key must be valid for Cartesia STT.
- **Wrong config** — Cartesia may return an error object with `message` or `error`; the app now logs that string so you see the real reason in the console.
- **Network / CORS** — STT uses a WebSocket to `wss://api.cartesia.ai/stt/websocket`; ensure the page is served over HTTPS (or localhost) and that nothing blocks the connection.

**Fix (code):** STT error handling in `cartesia-audio-bridge.js` now:
- Logs a **readable error string** (from `msg.error`, `msg.message`, or the full payload) so the console shows the actual Cartesia message instead of just "Object".
- Calls **`onError`** so the UI shows "Error" and the mic stops; you can then correct the API key or config and try again.

---

## 7. References

- **Flow:** `debug/errors-and-fixes.md` (Mic Flow, n8n Full Payload Fix, Timer Fix).
- **n8n usage:** `docs/n8n-webhooks-research.md`.
- **Fallback / revert:** `debug/FALLBACK-REVERT-RESEARCH.md`.
