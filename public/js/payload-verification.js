/**
 * Payload Verification Utility
 * Ensures front-end, UI, and back-end are sending and receiving payloads correctly.
 * Provides validation, monitoring, and debugging tools for payload flow.
 */

'use strict';

/**
 * Expected payload structure for n8n webhook
 */
const REQUIRED_PAYLOAD_FIELDS = [
  'message',
  'session_id',
  'sessionId',
  'timestamp',
  'source',
  'message_id',
  'messageId',
];

// Optional payload fields (documentation only - not used in validation)
// const OPTIONAL_PAYLOAD_FIELDS = [
//   'timezone',
//   'location',
//   'attachments',
//   'locale',
//   'language',
//   'conversationHistory',
//   'intent',
//   'agenticHints',
//   'contextEnrichment',
// ];

/**
 * Expected response keys that n8n may return
 */
const EXPECTED_RESPONSE_KEYS = [
  'output',
  'reply',
  'result',
  'text',
  'message',
  'response',
  'answer',
  'content',
  'body',
  'responseText',
];

/**
 * Validate payload structure before sending
 * @param {Object} payload - Payload to validate
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validatePayload(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload is not an object'], warnings: [] };
  }

  // Check required fields
  for (const field of REQUIRED_PAYLOAD_FIELDS) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    } else if (field === 'message' && (!payload[field] || typeof payload[field] !== 'string' || !payload[field].trim())) {
      errors.push(`Field 'message' is empty or invalid`);
    } else if (field === 'source' && !['voice', 'text'].includes(payload[field])) {
      errors.push(`Field 'source' must be 'voice' or 'text', got: ${payload[field]}`);
    }
  }

  // Validate session_id and sessionId match
  if (payload.session_id && payload.sessionId && payload.session_id !== payload.sessionId) {
    warnings.push(`session_id and sessionId do not match: ${payload.session_id} vs ${payload.sessionId}`);
  }

  // Validate message_id and messageId match
  if (payload.message_id && payload.messageId && payload.message_id !== payload.messageId) {
    warnings.push(`message_id and messageId do not match: ${payload.message_id} vs ${payload.messageId}`);
  }

  // Validate timestamp format (ISO 8601)
  if (payload.timestamp && typeof payload.timestamp === 'string') {
    const date = new Date(payload.timestamp);
    if (isNaN(date.getTime())) {
      warnings.push(`Invalid timestamp format: ${payload.timestamp}`);
    }
  }

  // Validate attachments structure
  if (payload.attachments && Array.isArray(payload.attachments)) {
    payload.attachments.forEach((att, idx) => {
      if (!att || typeof att !== 'object') {
        warnings.push(`Attachment at index ${idx} is not an object`);
      } else {
        if (!att.name || typeof att.name !== 'string') {
          warnings.push(`Attachment at index ${idx} missing or invalid 'name' field`);
        }
        if (att.data && typeof att.data !== 'string') {
          warnings.push(`Attachment at index ${idx} has invalid 'data' field (should be base64 string)`);
        }
      }
    });
  }

  // Validate wakeWordTriggered if present (should be boolean)
  if ('wakeWordTriggered' in payload && typeof payload.wakeWordTriggered !== 'boolean') {
    warnings.push(`Field 'wakeWordTriggered' should be a boolean, got: ${typeof payload.wakeWordTriggered}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate response structure from n8n
 * @param {Object} response - Response to validate
 * @returns {{ valid: boolean, hasReply: boolean, replyKey: string|null, errors: string[], warnings: string[] }}
 */
export function validateResponse(response) {
  const errors = [];
  const warnings = [];

  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      hasReply: false,
      replyKey: null,
      errors: ['Response is not an object'],
      warnings: [],
    };
  }

  // Check if response is empty
  if (Object.keys(response).length === 0) {
    errors.push('Response is empty (no keys found)');
    return {
      valid: false,
      hasReply: false,
      replyKey: null,
      errors,
      warnings,
    };
  }

  // Check for expected reply keys
  let replyKey = null;
  let hasReply = false;

  for (const key of EXPECTED_RESPONSE_KEYS) {
    if (key in response) {
      const value = response[key];
      if (typeof value === 'string' && value.trim()) {
        replyKey = key;
        hasReply = true;
        break;
      } else if (typeof value === 'string' && !value.trim()) {
        warnings.push(`Response has '${key}' field but it's empty`);
      }
    }
  }

  // Check for array responses (n8n item format)
  if (!hasReply && Array.isArray(response) && response.length > 0) {
    warnings.push('Response is an array - checking first item for reply');
    const firstItem = response[0];
    if (firstItem && typeof firstItem === 'object') {
      for (const key of EXPECTED_RESPONSE_KEYS) {
        if (key in firstItem) {
          const value = firstItem[key];
          if (typeof value === 'string' && value.trim()) {
            replyKey = `[0].${key}`;
            hasReply = true;
            break;
          }
        }
        // Check nested json property (n8n item format)
        if (firstItem.json && typeof firstItem.json === 'object' && key in firstItem.json) {
          const value = firstItem.json[key];
          if (typeof value === 'string' && value.trim()) {
            replyKey = `[0].json.${key}`;
            hasReply = true;
            break;
          }
        }
      }
    }
  }

  if (!hasReply) {
    const availableKeys = Object.keys(response);
    errors.push(`No reply found in response. Available keys: ${availableKeys.join(', ')}. Expected one of: ${EXPECTED_RESPONSE_KEYS.join(', ')}`);
  }

  return {
    valid: hasReply,
    hasReply,
    replyKey,
    errors,
    warnings,
  };
}

/**
 * Payload monitoring - tracks all payload sends and receives
 */
class PayloadMonitor {
  constructor() {
    this.sends = [];
    this.receives = [];
    this.maxHistory = 100;
  }

  /**
   * Record a payload send
   * @param {Object} payload - Payload that was sent
   * @param {string} url - Webhook URL
   * @param {number} timestamp - Timestamp when sent
   */
  recordSend(payload, url, timestamp = Date.now()) {
    const record = {
      timestamp,
      url,
      payload: { ...payload },
      payloadSize: JSON.stringify(payload).length,
      source: payload.source || 'unknown',
      messageLength: payload.message?.length || 0,
      hasAttachments: Array.isArray(payload.attachments) && payload.attachments.length > 0,
      validation: validatePayload(payload),
    };
    this.sends.push(record);
    if (this.sends.length > this.maxHistory) {
      this.sends.shift();
    }
    return record;
  }

  /**
   * Record a response receive
   * @param {Object} response - Response received
   * @param {number} status - HTTP status code
   * @param {string} url - Webhook URL
   * @param {number} timestamp - Timestamp when received
   */
  recordReceive(response, status, url, timestamp = Date.now()) {
    const record = {
      timestamp,
      url,
      status,
      response: { ...response },
      responseSize: JSON.stringify(response).length,
      validation: validateResponse(response),
    };
    this.receives.push(record);
    if (this.receives.length > this.maxHistory) {
      this.receives.shift();
    }
    return record;
  }

  /**
   * Get statistics about payload flow
   * @returns {Object} Statistics
   */
  getStats() {
    const recentSends = this.sends.slice(-10);
    const recentReceives = this.receives.slice(-10);

    const sendStats = {
      total: this.sends.length,
      recent: recentSends.length,
      valid: recentSends.filter(r => r.validation.valid).length,
      invalid: recentSends.filter(r => !r.validation.valid).length,
      withAttachments: recentSends.filter(r => r.hasAttachments).length,
      voice: recentSends.filter(r => r.payload.source === 'voice').length,
      text: recentSends.filter(r => r.payload.source === 'text').length,
    };

    const receiveStats = {
      total: this.receives.length,
      recent: recentReceives.length,
      withReply: recentReceives.filter(r => r.validation.hasReply).length,
      withoutReply: recentReceives.filter(r => !r.validation.hasReply).length,
      success: recentReceives.filter(r => r.status >= 200 && r.status < 300).length,
      errors: recentReceives.filter(r => r.status >= 400).length,
    };

    return {
      sends: sendStats,
      receives: receiveStats,
      health: {
        sendHealth: sendStats.recent > 0 ? (sendStats.valid / sendStats.recent) * 100 : 0,
        receiveHealth: receiveStats.recent > 0 ? (receiveStats.withReply / receiveStats.recent) * 100 : 0,
        overallHealth: receiveStats.recent > 0 && sendStats.recent > 0
          ? ((sendStats.valid / sendStats.recent) + (receiveStats.withReply / receiveStats.recent)) / 2 * 100
          : 0,
      },
    };
  }

  /**
   * Get recent history
   * @param {number} count - Number of recent records to return
   * @returns {Object} Recent sends and receives
   */
  getRecentHistory(count = 10) {
    return {
      sends: this.sends.slice(-count),
      receives: this.receives.slice(-count),
    };
  }

  /**
   * Clear history
   */
  clear() {
    this.sends = [];
    this.receives = [];
  }
}

// Global monitor instance
export const payloadMonitor = new PayloadMonitor();

/**
 * Comprehensive payload flow verification
 * Checks if payloads are being sent and received correctly
 * @returns {Object} Verification results
 */
export function verifyPayloadFlow() {
  const stats = payloadMonitor.getStats();
  const recent = payloadMonitor.getRecentHistory(5);

  const issues = [];

  // Check if we're sending payloads
  if (stats.sends.recent === 0) {
    issues.push({
      severity: 'error',
      message: 'No payloads have been sent recently. Check if UI buttons are working.',
    });
  } else if (stats.sends.invalid > 0) {
    issues.push({
      severity: 'warning',
      message: `${stats.sends.invalid} of ${stats.sends.recent} recent payloads had validation errors.`,
    });
  }

  // Check if we're receiving responses
  if (stats.receives.recent === 0) {
    issues.push({
      severity: 'error',
      message: 'No responses have been received recently. Check network connection and n8n webhook.',
    });
  } else if (stats.receives.withoutReply > 0) {
    issues.push({
      severity: 'warning',
      message: `${stats.receives.withoutReply} of ${stats.receives.recent} recent responses had no reply field.`,
    });
  }

  // Check response success rate
  if (stats.receives.recent > 0 && stats.receives.errors > 0) {
    issues.push({
      severity: 'error',
      message: `${stats.receives.errors} of ${stats.receives.recent} recent responses had HTTP errors.`,
    });
  }

  // Check payload/response matching
  if (stats.sends.recent > stats.receives.recent + 1) {
    issues.push({
      severity: 'warning',
      message: `More payloads sent (${stats.sends.recent}) than responses received (${stats.receives.recent}). Some requests may be pending or failed.`,
    });
  }

  return {
    healthy: issues.filter(i => i.severity === 'error').length === 0,
    stats,
    issues,
    recent,
    timestamp: new Date().toISOString(),
  };
}
