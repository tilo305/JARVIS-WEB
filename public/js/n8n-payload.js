/**
 * Shared n8n webhook payload builder and reply extraction — single source of truth for all n8n requests.
 * Used by: chat UI (app.js), debug tools (check-n8n-webhook, open-app-debug-send), live tests, fallback-revert-debug.
 * Ensures session_id, timezone, location, and all fields are always sent; reply parsing handles arrays and n8n item format.
 */
'use strict';

/** Keys that must be present on every n8n webhook payload (frontend + Electron). */
export const N8N_PAYLOAD_REQUIRED_KEYS = [
  'message', 'query', 'input',
  'session_id', 'sessionId',
  'timestamp', 'timezone', 'location',
  'message_id', 'messageId',
  'source', 'attachments',
];

/** Keys checked (in order) for reply text in n8n webhook JSON response */
export const N8N_REPLY_KEYS = ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content', 'body'];

/**
 * Extract reply string from n8n webhook JSON response.
 * Checks top-level keys, then array (e.g. [{ output: "..." }] from Respond to Webhook "First Incoming Item"),
 * including n8n item format { json: { output: "..." } }, then nested objects.
 * @param {Object} data - Parsed JSON response from n8n
 * @returns {string|null} - Reply text or null if none found
 */
export function extractReplyFromJson(data) {
  if (!data || typeof data !== 'object') return null;
  for (const key of N8N_REPLY_KEYS) {
    const v = data[key];
    if (typeof v === 'string') return v;
  }
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const fromFirst = extractReplyFromJson(first);
      if (fromFirst) return fromFirst;
      if (first.json && typeof first.json === 'object') {
        const fromJson = extractReplyFromJson(first.json);
        if (fromJson) return fromJson;
      }
    }
  }
  for (const v of Object.values(data)) {
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length) {
      const fromArr = extractReplyFromJson(v[0]);
      if (fromArr) return fromArr;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = extractReplyFromJson(v);
      if (nested) return nested;
    }
  }
  return null;
}

/** Keys checked for files array in n8n webhook JSON response */
const N8N_FILES_KEYS = ['files', 'createFiles', 'file_outputs', 'attachments'];

/**
 * Extract optional file-creation specs from n8n webhook JSON response.
 * Used when the assistant is asked to create audio, PDF, image, or text files.
 * Each item: { type: 'audio'|'pdf'|'image'|'text', ... } with type-specific fields.
 * @param {Object} data - Parsed JSON response from n8n
 * @returns {Array<Object>} - Array of file specs (may be empty)
 */
export function extractFilesFromJson(data) {
  if (!data || typeof data !== 'object') return [];
  let list = null;
  for (const key of N8N_FILES_KEYS) {
    const v = data[key];
    if (Array.isArray(v) && v.length) {
      list = v;
      break;
    }
  }
  if (!list) return [];
  return list.filter((f) => f && typeof f === 'object' && f.type);
}

/**
 * Get client location/timezone and locale.
 * Works in browser (navigator, Intl) and Node (Intl only).
 * @returns {{ timezone: string, locale: string, language: string }}
 */
export function getClientLocation() {
  let timezone = 'UTC';
  let locale = '';
  let language = '';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
    }
    if (typeof navigator !== 'undefined') {
      locale = navigator.language || navigator.userLanguage || '';
      language = (navigator.languages && navigator.languages[0]) || locale || '';
    }
  } catch {
    /* ignore */
  }
  return { timezone, locale, language };
}

/**
 * Natural fallback replies when n8n doesn't return a proper reply.
 * Single source of truth for app.js and fallback-revert-debug.html.
 * Follows JARVIS system prompt: British, always "sir", warm and conversational.
 * @param {string} [userMessage] - Raw user message
 * @returns {string|null} - Fallback reply or null
 */
export function getNaturalFallback(userMessage) {
  const m = (userMessage || '').trim().toLowerCase().replace(/[!?.,]+$/, '');
  if (!m) return null;
  const greetings = ['hello', 'hi', 'hey', 'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'];
  if (greetings.some((g) => m === g || m.startsWith(g + ' '))) return "Good morning, sir. How can I assist you today?";
  if (m === 'goodbye' || m === 'bye' || m === 'see you') return "Goodbye, sir. I'll be here when you need me.";
  if (m === 'thanks' || m === 'thank you' || m === 'thanks!') return "You're welcome, sir.";
  if (m === 'yes' || m === 'no') return "Understood, sir.";
  return null;
}

/**
 * Build full payload for n8n webhook. All fields n8n may expect:
 * - session_id / sessionId: per-tab/session continuity
 * - timestamp: ISO 8601 when message was sent
 * - timezone: user's IANA timezone (e.g. America/New_York)
 * - location: same as timezone
 * - message_id / messageId: unique per message (tracing, idempotency)
 * - source: 'voice' | 'text'
 * - attachments: array of { name, type, size, data? } — data is base64 file content when present
 * - locale, language: browser locale/language
 *
 * @param {string} message - User message text
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.source='text'] - 'voice' | 'text'
 * @param {string} [options.sessionId] - Override session ID (auto-generated if omitted)
 * @param {Array} [options.attachments] - File attachments
 * @param {Array} [options.conversationHistory] - Previous conversation messages for context
 * @param {string} [options.intent] - Agentic: detected intent (e.g. greeting)
 * @param {Object} [options.contextEnrichment] - Agentic: context (e.g. viewportWidth)
 * @param {Object} [options.agenticHints] - Optional { planMode, refineMode } for workflow selection
 * @returns {Object} Full payload object
 */
export function buildN8nPayload(message, options = {}) {
  const source = options.source ?? 'text';
  const sessionId = options.sessionId ?? `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const rawAttachments = options.attachments ?? [];
  const hasConversationHistory = Array.isArray(options.conversationHistory) && options.conversationHistory.length > 0;

  const attachments = rawAttachments.map((f) => {
    if (f instanceof File) return { name: f.name, type: f.type, size: f.size };
    if (f && typeof f === 'object' && 'name' in f) {
      const a = { name: f.name, type: f.type ?? '', size: f.size ?? 0 };
      if (typeof f.data === 'string') a.data = f.data; // base64 file content for n8n
      if (typeof f.ocrText === 'string') a.ocrText = f.ocrText; // OCR text from multimodal OCR tool
      return a;
    }
    return null;
  }).filter(Boolean);

  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const { timezone, locale, language } = getClientLocation();

  const trimmedMessage = (message || '').trim();
  const payload = {
    message: trimmedMessage,
    // Aliases so n8n workflows that expect "query" or "input" still receive the user message
    query: trimmedMessage,
    input: trimmedMessage,
    session_id: sessionId,
    sessionId,
    timestamp: now,
    timezone,
    location: timezone,
    message_id: messageId,
    messageId,
    source,
    attachments,
    locale: locale || undefined,
    language: language || undefined,
  };
  if (hasConversationHistory) {
    payload.conversation_history = options.conversationHistory;
    payload.conversationHistory = options.conversationHistory;
  }
  if (options.intent != null) payload.intent = options.intent;
  if (options.contextEnrichment != null) payload.contextEnrichment = options.contextEnrichment;
  if (options.agenticHints != null && typeof options.agenticHints === 'object') {
    payload.agenticHints = options.agenticHints;
  }
  return payload;
}

/**
 * Validate payload before sending to n8n (frontend and Electron).
 * Ensures all required keys exist and message/query/input are consistent.
 * @param {Object} payload - Built payload object
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateN8nPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  for (const key of N8N_PAYLOAD_REQUIRED_KEYS) {
    if (!(key in payload)) {
      errors.push(`Missing required key: ${key}`);
    }
  }
  const msg = payload.message;
  const q = payload.query;
  const inp = payload.input;
  if (typeof msg !== 'string') errors.push('payload.message must be a string');
  if (typeof q !== 'string') errors.push('payload.query must be a string');
  if (typeof inp !== 'string') errors.push('payload.input must be a string');
  if (msg !== q || msg !== inp) {
    errors.push('payload.message, query, and input must be the same value');
  }
  if (payload.source !== 'voice' && payload.source !== 'text') {
    errors.push("payload.source must be 'voice' or 'text'");
  }
  if (!Array.isArray(payload.attachments)) {
    errors.push('payload.attachments must be an array');
  }
  if (errors.length) return { valid: false, errors };
  return { valid: true };
}
