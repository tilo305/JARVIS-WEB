# Mic Button Processing Stuck Fix

**Date:** 2026-02-02  
**Status:** ✅ **FIXED**

---

## Issue Summary

**Problem:** When clicking the mic button, the status would get stuck at "Processing…" and never update, preventing the user from continuing.

**Root Cause:** The `getLLMReply` function could hang indefinitely if:
1. The n8n webhook was slow or unresponsive
2. Network issues caused the request to hang
3. The internal timeout (30s) wasn't sufficient in some edge cases

---

## Fixes Applied

### ✅ 1. Added Timeout Wrapper

**File:** `public/js/app.js` (lines 908-937)

Added a 35-second timeout wrapper around `getLLMReply` to prevent the status from getting stuck:

```javascript
// Wrap getLLMReply in a timeout to prevent status from getting stuck
let replyText, replyData;
let timeoutId;
try {
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Request timeout after 35 seconds')), 35000);
  });
  const result = await Promise.race([
    getLLMReply(trimmed, { 
      source: 'voice', 
      attachments: audioAttachments,
      wakeWordTriggered: isWakeWordTriggered
    }),
    timeoutPromise
  ]);
  // Clear timeout if getLLMReply succeeded
  if (timeoutId) clearTimeout(timeoutId);
  replyText = result.reply;
  replyData = result.data;
} catch (timeoutErr) {
  // Clear timeout on error
  if (timeoutId) clearTimeout(timeoutId);
  console.error('[JARVIS] Voice: getLLMReply timeout or error', { error: timeoutErr });
  // Use fallback reply if request times out or fails
  replyText = timeoutErr?.message?.includes('timeout') 
    ? "Request timed out. The assistant is taking too long to respond. Please try again."
    : "Sorry, I couldn't reach the assistant. Please try again.";
  replyData = {};
}
```

**Key Features:**
- 35-second timeout (5 seconds longer than internal 30s timeout)
- Properly clears timeout to prevent memory leaks
- Provides user-friendly error messages
- Ensures status always updates

### ✅ 2. Improved Status Message

**File:** `public/js/app.js` (line 970)

Changed ambiguous "Connecting…" status to more descriptive "Restarting mic…":

```javascript
// Before:
setStatus('Connecting…', '');

// After:
setStatus('Restarting mic…', 'listening');
```

### ✅ 3. Enhanced Error Handling

**File:** `public/js/app.js` (lines 1020-1025)

Added mic button sync in outer error handler to ensure button state is always updated:

```javascript
} catch (err) {
  DEBUG.error('onTranscript error', err);
  setStatus('Error', 'error');
  appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
  // Ensure mic button is synced on error
  syncMicButton(false, false);
}
```

---

## Testing

### Manual Testing

1. **Test normal flow:**
   - Click mic button
   - Speak a message
   - Verify status transitions: "Listening…" → "Processing…" → "Speaking…" → "Listening…"

2. **Test timeout scenario:**
   - Simulate slow n8n response (or disconnect network)
   - Click mic button and speak
   - Verify status updates after 35 seconds with timeout message
   - Verify mic button returns to idle state

3. **Test error handling:**
   - Cause network error (disable network)
   - Click mic button and speak
   - Verify error message is shown
   - Verify status updates and mic button syncs

### Automated Testing

```javascript
// In browser console (with ?debug=1)
// Test timeout handling
window.JARVIS_DEBUG_TEST_MIC_PAYLOAD("test message");
```

---

## Verification

✅ **Syntax Check:** PASSED  
✅ **ESLint Check:** PASSED (0 errors, 0 warnings)  
✅ **Memory Leak Prevention:** Timeout properly cleared  
✅ **Error Handling:** Complete with fallback messages  
✅ **Status Updates:** Always updates, never stuck  

---

## Related Files

- `public/js/app.js` - Main application logic
- `public/js/cartesia-audio-bridge.js` - Audio bridge implementation
- `debug/ERROR-FIXES-SUMMARY.md` - Previous error fixes

---

## Notes

- The 35-second timeout is intentionally longer than the internal 30-second timeout to provide an extra safety net
- The timeout wrapper catches cases where `getLLMReply` might hang due to network issues or unresponsive webhooks
- All timeouts are properly cleared to prevent memory leaks
- Error messages are user-friendly and actionable
