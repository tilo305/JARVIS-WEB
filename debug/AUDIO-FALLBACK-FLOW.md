# Audio Fallback Flow - Where Dynamic Response Fallback Comes From

**Date:** 2025-01-XX  
**Issue:** Understanding where the dynamic response fallback in the chat window comes from when speaking into the mic, and how to verify if audio is being sent correctly to n8n.

---

## 1. Where the Fallback Response Comes From

The **dynamic response fallback** appears in the chat window when n8n doesn't return a proper reply. It's generated in the `getLLMReply` function in `public/js/app.js`.

### 1.1 Fallback Generation Location

**File:** `public/js/app.js`  
**Lines:** 804-809

```javascript
const natural = getNaturalFallback(payload.message);
const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
conversationHistory.addUser(payload.message);
conversationHistory.addAssistant(fallback);
DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
return { reply: fallback, data };
```

### 1.2 When Fallback is Used

The fallback is used when:
1. **n8n returns empty response** (`{}`) - lines 766-770
2. **n8n returns response without expected reply keys** - lines 772-776
3. **No reply extracted from response** - line 705 (`extractReplyFromJson` returns `null`)

The code checks for reply in these keys (in order):
- `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`, `body`, `responseText`

### 1.3 Types of Fallbacks

1. **Natural Fallback** (from `getNaturalFallback` in `public/js/n8n-payload.js`):
   - Greetings → "Hello! How can I assist you today?"
   - Thanks → "You're welcome."
   - Goodbye → "Goodbye. I'll be here when you need me."
   - Yes/No → "Understood."

2. **Generic Fallback** (when no natural match):
   - "I heard you. I'm still getting set up — please try again in a moment."

---

## 2. Complete Audio Flow: Mic → n8n

### 2.1 Flow Diagram

```
User speaks into mic
  ↓
CartesiaAudioBridge captures audio
  ↓
onTranscript callback (app.js:965)
  ↓
Get audio as base64 (app.js:1008-1019)
  ↓
Create audio attachment (app.js:1059-1064)
  ↓
Build payload with audio (app.js:1070-1074)
  ↓
Call getLLMReply (app.js:1134)
  ↓
Send POST to n8n webhook (app.js:530)
  ↓
Parse response (app.js:618-675)
  ↓
Extract reply (app.js:705)
  ↓
If no reply → Use fallback (app.js:804-809)
```

### 2.2 Key Code Locations

#### Audio Capture
**File:** `public/js/app.js`  
**Lines:** 1008-1021

```javascript
// Get recorded audio as base64 before any async operations
let audioBase64 = null;
try {
  audioBase64 = bridge.getRecordedAudioBase64();
  // Validate base64 string
  if (audioBase64 && (typeof audioBase64 !== 'string' || audioBase64.length === 0)) {
    DEBUG.error('Invalid audio base64', { type: typeof audioBase64, length: audioBase64?.length });
    audioBase64 = null;
  }
} catch (err) {
  DEBUG.error('Failed to get recorded audio', { error: err });
  audioBase64 = null;
}
// Clear recorded audio immediately after getting it (to free memory)
bridge.clearRecordedAudio();
```

#### Audio Attachment Creation
**File:** `public/js/app.js`  
**Lines:** 1059-1064

```javascript
const audioAttachments = audioBase64 ? [{
  name: 'voice-recording.pcm',
  type: 'audio/pcm',
  size: Math.floor(audioBase64.length * 3 / 4), // Base64 size to binary size approximation
  data: audioBase64,
}] : [];
```

#### Payload Building
**File:** `public/js/app.js`  
**Lines:** 1070-1074

```javascript
const voicePayload = buildPayload(validatedText, { 
  source: 'voice', 
  attachments: audioAttachments,
  wakeWordTriggered: isWakeWordTriggered
});
```

The `buildPayload` function (line 237) calls `buildN8nPayload` from `public/js/n8n-payload.js`, which processes attachments at lines 150-159:

```javascript
const attachments = rawAttachments.map((f) => {
  if (f instanceof File) return { name: f.name, type: f.type, size: f.size };
  if (f && typeof f === 'object' && 'name' in f) {
    const a = { name: f.name, type: f.type ?? '', size: f.size ?? 0 };
    if (typeof f.data === 'string') a.data = f.data; // base64 file content for n8n
    if (typeof f.ocrText === 'string') a.ocrText = f.ocrText;
    return a;
  }
  return null;
}).filter(Boolean);
```

#### Payload Sending
**File:** `public/js/app.js`  
**Lines:** 1134-1138

```javascript
const result = await Promise.race([
  getLLMReply(validatedText, { 
    source: 'voice', 
    attachments: audioAttachments,
    wakeWordTriggered: isWakeWordTriggered
  }),
  timeoutPromise
]);
```

The `getLLMReply` function sends the payload via POST request at line 530:

```javascript
const r = await fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: payloadJson,
  signal: controller.signal,
  mode: 'cors',
});
```

---

## 3. How to Verify Audio is Being Sent to n8n

### 3.1 Console Logs to Check

The code has extensive logging. Check the browser console for these messages:

#### Audio Capture Verification
Look for:
- `[JARVIS] onTranscript: audio attachment` - Shows if audio was captured
- `[JARVIS] Voice: About to call getLLMReply - payload will be sent to n8n` - Shows payload being prepared

#### Payload Verification
Look for:
- `[JARVIS] Payload SENT (source=voice)` - Confirms payload is being sent
- `[JARVIS] Sending payload to n8n` - Shows full payload structure including attachments
- `[JARVIS] VERIFY: Full payload being sent:` - Shows complete payload object

**Key fields to check in the payload log:**
```javascript
attachments: [{
  name: 'voice-recording.pcm',
  type: 'audio/pcm',
  size: <number>,  // Should be > 0 if audio was captured
  hasData: true,   // Should be true if audio data is present
  dataLength: <number>  // Should be > 0 if audio data is present
}]
```

#### Network Verification
1. Open browser DevTools → Network tab
2. Filter by your n8n webhook URL
3. Find the POST request
4. Click on it → Payload tab
5. Verify `attachments` array contains audio data:
   ```json
   {
     "attachments": [
       {
         "name": "voice-recording.pcm",
         "type": "audio/pcm",
         "size": 12345,
         "data": "base64encodedstring..."
       }
     ]
   }
   ```

### 3.2 Common Issues

#### Issue 1: Audio Not Captured
**Symptoms:**
- `audioBase64` is `null` in console logs
- `hasAudio: false` in attachment logs
- `attachments: []` in payload

**Check:**
- `bridge.getRecordedAudioBase64()` is being called (line 1010)
- Audio recording was active when transcript was received
- No errors in console from `getRecordedAudioBase64()`

#### Issue 2: Audio Not in Payload
**Symptoms:**
- Audio captured but `attachments` array is empty in payload
- `hasAttachments: false` in payload logs

**Check:**
- `audioAttachments` array is created correctly (line 1059-1064)
- `audioAttachments` is passed to `buildPayload` (line 1072)
- `buildN8nPayload` processes attachments correctly (n8n-payload.js:150-159)

#### Issue 3: Payload Not Sent
**Symptoms:**
- No POST request in Network tab
- Error in console: "Failed to fetch" or CORS error

**Check:**
- `n8nWebhookUrl` is set correctly
- Network connectivity
- CORS configuration on n8n server

#### Issue 4: Fallback Appears (Audio May Be Sent)
**Symptoms:**
- Fallback message appears in chat
- But payload may have been sent successfully

**Check:**
- Network tab shows POST request with 200 status
- Response body in Network tab - does it contain expected reply keys?
- Console log: `[JARVIS] VERIFY: Full response received from n8n:` - check if response has `output`, `reply`, etc.

---

## 4. Debugging Steps

### Step 1: Enable Debug Mode
Add `?debug=1` to URL or set `window.JARVIS_DEBUG = true` before page load.

### Step 2: Check Console Logs
Look for these specific log messages in order:

1. **Audio capture:**
   ```
   [JARVIS] onTranscript: audio attachment { hasAudio: true, size: <number> }
   ```

2. **Payload building:**
   ```
   [JARVIS] Voice payload (mic/wake word, full structure): { attachments: [...] }
   ```

3. **Payload sending:**
   ```
   [JARVIS] ✅ PAYLOAD READY TO SEND TO N8N { hasAttachments: true }
   [JARVIS] VERIFY: Full payload being sent: { attachments: [...] }
   ```

4. **Response received:**
   ```
   [JARVIS] ✅ PAYLOAD RECEIVED FROM N8N
   [JARVIS] VERIFY: Full response received from n8n: { ... }
   ```

5. **Reply extraction:**
   ```
   [JARVIS] VERIFY: Reply extracted from response { hasReply: true/false }
   ```

### Step 3: Check Network Tab
1. Open DevTools → Network
2. Speak into mic
3. Find POST request to n8n webhook
4. Check:
   - **Request Payload** → `attachments` array should have audio data
   - **Response** → Should contain reply in expected keys

### Step 4: Verify n8n Receives Audio
In your n8n workflow:
1. Add a **Function** node after the Webhook node
2. Log the incoming data:
   ```javascript
   const attachments = $input.item.json.attachments || [];
   console.log('Attachments received:', attachments);
   if (attachments.length > 0) {
     console.log('Audio attachment:', {
       name: attachments[0].name,
       type: attachments[0].type,
       size: attachments[0].size,
       hasData: !!attachments[0].data,
       dataLength: attachments[0].data?.length || 0
     });
   }
   return $input.item.json;
   ```

---

## 5. Summary

**Fallback Location:**
- Generated in `getLLMReply` function at `public/js/app.js:804-809`
- Triggered when n8n response doesn't contain expected reply keys

**Audio Flow:**
1. Captured: `app.js:1008-1019` → `bridge.getRecordedAudioBase64()`
2. Attached: `app.js:1059-1064` → Creates attachment object with base64 data
3. Payload: `app.js:1070-1074` → `buildPayload()` includes attachments
4. Sent: `app.js:530` → POST to n8n webhook with JSON payload
5. Response: `app.js:618-675` → Parses response, extracts reply
6. Fallback: `app.js:804-809` → Used if no reply found

**Verification:**
- Check console logs for `hasAudio`, `hasAttachments`, `dataLength`
- Check Network tab for POST request payload
- Verify n8n workflow receives `attachments` array with audio data
