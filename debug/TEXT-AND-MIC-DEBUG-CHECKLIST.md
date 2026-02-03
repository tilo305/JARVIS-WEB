# Text and Mic Debug Checklist

**Last updated:** 2026-02-02  
**Purpose:** Comprehensive testing and debugging for both text send and mic/voice paths after all updates.

---

## Prerequisites

1. **Dev server running:** `npm run vite` (should be on http://localhost:3000)
2. **Open app with debug:** http://localhost:3000/?debug=1
3. **Open browser DevTools:** F12 or Cmd+Option+I
4. **Go to Console tab**

---

## Step 1: Check Configuration

**In the browser console, run:**
```javascript
JARVIS_DEBUG_CHECK_CONFIG()
```

**Expected output:**
```
[JARVIS DEBUG] Configuration check:
  apiKey: Set (sk_cartesia...) OR NOT SET
  voiceId: 95131c95-525c-463b-893d-803bafdf93c4 OR NOT SET
  n8nWebhookUrl: https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4
  Mic support: { supported: true } OR { supported: false, message: '...' }
  Bridge STT active: false (should be false when not recording)
```

**What to check:**
- ✅ `apiKey`: Should be "Set" if you have CARTESIA_API_KEY in .env or window.JARVIS_CONFIG
  - ❌ If "NOT SET": Voice/mic won't work. Text chat will work but no TTS.
- ✅ `voiceId`: Should be set (default or custom)
- ✅ `n8nWebhookUrl`: Should be the production URL (`/webhook/...` not `/webhook-test/...`)
- ✅ `Mic support`: Should be `{ supported: true }` (HTTPS or localhost required)

---

## Step 2: Test n8n Webhook (Backend)

**In the browser console, run:**
```javascript
JARVIS_DEBUG_SEND_TEST()
```

**Expected output:**
```
[JARVIS DEBUG] Sending test message to n8n... Hello from JARVIS debug
[JARVIS DEBUG] Reply OK: Hello, sir. JARVIS here — ready to assist. What would you like me to do?
```

**What to check:**
- ✅ Status should be 200
- ✅ Reply should be a string (the AI response)
- ❌ If "No reply": Check `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`
  - Webhook URL might be webhook-test (use production)
  - n8n workflow might be inactive
  - Respond to Webhook node might not be in the flow

---

## Step 3: Test Text Send Path (UI)

1. **Type a message** in the text input (e.g. "Hello")
2. **Click Send** or press Enter

**Expected behavior:**
- ✅ Your message appears in the chat (user bubble)
- ✅ Status changes to "Processing…"
- ✅ Assistant's reply appears in the chat (assistant bubble)
- ✅ If `apiKey` is set:
  - Status changes to "Speaking…"
  - You hear the voice response (TTS)
  - Status changes to "Ready"
- ✅ If `apiKey` is NOT set:
  - Status shows "Ready (no voice: add CARTESIA_API_KEY for TTS)"
  - You see the text reply but no voice

**Console logs (with ?debug=1):**
```
[JARVIS] Debug mode enabled
n8n: sending payload { message: "Hello", source: "text", ... }
n8n: response { status: 200, hasReply: true, replyPreview: "Hello, sir..." }
```

**If text send fails:**
- ❌ Check console for errors
- ❌ Check Network tab: POST to n8n webhook should return 200 with JSON body
- ❌ If status shows "Error": check console for error message

---

## Step 4: Test Mic/Voice Path (UI)

### 4a. Start the mic

1. **Click the mic button** (🎤)

**Expected behavior:**
- ✅ If `apiKey` is NOT set:
  - Status shows "Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)"
  - Mic does NOT start
  - **FIX:** Set CARTESIA_API_KEY in .env or window.JARVIS_CONFIG, then reload
- ✅ If `apiKey` IS set:
  - Mic button becomes active/recording (visual change)
  - Status shows "Connecting…" then "Listening…"
  - You should see the mic icon change (active state)

**Console logs (with ?debug=1):**
```
Mic clicked { sttActive: false }
TTS connected, starting STT…
STT WebSocket open
STT WebSocket connected
getUserMedia OK, stream tracks: 1
VAD started, pipeline active
```

**If mic fails to start:**
- ❌ Check console for errors:
  - "CARTESIA_API_KEY is required" → Set API key
  - "Microphone access was denied" → Allow mic permission in browser
  - "No microphone found" → Connect a mic
  - "STT WebSocket error" → Check API key validity, network
- ❌ Check browser address bar for mic permission icon (🎤 with X)

### 4b. Speak into the mic

1. **Speak clearly** (e.g. "Hello JARVIS")
2. **Stop speaking** and wait for VAD silence timeout (~1.2s)

**Expected behavior:**
- ✅ While speaking:
  - Status shows partial transcripts: `Listening… "Hello JAR..."`
  - Console shows: `STT transcript { text: "Hello", is_final: false }`
- ✅ After you stop speaking (VAD detects end):
  - Status changes to "Processing…"
  - Your transcript appears in the chat (user bubble)
  - Console shows: `onTranscript: sending voice payload to n8n { length: 12, preview: "Hello JARVIS" }`
  - n8n request is sent
  - Assistant's reply appears in the chat (assistant bubble)
  - Status changes to "Speaking…"
  - You hear the voice response (TTS)
  - Status changes to "Ready"
  - Mic stops automatically (after silence timeout)

**Console logs (with ?debug=1):**
```
VAD onSpeechStart - enabling STT streaming
STT transcript { text: "Hello", is_final: false }
STT transcript { text: "Hello JARVIS", is_final: false }
VAD onSpeechEnd - sending finalize, starting 2.5s mic stop timer
STT transcript { text: "Hello JARVIS", is_final: true }
2.5s elapsed - sending transcript to agent { fromFinal: true, preview: "Hello JARVIS" }
onTranscript: sending voice payload to n8n { length: 12, preview: "Hello JARVIS" }
n8n: sending payload { message: "Hello JARVIS", source: "voice", ... }
n8n: response { status: 200, hasReply: true, replyPreview: "Hello, sir..." }
```

**If voice fails:**
- ❌ **No partial transcripts while speaking:**
  - VAD might not detect your voice (too quiet, background noise)
  - Check mic input level in OS settings
  - Try speaking louder or closer to the mic
- ❌ **Partial transcripts appear but no final transcript:**
  - STT WebSocket might have closed or errored
  - Check console for `[STT]` errors
  - Check API key validity
- ❌ **Final transcript appears but no reply in chat:**
  - Check console for `onTranscript error` or `n8n webhook error`
  - Run `JARVIS_DEBUG_SEND_TEST()` to verify n8n is working
  - Check Network tab: POST to n8n should return 200
- ❌ **Reply appears in chat but no voice:**
  - Check console for `TTS error in onTranscript`
  - TTS WebSocket might have failed
  - Check API key validity
  - If `apiKey` is NOT set: expected (text only, no voice)

---

## Step 5: Common Issues and Fixes

### Issue: "Add CARTESIA_API_KEY" when clicking mic

**Cause:** `apiKey` is not set.

**Fix:**
1. In `.env`:
   ```
   VITE_CARTESIA_API_KEY=your_key_here
   ```
2. Or in browser console (temporary):
   ```javascript
   window.JARVIS_CONFIG = {
     apiKey: 'your_key_here',
     voiceId: '95131c95-525c-463b-893d-803bafdf93c4',
     n8nWebhookUrl: 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4'
   };
   ```
3. Reload the page (hard refresh: Ctrl+F5)

### Issue: Text appears in chat but no voice

**Cause:** `apiKey` is not set, or TTS failed.

**Fix:**
- Set `CARTESIA_API_KEY` (see above)
- Check console for TTS errors
- Verify API key is valid (not expired, has TTS access)

### Issue: Mic starts but no transcripts appear

**Cause:** VAD not detecting speech, or STT WebSocket failed.

**Fix:**
- Speak louder or closer to the mic
- Check mic input level in OS settings
- Check console for STT WebSocket errors
- Verify API key is valid

### Issue: "No reply" from n8n webhook

**Cause:** Webhook URL is wrong, workflow inactive, or Respond to Webhook node missing.

**Fix:** See `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`

---

## Step 6: Report Results

After testing, report:

1. **Text send:** ✅ Works / ❌ Fails (paste console errors)
2. **Mic start:** ✅ Works / ❌ Fails (paste console errors)
3. **Voice transcripts:** ✅ Works / ❌ Fails (paste console errors)
4. **n8n reply:** ✅ Works / ❌ Fails (paste console errors)
5. **TTS playback:** ✅ Works / ❌ Fails (paste console errors)
6. **Config check output:** (paste `JARVIS_DEBUG_CHECK_CONFIG()` output)

---

## Quick Commands

```javascript
// Check config
JARVIS_DEBUG_CHECK_CONFIG()

// Test n8n webhook
JARVIS_DEBUG_SEND_TEST()

// Enable debug (if not already on)
window.JARVIS_DEBUG = true

// Check if debug is enabled
DEBUG.enabled
```
