# UI Patterns Integration Guide

## Quick Integration Steps

The UI patterns module has been created and CSS has been enhanced. To complete the integration, add the following code to `public/js/app.js`:

### Step 1: Add Import (after line 23)

Find this line:
```javascript
import { DEBUG, escapeHtml } from './debug.js';
```

Add after it:
```javascript
import {
  NotificationSystem,
  ProgressIndicator,
  InputHints,
  AutocompleteSystem,
  SmartDefaults,
  ContextKeeper,
  isBrowser,
} from './ui-patterns.js';
```

### Step 2: Initialize UI Patterns (after line 33)

Find this line:
```javascript
const MIC_BOOST_STORAGE_KEY = 'jarvis_mic_boost';
```

Add after it:
```javascript
// Initialize UI patterns (microinteractions, notifications, smart defaults)
const notifications = isBrowser ? new NotificationSystem() : null;
const smartDefaults = isBrowser ? new SmartDefaults() : null;
const contextKeeper = new ContextKeeper();
let inputHints = null;
let autocomplete = null;
let progressIndicator = null;
```

### Step 3: Update `appendMessage` function (after line 191)

Find this section:
```javascript
  });
  
  // Return the element immediately (even though it's not yet in DOM)
  // This maintains backward compatibility with code that uses the return value
  return wrap;
}
```

Add before the return statement:
```javascript
  // Store message in context for smart defaults
  if (smartDefaults && role === 'user') {
    smartDefaults.addRecentItem('messages', content.slice(0, 100));
  }
```

### Step 4: Update `getLLMReply` function

#### 4a. Add progress indicator at start (after line 241)

Find:
```javascript
  if (!payload.message) return { reply: "I didn't catch that. Try again?", data: {} };
  DEBUG.trace('n8n: sending payload', {
```

Add before DEBUG.trace:
```javascript
  // Show progress indicator for async operations
  if (progressIndicator) {
    progressIndicator.remove();
  }
  if (isBrowser && chatContainer) {
    progressIndicator = new ProgressIndicator(chatContainer, { showSpinner: true });
    progressIndicator.show();
    progressIndicator.setProgress(10);
  }
```

#### 4b. Update progress during fetch (around line 282)

Find:
```javascript
    const res = await fetch(n8nWebhookUrl, {
```

Add before it:
```javascript
    // Update progress
    if (progressIndicator) progressIndicator.setProgress(30);
```

#### 4c. Update progress after fetch (around line 288)

Find:
```javascript
    clearTimeout(timeoutId);
    const contentType = res.headers.get('content-type') || '';
```

Add after clearTimeout:
```javascript
    // Update progress
    if (progressIndicator) progressIndicator.setProgress(60);
```

#### 4d. Update progress before parsing (around line 303)

Find:
```javascript
    const reply = extractReplyFromJson(data);
```

Add before it:
```javascript
    // Update progress
    if (progressIndicator) progressIndicator.setProgress(90);
    
    const reply = extractReplyFromJson(data);
    
    // Complete progress
    if (progressIndicator) {
      progressIndicator.setProgress(100);
      setTimeout(() => progressIndicator.hide(), 200);
    }
```

#### 4e. Add success notification (around line 320)

Find:
```javascript
    if (typeof reply === 'string') return { reply, data };
```

Replace with:
```javascript
    if (typeof reply === 'string') {
      // Success notification
      if (notifications && options.showNotifications !== false) {
        notifications.success('Response received', 2000);
      }
      return { reply, data };
    }
```

#### 4f. Hide progress on fallback (around line 336)

Find:
```javascript
    const fallback = natural || "I heard you, sir. Still getting set up — please try again in a moment.";
    DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
    return { reply: natural ? natural : fallback, data };
```

Add before return:
```javascript
    // Hide progress on fallback
    if (progressIndicator) progressIndicator.hide();
```

#### 4g. Add error notifications (around line 337)

Find the catch block:
```javascript
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
```

Add at start of catch:
```javascript
  } catch (err) {
    // Hide progress on error
    if (progressIndicator) progressIndicator.hide();
    
    if (timeoutId) clearTimeout(timeoutId);
```

Then add notifications in each error case:
- After `AbortError`: `if (notifications) notifications.error('Request timed out', 4000);`
- After `CORS` error: `if (notifications) notifications.error('Network error - check connection', 4000);`
- After general error: `if (notifications) notifications.error('Connection failed', 4000);`

### Step 5: Update textInput initialization (around line 728)

Find:
```javascript
if (textInput) {
  // Auto-resize textarea as user types
  function autoResizeTextarea() {
```

Add after `if (textInput) {`:
```javascript
  // Initialize input hints and autocomplete (UI patterns)
  if (isBrowser) {
    inputHints = new InputHints(textInput);
    
    // Smart defaults: recent messages as autocomplete suggestions
    const recentMessages = smartDefaults ? smartDefaults.getRecentItems('messages', 10) : [];
    autocomplete = new AutocompleteSystem(textInput, recentMessages, {
      minChars: 2,
      maxSuggestions: 5,
      debounceMs: 300,
    });
    autocomplete.init();
    
    // Show input hint on focus
    textInput.addEventListener('focus', () => {
      if (inputHints && !textInput.value) {
        inputHints.setHint('Type your message or use the microphone');
      }
    });
  }
```

## Verification

After integration, test:

1. ✅ Type in input - should see hint on focus
2. ✅ Type 2+ characters - should see autocomplete dropdown
3. ✅ Send message - should see progress indicator
4. ✅ Success/error - should see notifications
5. ✅ Recent messages - should appear in autocomplete

## Files Created/Modified

- ✅ `public/js/ui-patterns.js` - New UI patterns module
- ✅ `public/index.html` - Enhanced CSS with animations
- ✅ `UI-PATTERNS-IMPLEMENTATION.md` - Full documentation
- ⚠️ `public/js/app.js` - Needs manual integration (this guide)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify `ui-patterns.js` is loaded
3. Ensure all imports are correct
4. Check that `isBrowser` checks are in place
