/**
 * JARVIS Chat App — Iron Man themed voice/chat UI
 * Connects Cartesia STT/TTS via AudioWorklet (aUdiO dOcS, cArTeSiA dOcS)
 *
 * Bridge ↔ UI contract:
 * - Bridge callbacks (onTranscript, onSTTStopped, onError, onSpeechStart/End, etc.) drive status and mic state.
 * - setStatus() and syncMicButton() are the single place to update header status and mic button (active/disabled/aria).
 * - Mic: click = toggle STT; bridge.onSTTStopped always clears mic "recording" state so UI stays in sync.
 *
 * Debug: Add ?debug=1 to URL or set window.JARVIS_DEBUG = true
 */
import { CartesiaAudioBridge } from './cartesia-audio-bridge.js';
import { VAD_CONFIG } from './vad-config.js';
import { buildN8nPayload, validateN8nPayload, extractReplyFromJson, extractFilesFromJson, getNaturalFallback } from './n8n-payload.js';
import {
  ConversationHistory,
  classifyIntent,
  getContextEnrichment,
  validateInput,
  runWithRetry,
} from './agentic-patterns.js';
import { addOcrToAttachments } from './ocr-tool.js';
import {
  createPdfBlob,
  createImageBlobFromBase64,
  createTextBlob,
  downloadBlob,
  isAudioFile,
  safeFilename,
} from './file-creator.js';
import { DEBUG, escapeHtml } from './debug.js';
import { 
  ValidationError, 
  NetworkError, 
  TimeoutError, 
  ConfigurationError
} from './utils/error-handling.js';
import { debounce, memoize } from './utils/performance.js';
import { 
  validateFile, 
  sanitizeFilename, 
  sanitizeWebhookResponse,
  rateLimiter,
  isValidUrl 
} from './security.js';
import { PerformanceMonitor } from './utils/debug.js';
import {
  detectCORSError,
  diagnoseCORS,
  testCORSPreflight,
  getCORSConfigurationGuide,
} from './cors-handler.js';

const chatContainer = document.getElementById('chatContainer');
const textInput = document.getElementById('textInput');
const btnSend = document.getElementById('btnSend');
const btnMic = document.getElementById('btnMic');
const btnPaperclip = document.getElementById('btnPaperclip');
const btnStopVoice = document.getElementById('btnStopVoice');
const btnExportPdf = document.getElementById('btnExportPdf');
const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');
const MIC_BOOST_STORAGE_KEY = 'jarvis_mic_boost';

/** Guard: fail fast if required DOM is missing (wrong page or load order) */
if (!chatContainer || !statusEl) {
  const msg = '[JARVIS] Missing required DOM (chatContainer or status). Load app.js on the correct page.';
  /* eslint-disable no-console -- intentional when DOM is missing */
  if (typeof console !== 'undefined' && console.error) console.error(msg);
  /* eslint-enable no-console */
  throw new Error('JARVIS: missing required DOM elements');
}

/** Guard: check button elements exist before attaching event listeners */
if (!btnSend || !btnMic || !btnPaperclip || !textInput || !fileInput) {
  const msg = '[JARVIS] Missing required button elements. Check HTML structure.';
  const missing = {
    btnSend: !btnSend,
    btnMic: !btnMic,
    btnPaperclip: !btnPaperclip,
    textInput: !textInput,
    fileInput: !fileInput,
  };
  /* eslint-disable no-console -- intentional when DOM is missing */
  if (typeof console !== 'undefined' && console.error) console.error(msg, missing);
  /* eslint-enable no-console */
  throw new Error('JARVIS: missing required button elements');
}

/** Config: Vite env when built, or window.JARVIS_CONFIG for static HTML (e.g. public/index.html) */
// Memoized config getter (config doesn't change during runtime - JavaScript Handbook pattern)
const getConfig = memoize(() => {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  const defaultN8n = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
  // Electron: n8n URL is resolved at send time via electronAPI.getN8nWebhookUrl() (main process .env)
  const n8nUrl = env.VITE_N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || env.N8N_WEBHOOK_URL || defaultN8n;
  return {
    apiKey: env.VITE_CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: n8nUrl,
    // Low-latency bidirectional flow: default true = send to agent on STT final (saves ~2.5s vs waiting for silence)
    sendTranscriptOnFinal: env.VITE_SEND_TRANSCRIPT_ON_FINAL !== 'false' && cfg.sendTranscriptOnFinal !== false,
  };
});

const { apiKey, voiceId, n8nWebhookUrl, sendTranscriptOnFinal } = getConfig();

/** Detect Electron desktop context (preload exposes electronAPI when running in Electron). */
if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
  window.JARVIS_IS_ELECTRON = true;
  // Log n8n URL at startup when available (from main process .env)
  if (window.electronAPI?.getN8nWebhookUrl) {
    window.electronAPI.getN8nWebhookUrl().then((u) => {
      /* eslint-disable-next-line no-console -- intentional: Electron startup verification */
      console.log('[JARVIS] Electron: n8n webhook URL (from .env):', u);
    }).catch(() => {});
  }
}

/**
 * Show a toast notification (Electron menu-action, etc.).
 * Uses existing .notification CSS from index.html.
 * @param {string} message - Message to display
 * @param {string} [type='info'] - 'info' | 'success' | 'error' | 'warn'
 */
function showNotification(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = message;
  el.style.borderColor = type === 'error' ? 'var(--iron-red)' : type === 'success' ? 'var(--gold)' : 'var(--border)';
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/** Wire Electron menu-action listener (Pattern 3: Main→Renderer). */
if (typeof window !== 'undefined' && window.electronAPI?.onMenuAction) {
  window.electronAPI.onMenuAction(({ action, payload }) => {
    if (action === 'ping') {
      showNotification(String(payload ?? 'Pong'), 'success');
    }
  });
}

/** Session ID for n8n workflow continuity (persists for page lifetime) */
const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** Cached n8n webhook URL from Electron main process (avoids repeated IPC). */
let cachedElectronN8nUrl = null;

/** Conversation history for context (Agentic Pattern: Memory). Never cleared until page refresh. */
const conversationHistory = new ConversationHistory(20);

/** Flag to suppress onSTTStopped callback during STT restart (prevents mic flicker) */
let _isRestartingSTT = false;

/** Flag to prevent multiple concurrent mic button clicks */
let _micClickInProgress = false;

/** Build payload with app's session ID, conversation history, intent, and context (Agentic Patterns) */
function buildPayload(message, options) {
  const recentTurns = conversationHistory.getRecent(10);
  const intent = classifyIntent(message);
  const contextEnrichment = getContextEnrichment();
  return buildN8nPayload(message, {
    ...options,
    sessionId,
    conversationHistory: recentTurns,
    intent,
    contextEnrichment,
  });
}

/**
 * Strip markdown and meta-formatting so TTS speaks only the words (no "asterisk", "bold", etc.).
 * Removes **bold**, *italic*, `code`, and similar without reading the symbols aloud.
 * Also strips any remaining * or _ (TTS would read these as "asterisk"/"underscore").
 */
function stripMarkdownForTTS(text) {
  if (typeof text !== 'string' && text != null) text = String(text);
  if (!text || !text.trim()) return '';
  let t = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1')        // *italic* -> italic
    .replace(/__([^_]+)__/g, '$1')        // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1')          // _italic_ -> italic
    .replace(/`([^`]+)`/g, '$1')          // `code` -> code
    .replace(/~~([^~]+)~~/g, '$1')        // ~~strike~~ -> strike
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/\*+/g, '')                  // Remove remaining asterisks (TTS reads as "asterisk")
    .replace(/_+/g, ' ')                  // Remove remaining underscores (TTS reads as "underscore")
    .replace(/\s+/g, ' ');                // Normalize whitespace
  return t.trim();
}

/**
 * Split text into sentences for TTS continuations (natural prosody with continue: true).
 * Keeps sentence-ending punctuation. Single segment or no sentence end = one chunk.
 */
function splitSentencesForTTS(text) {
  const t = (typeof text === 'string' ? text : String(text || '')).trim();
  if (!t) return [];
  const parts = t.split(/(?<=[.!?])\s+/);
  const trimmed = parts.map((p) => p.trim()).filter(Boolean);
  return trimmed.length > 0 ? trimmed : [t];
}

// Optimized: Use requestAnimationFrame for smooth UI updates (reduces layout thrashing)
let _statusUpdateScheduled = false;
let _pendingStatus = { text: '', className: '' };
function setStatus(text, className = '') {
  if (!statusEl) return;
  // Store latest status values
  _pendingStatus = { text, className };
  // Batch status updates to avoid excessive DOM manipulation
  if (!_statusUpdateScheduled) {
    _statusUpdateScheduled = true;
    requestAnimationFrame(() => {
      _statusUpdateScheduled = false;
      if (statusEl) {
        // Use the latest pending values (may have changed during the frame)
        statusEl.textContent = _pendingStatus.text;
        statusEl.className = 'status ' + _pendingStatus.className;
      }
    });
  }
  // For critical updates that need immediate feedback, update synchronously
  // This ensures important status changes (like errors) are visible immediately
  if (className === 'error' || text.includes('Error') || text.includes('Failed')) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + className;
  }
}

/** Keep mic button in sync with bridge STT state (single source of truth for UI) */
function syncMicButton(recording = false, disabled = false) {
  if (!btnMic) return;
  DEBUG.trace('syncMicButton', { recording, disabled });
  btnMic.disabled = disabled;
  if (recording) {
    btnMic.classList.add('active', 'recording');
    btnMic.setAttribute('aria-pressed', 'true');
    btnMic.setAttribute('aria-label', 'Microphone on — click to stop');
  } else {
    btnMic.classList.remove('active', 'recording');
    btnMic.setAttribute('aria-pressed', 'false');
    btnMic.setAttribute('aria-label', 'Microphone — click to talk');
  }
}

// Optimized: Use DocumentFragment and requestAnimationFrame for efficient DOM updates
function appendMessage(role, content, attachments = []) {
  if (!chatContainer) return null;
  
  // Format timestamp for display
  const now = new Date();
  const timestamp = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: 'numeric', 
    minute: '2-digit'
  });
  
  // Use DocumentFragment for batch DOM operations (reduces reflows)
  const fragment = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.className = 'message ' + role;
  const label = role === 'user' ? 'You' : 'JARVIS';
  wrap.innerHTML = `<div class="label">${escapeHtml(label)}</div><div class="timestamp">${escapeHtml(timestamp)}</div><div class="content">${escapeHtml(content)}</div>`;
  if (attachments.length) {
    const attDiv = document.createElement('div');
    attDiv.className = 'attachments';
    for (const a of attachments) {
      const isImage = (a && typeof a === 'object' && a.type && a.type.startsWith('image/'));
      const isAudio = (a && typeof a === 'object' && a.type) ? isAudioFile(a) : false;
      if (isImage) {
        const img = document.createElement('img');
        img.src = a.url || URL.createObjectURL(a);
        img.alt = 'Attachment';
        attDiv.appendChild(img);
      } else if (isAudio && (a instanceof File || a instanceof Blob)) {
        const name = a.name || 'audio';
        const block = document.createElement('div');
        block.className = 'attachment-audio';
        block.innerHTML = `<span class="file-name">${escapeHtml(name)}</span>`;
        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'btn-attachment';
        downloadBtn.textContent = 'Download';
        downloadBtn.title = 'Download';
        downloadBtn.addEventListener('click', () => {
          downloadBlob(a, safeFilename(name, ''));
        });
        block.appendChild(downloadBtn);
        attDiv.appendChild(block);
      } else {
        const name = typeof a === 'string' ? a : (a && a.name) || 'File';
        const span = document.createElement('span');
        span.className = 'file-name';
        span.textContent = name;
        attDiv.appendChild(span);
      }
    }
    wrap.appendChild(attDiv);
  }
  fragment.appendChild(wrap);
  
  // Batch DOM update with requestAnimationFrame for smooth rendering
  // Store reference to chatContainer in case it changes
  const container = chatContainer;
  requestAnimationFrame(() => {
    if (container) {
      container.appendChild(fragment);
      // Scroll after DOM update completes
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  });
  
  // Return the element immediately (even though it's not yet in DOM)
  // This maintains backward compatibility with code that uses the return value
  return wrap;
}

/** Max attachment size (bytes) — larger files are skipped to avoid huge payloads */
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Read File objects to base64 for sending in JSON payload.
 * Implements comprehensive security validation based on OWASP file upload guidelines.
 * Skips files over MAX_ATTACHMENT_SIZE. Returns array of { name, type, size, data }.
 */
async function filesToAttachmentPayload(files) {
  const results = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    
    // Comprehensive security validation
    const validation = await validateFile(f, { 
      checkMagicBytes: true, 
      strictMimeType: true 
    });
    
    if (!validation.valid) {
      DEBUG.error('attachment validation failed', { 
        name: f.name, 
        error: validation.error,
        type: f.type,
        size: f.size 
      });
      // Show user-friendly error
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`File "${f.name}" rejected: ${validation.error}`);
      }
      continue;
    }
    
    // Size check (redundant but kept for backward compatibility)
    if (f.size > MAX_ATTACHMENT_SIZE) {
      DEBUG.trace('attachment skipped (too large)', { name: f.name, size: f.size });
      continue;
    }
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const m = r.result;
          resolve(typeof m === 'string' && m.includes(',') ? m.split(',')[1] : '');
        };
        r.onerror = () => reject(r.error);
        r.readAsDataURL(f);
      });
      
      // Sanitize filename before sending
      const sanitizedName = sanitizeFilename(f.name);
      results.push({ 
        name: sanitizedName, 
        type: f.type, 
        size: f.size, 
        data: base64 
      });
    } catch (err) {
      DEBUG.error('attachment read failed', { name: f.name, err });
    }
  }
  return results;
}

/**
 * Message flow (send/receive contract):
 * 1. User action (text Send or voice final) → appendMessage('user', text) → conversationHistory.push(user)
 * 2. getLLMReplyWithFiller / getLLMReply builds payload (message, query, input, sessionId, etc.) and POSTs to n8n
 * 3. Response parsed via extractReplyFromJson → appendMessage('assistant', reply) → conversationHistory.push(assistant)
 * 4. TTS speaks reply (if apiKey); processFileSpecs handles any file outputs from n8n
 * UI always shows user message first, then assistant message after n8n responds (or error fallback).
 */

/**
 * Get LLM reply from n8n webhook.
 * Sends full payload: message, session_id, sessionId, timestamp, timezone, location,
 * message_id, messageId, source, attachments, locale, language.
 * @returns {{ reply: string, data: Object }} - reply text and raw response for files
 * 
 * Enhanced with Result pattern and custom error classes from JavaScript Handbook
 */
async function getLLMReply(userText, options = {}) {
  // Agentic Pattern: Guardrails — validate input before sending
  const inputValidation = validateInput(userText);
  if (!inputValidation.valid) {
    DEBUG.error('getLLMReply: input validation failed', { error: inputValidation.error });
    return { reply: inputValidation.error || "I didn't catch that. Try again?", data: {} };
  }

  const payload = buildPayload(userText, options);

  // Validation with custom error class
  if (!payload.message) {
    const error = new ValidationError("I didn't catch that. Try again?");
    DEBUG.error('getLLMReply: empty message', error);
    return { reply: error.message, data: {} };
  }

  const validation = validateN8nPayload(payload);
  if (!validation.valid) {
    DEBUG.error('getLLMReply: invalid n8n payload', { errors: validation.errors });
    return { reply: "Configuration error, sir. The request could not be sent. Please try again.", data: {} };
  }

  // Resolve n8n URL: from Electron main (.env) when in desktop app, else from config
  let url = n8nWebhookUrl;
  if (typeof window !== 'undefined' && window.electronAPI?.getN8nWebhookUrl) {
    if (!cachedElectronN8nUrl) {
      cachedElectronN8nUrl = await window.electronAPI.getN8nWebhookUrl();
    }
    url = cachedElectronN8nUrl || url;
  }

  DEBUG.trace('n8n: sending payload', { 
    message: payload.message.slice(0, 50), 
    source: payload.source, 
    url,
    hasAttachments: !!(payload.attachments && payload.attachments.length),
    attachmentCount: payload.attachments?.length || 0
  });
  
  // Enhanced logging for payload verification
  if (DEBUG.enabled) {
    DEBUG.trace('n8n: full payload structure', {
      source: payload.source,
      messageLength: payload.message.length,
      sessionId: payload.sessionId,
      messageId: payload.messageId,
      attachments: payload.attachments?.map(a => ({ name: a.name, type: a.type, hasData: !!a.data })) || []
    });
  }
  
  // Configuration validation with custom error class
  if (!url || typeof url !== 'string' || !url.trim()) {
    const error = new ConfigurationError('N8N webhook URL is not set', 'n8nWebhookUrl');
    DEBUG.error('n8n webhook URL is missing or invalid', { url, error });
    return { reply: "Configuration error, sir. N8N webhook URL is not set. Please check your configuration.", data: {} };
  }
  
  // URL validation to prevent SSRF attacks
  if (!isValidUrl(url)) {
    const error = new ConfigurationError('N8N webhook URL is invalid or uses dangerous protocol', 'n8nWebhookUrl');
    DEBUG.error('n8n webhook URL validation failed', { url, error });
    return { reply: "Configuration error, sir. N8N webhook URL is invalid. Please check your configuration.", data: {} };
  }
  
  // Rate limiting to prevent abuse
  const rateLimitKey = `n8n-${sessionId}`;
  if (!rateLimiter.isAllowed(rateLimitKey)) {
    DEBUG.error('n8n webhook rate limit exceeded', { rateLimitKey });
    return { reply: "Rate limit exceeded, sir. Please wait a moment before trying again.", data: {} };
  }
  
  const useElectronProxy = typeof window !== 'undefined' && window.electronAPI?.invokeN8nWebhook;
  const N8N_TIMEOUT_MS = 30000; // 30s — avoid hanging; optimal for conversational latency

  try {
    // Agentic Pattern: Exception Handling — retry with exponential backoff for transient failures
    const { result: responseData, duration } = await PerformanceMonitor.measureAsync(
      `n8n Request (${payload.source})`,
      () => runWithRetry(async () => {
        const controller = new AbortController();
        const timeoutId = useElectronProxy ? null : setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
        try {
          const payloadJson = JSON.stringify(payload);
          DEBUG.trace('n8n: sending POST request', {
            source: payload.source,
            payloadSize: payloadJson.length,
            url,
            viaElectron: !!useElectronProxy
          });

          // eslint-disable-next-line no-console -- intentional: user needs to verify payloads are sent
          console.log(`[JARVIS] Sending ${payload.source} to n8n (message, query, input all set):`, {
            source: payload.source,
            message: payload.message.slice(0, 120),
            messageLength: payload.message.length,
            hasAttachments: !!(payload.attachments && payload.attachments.length),
            sessionId: payload.sessionId
          });

          if (useElectronProxy) {
            const r = await window.electronAPI.invokeN8nWebhook(url, payloadJson);
            if (r.status < 200 || r.status >= 300) {
              throw new NetworkError(`HTTP ${r.status}: ${r.statusText}`);
            }
            return { data: r.data, status: r.status, statusText: r.statusText };
          }

          const proxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/n8n-proxy` : null;
          const useProxy = proxyUrl && window.location.origin !== 'null' && !url.startsWith(window.location.origin);
          let res;
          if (useProxy) {
            res = await fetch(proxyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, body: payload }),
              signal: controller.signal,
            });
            if (res.status === 404) {
              res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payloadJson,
                signal: controller.signal,
              });
            }
          } else {
            res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payloadJson,
              signal: controller.signal,
            });
          }

          if (!res.ok) {
            throw new NetworkError(`HTTP ${res.status}: ${res.statusText}`);
          }

          const contentType = res.headers.get('content-type') || '';
          let data = {};
          if (contentType.includes('application/json')) {
            data = await res.json().catch(() => ({}));
          } else {
            const text = await res.text().catch(() => '');
            if (text.trim()) {
              try {
                data = JSON.parse(text);
              } catch {
                data = { output: text.trim() };
              }
            }
          }

          return { data, status: res.status, statusText: res.statusText };
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      }, { maxAttempts: 3 })
    );
    
    const { data, status, statusText } = responseData;
    
    // Sanitize webhook response to prevent XSS attacks
    const sanitizedData = sanitizeWebhookResponse(data);
    const reply = extractReplyFromJson(sanitizedData);
    
    DEBUG.trace('n8n: response received', { 
      status, 
      statusText,
      source: payload.source,
      hasReply: !!reply, 
      replyPreview: typeof reply === 'string' ? reply.slice(0, 50) : '',
      responseKeys: Object.keys(data),
      duration: `${duration.toFixed(2)}ms`
    });
    
    // Always log response receipt (not just in debug mode) for verification
    // eslint-disable-next-line no-console -- intentional: user needs to verify responses are received
    console.log(`[JARVIS] Received ${payload.source} response from n8n (${duration.toFixed(2)}ms):`, {
      source: payload.source,
      status,
      hasReply: !!reply,
      replyPreview: typeof reply === 'string' ? reply.slice(0, 100) : 'No reply extracted'
    });
    
    if (typeof reply === 'string') {
      return { reply, data };
    }
    
    // No reply extracted — log so we can diagnose fallback (message was sent; n8n returned no recognized reply key)
    const responseKeys = data && typeof data === 'object' ? Object.keys(data) : [];
    // eslint-disable-next-line no-console -- intentional: user needs to see why fallback was used
    console.warn('[JARVIS] n8n fallback: no reply in response. Message we sent:', JSON.stringify(payload.message).slice(0, 80), '| Response keys:', responseKeys.join(', ') || '(empty)', '| Body preview:', JSON.stringify(data).slice(0, 400));
    if (DEBUG.enabled && typeof reply !== 'string') {
      DEBUG.trace('n8n: response body (no reply extracted)', data);
    }
    if (status >= 200 && status < 300 && (Object.keys(data).length === 0 || !extractReplyFromJson(data))) {
      DEBUG.error('n8n: empty or no reply in response body. In n8n, set Webhook node Respond to "Using Respond to Webhook Node" and return JSON with one of: output, reply, result, text, message, response, answer, content, body. See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
    }
    const natural = getNaturalFallback(payload.message);
    const fallback = natural || "I heard you, sir. Still getting set up — please try again in a moment.";
    DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
    return { reply: natural ? natural : fallback, data };
    
  } catch (err) {
    // Enhanced error handling with custom error classes
    if (err.name === 'AbortError') {
      const error = new TimeoutError('Request timed out after 30s', 30000);
      DEBUG.error('n8n webhook timeout after 30s', { url, message: payload.message.slice(0, 50), error });
      return { reply: "Request timed out, sir. The assistant is taking too long to respond. Please try again.", data: {} };
    } else if (err instanceof NetworkError) {
      const code = err.code ?? err.cause?.code;
      const hint = code ? ` (${code})` : '';
      const is429 = err.message && err.message.includes('429');
      const is404 = err.message && err.message.includes('404');
      // Log message first so it's visible when copied to clipboard (objects stringify as [object Object])
      DEBUG.error('n8n webhook network error:', err.message || String(err), { url, code });
      if (is404) {
        // eslint-disable-next-line no-console -- intentional: user needs to fix webhook URL
        console.warn('[JARVIS] 404: Webhook not found. In n8n: open the workflow → turn it ON (Active). Use production URL /webhook/... not /webhook-test/.... If you recreated the workflow, copy the new webhook URL into .env. URL:', url);
      }
      if (is429) {
        return { reply: "Rate limit exceeded, sir. Please wait a moment before trying again.", data: {} };
      }
      if (is404) {
        return { reply: "Webhook not found, sir. In n8n: open the workflow and turn it ON (Active). Use the production URL (/webhook/..., not /webhook-test/). If you recreated the workflow, update the webhook URL in .env.", data: {} };
      }
      return { reply: `Network error${hint}, sir. Could not reach the assistant. Check your connection and that n8n.hempstarai.com is reachable.`, data: {} };
    } else if (detectCORSError(err, url) || (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch')))) {
      const error = new NetworkError('CORS or network error', err);
      DEBUG.error('n8n webhook CORS or network error', { url, error });
      if (DEBUG.enabled) {
        DEBUG.error('CORS config guide', getCORSConfigurationGuide(typeof window !== 'undefined' ? window.origin : ''));
      }
      return { reply: "Network error, sir. Could not reach the assistant. Check your connection and CORS settings.", data: {} };
    } else {
      const error = new NetworkError('Failed to reach assistant', err);
      DEBUG.error('n8n webhook error', { url, error });
      return { reply: "Sorry, sir. I couldn't reach the assistant. Please try again.", data: {} };
    }
  }
}

/**
 * Wraps getLLMReply with dynamic filler logic (NVIDIA Tokkio pattern).
 * After fillerTimeDelayMs with no reply, speaks a random filler phrase.
 * Cut off filler when reply arrives by calling cancelTTS before speaking reply.
 * @param {string} userText - User message
 * @param {Object} options - Options for buildPayload (source, attachments, etc.)
 * @param {{ bridge: CartesiaAudioBridge, apiKey: string }} ctx - Bridge and TTS availability
 * @returns {Promise<{ reply: string, data: Object }>} - Same as getLLMReply
 */
async function getLLMReplyWithFiller(userText, options, { bridge, apiKey }) {
  const { fillerPhrases = [], fillerTimeDelayMs = 2000 } = VAD_CONFIG;
  const enabled = apiKey && Array.isArray(fillerPhrases) && fillerPhrases.length > 0 && fillerTimeDelayMs > 0;

  let fillerTimer = null;
  const clearFillerTimer = () => {
    if (fillerTimer) {
      clearTimeout(fillerTimer);
      fillerTimer = null;
    }
  };

  if (enabled) {
    fillerTimer = setTimeout(() => {
      fillerTimer = null;
      const phrase = fillerPhrases[Math.floor(Math.random() * fillerPhrases.length)];
      if (phrase && typeof phrase === 'string' && phrase.trim()) {
        DEBUG.trace('Filler: speaking while waiting for n8n', { phrase: phrase.trim() });
        bridge.speakText(phrase.trim()).catch(() => {});
      }
    }, fillerTimeDelayMs);
  }

  try {
    const result = await getLLMReply(userText, options);
    clearFillerTimer();
    return result;
  } catch (err) {
    clearFillerTimer();
    throw err;
  }
}

/**
 * Process file specs from n8n response: create blobs and trigger downloads.
 * Types: pdf (title + content), image (base64), text (content). Audio files come from uploads (see attachment UI).
 * Implements security validation and sanitization.
 */
async function processFileSpecs(files) {
  if (!Array.isArray(files) || !files.length) return;
  for (const spec of files) {
    // Sanitize file spec to prevent injection attacks
    const sanitizedSpec = sanitizeWebhookResponse(spec);
    const type = ((sanitizedSpec.type || '').toLowerCase()).trim();
    const rawFilename = sanitizedSpec.filename || sanitizedSpec.name || 'file';
    
    // Sanitize filename to prevent path traversal
    const filename = sanitizeFilename(rawFilename);
    
    try {
      if (type === 'pdf') {
        // Sanitize content to prevent XSS
        const title = typeof sanitizedSpec.title === 'string' 
          ? sanitizeWebhookResponse(sanitizedSpec.title) 
          : 'Document';
        const content = typeof sanitizedSpec.content === 'string' 
          ? sanitizeWebhookResponse(sanitizedSpec.content) 
          : (typeof sanitizedSpec.text === 'string' ? sanitizeWebhookResponse(sanitizedSpec.text) : '');
        
        const blob = await createPdfBlob({
          title: String(title),
          content: String(content),
        });
        downloadBlob(blob, safeFilename(filename, '.pdf'));
      } else if (type === 'image' && (sanitizedSpec.data || sanitizedSpec.base64)) {
        const data = sanitizedSpec.data || sanitizedSpec.base64;
        const mime = sanitizedSpec.mime || sanitizedSpec.contentType || 'image/png';
        
        // Validate MIME type
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mime)) {
          DEBUG.error('invalid image MIME type', { mime, filename });
          continue;
        }
        
        const blob = createImageBlobFromBase64(String(data), mime);
        downloadBlob(blob, safeFilename(filename, '.png'));
      } else if (type === 'text') {
        const content = typeof sanitizedSpec.content === 'string' 
          ? sanitizeWebhookResponse(sanitizedSpec.content) 
          : (typeof sanitizedSpec.text === 'string' ? sanitizeWebhookResponse(sanitizedSpec.text) : '');
        const blob = createTextBlob(String(content), sanitizedSpec.mime || 'text/plain');
        downloadBlob(blob, safeFilename(filename, '.txt'));
      } else {
        DEBUG.warn('unknown file type in file spec', { type, filename });
      }
    } catch (err) {
      DEBUG.error('file creation failed', { type, filename, err });
    }
  }
}

const bridge = new CartesiaAudioBridge({
  apiKey: apiKey || undefined,
  voiceId: voiceId || undefined,
  ttsModel: 'sonic-turbo', // Optimal latency: 40ms first byte (vs 90ms for sonic-3)
  sendTranscriptOnFinal: sendTranscriptOnFinal !== false, // true = send on STT final (min latency); false = wait for silence (~2.5s)
  audioWorkletBasePath: (() => {
    // Use absolute path for AudioWorklet modules (resolved at runtime for correct origin)
    const url = new URL(/* @vite-ignore */ '../audio/', import.meta.url);
    // Use href (full URL) and ensure trailing slash
    let path = url.href;
    if (!path.endsWith('/')) path += '/';
    return path;
  })(),
  onPartialTranscript: (text, isFinal) => {
    if (!isFinal && text.trim()) {
      setStatus(`Listening… "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`, 'listening');
      // Optimize: Start processing partial transcript in parallel for ultra-low latency
      // This allows LLM to start thinking while user is still speaking
      // Note: We don't send to n8n yet (wait for final), but we can prepare
      if (text.trim().length > 10) {
        // Partial transcript is substantial - could trigger early processing
        // For now, just update UI (actual processing happens on final transcript)
        DEBUG.trace('Partial transcript received', { length: text.length, preview: text.slice(0, 50) });
      }
    }
  },
  onTranscript: async (text, isFinal) => {
    if (!isFinal) return;
    const trimmed = (text || '').trim();
    if (!trimmed) {
      DEBUG.trace('onTranscript: empty text, skipping n8n (no payload sent)');
      return;
    }
    DEBUG.trace('onTranscript: sending voice payload to n8n', { length: trimmed.length, preview: trimmed.slice(0, 80) });
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
    
    try {
      // Send/receive: show user message in UI first, then request n8n reply
      appendMessage('user', trimmed);
      conversationHistory.push({ role: 'user', content: trimmed });
      setStatus('Processing…', 'listening');
      const audioAttachments = audioBase64 ? [{
        name: 'voice-recording.pcm',
        type: 'audio/pcm',
        size: Math.floor(audioBase64.length * 3 / 4), // Base64 size to binary size approximation
        data: audioBase64,
      }] : [];
      DEBUG.trace('onTranscript: audio attachment', { 
        hasAudio: !!audioBase64, 
        size: audioAttachments[0]?.size || 0,
        audioBase64Length: audioBase64?.length || 0
      });
      DEBUG.trace('onTranscript: calling getLLMReply with voice source', { 
        textLength: trimmed.length, 
        hasAudioAttachment: audioAttachments.length > 0 
      });
      // Optimized: Pre-connect TTS WebSocket while waiting for n8n response (parallel processing)
      const ttsConnectPromise = apiKey ? bridge.connectTTS().catch(() => {}) : null;
      
      const { reply: replyText, data: replyData } = await getLLMReplyWithFiller(trimmed, { source: 'voice', attachments: audioAttachments }, { bridge, apiKey });
      
      // Ensure TTS is connected before speaking (wait for pre-connection if it was started)
      if (ttsConnectPromise) {
        try {
          await ttsConnectPromise;
        } catch (err) {
          DEBUG.error('TTS pre-connection failed', err);
          // Continue anyway - TTS will connect on-demand
        }
      }
      
      // Safeguard: ensure replyText is a string
      const safeReplyText = typeof replyText === 'string' ? replyText : String(replyText || '');
      appendMessage('assistant', safeReplyText);

      // Add assistant response to conversation history
      conversationHistory.push({ role: 'assistant', content: safeReplyText });
      const files = extractFilesFromJson(replyData);
      if (apiKey) {
        setStatus('Speaking…', 'speaking');
        try {
          // For optimal bi-directional flow: keep STT/VAD active during TTS for immediate barge-in
          const wasSTTActive = bridge.isSTTActive();
          if (wasSTTActive) {
            // Pause silence timers during TTS so they don't interfere with barge-in
            bridge.pauseSilenceTimersForBargeIn();
          } else {
            // If STT wasn't active, start it now so VAD can detect barge-in during TTS
            _isRestartingSTT = true;
            try {
              try {
                const saved = typeof localStorage !== 'undefined' && localStorage.getItem(MIC_BOOST_STORAGE_KEY);
                if (saved != null) {
                  const v = parseFloat(saved);
                  if (!Number.isNaN(v)) bridge.setInputGain(Math.max(0.5, Math.min(2, v)));
                }
              } catch { /* ignore */ }
              await bridge.startSTT();
              syncMicButton(true, false);
              setStatus('Listening…', 'listening');
            } catch (sttErr) {
              DEBUG.error('Failed to start STT before TTS', sttErr);
              // Continue with TTS even if STT start failed (no barge-in, but TTS will work)
            } finally {
              _isRestartingSTT = false;
            }
          }
          
          // Cut off any filler spoken while waiting; then speak the reply (barge-in can interrupt)
          bridge.cancelTTS();
          // Strip markdown so TTS speaks only words (no asterisks or meta-words)
          const rawReply = typeof replyText === 'string' ? replyText : String(replyText || '');
          const safeReplyTextForTTS = stripMarkdownForTTS(rawReply);
          if (safeReplyTextForTTS.trim()) {
            const chunks = splitSentencesForTTS(safeReplyTextForTTS);
            if (chunks.length > 1) {
              await bridge.streamTextChunks(chunks);
            } else {
              await bridge.speakText(safeReplyTextForTTS);
            }
          }
          
          // After TTS completes, bridge starts 10s silence timer when playback actually finishes (buffer empty)
          if (bridge.isSTTActive()) {
            setStatus('Listening…', 'listening');
          } else {
            // If STT stopped (e.g., due to barge-in), restart it
            setStatus('Connecting…', '');
            _isRestartingSTT = true;
            try {
              try {
                const saved = typeof localStorage !== 'undefined' && localStorage.getItem(MIC_BOOST_STORAGE_KEY);
                if (saved != null) {
                  const v = parseFloat(saved);
                  if (!Number.isNaN(v)) bridge.setInputGain(Math.max(0.5, Math.min(2, v)));
                }
              } catch { /* ignore */ }
              await bridge.startSTT();
              syncMicButton(true, false);
              setStatus('Listening…', 'listening');
              bridge.startAgentSilenceTimer();
            } catch (sttErr) {
              DEBUG.error('Failed to restart STT after TTS', sttErr);
              syncMicButton(false, false);
              setStatus('Ready (mic restart failed)', '');
            } finally {
              _isRestartingSTT = false;
            }
          }
          if (files.length) await processFileSpecs(files);
        } catch (err) {
          _isRestartingSTT = false;
          // Barge-in: user spoke during TTS — treat as normal flow, not an error
          const isBargeIn = err?.message && /barge-in|cancelled|user spoke|Barge-in/i.test(String(err.message));
          if (isBargeIn) {
            DEBUG.trace('TTS interrupted by barge-in (normal flow)', { message: err?.message });
            if (bridge.isSTTActive()) setStatus('Listening…', 'listening');
            else setStatus('Ready');
          } else {
            DEBUG.error('TTS error in onTranscript', err);
            setStatus('Ready (TTS error)', '');
            appendMessage('assistant', 'Sorry, I could not speak that. ' + (err?.message || err));
          }
        }
      } else {
        setStatus('Ready (no voice: add CARTESIA_API_KEY for TTS)', '');
        if (files.length) await processFileSpecs(files);
      }
    } catch (err) {
      DEBUG.error('onTranscript error', err);
      // Safeguard: ensure flag is cleared on any error
      _isRestartingSTT = false;
      setStatus('Error', 'error');
      appendMessage('assistant', 'Sorry, sir. Something went wrong. ' + (err?.message || err));
    }
  },
  onTTSChunk: () => {},
  onError: (err) => {
    // eslint-disable-next-line no-console -- intentional error reporting
    console.error('[JARVIS]', err);
    setStatus('Error', 'error');
    // Ensure mic button is synced if STT was active
    if (bridge.isSTTActive()) {
      bridge.stopSTT(); // This will trigger onSTTStopped which syncs the mic button
    } else {
      // If STT wasn't active, ensure mic button is in correct state
      syncMicButton(false, false);
    }
  },
  onSTTStopped: () => {
    // Suppress mic state update if STT is being restarted (prevents flicker)
    if (_isRestartingSTT) {
      DEBUG.trace('onSTTStopped: suppressing mic update during restart');
      bridge.stopLevelMeter();
      return;
    }
    // Safety check: verify STT is actually stopped before updating mic button
    if (bridge.isSTTActive()) {
      DEBUG.trace('onSTTStopped: STT still active, not updating mic button');
      return;
    }
    DEBUG.trace('onSTTStopped: mic reverting to idle (syncMicButton false)');
    syncMicButton(false, false);
    bridge.stopLevelMeter();
    setStatus('Ready');
  },
  // VAD callbacks — Heuristic S2: Make system status clear (bOoK oN vOiCe BoT dEsIgN.md)
  onSpeechStart: () => setStatus('Listening…', 'listening'),
  onSpeechEnd: () => setStatus('Processing…', 'listening'),
  onVADMisfire: () => {
    DEBUG.trace('VAD misfire - speech too short');
    setStatus('Try again — speak a bit longer', 'status-misfire');
    setTimeout(() => {
      if (statusEl.textContent.includes('Try again')) setStatus('Listening…', 'listening');
    }, 2500);
  },
  // ~10s silence: single British closing message (TTS), then INACTIVE.
  // Uses same Cartesia voice as bridge (VITE_CARTESIA_VOICE_ID from .env).
  onSilenceClosingMessage: (phrase) => {
    DEBUG.trace('onSilenceClosingMessage received', { phrase });
    if (!phrase || typeof phrase !== 'string' || !phrase.trim()) {
      setStatus('Ready');
      return;
    }
    const text = phrase.trim();
    setStatus('Standing by…', '');
    appendMessage('assistant', text);
    bridge.speakText(text).then(() => setStatus('Ready')).catch(() => setStatus('Ready'));
  },
});

// Expose bridge and conversation history for debug and external integration
if (typeof window !== 'undefined') {
  window.JARVIS_BRIDGE = bridge;
  // Agentic Pattern: Memory — expose for debug (?debug=1): JARVIS_CONVERSATION_HISTORY.getRecent(20)
  window.JARVIS_CONVERSATION_HISTORY = conversationHistory;
}

/** Debug tool: when ?debug=1, expose JARVIS_DEBUG_SEND_TEST() in console to send a test message and check n8n response. */
if (typeof window !== 'undefined' && (DEBUG.enabled || (window.location && window.location.search && /[?&]debug=1/.test(window.location.search)))) {
  window.JARVIS_DEBUG_SEND_TEST = async function () {
    const msg = 'Hello from JARVIS debug';
    /* eslint-disable no-console -- debug tool */
    console.log('[JARVIS DEBUG] Sending test message to n8n...', msg);
    try {
      const { reply, data } = await getLLMReply(msg, { source: 'text' });
      if (typeof reply === 'string') {
        console.log('[JARVIS DEBUG] Reply OK:', reply.slice(0, 120) + (reply.length > 120 ? '…' : ''));
        return { ok: true, reply };
      }
      console.error('[JARVIS DEBUG] No reply in response.');
      console.log('[JARVIS DEBUG] Response body:', data);
      console.log('[JARVIS DEBUG] Fix: 1. Use production URL (webhook/ not webhook-test/). 2. Ensure n8n workflow is active. 3. Check CORS if cross-origin. See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
      return { ok: false, data };
    } catch (err) {
      console.error('[JARVIS DEBUG] Error:', err.message);
      console.log('[JARVIS DEBUG] Fix: Check network, CORS, and webhook URL. See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
      return { ok: false, error: err.message };
    }
  };
  console.log('[JARVIS DEBUG] Run JARVIS_DEBUG_SEND_TEST() in the console to send a test message and check the n8n response.');
  window.JARVIS_DEBUG_CHECK_CONFIG = function () {
    console.log('[JARVIS DEBUG] Configuration check:');
    console.log('  apiKey:', apiKey ? `Set (${apiKey.slice(0, 10)}...)` : 'NOT SET');
    console.log('  voiceId:', voiceId || 'NOT SET');
    console.log('  n8nWebhookUrl:', n8nWebhookUrl);
    console.log('  Mic support:', CartesiaAudioBridge.checkRecordingSupport());
    console.log('  Bridge STT active:', bridge.isSTTActive());
    return {
      hasApiKey: !!apiKey,
      hasVoiceId: !!voiceId,
      n8nWebhookUrl,
      micSupport: CartesiaAudioBridge.checkRecordingSupport(),
      sttActive: bridge.isSTTActive(),
    };
  };
  console.log('[JARVIS DEBUG] Run JARVIS_DEBUG_CHECK_CONFIG() to see current configuration and mic status.');
}

/** Verify front-end send/receive flow: DOM elements, payload shape, and reply extraction. Call JARVIS_VERIFY_MESSAGE_FLOW() anytime. */
if (typeof window !== 'undefined') {
  window.JARVIS_VERIFY_MESSAGE_FLOW = function () {
    const checks = { ok: true, errors: [], warnings: [] };
    if (!chatContainer) {
      checks.ok = false;
      checks.errors.push('chatContainer (#chatContainer) missing');
    }
    if (!textInput) checks.errors.push('textInput (#textInput) missing');
    if (!btnSend) checks.errors.push('btnSend (#btnSend) missing');
    if (!btnMic) checks.warnings.push('btnMic (#btnMic) missing');
    if (!statusEl) checks.errors.push('status (#status) missing');
    const payload = buildPayload('verify-flow-test', { source: 'text' });
    const validation = validateN8nPayload(payload);
    if (!validation.valid) {
      checks.ok = false;
      checks.errors.push('Payload validation failed: ' + (validation.errors || []).join('; '));
    }
    if (payload.message !== 'verify-flow-test' || payload.query !== payload.message || payload.input !== payload.message) {
      checks.ok = false;
      checks.errors.push('Payload message/query/input not aligned');
    }
    if (checks.errors.length) checks.ok = false;
    console.log('[JARVIS] Message flow verification:', checks.ok ? 'PASS' : 'FAIL', checks);
    return checks;
  };
}

let pendingAttachments = [];

if (btnSend) {
  btnSend.addEventListener('click', async () => {
    try {
      DEBUG.trace('btnSend clicked', { hasText: !!textInput.value.trim(), textLength: textInput.value.trim().length });
      const text = textInput.value.trim();
      if (!text) {
        DEBUG.trace('btnSend: empty text, returning early');
        return;
      }
      // Interrupt any ongoing TTS immediately when user sends text (barge-in)
      // This allows text input to interrupt the agent mid-speech, just like voice input does
      bridge.cancelTTS();
      textInput.value = '';
      textInput.placeholder = 'Type or speak...';
      // Reset textarea height after clearing
      if (textInput.style.height) {
        textInput.style.height = 'auto';
      }
      const attachmentsForPayload = [...pendingAttachments];
      // Send/receive: show user message in UI first, then request n8n reply
      appendMessage('user', text, attachmentsForPayload.length ? attachmentsForPayload : []);
      conversationHistory.push({ role: 'user', content: text });
      pendingAttachments = [];
      setStatus('Processing…', 'listening');
      try {
        const attachmentPayload = await filesToAttachmentPayload(attachmentsForPayload);
        await addOcrToAttachments(attachmentPayload);
        DEBUG.trace('btnSend: calling getLLMReply with text source', { 
          textLength: text.length, 
          attachmentCount: attachmentPayload.length 
        });
        // Optimized: Pre-connect TTS WebSocket while waiting for n8n response (parallel processing)
        const ttsConnectPromise = apiKey ? bridge.connectTTS().catch(() => {}) : null;
        
        const { reply: replyText, data: replyData } = await getLLMReplyWithFiller(text, { source: 'text', attachments: attachmentPayload }, { bridge, apiKey });
        
        // Ensure TTS is connected before speaking (wait for pre-connection if it was started)
        if (ttsConnectPromise) {
          try {
            await ttsConnectPromise;
          } catch (err) {
            DEBUG.error('TTS pre-connection failed', err);
            // Continue anyway - TTS will connect on-demand
          }
        }
        
        // Safeguard: ensure replyText is a string
        const safeReplyText = typeof replyText === 'string' ? replyText : String(replyText || '');
        appendMessage('assistant', safeReplyText);
        // Add assistant response to conversation history
        conversationHistory.push({ role: 'assistant', content: safeReplyText });
        const files = extractFilesFromJson(replyData);
        if (apiKey) {
          setStatus('Speaking…', 'speaking');
          try {
            // Cut off any filler spoken while waiting; then speak the reply
            bridge.cancelTTS();
            // Strip markdown so TTS speaks only words (no asterisks or meta-words)
            const rawReply = typeof replyText === 'string' ? replyText : String(replyText || '');
            const safeReplyTextForTTS = stripMarkdownForTTS(rawReply);
            if (safeReplyTextForTTS.trim()) {
              const chunks = splitSentencesForTTS(safeReplyTextForTTS);
              if (chunks.length > 1) {
                await bridge.streamTextChunks(chunks);
              } else {
                await bridge.speakText(safeReplyTextForTTS);
              }
            }
            setStatus('Ready');
            if (files.length) await processFileSpecs(files);
          } catch (err) {
            const isBargeIn = err?.message && /barge-in|cancelled|user spoke|Barge-in/i.test(String(err.message));
            if (isBargeIn) {
              DEBUG.trace('TTS interrupted (barge-in) in btnSend', { message: err?.message });
              setStatus('Ready');
            } else {
              setStatus('Error', 'error');
              appendMessage('assistant', 'Sorry, sir. Something went wrong. ' + (err?.message || err));
            }
            if (files.length) await processFileSpecs(files);
          }
        } else {
          setStatus('Ready (no voice: add CARTESIA_API_KEY for TTS)', '');
          if (files.length) await processFileSpecs(files);
        }
      } catch (err) {
        setStatus('Error', 'error');
        appendMessage('assistant', 'Sorry, sir. Something went wrong. ' + (err?.message || err));
      }
    } catch (err) {
      // Top-level catch to prevent unhandled promise rejections
      DEBUG.error('btnSend: unhandled error', err);
      setStatus('Error', 'error');
      if (chatContainer) {
        appendMessage('assistant', 'Sorry, sir. An unexpected error occurred. ' + (err?.message || err));
      }
    }
  });
} else {
  DEBUG.error('btnSend not found - cannot attach click handler');
}

if (textInput) {
  // Auto-resize textarea as user types
  function autoResizeTextarea() {
    if (!textInput) return;
    textInput.style.height = 'auto';
    const scrollHeight = textInput.scrollHeight;
    const maxHeight = 120; // matches CSS max-height
    textInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }
  
  // Debounce auto-resize to avoid excessive calculations (JavaScript Handbook pattern)
  const debouncedAutoResize = debounce(autoResizeTextarea, 100);
  
  textInput.addEventListener('input', debouncedAutoResize);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Only interrupt TTS if there's actual text to send (matches click handler behavior)
      const text = textInput?.value?.trim();
      if (text) {
        // Interrupt any ongoing TTS immediately when user presses Enter (barge-in)
        // This ensures immediate interruption before the click handler executes
        bridge.cancelTTS();
      }
      if (btnSend) btnSend.click();
      // Reset height after sending
      setTimeout(() => {
        if (textInput && !textInput.value.trim()) {
          textInput.style.height = 'auto';
        }
      }, 0);
    } else {
      // Allow textarea to resize on Enter+Shift or other keys (immediate resize for better UX)
      setTimeout(autoResizeTextarea, 0);
    }
  });
} else {
  DEBUG.error('textInput not found - cannot attach keydown handler');
}

if (btnMic) {
  btnMic.addEventListener('click', async () => {
    try {
      // Debounce: prevent multiple concurrent clicks
      if (_micClickInProgress) {
        DEBUG.trace('Mic click ignored - operation in progress');
        return;
      }
      
      DEBUG.trace('Mic clicked', { sttActive: bridge.isSTTActive() });
      
      if (bridge.isSTTActive()) {
        bridge.stopSTT();
        return;
      }
      
      // Early validation checks (synchronous, don't need flag protection)
      if (!apiKey) {
        setStatus('Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)', 'error');
        return;
      }
      const support = CartesiaAudioBridge.checkRecordingSupport();
      if (!support.supported) {
        setStatus(support.message || 'Microphone not available', 'error');
        return;
      }
      
      _micClickInProgress = true;
      try {
        syncMicButton(false, true);
        try {
          setStatus('Connecting…');
          await bridge.connectTTS().catch(() => {});
          DEBUG.trace('TTS connected, starting STT…');
        try {
          const saved = typeof localStorage !== 'undefined' && localStorage.getItem(MIC_BOOST_STORAGE_KEY);
          if (saved != null) {
            const v = parseFloat(saved);
            if (!Number.isNaN(v)) bridge.setInputGain(Math.max(0.5, Math.min(2, v)));
          }
        } catch { /* ignore */ }
          await bridge.startSTT();
          syncMicButton(true, false);
          setStatus('Listening…', 'listening');
        } catch (err) {
          const msg = err?.message || String(err);
          setStatus(msg.startsWith('Mic ') ? msg : 'Mic: ' + msg, 'error');
          syncMicButton(false, false);
        }
      } finally {
        _micClickInProgress = false;
      }
    } catch (err) {
      // Top-level catch to prevent unhandled promise rejections
      DEBUG.error('btnMic: unhandled error', err);
      _micClickInProgress = false;
      setStatus('Error', 'error');
      syncMicButton(false, false);
    }
  });
} else {
  DEBUG.error('btnMic not found - cannot attach click handler');
}

if (btnPaperclip && fileInput) {
  btnPaperclip.addEventListener('click', () => fileInput.click());
} else {
  DEBUG.error('btnPaperclip or fileInput not found - cannot attach click handler', { btnPaperclip: !!btnPaperclip, fileInput: !!fileInput });
}

if (btnStopVoice) {
  btnStopVoice.addEventListener('click', () => {
    DEBUG.trace('btnStopVoice clicked - stopping agent voice');
    // Immediately stop any ongoing TTS (kill agent voice)
    bridge.cancelTTS();
    setStatus('Voice stopped', '');
    // Reset status after a brief moment
    // Only reset if status is still "Voice stopped" (wasn't changed by another operation)
    setTimeout(() => {
      if (statusEl) {
        const currentStatus = statusEl.textContent.trim();
        // Only reset if status hasn't been changed by another operation
        if (currentStatus === 'Voice stopped') {
          setStatus('Ready');
        }
      }
    }, 1500);
  });
} else {
  DEBUG.error('btnStopVoice not found - cannot attach click handler');
}

if (btnExportPdf) {
  btnExportPdf.addEventListener('click', async () => {
    try {
      if (!chatContainer) return;
      const messages = chatContainer.querySelectorAll('.message');
      const lines = [];
      for (const msg of messages) {
        const label = msg.querySelector('.label');
        const content = msg.querySelector('.content');
        const who = label ? label.textContent.trim() : 'Unknown';
        const text = content ? content.textContent.trim() : '';
        if (text) lines.push(`${who}:\n${text}\n`);
      }
      const content = lines.join('\n') || 'No messages yet.';
      try {
        setStatus('Creating PDF…', '');
        const blob = await createPdfBlob({ title: 'JARVIS Chat', content });
        downloadBlob(blob, safeFilename('jarvis-chat.pdf', '.pdf'));
        setStatus('Ready');
      } catch (err) {
        DEBUG.error('Export PDF failed', err);
        setStatus('Error', 'error');
      }
    } catch (err) {
      // Top-level catch to prevent unhandled promise rejections
      DEBUG.error('btnExportPdf: unhandled error', err);
      setStatus('Error', 'error');
    }
  });
} else {
  DEBUG.error('btnExportPdf not found - cannot attach click handler');
}

if (fileInput && textInput) {
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    pendingAttachments.push(...files);
    const n = pendingAttachments.length;
    textInput.placeholder = n ? `${n} file(s) attached — type a message...` : 'Type or speak...';
    fileInput.value = '';
  });
} else {
  DEBUG.error('fileInput or textInput not found - cannot attach file change handler', { fileInput: !!fileInput, textInput: !!textInput });
}

// MDN WebSockets API: Close connections on pagehide for bfcache compatibility.
// "Having an open WebSocket connection may prevent the browser adding your page to the bfcache.
// It's good practice to close your connection when the user has finished with your page."
// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#working_with_the_bfcache
window.addEventListener('pagehide', () => bridge.closeAllWebSocketsForBfcache());

window.addEventListener('beforeunload', () => bridge.destroy());

// Expose functions for testing (debug mode only)
if (DEBUG.enabled || (typeof window !== 'undefined' && window.location && window.location.search && /[?&]debug=1/.test(window.location.search))) {
  window.JARVIS_TEST = {
    setStatus,
    appendMessage,
    bridge,
    syncMicButton
  };
  // Read-only debug API: chat history is never cleared until the page is refreshed.
  window.JARVIS_CONVERSATION_HISTORY = {
    getRecent(n = 20) {
      const len = Math.min(Number(n) || 20, conversationHistory.length);
      return conversationHistory.slice(-len);
    }
  };
  // CORS diagnostics (see docs/CORS-DOCS.md, docs/CORS-CONFIGURATION.md)
  window.JARVIS_DEBUG_CORS = async (url = n8nWebhookUrl) => {
    const result = await diagnoseCORS(url);
    /* eslint-disable no-console -- debug API for CORS diagnostics */
    console.log('[JARVIS] CORS diagnostics:', result);
    console.log(getCORSConfigurationGuide(typeof window !== 'undefined' ? window.origin : ''));
    /* eslint-enable no-console */
    return result;
  };
  window.JARVIS_DEBUG_CORS_PREFLIGHT = async (url = n8nWebhookUrl) => {
    const result = await testCORSPreflight(url);
    /* eslint-disable-next-line no-console -- debug API for CORS preflight test */
    console.log('[JARVIS] CORS preflight test:', result);
    return result;
  };
}