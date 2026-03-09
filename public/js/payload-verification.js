/**
 * Payload verification — validates n8n webhook payloads and responses.
 * Used for debugging and monitoring payload flow.
 */
import { extractReplyFromJson } from './n8n-payload.js';

/**
 * Validate outgoing payload before sending.
 * @param {Object} payload - Built payload object
 * @returns {{ valid: boolean, errors?: string[], warnings?: string[] }}
 */
export function validatePayload(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  const requiredForValidation = ['message', 'session_id', 'sessionId', 'timestamp', 'source', 'message_id', 'messageId'];
  for (const key of requiredForValidation) {
    if (!(key in payload)) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  const msg = payload.message;
  const q = payload.query ?? payload.message;
  const inp = payload.input ?? payload.message;
  if (typeof msg !== 'string') errors.push('payload.message must be a string');
  else if (msg.trim() === '') errors.push('payload.message cannot be empty');
  if (typeof q !== 'string') errors.push('payload.query must be a string');
  if (typeof inp !== 'string') errors.push('payload.input must be a string');
  if (msg !== q || msg !== inp) {
    errors.push('payload.message, query, and input must be the same value');
  }
  if (payload.source !== 'voice' && payload.source !== 'text') {
    errors.push("payload.source must be 'voice' or 'text'");
  }
  const attachments = payload.attachments;
  if (attachments != null && !Array.isArray(attachments)) {
    errors.push('payload.attachments must be an array');
  }

  if (payload.session_id !== payload.sessionId) {
    warnings.push('session_id and sessionId should match');
  }

  if (errors.length) return { valid: false, errors, warnings };
  return { valid: true, errors: [], warnings };
}

function findReplyKeyPath(data, prefix = '') {
  if (!data || typeof data !== 'object') return null;
  for (const key of ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content', 'body']) {
    const v = data[key];
    if (typeof v === 'string') return prefix ? `${prefix}.${key}` : key;
  }
  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string') return `${prefix}[0]`;
    if (first && typeof first === 'object') {
      const fromFirst = findReplyKeyPath(first, prefix ? `${prefix}[0]` : '[0]');
      if (fromFirst) return fromFirst;
      if (first.json) {
        const fromJson = findReplyKeyPath(first.json, prefix ? `${prefix}[0].json` : '[0].json');
        if (fromJson) return fromJson;
      }
    }
  }
  return null;
}

/**
 * Validate n8n webhook response.
 * @param {Object|Array} response - Parsed JSON response
 * @returns {{ valid: boolean, hasReply: boolean, replyKey?: string, errors?: string[] }}
 */
export function validateResponse(response) {
  const errors = [];
  const replyKey = findReplyKeyPath(response);
  const hasReply = replyKey != null;

  if (!response || (typeof response !== 'object' && !Array.isArray(response))) {
    return { valid: false, hasReply: false, errors: ['Response must be an object or array'] };
  }
  if (!hasReply) {
    errors.push('Response has no reply or is empty');
    return { valid: false, hasReply: false, replyKey: replyKey || undefined, errors };
  }
  return { valid: true, hasReply: true, replyKey: replyKey || undefined, errors: [] };
}

const MAX_HISTORY = 100;
let sendHistory = [];
let receiveHistory = [];

/**
 * Monitor for payload send/receive tracking.
 */
export const payloadMonitor = {
  recordSend(payload, url) {
    const record = { payload, url, ts: Date.now() };
    sendHistory.push(record);
    if (sendHistory.length > MAX_HISTORY) sendHistory = sendHistory.slice(-MAX_HISTORY);
    return record;
  },

  recordReceive(response, status, url) {
    const record = { response, status, url, ts: Date.now() };
    receiveHistory.push(record);
    if (receiveHistory.length > MAX_HISTORY) receiveHistory = receiveHistory.slice(-MAX_HISTORY);
    return record;
  },

  getStats() {
    const sends = { total: sendHistory.length, history: sendHistory };
    const receives = { total: receiveHistory.length, history: receiveHistory };
    const lastReceive = receiveHistory[receiveHistory.length - 1];
    const hasReply = lastReceive ? extractReplyFromJson(lastReceive.response) != null : false;
    const health = sends.total > 0 && receives.total > 0 && hasReply ? 'healthy' : 'unknown';
    return { sends, receives, health };
  },

  clear() {
    sendHistory = [];
    receiveHistory = [];
  },
};

/**
 * Verify payload flow health based on monitor history.
 * @returns {{ healthy: boolean, stats: Object, issues: Array<{ message: string }> }}
 */
export function verifyPayloadFlow() {
  const stats = payloadMonitor.getStats();
  const issues = [];

  if (stats.sends.total === 0) {
    issues.push({ message: 'No payloads sent recorded' });
  }
  if (stats.receives.total === 0 && stats.sends.total > 0) {
    issues.push({ message: 'No receives recorded' });
  }
  const lastRecv = receiveHistory[receiveHistory.length - 1];
  if (lastRecv && findReplyKeyPath(lastRecv.response) == null) {
    issues.push({ message: 'Last response has no reply' });
  }

  return {
    healthy: issues.length === 0,
    stats,
    issues,
  };
}
