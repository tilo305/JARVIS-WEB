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
import { buildN8nPayload } from './n8n-payload.js';
import { DEBUG } from './debug.js';

const chatContainer = document.getElementById('chatContainer');
const textInput = document.getElementById('textInput');
const btnSend = document.getElementById('btnSend');
const btnMic = document.getElementById('btnMic');
const btnPaperclip = document.getElementById('btnPaperclip');
const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');

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
  let attHtml = '';
  if (attachments.length) {
    attHtml = '<div class="attachments">' + attachments.map(a => {
      const isImage = (a && typeof a === 'object' && a.type && a.type.startsWith('image/'));
      if (isImage) {
        const url = a.url || URL.createObjectURL(a);
        return `<img src="${url}" alt="Attachment" />`;
      }
      const name = typeof a === 'string' ? a : (a && a.name) || 'File';
      return `<span class="file-name">${escapeHtml(name)}</span>`;
    }).join('') + '</div>';
  }
  wrap.innerHTML = `<div class="label">${escapeHtml(label)}</div><div class="content">${escapeHtml(content)}</div>${attHtml}`;
  chatContainer.appendChild(wrap);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return wrap;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

const N8N_REPLY_KEYS = ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content'];

/**
 * Get client location/timezone and locale for n8n (no geolocation permission required).
 * @returns {{ timezone: string, locale: string, language: string }}
 */
function extractReplyFromJson(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of N8N_REPLY_KEYS) {
    const v = data[key];
    if (typeof v === 'string') return v;
  }
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return extractReplyFromJson(first);
  }
  for (const v of Object.values(data)) {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = extractReplyFromJson(v);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Natural fallback replies when n8n doesn't return a proper reply.
 * Keeps the conversation friendly instead of showing technical instructions.
 */
function getNaturalFallback(userMessage) {
  const m = (userMessage || '').trim().toLowerCase().replace(/[!?.,]+$/, '');
  if (!m) return null;
  const greetings = ['hello', 'hi', 'hey', 'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'];
  if (greetings.some((g) => m === g || m.startsWith(g + ' '))) {
    return "Hello! How can I assist you today?";
  }
  if (m === 'goodbye' || m === 'bye' || m === 'see you') {
    return "Goodbye. I'll be here when you need me.";
  }
  if (m === 'thanks' || m === 'thank you' || m === 'thanks!') {
    return "You're welcome.";
  }
  if (m === 'yes' || m === 'no') {
    return "Understood.";
  }
  return null;
}

/**
 * Get LLM reply from n8n webhook.
 * Sends full payload: message, session_id, sessionId, timestamp, timezone, location,
 * message_id, messageId, source, attachments, locale, language.
 */
async function getLLMReply(userText, options = {}) {
  const payload = buildPayload(userText, options);
  if (!payload.message) return "I didn't catch that. Try again?";
  DEBUG.trace('n8n: sending payload', { message: payload.message.slice(0, 50), source: payload.source });
  try {
    const res = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    const reply = extractReplyFromJson(data);
    DEBUG.trace('n8n: response', { status: res.status, hasReply: !!reply, replyPreview: typeof reply === 'string' ? reply.slice(0, 50) : '' });
    if (typeof reply === 'string') return reply;
    const natural = getNaturalFallback(payload.message);
    const fallback = natural || "I heard you. I'm still getting set up — please try again in a moment.";
    DEBUG.trace('n8n: using fallback (no reply in response)', { natural: !!natural, fallbackPreview: fallback.slice(0, 50) });
    if (natural) return natural;
    return fallback;
  } catch (err) {
    DEBUG.error('n8n webhook error', err);
    return "Sorry, I couldn't reach the assistant. Please try again.";
  }
}

const bridge = new CartesiaAudioBridge({
  apiKey: apiKey || undefined,
  voiceId: voiceId || undefined,
  ttsModel: 'sonic-turbo',
  audioWorkletBasePath: new URL('audio/', document.baseURI).href,
  onPartialTranscript: (text, isFinal) => {
    if (!isFinal && text.trim()) setStatus(`Listening… "${text.slice(0, 40)}${text.length > 40 ? '…' : ''}"`, 'listening');
  },
  onTranscript: async (text, isFinal) => {
    if (!isFinal) return;
    if (!text.trim()) {
      DEBUG.trace('onTranscript: empty text, skipping n8n');
      return;
    }
    DEBUG.trace('onTranscript: final text received, sending to n8n', { text: text.slice(0, 80) });
    appendMessage('user', text);
    setStatus('Processing…', 'listening');
    const replyText = await getLLMReply(text, { source: 'voice' });
    appendMessage('assistant', replyText);
    setStatus('Speaking…', 'speaking');
    bridge.speakText(replyText).then(() => {
      setStatus('Ready');
      bridge.startAgentSilenceTimer();
    }).catch((err) => {
      setStatus('Error', 'error');
      appendMessage('assistant', 'Sorry, I could not speak that. ' + (err?.message || err));
    });
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

let pendingAttachments = [];

btnSend.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return;
  if (!apiKey) {
    setStatus('Add CARTESIA_API_KEY (or set window.JARVIS_CONFIG.apiKey)', 'error');
    return;
  }
  textInput.value = '';
  textInput.placeholder = 'Type or speak...';
  const attachmentsForPayload = [...pendingAttachments];
  appendMessage('user', text, attachmentsForPayload.length ? attachmentsForPayload : []);
  pendingAttachments = [];
  setStatus('Processing…', 'listening');
  const replyText = await getLLMReply(text, { source: 'text', attachments: attachmentsForPayload });
  appendMessage('assistant', replyText);
  setStatus('Speaking…', 'speaking');
  try {
    await bridge.speakText(replyText);
    setStatus('Ready');
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
fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files || []);
  if (!files.length) return;
  pendingAttachments.push(...files);
  const n = pendingAttachments.length;
  textInput.placeholder = n ? `${n} file(s) attached — type a message...` : 'Type or speak...';
  fileInput.value = '';
});

window.addEventListener('beforeunload', () => bridge.destroy());
