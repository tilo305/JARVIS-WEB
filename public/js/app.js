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
  createPdfBlob,
  createImageBlobFromBase64,
  createTextBlob,
  downloadBlob,
  isAudioFile,
  safeFilename,
} from './file-creator.js';
import { DEBUG } from './debug.js';

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

/** Config: Vite env when built, or window.JARVIS_CONFIG for static HTML (e.g. public/index.html) */
function getConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  return {
    apiKey: env.VITE_CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4',
  };
}
const { apiKey, voiceId, n8nWebhookUrl } = getConfig();

/** Session ID for n8n workflow continuity (persists for page lifetime) */
const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** Build payload with app's session ID */
function buildPayload(message, options) {
  return buildN8nPayload(message, { ...options, sessionId });
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

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
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
  const payload = buildPayload(userText, options);
  if (!payload.message) return { reply: "I didn't catch that. Try again?", data: {} };
  DEBUG.trace('n8n: sending payload', { message: payload.message.slice(0, 50), source: payload.source });
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
    DEBUG.trace('n8n: response', { status: res.status, hasReply: !!reply, replyPreview: typeof reply === 'string' ? reply.slice(0, 50) : '' });
    if (typeof reply === 'string') return { reply, data };
    // No reply extracted — log so we can diagnose fallback
    const hasNatural = !!getNaturalFallback(payload.message);
    if (!hasNatural) {
      // eslint-disable-next-line no-console -- intentional: user needs to see why fallback was used
      console.warn('[JARVIS] n8n fallback: no reply in response. Status:', res.status, 'Body:', JSON.stringify(data).slice(0, 300));
    }
    if (DEBUG.enabled && typeof reply !== 'string') {
      DEBUG.trace('n8n: response body (no reply extracted)', data);
    }
    if (res.ok && (Object.keys(data).length === 0 || !extractReplyFromJson(data))) {
      DEBUG.error('n8n: empty or no reply in response body. In n8n, set Webhook node Respond to "Using Respond to Webhook Node". See debug/N8N-RESPOND-TO-WEBHOOK-FIX.md');
    }
    const natural = getNaturalFallback(payload.message);
    const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
    DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
    return { reply: natural ? natural : fallback, data };
  } catch (err) {
    DEBUG.error('n8n webhook error', err);
    return { reply: "Sorry, I couldn't reach the assistant. Please try again.", data: {} };
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
  ttsModel: 'sonic-turbo',
  audioWorkletBasePath: new URL('../audio/', import.meta.url).href,
  onPartialTranscript: (text, isFinal) => {
    if (!isFinal && text.trim()) setStatus(`Listening… "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`, 'listening');
  },
  onTranscript: async (text, isFinal) => {
    if (!isFinal) return;
    const trimmed = (text || '').trim();
    if (!trimmed) {
      DEBUG.trace('onTranscript: empty text, skipping n8n (no payload sent)');
      return;
    }
    DEBUG.trace('onTranscript: sending voice payload to n8n', { length: trimmed.length, preview: trimmed.slice(0, 80) });
    try {
      appendMessage('user', trimmed);
      setStatus('Processing…', 'listening');
      const { reply: replyText, data: replyData } = await getLLMReply(trimmed, { source: 'voice' });
      appendMessage('assistant', replyText);
      const files = extractFilesFromJson(replyData);
      if (apiKey) {
        setStatus('Speaking…', 'speaking');
        try {
          await bridge.speakText(replyText);
          setStatus('Connecting…', '');
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
            setStatus('Ready (mic restart failed)', '');
          }
          if (files.length) await processFileSpecs(files);
        } catch (err) {
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
    // eslint-disable-next-line no-console -- intentional error reporting
    console.error('[JARVIS]', err);
    setStatus('Error', 'error');
    if (bridge.isSTTActive()) bridge.stopSTT();
  },
  onSTTStopped: () => {
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
/* eslint-enable no-console */

let pendingAttachments = [];

btnSend.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return;
  textInput.value = '';
  textInput.placeholder = 'Type or speak...';
  const attachmentsForPayload = [...pendingAttachments];
  appendMessage('user', text, attachmentsForPayload.length ? attachmentsForPayload : []);
  pendingAttachments = [];
  setStatus('Processing…', 'listening');
  try {
    const attachmentPayload = await filesToAttachmentPayload(attachmentsForPayload);
    await addOcrToAttachments(attachmentPayload);
    const { reply: replyText, data: replyData } = await getLLMReply(text, { source: 'text', attachments: attachmentPayload });
    appendMessage('assistant', replyText);
    const files = extractFilesFromJson(replyData);
    if (apiKey) {
      setStatus('Speaking…', 'speaking');
      try {
        await bridge.speakText(replyText);
        setStatus('Ready');
        if (files.length) await processFileSpecs(files);
      } catch (err) {
        setStatus('Error', 'error');
        appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
      }
    } else {
      setStatus('Ready (no voice: add CARTESIA_API_KEY for TTS)', '');
      if (files.length) await processFileSpecs(files);
    }
  } catch (err) {
    setStatus('Error', 'error');
    appendMessage('assistant', 'Sorry, something went wrong. ' + (err?.message || err));
  }
});

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    btnSend.click();
  }
});

btnMic.addEventListener('click', async () => {
  DEBUG.trace('Mic clicked', { sttActive: bridge.isSTTActive() });
  if (bridge.isSTTActive()) {
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
    await bridge.startSTT();
    syncMicButton(true, false);
    setStatus('Listening…', 'listening');
  } catch (err) {
    const msg = err?.message || String(err);
    setStatus(msg.startsWith('Mic ') ? msg : 'Mic: ' + msg, 'error');
    syncMicButton(false, false);
  }
});

btnPaperclip.addEventListener('click', () => fileInput.click());

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

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || []);
  if (!files.length) return;
  pendingAttachments.push(...files);
  const n = pendingAttachments.length;
  textInput.placeholder = n ? `${n} file(s) attached — type a message...` : 'Type or speak...';
  fileInput.value = '';
});

window.addEventListener('beforeunload', () => bridge.destroy());
