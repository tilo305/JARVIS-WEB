# Fallback Revert Research — Mic Button & Text Messages

Per **zEn DeBuGgEr.md** — comprehensive research into why the mic button and text messages revert to their fallbacks.

---

## 1. Summary of Symptoms

| Component | Fallback State | When User Sees Fallback |
|-----------|----------------|-------------------------|
| **Mic button** | Default: gray, `aria-label="Microphone — click to talk"`, not recording | Mic reverts to idle/inactive even when user expects it to stay recording |
| **Text messages** | Natural fallback replies: "Hello! How can I assist you today?", "I heard you. I'm still getting set up…", etc. | Assistant always shows canned replies instead of real LLM responses from n8n |

---

## 2. Mic Button Revert — Root Cause Analysis

### 2.1 State Flow (Source of Truth: `app.js` + `cartesia-audio-bridge.js`)

```
User clicks mic
  → syncMicButton(false, true)     [disabled while connecting]
  → bridge.connectTTS()
  → bridge.startSTT()
  → syncMicButton(true, false)     [recording state]
  → User speaks...
  → VAD onSpeechEnd
  → 2.5s later: stopSTT() → onSTTStopped() → syncMicButton(false, false)  [REVERT]
```

### 2.2 Causes of Mic Revert to Fallback (idle state)

| # | Cause | Location | Details |
|---|-------|----------|---------|
| 1 | **2.5s user silence** | `vad-config.js` → `cartesia-audio-bridge.js` | `silenceAfterSpeechToStopMicMs: 2500` — 2.5s after user stops speaking, `stopSTT()` runs → `onSTTStopped` → mic goes idle. Gives time for agent to respond. |
| 2 | **10s agent silence** | `cartesia-audio-bridge.js` → `startAgentSilenceTimer()` | Called when agent finishes TTS. After 10s of no user speech, `onSilenceClosingMessage` fires (e.g. "Standing by if you need anything"), then `stopSTT()`. |
| 3 | **onError** | `app.js` L264–266 | If bridge errors, `bridge.stopSTT()` is called → `onSTTStopped` → mic reverts. |
| 4 | **startSTT fails** | `app.js` L341–353 | `syncMicButton(false, true)` then `startSTT()` — if it throws, catch calls `syncMicButton(false, false)`. Mic never reached recording state; shows idle. |
| 5 | **User clicks mic again** | `app.js` L328 | User manually stops → `bridge.stopSTT()` → `onSTTStopped`. Expected. |
| 6 | **Barge-in** | `cartesia-audio-bridge.js` | When user speaks during TTS, `_bargeIn()` clears TTS buffer but does **not** stop STT. Mic should stay recording. |
| 7 | **VAD misfire** | `app.js` L273–279 | `onVADMisfire` — speech too short. Does **not** call `stopSTT`. Mic should stay recording. |

### 2.3 Most Likely Mic Revert Scenario

**Hypothesis:** The mic reverts 2.5 seconds after the user stops speaking (when `onSpeechEnd` fires). During that 2.5s, the app is:
1. Waiting for STT to return final transcript
2. Calling n8n (1–5+ seconds)
3. Playing TTS

So the mic goes back to idle **while** the assistant is still "Processing…" or "Speaking…". This can feel like an unexpected revert.

**Fix direction:** Consider delaying `stopSTT` until after the full round-trip (transcript → n8n → TTS done), or increase `silenceAfterSpeechToStopMicMs` if the current 2.5s feels too aggressive. The design doc suggests mic stops when no voice is detected; the current behavior matches that.

---

## 3. Text Message Fallbacks — Root Cause Analysis

### 3.1 Reply Extraction Flow (`app.js`)

```
getLLMReply(userText)
  → fetch(n8nWebhookUrl, { method: 'POST', body: JSON.stringify(payload) })
  → res.json()
  → extractReplyFromJson(data)   → returns string or null
  → if null: getNaturalFallback(payload.message)  → returns string or null
  → if still null: "I heard you. I'm still getting set up — please try again in a moment."
```

### 3.2 When Fallbacks Are Used

| Condition | Result |
|-----------|--------|
| `extractReplyFromJson` finds a string in `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content` | **Real reply** — no fallback |
| n8n returns JSON without those keys, but user said "hello", "hi", "thanks", etc. | **Natural fallback** — e.g. "Hello! How can I assist you today?" |
| n8n returns JSON without those keys, no natural fallback match | **Generic fallback** — "I heard you. I'm still getting set up…" |
| fetch throws (CORS, network, timeout) | **Error fallback** — "Sorry, I couldn't reach the assistant. Please try again." |
| n8n returns 404 (workflow inactive) | `res.json()` may succeed; body may be `{}` or error object; `extractReplyFromJson` returns null → generic fallback |

### 3.3 Causes of Text Fallbacks

| # | Cause | How to Diagnose |
|---|-------|-----------------|
| 1 | **n8n workflow inactive** | 404 response; body may lack `output`/`reply`/etc. |
| 2 | **n8n returns different structure** | Response uses a key not in `N8N_REPLY_KEYS` |
| 3 | **CORS blocking fetch** | Browser console: CORS error; fetch throws |
| 4 | **Wrong webhook URL** | 404 or wrong server |
| 5 | **Network/timeout** | fetch throws |
| 6 | **Empty or invalid JSON** | `res.json().catch(() => ({}))` yields `{}`; extractReply returns null |

### 3.4 Expected n8n Response Format

The app looks for a **string** in these keys (in order):

- `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`
- First element of a non-empty array (if string or object — recursive)
- Any string value in nested objects (recursive)

Example valid responses:

```json
{ "reply": "Hello! How can I help?" }
{ "output": "Here is your answer." }
```

---

## 4. Diagnostic Tools

### 4.1 Enable Debug Logging

Add `?debug=1` to the URL or set `window.JARVIS_DEBUG = true` before the app loads. This enables:

- `DEBUG.trace('onTranscript: ...')` — when final transcript is received
- `DEBUG.trace('n8n: sending payload', ...)` — outgoing payload
- `DEBUG.trace('n8n: response', ...)` — status, hasReply, replyPreview
- `DEBUG.trace('VAD misfire ...')` — when speech is too short
- `DEBUG.trace('Mic clicked', ...)` — mic click and STT state
- `DEBUG.trace('startSTT: ...')` — STT pipeline stages

### 4.2 Live Diagnostic Page

Use **`public/debug/fallback-revert-debug.html`** (see below) to:

1. Test n8n webhook from the **browser** (same origin/CORS as the main app)
2. Log exact n8n request/response and whether `extractReplyFromJson` would succeed
3. Log mic button state changes and `onSTTStopped` timing
4. Simulate the full flow with trace timestamps

### 4.3 Node Debug Tools (Existing)

- `npm run debug:n8n` — runs `debug/tools/check-n8n-webhook.js` (Node; no CORS)
- `npm test -- debug/live/n8n-webhook.test.js` — Jest LIVE test for webhook

**Note:** Node tools do not experience CORS. If Node succeeds but the browser gets fallbacks, CORS or browser-specific issues are likely.

---

## 5. Files Reference

| File | Role |
|------|------|
| `public/js/app.js` | `syncMicButton`, `getLLMReply`, `extractReplyFromJson`, `getNaturalFallback`, bridge callbacks |
| `public/js/cartesia-audio-bridge.js` | `stopSTT`, `onSTTStopped`, VAD timers, `silenceAfterSpeechToStopMicMs` |
| `public/js/vad-config.js` | `silenceAfterSpeechToStopMicMs`, `silenceClosingMessageMs` |
| `public/js/debug.js` | `DEBUG.trace`, `DEBUG.error`, enabled via `?debug=1` |
| `debug/tools/check-n8n-webhook.js` | Node webhook connectivity check |
| `debug/live/n8n-webhook.test.js` | Jest LIVE n8n test |

---

## 6. Recommended Next Steps

1. **Run fallback-revert-debug.html** in the browser with `?debug=1`, reproduce the issue, and capture:
   - n8n response (status, body, extracted reply)
   - Mic state transitions and timestamps
2. **Compare Node vs browser** — run `npm run debug:n8n`; if Node succeeds but browser gets fallbacks, investigate CORS and URL config.
3. **Adjust VAD timing** if mic revert feels too early — e.g. increase `silenceAfterSpeechToStopMicMs` or change when `stopSTT` is called relative to the n8n/TTS round-trip.
4. **Verify n8n workflow** — ensure it returns JSON with one of `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content` as a string.
