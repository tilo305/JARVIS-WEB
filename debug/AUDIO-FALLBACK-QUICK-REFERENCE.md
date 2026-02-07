# Quick Reference: Audio Fallback & Verification

## Where Fallback Comes From

**File:** `public/js/app.js`  
**Function:** `getLLMReply`  
**Lines:** 804-809

```javascript
const natural = getNaturalFallback(payload.message);
const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
conversationHistory.addUser(payload.message);
conversationHistory.addAssistant(fallback);
return { reply: fallback, data };
```

**Triggered when:** n8n response doesn't contain expected reply keys (`output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`)

---

## Audio Flow - Key Locations

### 1. Audio Capture
**File:** `public/js/app.js`  
**Function:** `onTranscript` (in `CartesiaAudioBridge` config)  
**Lines:** 1008-1021

```javascript
let audioBase64 = null;
try {
  audioBase64 = bridge.getRecordedAudioBase64();
  if (audioBase64 && (typeof audioBase64 !== 'string' || audioBase64.length === 0)) {
    DEBUG.error('Invalid audio base64', { type: typeof audioBase64, length: audioBase64?.length });
    audioBase64 = null;
  }
} catch (err) {
  DEBUG.error('Failed to get recorded audio', { error: err });
  audioBase64 = null;
}
bridge.clearRecordedAudio();
```

### 2. Audio Attachment Creation
**File:** `public/js/app.js`  
**Function:** `onTranscript`  
**Lines:** 1059-1064

```javascript
const audioAttachments = audioBase64 ? [{
  name: 'voice-recording.pcm',
  type: 'audio/pcm',
  size: Math.floor(audioBase64.length * 3 / 4),
  data: audioBase64,
}] : [];
```

### 3. Payload Building
**File:** `public/js/app.js`  
**Function:** `onTranscript`  
**Lines:** 1070-1074

```javascript
const voicePayload = buildPayload(validatedText, { 
  source: 'voice', 
  attachments: audioAttachments,
  wakeWordTriggered: isWakeWordTriggered
});
```

**Calls:** `buildPayload()` (line 237) → `buildN8nPayload()` (`public/js/n8n-payload.js:145`)

### 4. Payload Sending
**File:** `public/js/app.js`  
**Function:** `getLLMReply`  
**Lines:** 1134-1138 (call) and 530 (actual fetch)

```javascript
// Called from onTranscript:
const result = await Promise.race([
  getLLMReply(validatedText, { 
    source: 'voice', 
    attachments: audioAttachments,
    wakeWordTriggered: isWakeWordTriggered
  }),
  timeoutPromise
]);

// Inside getLLMReply:
const r = await fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: payloadJson,
  signal: controller.signal,
  mode: 'cors',
});
```

### 5. Response Parsing & Fallback
**File:** `public/js/app.js`  
**Function:** `getLLMReply`  
**Lines:** 705 (extract reply), 804-809 (fallback)

```javascript
const reply = extractReplyFromJson(data);
if (typeof reply === 'string') {
  return { reply, data };
}
// No reply found → use fallback
const natural = getNaturalFallback(payload.message);
const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
return { reply: fallback, data };
```

---

## Console Logs to Check

### Audio Capture
```
[JARVIS] onTranscript: audio attachment { hasAudio: true/false, size: <number> }
```

### Payload Building
```
[JARVIS] Voice payload (mic/wake word, full structure): {
  attachments: [{
    name: 'voice-recording.pcm',
    type: 'audio/pcm',
    size: <number>,
    hasData: true/false,
    dataLength: <number>
  }]
}
```

### Payload Sending
```
[JARVIS] ✅ PAYLOAD READY TO SEND TO N8N { hasAttachments: true/false }
[JARVIS] VERIFY: Full payload being sent: { attachments: [...] }
```

### Response Received
```
[JARVIS] ✅ PAYLOAD RECEIVED FROM N8N
[JARVIS] VERIFY: Full response received from n8n: { ... }
[JARVIS] VERIFY: Reply extracted from response { hasReply: true/false }
```

### Fallback Used
```
[JARVIS] n8n configuration issue: no reply in response. Using fallback.
[JARVIS] n8n: using fallback (no reply in response)
```

---

## Quick Verification Checklist

- [ ] **Audio captured?** Check console for `hasAudio: true` in audio attachment log
- [ ] **Audio in payload?** Check console for `hasData: true` and `dataLength > 0` in payload log
- [ ] **Payload sent?** Check Network tab for POST request to n8n webhook
- [ ] **Audio in request?** Check Network tab → Request Payload → `attachments` array has data
- [ ] **Response received?** Check console for "PAYLOAD RECEIVED FROM N8N"
- [ ] **Reply extracted?** Check console for `hasReply: true` (if false, fallback will be used)
- [ ] **n8n receives audio?** Add Function node in n8n workflow to log `$input.item.json.attachments`

---

## Common Issues

| Issue | Check | Location |
|-------|-------|----------|
| Audio not captured | `audioBase64` is null | `app.js:1010` |
| Audio not in payload | `attachments` array empty | `app.js:1059-1064` |
| Payload not sent | Network error or CORS | `app.js:530` |
| Fallback appears | Response missing reply keys | `app.js:705, 804-809` |

---

## Files to Check

1. **`public/js/app.js`**
   - Line 1008-1021: Audio capture
   - Line 1059-1064: Audio attachment creation
   - Line 1070-1074: Payload building
   - Line 1134-1138: Call to getLLMReply
   - Line 530: Fetch request to n8n
   - Line 705: Reply extraction
   - Line 804-809: Fallback generation

2. **`public/js/n8n-payload.js`**
   - Line 145-200: `buildN8nPayload` function
   - Line 150-159: Attachment processing
   - Line 104-113: `getNaturalFallback` function

3. **`public/js/app.js`**
   - Line 18-49: `extractReplyFromJson` (imported from n8n-payload.js)
