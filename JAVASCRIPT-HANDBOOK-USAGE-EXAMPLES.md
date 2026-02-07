# JavaScript Handbook Usage Examples

**Practical examples of applying handbook patterns to JARVIS-WEB**

---

## Example 1: Enhanced Error Handling in `app.js`

### Current Code (app.js line 242-353)

```javascript
async function getLLMReply(userText, options = {}) {
  // ... current implementation with try-catch
  try {
    const res = await fetch(n8nWebhookUrl, { ... });
    // ... handle response
  } catch (err) {
    // ... error handling
  }
}
```

### Enhanced with Handbook Patterns

```javascript
import { Result, NetworkError, TimeoutError, asyncHandler } from './utils/error-handling.js';
import { PerformanceMonitor } from './utils/debug.js';

async function getLLMReply(userText, options = {}) {
  const payload = buildPayload(userText, options);
  if (!payload.message) {
    return Result.error(new ValidationError('Empty message'));
  }
  
  if (!n8nWebhookUrl || typeof n8nWebhookUrl !== 'string' || !n8nWebhookUrl.trim()) {
    return Result.error(new ConfigurationError('N8N webhook URL is not set', 'n8nWebhookUrl'));
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const { result: data, duration } = await PerformanceMonitor.measureAsync(
      'n8n Request',
      async () => {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        } else {
          const text = await response.text();
          return text.trim() ? JSON.parse(text) : {};
        }
      }
    );
    
    clearTimeout(timeoutId);
    DEBUG.trace('n8n: response received', { duration, status: 'success' });
    
    const reply = extractReplyFromJson(data);
    if (typeof reply === 'string') {
      return Result.success({ reply, data });
    }
    
    const fallback = getNaturalFallback(payload.message) || 
      "I heard you, sir. Still getting set up — please try again in a moment.";
    return Result.success({ reply: fallback, data });
    
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      return Result.error(new TimeoutError('Request timed out after 30s', 30000));
    }
    
    if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch'))) {
      return Result.error(new NetworkError('CORS or network error', err));
    }
    
    return Result.error(new NetworkError('Failed to reach assistant', err));
  }
}

// Usage
const result = await getLLMReply(userText, options);
if (result.isSuccess()) {
  const { reply, data } = result.data;
  // Use reply and data
} else {
  const errorMessage = result.error.message;
  setStatus(errorMessage, 'error');
}
```

---

## Example 2: Debounced Search Input

### Current Code (app.js line 741-769)

```javascript
textInput.addEventListener('input', autoResizeTextarea);
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (btnSend) btnSend.click();
  }
});
```

### Enhanced with Debouncing

```javascript
import { debounce } from './utils/performance.js';

// Debounce auto-resize to avoid excessive calculations
const debouncedAutoResize = debounce(() => {
  if (!textInput) return;
  textInput.style.height = 'auto';
  const scrollHeight = textInput.scrollHeight;
  const maxHeight = 120;
  textInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
}, 100);

textInput.addEventListener('input', debouncedAutoResize);
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (btnSend) btnSend.click();
  } else {
    // Immediate resize for Enter+Shift
    setTimeout(autoResizeTextarea, 0);
  }
});
```

---

## Example 3: Memoized Configuration

### Current Code (app.js line 61-70)

```javascript
function getConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  return {
    apiKey: env.VITE_CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || '...',
  };
}
```

### Enhanced with Memoization

```javascript
import { memoize } from './utils/performance.js';

// Memoize config getter (config doesn't change during runtime)
const getConfig = memoize(() => {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  return {
    apiKey: env.VITE_CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || '...',
  };
});

// First call computes, subsequent calls use cache
const { apiKey, voiceId, n8nWebhookUrl } = getConfig();
```

---

## Example 4: Enhanced Debugging

### Current Code (app.js - various DEBUG calls)

```javascript
DEBUG.trace('n8n: sending payload', { ... });
DEBUG.error('n8n webhook error', { ... });
```

### Enhanced with Debug Console

```javascript
import { DebugConsole, PerformanceMonitor, Debug } from './utils/debug.js';

// Grouped logging for related operations
DebugConsole.group('n8n Request', () => {
  console.log('Payload:', payload);
  console.log('URL:', n8nWebhookUrl);
  console.log('Source:', payload.source);
});

// Performance monitoring
const { result, duration } = await PerformanceMonitor.measureAsync(
  'n8n Request',
  async () => {
    const response = await fetch(n8nWebhookUrl, { ... });
    return await response.json();
  }
);

Debug.log(`n8n request completed in ${duration}ms`);

// Table display for complex data
DebugConsole.table([
  { key: 'apiKey', value: apiKey ? 'Set' : 'Not Set' },
  { key: 'voiceId', value: voiceId || 'Not Set' },
  { key: 'n8nWebhookUrl', value: n8nWebhookUrl },
]);
```

---

## Example 5: Throttled Status Updates

### Current Code (app.js line 90-115)

```javascript
let _statusUpdateScheduled = false;
let _pendingStatus = { text: '', className: '' };
function setStatus(text, className = '') {
  if (!statusEl) return;
  _pendingStatus = { text, className };
  if (!_statusUpdateScheduled) {
    _statusUpdateScheduled = true;
    requestAnimationFrame(() => {
      _statusUpdateScheduled = false;
      if (statusEl) {
        statusEl.textContent = _pendingStatus.text;
        statusEl.className = 'status ' + _pendingStatus.className;
      }
    });
  }
  // ... error handling
}
```

### Enhanced with Throttling (Alternative Approach)

```javascript
import { throttle } from './utils/performance.js';

// Throttled status update (alternative to requestAnimationFrame)
const throttledStatusUpdate = throttle((text, className) => {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = 'status ' + className;
}, 100); // Update at most once per 100ms

function setStatus(text, className = '') {
  if (!statusEl) return;
  
  // Immediate update for errors
  if (className === 'error' || text.includes('Error') || text.includes('Failed')) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + className;
    return;
  }
  
  // Throttled update for normal status
  throttledStatusUpdate(text, className);
}
```

---

## Example 6: Result Pattern in WebSocket Operations

### Current Code (cartesia-audio-bridge.js - WebSocket connection)

```javascript
async connectSTTWebSocket() {
  // ... connection logic with try-catch
  return new Promise((resolve, reject) => {
    // ... WebSocket setup
    this.sttWs.onopen = () => resolve();
    this.sttWs.onerror = () => reject(new Error('STT WebSocket error'));
  });
}
```

### Enhanced with Result Pattern

```javascript
import { Result, NetworkError, TimeoutError } from './utils/error-handling.js';

async connectSTTWebSocket() {
  if (this.sttWs?.readyState === WebSocket.OPEN) {
    return Result.success();
  }
  
  if (this.sttWs?.readyState === WebSocket.CONNECTING && this._sttConnectPromise) {
    try {
      await this._sttConnectPromise;
      return Result.success();
    } catch (error) {
      return Result.error(error);
    }
  }
  
  const url = new URL(STT_ENDPOINT);
  // ... setup URL params
  
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        this._sttConnectPromise = null;
        try {
          this.sttWs.close();
        } catch {
          // Ignore
        }
        resolve(Result.error(new TimeoutError('STT WebSocket connection timeout')));
      }
    }, 180000);
    
    const settle = (result) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        this._sttConnectPromise = null;
        resolve(result);
      }
    };
    
    this.sttWs = new WebSocket(url.toString());
    
    this.sttWs.onopen = () => {
      settle(Result.success());
    };
    
    this.sttWs.onerror = (err) => {
      settle(Result.error(new NetworkError('STT WebSocket error', err)));
    };
    
    this.sttWs.onclose = (ev) => {
      if (!settled && ev && ev.code !== 1000 && ev.code !== 1001) {
        settle(Result.error(new NetworkError(
          `STT WebSocket closed unexpectedly (code: ${ev.code})`
        )));
      }
    };
  });
}

// Usage
const result = await bridge.connectSTTWebSocket();
if (result.isError()) {
  DEBUG.error('STT connection failed:', result.error);
  setStatus('STT connection failed', 'error');
} else {
  DEBUG.trace('STT connected successfully');
}
```

---

## Example 7: Lazy Loading AudioWorklet Processors

### Current Code (cartesia-audio-bridge.js line 301-417)

```javascript
async init() {
  // ... loads AudioWorklet processors immediately
  await this.audioContext.audioWorklet.addModule(sttAbsolute);
  await this.audioContext.audioWorklet.addModule(ttsAbsolute);
}
```

### Enhanced with Lazy Loading

```javascript
import { lazyLoader } from './utils/performance.js';

// Lazy load AudioWorklet processors
const sttProcessorLoader = lazyLoader(async () => {
  const basePath = this.options.audioWorkletBasePath || './audio/';
  const sttPath = `${basePath}stt-capture-processor.js`;
  const sttAbsolute = sttPath.startsWith('http') 
    ? sttPath 
    : new URL(sttPath, window.location.origin).href;
  await this.audioContext.audioWorklet.addModule(sttAbsolute);
  return true;
});

const ttsProcessorLoader = lazyLoader(async () => {
  const basePath = this.options.audioWorkletBasePath || './audio/';
  const ttsPath = `${basePath}tts-playback-processor.js`;
  const ttsAbsolute = ttsPath.startsWith('http')
    ? ttsPath
    : new URL(ttsPath, window.location.origin).href;
  await this.audioContext.audioWorklet.addModule(ttsAbsolute);
  return true;
});

async init() {
  // ... AudioContext setup
  
  // Load processors only when needed (lazy loading)
  if (!this.sttProcessorLoaded) {
    await sttProcessorLoader.load();
    this.sttProcessorLoaded = true;
  }
  
  if (!this.ttsProcessorLoaded) {
    await ttsProcessorLoader.load();
    this.ttsProcessorLoaded = true;
  }
  
  // ... rest of initialization
}
```

---

## Summary

These examples demonstrate how to apply handbook patterns to existing JARVIS-WEB code:

1. **Error Handling**: Use Result pattern and custom error classes
2. **Performance**: Add debouncing, throttling, and memoization
3. **Debugging**: Use enhanced console methods and performance monitoring
4. **Code Organization**: Improve structure with utility functions
5. **Memory Management**: Use lazy loading for heavy resources

**Note:** These are examples. Apply patterns gradually and test thoroughly.

---

*Examples based on "The Ultimate JavaScript Handbook" and JARVIS-WEB codebase.*
