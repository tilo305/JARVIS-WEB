/**
 * Agentic Design Patterns — Client-side implementations for JARVIS-WEB
 *
 * Implements patterns from "Agentic Design Patterns: A Hands-On Guide" adapted for
 * a browser + n8n webhook architecture. The LLM orchestration happens in n8n;
 * this module provides client-side support for Memory, Routing, Guardrails,
 * Exception Handling, Context Engineering, and Parallelization.
 *
 * @module agentic-patterns
 */

'use strict';

// --- Pattern: Memory (Chapter 8) ---

/** Default max messages to keep in short-term conversation history */
const DEFAULT_HISTORY_LIMIT = 20;

/**
 * In-memory conversation history for short-term context (Memory pattern).
 * Sends recent turns to n8n so the backend LLM can maintain conversational context.
 */
export class ConversationHistory {
  /**
   * @param {number} [maxMessages=20] - Max user+assistant pairs to keep
   */
  constructor(maxMessages = DEFAULT_HISTORY_LIMIT) {
    this.maxMessages = maxMessages;
    /** @type {Array<{role: 'user'|'assistant', content: string}>} */
    this._messages = [];
  }

  /**
   * Add a user message (call before sending to n8n).
   * @param {string} content - User message text
   */
  addUser(content) {
    if (typeof content !== 'string' || !content.trim()) return;
    this._messages.push({ role: 'user', content: content.trim() });
    this._trim();
  }

  /**
   * Add an assistant reply (call after receiving from n8n).
   * @param {string} content - Assistant reply text
   */
  addAssistant(content) {
    if (typeof content !== 'string') return;
    this._messages.push({ role: 'assistant', content: String(content).trim() });
    this._trim();
  }

  _trim() {
    while (this._messages.length > this.maxMessages) {
      this._messages.shift();
    }
  }

  /**
   * Get recent history for payload (excludes current user message).
   * @param {number} [count=10] - Max pairs to include
   * @returns {Array<{role: string, content: string}>}
   */
  getRecent(count = 10) {
    const n = Math.min(count, Math.floor(this._messages.length / 2));
    const start = this._messages.length - n * 2;
    return start >= 0 ? this._messages.slice(start) : [];
  }

  /**
   * Clear history (e.g. on "new conversation").
   */
  clear() {
    this._messages = [];
  }
}

// --- Pattern: Routing (Chapter 2) ---

/** Intent categories for simple rule-based routing */
export const INTENTS = {
  GREETING: 'greeting',
  GOODBYE: 'goodbye',
  HELP: 'help',
  CALENDAR: 'calendar',
  EMAIL: 'email',
  SEARCH: 'search',
  GENERAL: 'general',
};

/**
 * Simple rule-based intent classification (Routing pattern).
 * n8n can use this to route to different sub-workflows or prompt branches.
 *
 * @param {string} text - User message
 * @returns {string} Intent key from INTENTS
 */
export function classifyIntent(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return INTENTS.GENERAL;

  const greeting = /\b(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings)\b/i;
  const goodbye = /\b(bye|goodbye|see\s*(you|ya)|ciao|cheers)\b/i;
  const help = /\b(help|what\s+can\s+you\s+do|how\s+does\s+this\s+work)\b/i;
  const calendar = /\b(calendar|schedule|meeting|event|appointment|what('s|\s+is)\s+on\s+(my\s+)?(today|tomorrow))\b/i;
  const email = /\b(email|mail|inbox|send\s+(a\s+)?mail|read\s+my\s+email)\b/i;
  const search = /\b(search|look\s+up|find|what\s+is|who\s+is|weather|news)\b/i;

  if (greeting.test(t)) return INTENTS.GREETING;
  if (goodbye.test(t)) return INTENTS.GOODBYE;
  if (help.test(t)) return INTENTS.HELP;
  if (calendar.test(t)) return INTENTS.CALENDAR;
  if (email.test(t)) return INTENTS.EMAIL;
  if (search.test(t)) return INTENTS.SEARCH;
  return INTENTS.GENERAL;
}

// --- Pattern: Guardrails / Safety (Chapter 18) ---

/** Max user message length (chars) to prevent abuse */
const MAX_INPUT_LENGTH = 8000;

/** Basic blocklist for obvious injection attempts (non-exhaustive) */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above)\s+instructions/i,
  /you\s+are\s+now\s+in\s+(?:developer|debug)\s+mode/i,
  /system\s*:\s*you\s+are/i,
  /\[INST\]|\[\/INST\]/i,
];

/**
 * Validate and sanitize user input (Guardrails pattern).
 *
 * @param {string} input - Raw user message
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export function validateInput(input) {
  if (typeof input !== 'string') {
    return { valid: false, sanitized: '', error: 'Invalid input type' };
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'Empty message' };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed.slice(0, MAX_INPUT_LENGTH),
      error: `Message too long (max ${MAX_INPUT_LENGTH} chars)`,
    };
  }
  for (const p of INJECTION_PATTERNS) {
    if (p.test(trimmed)) {
      return { valid: false, sanitized: trimmed, error: 'Input contains disallowed content' };
    }
  }
  return { valid: true, sanitized: trimmed };
}

/**
 * Sanitize assistant output for display (Guardrails pattern).
 * Removes potential XSS and normalizes whitespace.
 *
 * @param {string} output - Raw assistant reply
 * @returns {string}
 */
export function sanitizeOutput(output) {
  if (typeof output !== 'string') return '';
  return output
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&/g, '&amp;')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

// --- Pattern: Exception Handling and Recovery (Chapter 12) ---

/** Default retry config */
const DEFAULT_RETRY = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  retryableErrors: ['AbortError', 'Failed to fetch', 'NetworkError', 'timeout', 'ECONNRESET', 'ETIMEDOUT'],
};

/**
 * Run an async function with retries and exponential backoff (Exception Handling pattern).
 *
 * @param {() => Promise<T>} fn - Async function to run
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxAttempts=3]
 * @param {number} [options.baseDelayMs=500]
 * @param {number} [options.maxDelayMs=5000]
 * @param {string[]} [options.retryableErrors]
 * @returns {Promise<T>}
 * @template T
 */
export async function runWithRetry(fn, options = {}) {
  const cfg = { ...DEFAULT_RETRY, ...options };
  let lastErr;
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || String(err)).toLowerCase();
      const isRetryable = cfg.retryableErrors.some((e) => msg.includes(e.toLowerCase()));
      if (attempt >= cfg.maxAttempts || !isRetryable) {
        throw err;
      }
      const delay = Math.min(cfg.baseDelayMs * Math.pow(2, attempt - 1), cfg.maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// --- Pattern: Context Engineering (Ch 1, Preface) ---

/**
 * Enrich payload with additional context (Context Engineering pattern).
 * Adds device/layout hints that n8n can use for personalization.
 *
 * @returns {Object} Extra context fields
 */
export function getContextEnrichment() {
  const ctx = {};
  try {
    if (typeof window !== 'undefined') {
      ctx.viewportWidth = window.innerWidth;
      ctx.viewportHeight = window.innerHeight;
      ctx.preferVoice = typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis !== null;
    }
    if (typeof navigator !== 'undefined') {
      ctx.userAgentHint = navigator.userAgent ? navigator.userAgent.slice(0, 80) : undefined;
    }
  } catch {
    /* ignore */
  }
  return ctx;
}

// --- Pattern: Parallelization (Chapter 3) ---

/**
 * Run multiple async operations in parallel and return all results.
 * Use for e.g. fetching main reply + suggestions at the same time.
 *
 * @param {Array<() => Promise<T>>} fns - Array of async functions
 * @returns {Promise<T[]>}
 * @template T
 */
export async function runParallel(fns) {
  return Promise.all(fns.map((fn) => fn()));
}

/**
 * Generate simple follow-up suggestions in parallel with main reply.
 * Placeholder — n8n could return suggestions; this is a client-side fallback.
 *
 * @param {string} lastUserMessage - Last user message for context
 * @returns {string[]} Array of suggestion strings
 */
export function getFallbackSuggestions(lastUserMessage) {
  const intent = classifyIntent(lastUserMessage || '');
  const suggestions = {
    [INTENTS.GREETING]: ['What can you help me with?', 'Check my calendar', 'What\'s the weather?'],
    [INTENTS.CALENDAR]: ['What\'s on tomorrow?', 'Add a meeting', 'Any conflicts?'],
    [INTENTS.EMAIL]: ['Read my inbox', 'Send an email', 'Search my email'],
    [INTENTS.SEARCH]: ['Search for something else', 'Tell me more', 'Summarize that'],
    [INTENTS.GENERAL]: ['Tell me more', 'Can you clarify?', 'What else can you do?'],
  };
  return suggestions[intent] || suggestions[INTENTS.GENERAL];
}
