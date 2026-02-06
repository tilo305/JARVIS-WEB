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
import { buildN8nPayload, extractReplyFromJson, extractFilesFromJson, getNaturalFallback } from './n8n-payload.js';
import { addOcrToAttachments } from './ocr-tool.js';
import {
  ConversationHistory,
  classifyIntent,
  validateInput,
  runWithRetry,
  getContextEnrichment,
} from './agentic-patterns.js';
import {
  createPdfBlob,
  createImageBlobFromBase64,
  createTextBlob,
  downloadBlob,
  isAudioFile,
  safeFilename,
} from './file-creator.js';
import { DEBUG, escapeHtml } from './debug.js';
import { WakeWordTracker } from './wake-word-tracker.js';
import { WakeWordErrorMonitor } from './wake-word-error-monitor.js';
import { onWakeWordError, getLastError, logWakeWordError } from './wake-word-console.js';

const chatContainer = document.getElementById('chatContainer');
const textInput = document.getElementById('textInput');
const btnSend = document.getElementById('btnSend');
const btnMic = document.getElementById('btnMic');
const btnPaperclip = document.getElementById('btnPaperclip');
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
function getConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  
  // Wake word config — openWakeWord only
  const wakeWordEnabled = (env.VITE_WAKE_WORD_ENABLED || env.WAKE_WORD_ENABLED || cfg.wakeWordEnabled || 'false').toLowerCase() === 'true';
  const debugWakeWord = (env.VITE_DEBUG_WAKE_WORD || env.DEBUG_WAKE_WORD || cfg.debugWakeWord || 'false').toLowerCase() === 'true';
  const useOpenWakeWord = (env.VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD || cfg.useOpenWakeWord || 'false').toLowerCase() === 'true';
  const openWakeWordWsUrl = (env.VITE_OPENWAKEWORD_WS_URL || env.OPENWAKEWORD_WS_URL || cfg.openWakeWordWsUrl || 'ws://localhost:8765/ws').trim();

  return {
    apiKey: env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || env.CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4',
    wakeWordEnabled,
    debugWakeWord,
    useOpenWakeWord,
    openWakeWordWsUrl,
  };
}
const { apiKey, voiceId, n8nWebhookUrl, wakeWordEnabled, debugWakeWord, useOpenWakeWord, openWakeWordWsUrl } = getConfig();
/** True when wake word is enabled and openWakeWord is configured */
const wakeWordConfigured = wakeWordEnabled && useOpenWakeWord && openWakeWordWsUrl;

// Log button initialization status (always visible, not just in debug mode)
/* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
console.log('[JARVIS] Button initialization complete', {
  btnSend: !!btnSend,
  btnMic: !!btnMic,
  btnPaperclip: !!btnPaperclip,
  textInput: !!textInput,
  fileInput: !!fileInput,
  n8nWebhookUrl: n8nWebhookUrl || 'NOT SET'
});

/** Session ID for n8n workflow continuity (persists for page lifetime) */
const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** Conversation history for Memory pattern — sends recent turns to n8n for context */
const conversationHistory = new ConversationHistory(20);

/** Initialize wake word tracker - always show for testing */
let wakeWordTracker = null;
try {
  wakeWordTracker = new WakeWordTracker();
  // Show tracker panel (always visible for testing)
  const trackerEl = document.getElementById('wakeWordTracker');
  if (trackerEl) {
    trackerEl.style.display = 'flex';
  }
  
  // Immediately set status based on configuration
  // Use multiple attempts to ensure status updates
  const updateStatusDirectly = () => {
    const statusTextEl = document.getElementById('trackerStatusText');
    if (statusTextEl) {
      if (!wakeWordConfigured) {
        statusTextEl.textContent = 'Wake word failed';
        DEBUG.trace('Wake word not configured - set status directly');
      }
    }
  };
  
  // Try immediately
  updateStatusDirectly();
  
  // Try after short delay
  setTimeout(updateStatusDirectly, 50);
  
      if (!wakeWordConfigured) {
    DEBUG.trace('Wake word not configured - setting tracker status immediately');
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (wakeWordTracker) {
        wakeWordTracker.setStatus('error', 'Wake word failed');
      } else {
        updateStatusDirectly();
      }
    }, 100);
  } else {
    // Wake word is enabled - status will be updated after initialization
    DEBUG.trace('Wake word configured - will initialize and update status');
    setTimeout(() => {
      if (wakeWordTracker) {
        wakeWordTracker.setStatus('waiting', 'Initializing...');
      } else {
        const statusTextEl = document.getElementById('trackerStatusText');
        if (statusTextEl) statusTextEl.textContent = 'Initializing...';
      }
    }, 100);
  }
} catch (err) {
  DEBUG.error('Failed to initialize wake word tracker', err);
  // Hide tracker if initialization failed
  const trackerEl = document.getElementById('wakeWordTracker');
  if (trackerEl) {
    trackerEl.style.display = 'none';
  }
  // Still try to update status text directly
  const statusTextEl = document.getElementById('trackerStatusText');
  if (statusTextEl) {
    statusTextEl.textContent = 'Wake word failed';
  }
}

/** Show wake word errors in UI and ensure they appear in console (filter: JARVIS Wake Word Error) */
function updateWakeWordLastError(entry) {
  const el = document.getElementById('wakeWordLastError');
  if (!el) return;
  if (!entry) {
    el.textContent = 'Console: filter "JARVIS Wake Word Error"';
    el.classList.remove('has-error');
    return;
  }
  el.textContent = entry.message || 'Error';
  el.classList.add('has-error');
}
if (wakeWordConfigured) {
  onWakeWordError(updateWakeWordLastError);
  updateWakeWordLastError(getLastError());
}

/**
 * Build payload with app's session ID and agentic patterns (Memory, Routing, Context Engineering).
 * Same structure for mic button and wake word — both use source: 'voice' and optional attachments.
 */
function buildPayload(message, options = {}) {
  const agenticOptions = {
    ...options,
    sessionId,
    conversationHistory: conversationHistory.getRecent(10),
    intent: classifyIntent(message),
    contextEnrichment: getContextEnrichment(),
  };
  return buildN8nPayload(message, agenticOptions);
}

function setStatus(text, className = '') {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = 'status ' + className;
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

function appendMessage(role, content, attachments = []) {
  if (!chatContainer) return null;
  const wrap = document.createElement('div');
  wrap.className = 'message ' + role;
  const label = role === 'user' ? 'You' : 'JARVIS';
  wrap.innerHTML = `<div class="label">${escapeHtml(label)}</div><div class="content">${escapeHtml(content)}</div>`;
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
  chatContainer.appendChild(wrap);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return wrap;
}

/** Max attachment size (bytes) — larger files are skipped to avoid huge payloads */
const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Read File objects to base64 for sending in JSON payload.
 * Skips files over MAX_ATTACHMENT_SIZE. Returns array of { name, type, size, data }.
 */
async function filesToAttachmentPayload(files) {
  const results = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
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
      results.push({ name: f.name, type: f.type, size: f.size, data: base64 });
    } catch (err) {
      DEBUG.error('attachment read failed', { name: f.name, err });
    }
  }
  return results;
}

/**
 * Get LLM reply from n8n webhook.
 * Sends full payload: message, session_id, sessionId, timestamp, timezone, location,
 * message_id, messageId, source, attachments, locale, language.
 * @returns {{ reply: string, data: Object }} - reply text and raw response for files
 */
async function getLLMReply(userText, options = {}) {
  const validation = validateInput(userText);
  if (!validation.valid) {
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.warn('[JARVIS] getLLMReply: input validation failed', validation.error);
    return { reply: validation.error || "I didn't catch that. Try again?", data: {} };
  }
  const payload = buildPayload(validation.sanitized, options);
  if (!payload.message) {
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.warn('[JARVIS] getLLMReply: empty message in payload');
    return { reply: "I didn't catch that. Try again?", data: {} };
  }
  const sourceLabel = payload.source === 'voice' ? 'voice' : 'text';
  const attachmentCount = payload.attachments?.length ?? 0;
  /* eslint-disable-next-line no-console -- payload verification: mic vs text */
  console.log('[JARVIS] Payload SENT (source=' + sourceLabel + ') messageLength=' + (payload.message?.length ?? 0) + ' attachments=' + attachmentCount);
  // Always log payload sending (not just in debug mode) for troubleshooting
  /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
  console.log('[JARVIS] Sending payload to n8n', { 
    message: payload.message.slice(0, 50), 
    source: payload.source, 
    url: n8nWebhookUrl,
    messageId: payload.messageId,
    sessionId: payload.sessionId,
    hasAttachments: payload.attachments?.length > 0,
    fullPayload: {
      message: payload.message,
      source: payload.source,
      session_id: payload.session_id,
      sessionId: payload.sessionId,
      timestamp: payload.timestamp,
      timezone: payload.timezone,
      location: payload.location,
      message_id: payload.message_id,
      messageId: payload.messageId,
      attachments: payload.attachments?.map(a => ({ 
        name: a.name, 
        type: a.type, 
        size: a.size, 
        hasData: !!a.data,
        dataLength: a.data?.length || 0
      })) || [],
      locale: payload.locale,
      language: payload.language,
      allKeys: Object.keys(payload),
      payloadSize: JSON.stringify(payload).length
    }
  });
  DEBUG.trace('n8n: sending payload', { 
    message: payload.message.slice(0, 50), 
    source: payload.source, 
    url: n8nWebhookUrl,
    messageId: payload.messageId,
    sessionId: payload.sessionId,
    hasAttachments: payload.attachments?.length > 0,
    fullPayload: payload
  });
  if (!n8nWebhookUrl || typeof n8nWebhookUrl !== 'string' || !n8nWebhookUrl.trim()) {
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.error('[JARVIS] n8n webhook URL is missing or invalid', { n8nWebhookUrl });
    DEBUG.error('n8n webhook URL is missing or invalid', { n8nWebhookUrl });
    return { reply: "Configuration error: N8N webhook URL is not set. Please check your configuration.", data: {} };
  }
  let timeoutId;
  try {
    const payloadJson = JSON.stringify(payload);
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] Making POST request to n8n webhook', { 
      url: n8nWebhookUrl, 
      payloadSize: payloadJson.length,
      source: payload.source,
      exactPayloadJson: payloadJson.length > 1000 ? payloadJson.slice(0, 1000) + '... [truncated]' : payloadJson
    });
    DEBUG.trace('n8n: POST request to webhook', { 
      url: n8nWebhookUrl, 
      payloadSize: payloadJson.length,
      source: payload.source,
      payloadJson: payloadJson
    });
    const res = await runWithRetry(async () => {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout per attempt
      try {
        const r = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadJson,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return r;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    });
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] Payload delivered to n8n', { status: res.status, source: payload.source, ok: res.ok });
    DEBUG.trace('n8n: POST request completed', { status: res.status, statusText: res.statusText });
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
    const reply = extractReplyFromJson(data);
    /* eslint-disable-next-line no-console -- payload verification: mic vs text */
    console.log('[JARVIS] Payload RECEIVED (source=' + sourceLabel + ') status=' + res.status + ' hasReply=' + !!reply + ' replyLength=' + (typeof reply === 'string' ? reply.length : 0));
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] n8n response parsed', { status: res.status, hasReply: !!reply, replyPreview: typeof reply === 'string' ? reply.slice(0, 50) : '', dataKeys: Object.keys(data) });
    DEBUG.trace('n8n: response', { status: res.status, hasReply: !!reply, replyPreview: typeof reply === 'string' ? reply.slice(0, 50) : '' });
    if (typeof reply === 'string') {
      conversationHistory.addUser(payload.message);
      conversationHistory.addAssistant(reply);
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Successfully extracted reply from n8n response', { replyLength: reply.length });
      return { reply, data };
    }
    // No reply extracted — always log so user can see what n8n returned
    const dataKeys = Object.keys(data || {});
    const bodyPreview = JSON.stringify(data).slice(0, 400);
    // eslint-disable-next-line no-console -- intentional: user needs to see why fallback was used
    console.warn('[JARVIS] n8n fallback: no reply in response.', {
      status: res.status,
      dataKeys: dataKeys.length ? dataKeys : '(empty)',
      bodyPreview: bodyPreview + (bodyPreview.length >= 400 ? '…' : ''),
      hint: 'n8n must return JSON with one of: output, reply, result, text, message, response, answer, content. Use production URL (/webhook/ not /webhook-test/). See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md',
    });
    if (DEBUG.enabled && typeof reply !== 'string') {
      DEBUG.trace('n8n: response body (no reply extracted)', data);
    }
    if (res.ok && (Object.keys(data).length === 0 || !extractReplyFromJson(data))) {
      DEBUG.error('n8n: empty or no reply in response body. In n8n, set Webhook node Respond to "Using Respond to Webhook Node". See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
    }
    const natural = getNaturalFallback(payload.message);
    const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
    conversationHistory.addUser(payload.message);
    conversationHistory.addAssistant(fallback);
    DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
    return { reply: fallback, data };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    const errMsg = err?.message ?? (typeof err === 'string' ? err : 'Unknown error');
    const errName = err?.name;
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.error('[JARVIS] Error in getLLMReply', { err, name: errName, message: errMsg, url: n8nWebhookUrl });
    if (errName === 'AbortError') {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.error('[JARVIS] n8n webhook timeout after 30s', { url: n8nWebhookUrl, message: (payload?.message || '').slice(0, 50) });
      DEBUG.error('n8n webhook timeout after 30s', { url: n8nWebhookUrl, message: (payload?.message || '').slice(0, 50) });
      return { reply: "Request timed out. The assistant is taking too long to respond. Please try again.", data: {} };
    } else if (errMsg && (errMsg.includes('CORS') || errMsg.includes('Failed to fetch'))) {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.error('[JARVIS] n8n webhook CORS or network error', { url: n8nWebhookUrl, err: errMsg });
      DEBUG.error('n8n webhook CORS or network error', { url: n8nWebhookUrl, err: errMsg });
      return { reply: "Network error: Could not reach the assistant. Check your connection and CORS settings.", data: {} };
    } else {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.error('[JARVIS] n8n webhook error', { url: n8nWebhookUrl, err });
      DEBUG.error('n8n webhook error', { url: n8nWebhookUrl, err });
      return { reply: "Sorry, I couldn't reach the assistant. Please try again.", data: {} };
    }
  }
}

/**
 * Process file specs from n8n response: create blobs and trigger downloads.
 * Types: pdf (title + content), image (base64), text (content). Audio files come from uploads (see attachment UI).
 */
async function processFileSpecs(files) {
  if (!Array.isArray(files) || !files.length) return;
  for (const spec of files) {
    const type = (spec.type || '').toLowerCase();
    const filename = spec.filename || spec.name;
    try {
      if (type === 'pdf') {
        const blob = await createPdfBlob({
          title: spec.title || 'Document',
          content: spec.content || spec.text || '',
        });
        downloadBlob(blob, safeFilename(filename, '.pdf'));
      } else if (type === 'image' && (spec.data || spec.base64)) {
        const data = spec.data || spec.base64;
        const mime = spec.mime || spec.contentType || 'image/png';
        const blob = createImageBlobFromBase64(data, mime);
        downloadBlob(blob, safeFilename(filename, '.png'));
      } else if (type === 'text') {
        const content = spec.content || spec.text || '';
        const blob = createTextBlob(content, spec.mime || 'text/plain');
        downloadBlob(blob, safeFilename(filename, '.txt'));
      }
    } catch (err) {
      DEBUG.error('file creation failed', { type, err });
    }
  }
}

const bridge = new CartesiaAudioBridge({
  apiKey: apiKey || undefined,
  voiceId: voiceId || undefined,
  ttsModel: 'sonic-3', // Better quality, more emotive (90ms latency vs 40ms)
  audioWorkletBasePath: (() => {
    // Use origin-relative /audio/ so Vite does not warn (no import.meta.url); works in dev and prod
    if (typeof window !== 'undefined' && window.location?.origin) {
      const path = new URL('/audio/', window.location.origin).href;
      return path.endsWith('/') ? path : path + '/';
    }
    return '/audio/';
  })(),
  // Wake word configuration (openWakeWord only)
  wakeWordEnabled: wakeWordConfigured,
  useOpenWakeWord: useOpenWakeWord || undefined,
  openWakeWordWsUrl: (useOpenWakeWord && openWakeWordWsUrl) ? openWakeWordWsUrl : undefined,
  onPartialTranscript: (text, isFinal) => {
    if (!isFinal && text.trim()) setStatus(`Listening… "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`, 'listening');
  },
  /** Voice transcript handler — same path for mic button and wake word; both use identical n8n payload (source: 'voice', attachments). */
  onTranscript: async (text, isFinal) => {
    if (!isFinal) return;
    const trimmed = (text || '').trim();
    if (!trimmed) {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] onTranscript: empty text, skipping n8n (no payload sent)');
      DEBUG.trace('onTranscript: empty text, skipping n8n (no payload sent)');
      return;
    }
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] onTranscript: FINAL transcript received (voice — mic or wake word)', { 
      textLength: trimmed.length, 
      preview: trimmed.slice(0, 80),
      isFinal 
    });
    const isWakeWordTriggered = bridge.isWakeWordWaiting() === false && bridge.isSTTActive();
    // Always log voice transcript sending (not just in debug mode) for troubleshooting
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] onTranscript: sending voice payload to n8n', { 
      length: trimmed.length, 
      preview: trimmed.slice(0, 80),
      wakeWordTriggered: isWakeWordTriggered,
      source: 'voice'
    });
    DEBUG.trace('onTranscript: sending voice payload to n8n', { 
      length: trimmed.length, 
      preview: trimmed.slice(0, 80),
      wakeWordTriggered: isWakeWordTriggered,
      source: 'voice'
    });
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
      appendMessage('user', trimmed);
      setStatus('Processing…', 'listening');
      const audioAttachments = audioBase64 ? [{
        name: 'voice-recording.pcm',
        type: 'audio/pcm',
        size: Math.floor(audioBase64.length * 3 / 4), // Base64 size to binary size approximation
        data: audioBase64,
      }] : [];
      DEBUG.trace('onTranscript: audio attachment', { hasAudio: !!audioBase64, size: audioAttachments[0]?.size || 0 });
      
      // Build payload — same structure for mic and wake word (source: 'voice', full n8n fields)
      const voicePayload = buildPayload(trimmed, { source: 'voice', attachments: audioAttachments });
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Voice payload (mic/wake word, full structure):', {
        message: voicePayload.message,
        source: voicePayload.source,
        session_id: voicePayload.session_id,
        sessionId: voicePayload.sessionId,
        message_id: voicePayload.message_id,
        messageId: voicePayload.messageId,
        timestamp: voicePayload.timestamp,
        timezone: voicePayload.timezone,
        location: voicePayload.location,
        locale: voicePayload.locale,
        language: voicePayload.language,
        attachments: voicePayload.attachments?.map(a => ({ 
          name: a.name, 
          type: a.type, 
          size: a.size, 
          hasData: !!a.data,
          dataLength: a.data?.length || 0
        })) || [],
        payloadKeys: Object.keys(voicePayload),
        payloadSize: JSON.stringify(voicePayload).length
      });
      DEBUG.trace('onTranscript: full voice payload structure', voicePayload);
      
      const { reply: replyText, data: replyData } = await getLLMReply(trimmed, { source: 'voice', attachments: audioAttachments });
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Voice (mic/wake word): received reply from n8n', { 
        replyLength: replyText?.length || 0, 
        hasData: !!replyData,
        replyPreview: typeof replyText === 'string' ? replyText.slice(0, 100) : '',
        hasApiKey: !!apiKey
      });
      // Ensure we always have a string for chat and TTS (correct payload → text + audio in UI)
      const displayText = typeof replyText === 'string' ? replyText : (replyText != null ? String(replyText) : 'No response received.');
      appendMessage('assistant', displayText);
      /* eslint-disable-next-line no-console -- mic response: text in chat + audio */
      console.log('[JARVIS] Mic response: text shown in chat (length=' + displayText.length + '), TTS ' + (apiKey ? 'playing' : 'skipped (no API key)'));
      const files = extractFilesFromJson(replyData);
      if (apiKey) {
        setStatus('Speaking…', 'speaking');
        try {
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.log('[JARVIS] Voice: starting TTS for response', { 
            replyLength: displayText.length,
            replyPreview: displayText.slice(0, 100),
            hasApiKey: !!apiKey,
            hasVoiceId: !!voiceId
          });
          await bridge.speakText(displayText);
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.log('[JARVIS] Voice: TTS completed successfully');
          setStatus('Connecting…', '');
          try {
            try {
              const saved = typeof localStorage !== 'undefined' && localStorage.getItem(MIC_BOOST_STORAGE_KEY);
              if (saved != null) {
                const v = parseFloat(saved);
                if (!Number.isNaN(v)) bridge.setInputGain(Math.max(0.5, Math.min(2, v)));
              }
            } catch { /* ignore */ }
            await bridge.startSTT({ skipWakeWordWait: true });
            syncMicButton(true, false);
            setStatus('Listening…', 'listening');
            bridge.startAgentSilenceTimer();
          } catch (sttErr) {
            /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
            console.error('[JARVIS] Mic button: Failed to restart STT after TTS', sttErr);
            DEBUG.error('Failed to restart STT after TTS', sttErr);
            syncMicButton(false, false);
            setStatus('Ready (mic restart failed)', '');
          }
          if (files.length) await processFileSpecs(files);
        } catch (err) {
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.error('[JARVIS] Mic button: TTS error in onTranscript', { 
            error: err, 
            errorMessage: err?.message, 
            errorName: err?.name,
            stack: err?.stack 
          });
          DEBUG.error('TTS error in onTranscript', err);
          setStatus('Ready (TTS error)', '');
          appendMessage('assistant', 'Sorry, I could not speak that. ' + (err?.message || err));
        }
      } else {
        setStatus('Ready (no voice: add CARTESIA_API_KEY for TTS)', '');
        if (files.length) await processFileSpecs(files);
      }
    } catch (err) {
      DEBUG.error('onTranscript error', err);
      setStatus('Error', 'error');
      appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
    }
  },
  onTTSChunk: () => {},
  onError: (err) => {
    const msg = typeof err === 'string' ? err : (err?.message || String(err));
    const isWakeWordError = msg.includes('wake word') ||
      msg.includes('OpenWakeWord') || msg.includes('openWakeWord') || msg.includes('OPENWAKEWORD_WS_URL') ||
      msg.includes('WebSocket');
    if (wakeWordEnabled && isWakeWordError) {
      logWakeWordError(msg, err);
    }
    try {
      // eslint-disable-next-line no-console -- intentional error reporting
      console.error('[JARVIS]', err);
    } catch {
      // eslint-disable-next-line no-console -- fallback when err is not serializable
      console.error('[JARVIS] Unknown error');
    }
    setStatus('Error', 'error');
    // Ensure mic button is synced if STT was active
    if (bridge.isSTTActive()) {
      bridge.stopSTT(); // This will trigger onSTTStopped which syncs the mic button
    } else {
      // If STT wasn't active, ensure mic button is in correct state
      syncMicButton(false, false);
    }
  },
  onSTTStarted: () => {
    DEBUG.trace('onSTTStarted: STT is now active, updating mic button');
    syncMicButton(true, false);
    // Status will be updated by onWakeWordDetected or onSpeechStart
  },
  onSTTStopped: () => {
    DEBUG.trace('onSTTStopped: mic reverting to idle (syncMicButton false)');
    syncMicButton(false, false);
    bridge.stopLevelMeter();
    // If wake word is enabled, show that we're waiting for wake word and refresh tracker
    if (wakeWordConfigured) {
      setStatus('Ready (waiting for wake word)');
      setTimeout(() => updateTrackerStatus(), 150);
    } else {
      setStatus('Ready');
    }
  },
  // VAD callbacks — Heuristic S2: Make system status clear (bOoK oN vOiCe BoT dEsIgN.md)
  onSpeechStart: () => setStatus('Listening…', 'listening'),
  onSpeechEnd: () => setStatus('Processing…', 'listening'),
  onVADMisfire: () => {
    DEBUG.trace('VAD misfire - speech too short');
    setStatus('Try again — speak a bit longer', 'status-misfire');
    setTimeout(() => {
      if (statusEl?.textContent?.includes('Try again')) setStatus('Listening…', 'listening');
    }, 2500);
  },
  onWakeWordDetected: async (keywordIndex) => {
    DEBUG.trace('Wake word detected! Activating STT pipeline...', { keywordIndex });
    if (debugWakeWord) {
      DEBUG.trace('Wake word detected!', { keywordIndex });
    }
    
    // Record detection in tracker
    if (wakeWordTracker) {
      const metrics = bridge.getWakeWordMetrics();
      const latency = metrics?.avgDetectionLatency || 0;
      let keywordName = `Keyword ${keywordIndex}`;
      keywordName = 'Hey Jarvis';
      wakeWordTracker.recordDetection({
        keywordIndex,
        keywordName,
        latency,
      });
    }
    
    setStatus('Wake word detected — listening…', 'listening');
    // Sync mic button to show it's active when wake word activates STT
    // The bridge will activate STT asynchronously, so we'll sync after a brief delay
    setTimeout(() => {
      if (bridge.isSTTActive()) {
        DEBUG.trace('Wake word: STT pipeline is now active, ready to capture speech');
        syncMicButton(true, false);
        setStatus('Listening…', 'listening');
      } else {
        // If STT didn't activate, keep status showing wake word detected
        DEBUG.warn('Wake word: STT pipeline did not activate after wake word detection');
        setStatus('Wake word detected — starting…', 'listening');
      }
    }, 100);
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
    bridge.speakText(text).then(() => {
      // Reset wake word to listening after 10s silence response (conversation ended)
      if (wakeWordConfigured) {
        bridge.initWakeWord().then((result) => {
          if (result?.success) {
            setStatus('Say "Hey Jarvis" to start', '');
            setTimeout(() => updateTrackerStatus(), 200);
          } else {
            setStatus('Ready');
          }
        }).catch(err => {
          DEBUG.error('Failed to re-initialize wake word after silence', err);
          setStatus('Ready');
        });
      } else {
        setStatus('Ready');
      }
    }).catch(() => setStatus('Ready'));
  },
});

// Initial Cartesia/UI state: status and mic reflect API key so voice is clearly connected or not
if (!apiKey) {
  setStatus('Ready (add CARTESIA_API_KEY for voice)', '');
  syncMicButton(false, true);
} else {
  setStatus('Ready', '');
}

// Initialize wake word error monitor
let wakeWordErrorMonitor = null;
if (wakeWordConfigured) {
  try {
    wakeWordErrorMonitor = new WakeWordErrorMonitor({
      bridge: bridge,
      onFixApplied: (fix) => {
        DEBUG.trace('Wake word error fix applied', fix);
        /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
        console.log('[JARVIS] Wake word error auto-fixed:', {
          errorType: fix.errorType,
          action: fix.fix?.action || 'Unknown action',
          fixed: fix.fix?.fixed || false
        });
        
        // Update tracker if fix was successful
        if (fix.fix && fix.fix.fixed && wakeWordTracker) {
          setTimeout(() => {
            updateTrackerStatus();
          }, 500);
        }
      },
      onErrorDetected: (error) => {
        DEBUG.trace('Wake word error detected', error);
      }
    });
    wakeWordErrorMonitor.start();
    DEBUG.trace('Wake word error monitor started');
    
    // Expose monitor to window for debugging (when debug mode is enabled)
    if (DEBUG.enabled && typeof window !== 'undefined') {
      window.JARVIS_WAKE_WORD_ERROR_MONITOR = wakeWordErrorMonitor;
      /* eslint-disable-next-line no-console -- intentional: debug tool */
      console.log('[JARVIS] Wake word error monitor available at window.JARVIS_WAKE_WORD_ERROR_MONITOR');
      /* eslint-disable-next-line no-console -- intentional: debug tool */
      console.log('[JARVIS] Available methods: getErrorHistory(), getFixHistory(), getStats(), clearHistory()');
    }
  } catch (err) {
    DEBUG.error('Failed to initialize wake word error monitor', err);
  }
}

// Store metrics interval for cleanup
let metricsInterval = null;

// Function to update wake word tracker status (accessible from mic button handler)
const updateTrackerStatus = () => {
  if (!wakeWordTracker) {
    DEBUG.trace('updateTrackerStatus: wakeWordTracker is null (may be disabled)');
    return;
  }
  
  if (!bridge) {
    DEBUG.error('updateTrackerStatus: bridge is null');
    if (wakeWordTracker) {
      wakeWordTracker.setStatus('error', 'Wake word failed');
    }
    return;
  }
  
  try {
    // Check if wake word was actually initialized (getWakeWordMetrics returns null if not initialized)
    const metrics = bridge.getWakeWordMetrics();
    DEBUG.trace('Wake word initialization check', { 
      hasMetrics: metrics !== null,
      hasTracker: !!wakeWordTracker,
      metrics: metrics
    });
    
    if (metrics !== null) {
      // Wake word successfully initialized
      const activeLabel = 'Wake word active (Hey Jarvis)';
      wakeWordTracker.setStatus('waiting', activeLabel);
      DEBUG.trace('Wake word tracker status updated to: waiting');
      
      // Start periodic metrics update
      if (metricsInterval) clearInterval(metricsInterval);
      metricsInterval = setInterval(() => {
        if (wakeWordTracker && bridge) {
          const currentMetrics = bridge.getWakeWordMetrics();
          if (currentMetrics) {
            wakeWordTracker.updateMetrics(currentMetrics);
          }
        }
      }, 1000);
    } else {
      // Wake word manager not initialized (likely mic permission not granted)
      wakeWordTracker.setStatus('error', 'Wake word failed');
      DEBUG.trace('Wake word tracker status updated to: waiting for permission');
    }
  } catch (err) {
    DEBUG.error('updateTrackerStatus: Error checking wake word status', err);
    if (wakeWordTracker) {
      wakeWordTracker.setStatus('error', 'Wake word failed');
    }
  }
};

// Initialize wake word automatically on load — no button. Retry on permission so it starts when user allows.
let wakeWordRetryIntervalId = null;
/** Set when Picovoice activation is refused (invalid key/quota/domain) — do not retry. */
let wakeWordNonRetryable = false;
/** Only one wake word init at a time to avoid parallel timeouts and duplicate errors. */
let wakeWordInitInProgress = false;

function stopWakeWordRetries() {
  if (wakeWordRetryIntervalId) {
    clearInterval(wakeWordRetryIntervalId);
    wakeWordRetryIntervalId = null;
  }
}

function tryWakeWordInit() {
  if (wakeWordNonRetryable) return Promise.resolve(false);
  if (wakeWordInitInProgress) return Promise.resolve(false);
  wakeWordInitInProgress = true;
  return bridge.initWakeWord()
    .finally(() => { wakeWordInitInProgress = false; })
    .then(result => {
    if (result.success) {
      stopWakeWordRetries();
      setStatus('Say "Hey Jarvis" to start', '');
      setTimeout(() => updateTrackerStatus(), 200);
      return true;
    }
    if (result.nonRetryable) {
      wakeWordNonRetryable = true;
      stopWakeWordRetries();
      if (wakeWordTracker) {
        const msg = 'Wake word unavailable. Is the OpenWakeWord server running? Use mic button to talk.';
        wakeWordTracker.setStatus('error', msg);
      }
      return false;
    }
    const reason = result.reason || '';
    const isPermission = /permission|microphone|denied/i.test(reason);
    if (wakeWordTracker) {
      wakeWordTracker.setStatus(isPermission ? 'waiting' : 'error', isPermission
        ? 'Allow microphone — wake word will start automatically'
        : (reason ? `Wake word: ${reason}` : 'Wake word failed'));
    }
    return false;
  }).catch(err => {
    if (!wakeWordNonRetryable) {
      DEBUG.error('Wake word init failed', err);
    }
    const msg = err?.message || String(err);
    const isPermission = /permission|microphone|denied/i.test(msg);
    if (wakeWordTracker) {
      wakeWordTracker.setStatus(isPermission ? 'waiting' : 'error', isPermission
        ? 'Allow microphone — wake word will start automatically'
        : `Wake word failed: ${msg}`);
    }
    return false;
  });
}

function startWakeWordRetries() {
  if (wakeWordRetryIntervalId || wakeWordNonRetryable) return;
  // Do NOT call tryWakeWordInit() on a timer — it would create/resume AudioContext without a user gesture and trigger the browser warning.
  // Instead, re-bind the gesture listener so the next click will retry. Show "Click to try again".
  wakeWordGestureHandled = false;
  bindFirstGesture();
  if (wakeWordTracker) wakeWordTracker.setStatus('waiting', 'Click or tap anywhere to try again');
}

if (wakeWordConfigured) {
  // Try once on load (works when site already has mic permission from a previous visit).
  // Browsers block getUserMedia without a user gesture, so we init on first interaction.
  let wakeWordGestureHandled = false;
  function onFirstUserGesture() {
    if (wakeWordGestureHandled || bridge.getWakeWordMetrics()) return;
    wakeWordGestureHandled = true;
    if (wakeWordTracker) wakeWordTracker.setStatus('waiting', 'Starting wake word...');
    bridge.ensureWakeWordListening().then((result) => {
      if (result?.success) {
        stopWakeWordRetries();
        setStatus('Say "Hey Jarvis" to start', '');
        setTimeout(() => updateTrackerStatus(), 200);
      } else {
        if (wakeWordTracker) {
          const reason = result?.reason || '';
          const isPermission = /permission|microphone|denied/i.test(reason);
          wakeWordTracker.setStatus(isPermission ? 'waiting' : 'error', isPermission
            ? 'Allow microphone — wake word will start automatically'
            : (reason || 'Wake word failed'));
        }
        startWakeWordRetries(); // Retry periodically when first gesture failed (e.g. permission pending)
      }
    }).catch((err) => {
      DEBUG.error('Wake word init failed', err);
      if (wakeWordTracker) wakeWordTracker.setStatus('error', `Wake word failed: ${err?.message || err}`);
      startWakeWordRetries();
    });
  }
  function bindFirstGesture() {
    if (wakeWordGestureHandled || bridge.getWakeWordMetrics()) return;
    ['click', 'keydown', 'touchstart'].forEach((ev) => {
      document.addEventListener(ev, onFirstUserGesture, { once: true, capture: true });
    });
  }
  // Defer wake word init to first user gesture so AudioContext is created after a click/tap/key.
  // This avoids the browser warning: "The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture."
  bindFirstGesture();
  if (wakeWordTracker) wakeWordTracker.setStatus('waiting', 'Click or tap anywhere to start wake word');
  // When user returns to tab: do NOT call tryWakeWordInit() — it would create/resume AudioContext without a user gesture and trigger the warning.
  // Re-bind the gesture listener so the next click will init wake word.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !wakeWordNonRetryable && !bridge.getWakeWordMetrics()) {
        wakeWordGestureHandled = false;
        bindFirstGesture();
        if (wakeWordTracker) wakeWordTracker.setStatus('waiting', 'Click or tap anywhere to start wake word');
      }
    });
  }
} else if (wakeWordTracker) {
  // Wake word not enabled but tracker exists (shouldn't happen, but handle gracefully)
  DEBUG.trace('Wake word not configured - setting tracker to error state');
  wakeWordTracker.setStatus('error', 'Wake word failed');
}

// Clean up intervals when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopWakeWordRetries();
    if (metricsInterval) {
      clearInterval(metricsInterval);
      metricsInterval = null;
    }
    if (wakeWordTracker) {
      wakeWordTracker.destroy();
    }
    if (wakeWordErrorMonitor) {
      wakeWordErrorMonitor.stop();
      wakeWordErrorMonitor = null;
    }
  });
}

/** Debug tool: when ?debug=1, expose JARVIS_DEBUG_SEND_TEST() in console to send a test message and check n8n response. */
if (typeof window !== 'undefined' && (DEBUG.enabled || (window.location && window.location.search && /[?&]debug=1/.test(window.location.search)))) {
  /* eslint-disable no-console -- debug tool */
  console.log('%c[JARVIS DEBUG] Debug mode enabled!', 'color: #FFB800; font-weight: bold; font-size: 14px;');
  console.log('%c[JARVIS DEBUG] DevTools Access:', 'color: #FFB800; font-weight: bold;');
  console.log('  • Press F12 (Windows/Linux) or Cmd+Option+I (Mac) to open DevTools');
  console.log('  • Or right-click → Inspect → Console tab');
  console.log('  • Debug pages: http://localhost:3000/debug/voice-pipeline-debug.html');
  console.log('');
  
  window.JARVIS_DEBUG_SEND_TEST = async function () {
    const msg = 'Hello from JARVIS debug';
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
      const msg = err?.message ?? (typeof err === 'string' ? err : 'Unknown error');
      console.error('[JARVIS DEBUG] Error:', msg);
      console.log('[JARVIS DEBUG] Fix: Check network, CORS, and webhook URL. See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
      return { ok: false, error: msg };
    }
  };
  console.log('[JARVIS DEBUG] Run JARVIS_DEBUG_SEND_TEST() in the console to send a test message and check the n8n response.');
  
  window.JARVIS_CONVERSATION_HISTORY = conversationHistory;
  window.JARVIS_DEBUG_CHECK_CONFIG = function () {
    console.log('[JARVIS DEBUG] Configuration check:');
    console.log('  apiKey:', (apiKey && typeof apiKey === 'string') ? `Set (${String(apiKey).slice(0, 10)}...)` : 'NOT SET');
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
  
  // Helper to show all available debug functions
  window.JARVIS_DEBUG_HELP = function () {
    console.log('%c[JARVIS DEBUG] Available Debug Functions:', 'color: #FFB800; font-weight: bold; font-size: 14px;');
    console.log('  • JARVIS_DEBUG_SEND_TEST() - Send test message to n8n');
    console.log('  • JARVIS_DEBUG_CHECK_CONFIG() - Check configuration and mic status');
    console.log('  • JARVIS_DEBUG_HELP() - Show this help message');
    console.log('  • JARVIS_DEBUG_OPEN_DEVTOOLS() - Try to open DevTools (may not work in all browsers)');
    console.log('');
    console.log('%c[JARVIS DEBUG] Debug Pages:', 'color: #FFB800; font-weight: bold;');
    console.log('  • Voice Pipeline: http://localhost:3000/debug/voice-pipeline-debug.html');
    console.log('  • AudioWorklet: http://localhost:3000/debug/debug-audioworklet.html');
    console.log('  • Fallback Revert: http://localhost:3000/debug/fallback-revert-debug.html');
    console.log('');
    console.log('%c[JARVIS DEBUG] DevTools Access Methods:', 'color: #FFB800; font-weight: bold;');
    console.log('  Method 1: Keyboard Shortcuts');
    console.log('    • F12 (Windows/Linux/Mac)');
    console.log('    • Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)');
    console.log('    • Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Console only');
    console.log('    • Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Inspect Element');
    console.log('  Method 2: Right-click menu');
    console.log('    • Right-click anywhere on page → "Inspect" or "Inspect Element"');
    console.log('  Method 3: Browser menu');
    console.log('    • Chrome/Edge: Menu (⋮) → More Tools → Developer Tools');
    console.log('    • Firefox: Menu (☰) → More Tools → Web Developer Tools');
    console.log('    • Safari: Develop menu (enable in Preferences → Advanced)');
    console.log('  Method 4: If F12 is blocked');
    console.log('    • Check if browser extensions are blocking it');
    console.log('    • Try in incognito/private mode');
    console.log('    • Check Windows/browser settings for disabled shortcuts');
  };
  
  // Helper to attempt opening DevTools (limited browser support)
  window.JARVIS_DEBUG_OPEN_DEVTOOLS = function () {
    console.log('%c[JARVIS DEBUG] Attempting to open DevTools...', 'color: #FFB800; font-weight: bold;');
    console.log('Note: Most browsers block programmatic DevTools access for security.');
    console.log('If this doesn\'t work, use one of these methods:');
    console.log('  1. Press F12');
    console.log('  2. Right-click → Inspect');
    console.log('  3. Browser menu → Developer Tools');
    console.log('  4. Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)');
    
    // Try to trigger DevTools (may not work due to browser security)
    try {
      // This is a common trick but may not work in modern browsers
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow.console.log('%c', '');
      document.body.removeChild(iframe);
    } catch {
      // Expected to fail in most browsers
    }
    
    // Show alert with instructions
    alert('DevTools cannot be opened programmatically for security reasons.\n\n' +
          'Please use one of these methods:\n' +
          '• Press F12\n' +
          '• Right-click → Inspect\n' +
          '• Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)\n' +
          '• Browser menu → Developer Tools');
  };
  
  console.log('[JARVIS DEBUG] Run JARVIS_DEBUG_HELP() for a list of all debug functions and shortcuts.');
  console.log('[JARVIS DEBUG] Run JARVIS_DEBUG_OPEN_DEVTOOLS() for help opening DevTools if F12 is blocked.');
}
/* eslint-enable no-console */

let pendingAttachments = [];

if (btnSend) {
  btnSend.addEventListener('click', async () => {
    // Always log button clicks (not just in debug mode) for troubleshooting
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] Send button clicked', { hasText: !!textInput.value.trim(), textLength: textInput.value.trim().length });
    DEBUG.trace('btnSend clicked', { hasText: !!textInput.value.trim(), textLength: textInput.value.trim().length });
    const text = textInput.value.trim();
    if (!text) {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Send button: empty text, returning early');
      DEBUG.trace('btnSend: empty text, returning early');
      return;
    }
    textInput.value = '';
    textInput.placeholder = 'Type or speak...';
    // Reset textarea height after clearing
    if (textInput.style.height) {
      textInput.style.height = 'auto';
    }
    const attachmentsForPayload = [...pendingAttachments];
    appendMessage('user', text, attachmentsForPayload.length ? attachmentsForPayload : []);
    pendingAttachments = [];
    setStatus('Processing…', 'listening');
    try {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Preparing to send text message to n8n', { text: text.slice(0, 50), n8nWebhookUrl });
      const attachmentPayload = await filesToAttachmentPayload(attachmentsForPayload);
      await addOcrToAttachments(attachmentPayload);
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Calling getLLMReply with text payload', { textLength: text.length, hasAttachments: attachmentPayload.length > 0 });
      
      // Build payload explicitly to log it before sending (for debugging)
      const textPayload = buildPayload(text, { source: 'text', attachments: attachmentPayload });
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Text button payload (full structure):', {
        message: textPayload.message,
        source: textPayload.source,
        session_id: textPayload.session_id,
        sessionId: textPayload.sessionId,
        message_id: textPayload.message_id,
        messageId: textPayload.messageId,
        timestamp: textPayload.timestamp,
        timezone: textPayload.timezone,
        location: textPayload.location,
        locale: textPayload.locale,
        language: textPayload.language,
        attachments: textPayload.attachments?.map(a => ({ 
          name: a.name, 
          type: a.type, 
          size: a.size, 
          hasData: !!a.data,
          dataLength: a.data?.length || 0
        })) || [],
        payloadKeys: Object.keys(textPayload),
        payloadSize: JSON.stringify(textPayload).length
      });
      DEBUG.trace('Text button: full payload structure', textPayload);
      
      const { reply: replyText, data: replyData } = await getLLMReply(text, { source: 'text', attachments: attachmentPayload });
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Received reply from n8n', { replyLength: replyText?.length || 0, hasData: !!replyData });
      appendMessage('assistant', replyText);
      const files = extractFilesFromJson(replyData);
      if (apiKey) {
        setStatus('Speaking…', 'speaking');
        try {
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.log('[JARVIS] Speaking text response...');
          // speakText() will call connectTTS() internally, which ensures TTS node is initialized
          await bridge.speakText(replyText);
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.log('[JARVIS] Finished speaking text');
          setStatus('Ready');
          if (files.length) await processFileSpecs(files);
        } catch (err) {
          /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
          console.error('[JARVIS] Error in TTS/speak', err);
          setStatus('Error', 'error');
          appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
        }
      } else {
        setStatus('Ready (no voice: add CARTESIA_API_KEY for TTS)', '');
        if (files.length) await processFileSpecs(files);
      }
    } catch (err) {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.error('[JARVIS] Error in send button handler', err);
      setStatus('Error', 'error');
      appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
    }
  });
  /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
  console.log('[JARVIS] Send button click handler attached');
} else {
  /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
  console.error('[JARVIS] btnSend not found - cannot attach click handler');
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
  
  textInput.addEventListener('input', autoResizeTextarea);
  textInput.addEventListener('keydown', (e) => {
    // Never block DevTools shortcuts (F12, Ctrl+Shift+I, etc.)
    if (e.key === 'F12' ||
        (e.key === 'I' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) ||
        (e.key === 'J' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) ||
        (e.key === 'C' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey)) {
      // Allow DevTools shortcuts to work normally - don't prevent default
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (btnSend) btnSend.click();
      // Reset height after sending
      setTimeout(() => {
        if (textInput && !textInput.value.trim()) {
          textInput.style.height = 'auto';
        }
      }, 0);
    } else {
      // Allow textarea to resize on Enter+Shift or other keys
      setTimeout(autoResizeTextarea, 0);
    }
  });
} else {
  DEBUG.error('textInput not found - cannot attach keydown handler');
}

// Ensure DevTools shortcuts always work at document level (regardless of focus)
// This prevents any code from accidentally blocking F12 or other DevTools shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12') {
    // Explicitly allow F12 - never prevent default
    return;
  }
  // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac) - Open DevTools
  if (e.key === 'I' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
    // Allow - don't prevent default
    return;
  }
  // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Open Console
  if (e.key === 'J' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
    // Allow - don't prevent default
    return;
  }
  // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Inspect Element
  if (e.key === 'C' && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
    // Allow - don't prevent default
    return;
  }
  // Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac) - View Source
  if (e.key === 'U' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
    // Allow - don't prevent default
    return;
  }
}, { capture: true }); // Use capture phase to ensure we run before other handlers

if (btnMic) {
  btnMic.addEventListener('click', async () => {
    // Always log button clicks (not just in debug mode) for troubleshooting
    /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
    console.log('[JARVIS] Mic button clicked', { sttActive: bridge.isSTTActive() });
    DEBUG.trace('Mic clicked', { sttActive: bridge.isSTTActive() });
    if (bridge.isSTTActive()) {
      /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
      console.log('[JARVIS] Stopping STT (mic was active)');
      bridge.stopSTT();
      return;
    }
    if (!apiKey) {
      setStatus('Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)', 'error');
      return;
    }
    const support = CartesiaAudioBridge.checkRecordingSupport();
    if (!support.supported) {
      setStatus(support.message || 'Microphone not available', 'error');
      return;
    }
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
      // Mic button = listen immediately; don't wait for wake word
      await bridge.startSTT({ skipWakeWordWait: true });
      syncMicButton(true, false);
      setStatus('Listening…', 'listening');
      // Update wake word tracker status after mic permission is granted and STT starts
      // This ensures the tracker shows the correct status after user grants permission
      if (wakeWordConfigured) {
        setTimeout(() => {
          updateTrackerStatus();
        }, 500); // Small delay to ensure wake word is initialized
      }
    } catch (err) {
      const msg = err?.message || String(err);
      setStatus(msg.startsWith('Mic ') ? msg : 'Mic: ' + msg, 'error');
      syncMicButton(false, false);
    }
  });
  /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
  console.log('[JARVIS] Mic button click handler attached');
} else {
  /* eslint-disable-next-line no-console -- intentional: always visible for troubleshooting */
  console.error('[JARVIS] btnMic not found - cannot attach click handler');
  DEBUG.error('btnMic not found - cannot attach click handler');
}

if (btnPaperclip && fileInput) {
  btnPaperclip.addEventListener('click', () => fileInput.click());
} else {
  DEBUG.error('btnPaperclip or fileInput not found - cannot attach click handler', { btnPaperclip: !!btnPaperclip, fileInput: !!fileInput });
}

if (btnExportPdf) {
  btnExportPdf.addEventListener('click', async () => {
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
  });
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

// Full teardown when tab/window is closing
window.addEventListener('beforeunload', () => bridge.destroy());

// MDN bfcache: close WebSockets on pagehide so the page can be added to back/forward cache
// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#working_with_the_bfcache
window.addEventListener('pagehide', () => {
  bridge.closeAllWebSocketsForBfcache();
});
