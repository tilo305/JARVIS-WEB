/**
 * Shared n8n webhook payload builder — single source of truth for all n8n requests.
 * Used by: chat UI (app.js), debug tools (check-n8n-webhook), live tests (n8n-webhook.test).
 * Ensures session_id, timezone, location, and all fields are always sent.
 */
'use strict';

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
 * Build full payload for n8n webhook. All fields n8n may expect:
 * - session_id / sessionId: per-tab/session continuity
 * - timestamp: ISO 8601 when message was sent
 * - timezone: user's IANA timezone (e.g. America/New_York)
 * - location: same as timezone
 * - message_id / messageId: unique per message (tracing, idempotency)
 * - source: 'voice' | 'text'
 * - attachments: array of { name, type, size }
 * - locale, language: browser locale/language
 *
 * @param {string} message - User message text
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.source='text'] - 'voice' | 'text'
 * @param {string} [options.sessionId] - Override session ID (auto-generated if omitted)
 * @param {Array} [options.attachments] - File attachments
 * @returns {Object} Full payload object
 */
export function buildN8nPayload(message, options = {}) {
  const source = options.source ?? 'text';
  const sessionId = options.sessionId ?? `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const rawAttachments = options.attachments ?? [];

  const attachments = rawAttachments.map((f) => {
    if (f instanceof File) return { name: f.name, type: f.type, size: f.size };
    if (f && typeof f === 'object' && 'name' in f) return { name: f.name, type: f.type ?? '', size: f.size ?? 0 };
    return null;
  }).filter(Boolean);

  const now = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const { timezone, locale, language } = getClientLocation();

  return {
    message: (message || '').trim(),
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
}
