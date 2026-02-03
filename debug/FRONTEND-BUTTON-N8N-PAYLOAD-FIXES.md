# Comprehensive Research: Front-End Not Sending Text and Audio Payloads to N8N

**Date:** 2026-02-02  
**Issue:** Buttons not working - no text or audio payloads sent to N8N when clicking buttons

---

## 1. Problem Summary

**Symptoms:**
- Clicking Send button does nothing
- Clicking Mic button does nothing  
- Clicking Paperclip button does nothing
- No network requests visible in browser DevTools
- No console errors (or errors are being swallowed)

**Expected Behavior:**
- Send button → sends text message to N8N webhook
- Mic button → starts STT, sends voice transcript to N8N webhook
- Paperclip button → opens file picker

---

## 2. Root Cause Analysis

### 2.1 Button Element Null Checks (CRITICAL ISSUE)

**Location:** `public/js/app.js` lines 25-32, 36-42

**Problem:** The code only checks for `chatContainer` and `statusEl` but does NOT check if button elements exist before attaching event listeners.

```javascript
const btnSend = document.getElementById('btnSend');
const btnMic = document.getElementById('btnMic');
const btnPaperclip = document.getElementById('btnPaperclip');
// ... no null checks for these!

// Guard only checks chatContainer and statusEl
if (!chatContainer || !statusEl) {
  throw new Error('JARVIS: missing required DOM elements');
}

// Later, event listeners are attached without checking if buttons exist:
btnSend.addEventListener('click', async () => { ... }); // ❌ Will throw if btnSend is null
btnMic.addEventListener('click', async () => { ... }); // ❌ Will throw if btnMic is null
btnPaperclip.addEventListener('click', () => { ... }); // ❌ Will throw if btnPaperclip is null
```

**Impact:** If any button is missing from the DOM (wrong HTML, script loads before DOM, etc.), `addEventListener` throws a TypeError and stops script execution. All subsequent code (including other button handlers) never runs.

**Fix Required:** Add null checks for all button elements before attaching listeners.

---

### 2.2 Script Execution Order

**Location:** `public/index.html` line 310

**Current Setup:**
```html
<script type="module" src="./js/app.js"></script>
```

**Analysis:**
- ES modules (`type="module"`) defer execution until DOM is ready
- However, if there's an error in the module (e.g., null button), the entire module fails to load
- No error recovery or fallback

**Potential Issues:**
1. If `app.js` throws an error early, no event listeners are attached
2. Browser console might show the error, but user doesn't see it
3. Module loading is atomic - one error stops everything

**Fix Required:** Add try-catch around event listener attachment, or ensure all DOM elements exist before accessing them.

---

### 2.3 Network Request Issues

**Location:** `public/js/app.js` lines 179-226 (`getLLMReply` function)

**Potential Issues:**

1. **CORS Errors:**
   - N8N webhook might not allow cross-origin requests
   - Browser blocks the request silently
   - No error shown to user

2. **Invalid Webhook URL:**
   - URL might be undefined or malformed
   - `fetch()` throws but error is caught and swallowed
   - User sees generic error message

3. **Network Timeout:**
   - Request hangs indefinitely
   - No timeout configured
   - User sees "Processing..." forever

4. **Response Parsing Errors:**
   - N8N returns non-JSON response
   - Parsing fails silently
   - Fallback message shown instead of real error

**Fix Required:** Add better error logging, CORS handling, request timeouts, and response validation.

---

### 2.4 N8N Webhook Configuration

**Location:** `public/js/app.js` line 184, `vite.config.js` line 118-120

**Current URL:** `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4`

**Potential Issues:**

1. **Wrong URL Type:**
   - Using `/webhook-test/` instead of `/webhook/` (test vs production)
   - Test webhooks may not return proper responses

2. **Workflow Not Active:**
   - N8N workflow is inactive
   - Webhook returns 404 or error

3. **Respond to Webhook Node Missing:**
   - Webhook receives request but never responds
   - Frontend waits forever for response
   - See `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`

4. **Response Format Mismatch:**
   - N8N returns response in unexpected format
   - `extractReplyFromJson()` can't find reply
   - Fallback message shown

**Fix Required:** Verify webhook URL, check N8N workflow status, ensure Respond to Webhook node exists.

---

### 2.5 Button Click Handler Execution

**Location:** `public/js/app.js` lines 408-441 (btnSend), 450-485 (btnMic), 487 (btnPaperclip)

**Potential Issues:**

1. **Early Return Conditions:**
   - `btnSend`: Returns early if `textInput.value.trim()` is empty
   - `btnMic`: Returns early if `!apiKey` or mic not supported
   - These are silent - no user feedback

2. **Async Errors:**
   - Errors in async handlers are caught but might not be logged
   - User sees generic "Sorry, something went wrong" message
   - No details about what failed

3. **Bridge Initialization:**
   - `CartesiaAudioBridge` might fail to initialize
   - Mic button handler depends on bridge being ready
   - No check if bridge is initialized

**Fix Required:** Add better error logging, user feedback for early returns, bridge initialization checks.

---

## 3. Diagnostic Checklist

### 3.1 Browser Console Checks

1. **Open browser DevTools (F12)**
2. **Check Console tab for errors:**
   - Look for `TypeError: Cannot read property 'addEventListener' of null`
   - Look for `JARVIS: missing required DOM elements`
   - Look for network errors (CORS, 404, etc.)
   - Look for `[JARVIS]` debug messages

3. **Check Network tab:**
   - Filter by "Fetch/XHR"
   - Click a button
   - See if any request to N8N webhook appears
   - Check request status (200, 404, CORS error, etc.)
   - Check request payload (is it being sent?)
   - Check response body (is N8N responding?)

### 3.2 DOM Element Checks

**Run in browser console:**
```javascript
// Check if buttons exist
console.log('btnSend:', document.getElementById('btnSend'));
console.log('btnMic:', document.getElementById('btnMic'));
console.log('btnPaperclip:', document.getElementById('btnPaperclip'));
console.log('textInput:', document.getElementById('textInput'));
console.log('chatContainer:', document.getElementById('chatContainer'));
console.log('status:', document.getElementById('status'));
```

**Expected:** All should return HTML elements (not `null`)

### 3.3 Configuration Checks

**Run in browser console (if debug mode enabled):**
```javascript
JARVIS_DEBUG_CHECK_CONFIG()
```

**Or manually check:**
```javascript
// Check N8N webhook URL
console.log('N8N URL:', window.JARVIS_CONFIG?.n8nWebhookUrl || 'not set');

// Check if app.js loaded
console.log('app.js loaded:', typeof getLLMReply !== 'undefined');
```

### 3.4 Event Listener Checks

**Run in browser console:**
```javascript
// Check if event listeners are attached
const btnSend = document.getElementById('btnSend');
const btnMic = document.getElementById('btnMic');

// Try to manually trigger
btnSend?.click();
btnMic?.click();

// Check if handlers are attached (Chrome DevTools)
// In Elements tab, select button, look at Event Listeners panel
```

---

## 4. Fixes Required

### Fix 1: Add Button Null Checks ✅

**File:** `public/js/app.js`

**Change:** Add null checks for all button elements before attaching event listeners.

```javascript
// After line 42, add:
if (!btnSend || !btnMic || !btnPaperclip || !textInput || !fileInput) {
  const msg = '[JARVIS] Missing required button elements. Check HTML structure.';
  console.error(msg, { btnSend, btnMic, btnPaperclip, textInput, fileInput });
  throw new Error('JARVIS: missing required button elements');
}
```

### Fix 2: Add Error Handling for Event Listeners ✅

**File:** `public/js/app.js`

**Change:** Wrap event listener attachment in try-catch and add conditional checks.

```javascript
// Replace lines 408-487 with guarded versions:
if (btnSend) {
  btnSend.addEventListener('click', async () => {
    // ... existing handler
  });
} else {
  console.error('[JARVIS] btnSend not found - cannot attach click handler');
}

// Same for btnMic, btnPaperclip
```

### Fix 3: Improve Network Error Logging ✅

**File:** `public/js/app.js`

**Change:** Add detailed logging for fetch errors, CORS issues, and timeouts.

```javascript
// In getLLMReply function, add:
try {
  const res = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // Add timeout
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });
  // ... rest of function
} catch (err) {
  if (err.name === 'AbortError') {
    DEBUG.error('n8n webhook timeout after 30s', { url: n8nWebhookUrl });
  } else if (err.message.includes('CORS')) {
    DEBUG.error('n8n webhook CORS error - check server CORS settings', { url: n8nWebhookUrl });
  } else {
    DEBUG.error('n8n webhook error', { url: n8nWebhookUrl, err });
  }
  // ... existing error handling
}
```

### Fix 4: Add Button Click Debug Logging ✅

**File:** `public/js/app.js`

**Change:** Add debug logging at the start of each button handler.

```javascript
btnSend.addEventListener('click', async () => {
  DEBUG.trace('btnSend clicked', { hasText: !!textInput.value.trim() });
  // ... rest of handler
});
```

### Fix 5: Verify N8N Webhook URL ✅

**File:** `public/js/app.js`, `vite.config.js`

**Action:** Ensure production webhook URL is used (not test URL).

**Check:**
- URL should be: `https://n8n.hempstarai.com/webhook/...` (not `/webhook-test/...`)
- Verify in browser console: `JARVIS_DEBUG_CHECK_CONFIG()` shows correct URL
- Test manually: `fetch('https://n8n.hempstarai.com/webhook/...', { method: 'POST', ... })`

---

## 5. Testing Steps

### Step 1: Verify DOM Elements

1. Open app in browser
2. Open DevTools Console
3. Run diagnostic checks (see section 3.2)
4. Verify all elements exist

### Step 2: Test Button Clicks

1. Open DevTools Network tab
2. Filter by "Fetch/XHR"
3. Click Send button (with text in input)
4. Verify:
   - Request appears in Network tab
   - Request has correct payload
   - Response received from N8N

### Step 3: Test N8N Webhook Directly

**In browser console:**
```javascript
// Test webhook directly
const testPayload = {
  message: "Hello from test",
  session_id: "test_session",
  source: "text"
};

fetch('https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testPayload)
})
  .then(r => r.json())
  .then(d => console.log('N8N Response:', d))
  .catch(e => console.error('N8N Error:', e));
```

**Expected:** Should receive JSON response with `output`, `reply`, or similar field.

### Step 4: Enable Debug Mode

1. Add `?debug=1` to URL
2. Open console
3. Click buttons
4. Check for `[JARVIS]` debug messages
5. Run `JARVIS_DEBUG_SEND_TEST()` to test N8N connection

---

## 6. Common Issues and Solutions

### Issue: "Cannot read property 'addEventListener' of null"

**Cause:** Button element doesn't exist in DOM.

**Solution:**
1. Check HTML - ensure buttons have correct IDs
2. Check script load order - ensure DOM is ready
3. Add null checks before `addEventListener`

### Issue: No network request appears

**Cause:** Event listener not attached, or handler returns early.

**Solution:**
1. Check console for errors
2. Verify buttons exist in DOM
3. Add debug logging to handlers
4. Check for early return conditions

### Issue: Network request fails with CORS error

**Cause:** N8N webhook doesn't allow cross-origin requests.

**Solution:**
1. Configure N8N to allow CORS (add CORS headers)
2. Or use a proxy server
3. Or serve frontend from same origin as N8N

### Issue: Network request succeeds but no reply

**Cause:** N8N workflow not configured correctly (see `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`).

**Solution:**
1. Check N8N workflow is active
2. Verify Respond to Webhook node exists and is connected
3. Check response format matches expected format
4. Use production webhook URL (not test URL)

### Issue: Buttons work but payload is empty

**Cause:** Payload building fails or message is empty.

**Solution:**
1. Check `buildN8nPayload()` function
2. Verify message text is not empty
3. Check for errors in payload construction
4. Add debug logging to see payload before sending

---

## 7. Summary

**Primary Issues:**
1. ❌ **Missing null checks for button elements** - causes script to fail silently
2. ❌ **No error handling for event listener attachment** - errors stop all handlers
3. ❌ **Insufficient network error logging** - hard to diagnose fetch failures
4. ❌ **No button click debug logging** - can't tell if handlers are being called

**Secondary Issues:**
1. ⚠️ N8N webhook configuration (URL, workflow status, Respond to Webhook node)
2. ⚠️ CORS issues
3. ⚠️ Network timeouts
4. ⚠️ Response parsing errors

**Priority Fixes:**
1. ✅ Add button null checks (prevents script failure)
2. ✅ Add error handling for event listeners (prevents silent failures)
3. ✅ Improve network error logging (helps diagnose issues)
4. ✅ Add debug logging (helps trace execution)

**Next Steps:**
1. Implement fixes in `app.js`
2. Test with debug mode enabled
3. Verify N8N webhook is accessible and configured correctly
4. Test all button interactions
