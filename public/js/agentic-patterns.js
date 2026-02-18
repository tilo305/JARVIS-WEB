/**
 * Agentic Design Patterns — JARVIS-WEB
 * Implements patterns from "Agentic Design Patterns: A Hands-On Guide to Building Intelligent Systems"
 * See docs/AGENTIC-PATTERNS.md
 */

/** Max turns to keep in memory (Chapter 8: Memory) */
const MEMORY_MAX_TURNS = 20;

/** Max turns to send to n8n per request */
const MEMORY_SEND_TURNS = 10;

/** Max user input length (Chapter 18: Guardrails) */
const MAX_INPUT_LENGTH = 8000;

/** Prompt injection patterns to block (basic heuristics) */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /disregard\s+(your|the)\s+instructions/i,
  /system\s*:\s*/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
];

/**
 * ConversationHistory — Memory (Chapter 8)
 * Stores last N user/assistant turns; sends last M to n8n for context.
 */
export class ConversationHistory {
  constructor(maxTurns = MEMORY_MAX_TURNS) {
    this.maxTurns = maxTurns;
    this.turns = [];
  }

  /** Add a turn { role, content } */
  push(turn) {
    if (turn && typeof turn === 'object' && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string') {
      this.turns.push({ role: turn.role, content: turn.content });
      if (this.turns.length > this.maxTurns) {
        this.turns = this.turns.slice(-this.maxTurns);
      }
    }
  }

  /** Get last N turns for n8n payload */
  getRecent(n = MEMORY_SEND_TURNS) {
    const len = Math.min(n, this.turns.length);
    return this.turns.slice(-len);
  }

  /** Get all turns (for debug) */
  getAll() {
    return [...this.turns];
  }

  /** Clear history */
  clear() {
    this.turns = [];
  }
}

/**
 * classifyIntent — Routing (Chapter 2)
 * Rule-based intent classification for n8n workflow routing.
 * @param {string} text - User message
 * @returns {string} - greeting | goodbye | help | calendar | email | search | general
 */
export function classifyIntent(text) {
  if (typeof text !== 'string') return 'general';
  const t = text.trim().toLowerCase();
  if (!t) return 'general';

  const greetings = ['hello', 'hi', 'hey', 'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'yo'];
  if (greetings.some((g) => t === g || t.startsWith(g + ' ') || t.startsWith(g + ','))) return 'greeting';

  const goodbyes = ['goodbye', 'bye', 'see you', 'later', 'cheers', 'take care'];
  if (goodbyes.some((g) => t === g || t.startsWith(g + ' ') || t.endsWith(' ' + g))) return 'goodbye';

  if (/\b(help|what can you do|how does this work)\b/i.test(t)) return 'help';
  if (/\b(calendar|schedule|meeting|appointment|today|tomorrow)\b/i.test(t)) return 'calendar';
  if (/\b(email|send (an? )?email|inbox|mail)\b/i.test(t)) return 'email';
  if (/\b(search|find|look up|google|web search)\b/i.test(t)) return 'search';

  return 'general';
}

/**
 * getContextEnrichment — Context Engineering (Chapter 1)
 * Enriches payload with device and environment context.
 */
export function getContextEnrichment() {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth ?? 0 : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight ?? 0 : 0;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const userAgentHint = userAgent.length > 200 ? userAgent.slice(0, 200) + '…' : userAgent;
  const preferVoice = typeof window !== 'undefined' && window.JARVIS_CONFIG?.voiceId;

  return {
    viewportWidth,
    viewportHeight,
    preferVoice: !!preferVoice,
    userAgentHint,
  };
}

/**
 * validateInput — Guardrails (Chapter 18)
 * Validates and sanitizes user input before sending to backend.
 * @param {string} text - Raw user input
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateInput(text) {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: 'Input cannot be empty' };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: `Input exceeds maximum length (${MAX_INPUT_LENGTH} characters)` };
  }
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Input contains disallowed content' };
    }
  }
  return { valid: true };
}

/**
 * sanitizeOutput — Guardrails (Chapter 18)
 * Sanitizes assistant output for safe display (XSS prevention).
 * Delegates to security.sanitizeHtml when available; otherwise basic escaping.
 * @param {string} text - Raw assistant reply
 * @returns {string} - Safe string for DOM display
 */
export function sanitizeOutput(text) {
  if (typeof text !== 'string' && text != null) text = String(text);
  if (!text) return '';
  // Basic HTML escaping if no security module
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return text.replace(/[&<>"'/]/g, (c) => map[c] || c);
}

/**
 * runWithRetry — Exception Handling (Chapter 12)
 * Wraps async fn with retry logic (exponential backoff) for transient failures.
 * @param {() => Promise<T>} fn - Async function to run
 * @param {{ maxAttempts?: number, baseDelayMs?: number, retryable?: (err: Error) => boolean }} [options]
 * @returns {Promise<T>}
 */
export async function runWithRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const isRetryable = options.retryable ?? defaultRetryable;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !isRetryable(err)) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function defaultRetryable(err) {
  const msg = err?.message || '';
  return (
    err?.name === 'AbortError' ||
    /timeout|timed out/i.test(msg) ||
    /failed to fetch|network error|networkerror/i.test(msg) ||
    /ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(msg)
  );
}

/**
 * runParallel — Parallelization (Chapter 3)
 * Runs async operations in parallel.
 * @param {Array<() => Promise<T>>} fns - Array of async functions
 * @returns {Promise<T[]>}
 */
export async function runParallel(fns) {
  return Promise.all(fns.map((fn) => fn()));
}
