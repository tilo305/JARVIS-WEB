/**
 * Agentic Design Patterns — JARVIS-WEB
 * Implements patterns from "Agentic Design Patterns: A Hands-On Guide to Building Intelligent Systems"
 * See docs/AGENTIC-PATTERNS.md
 */

/** Max turns to keep in memory (Chapter 8: Memory) */
const MEMORY_MAX_TURNS = 20;

/** Max turns to send to n8n per request */
const MEMORY_SEND_TURNS = 10;

/** Intent constants for classifyIntent return values */
export const INTENTS = {
  GREETING: 'greeting',
  GOODBYE: 'goodbye',
  HELP: 'help',
  CALENDAR: 'calendar',
  EMAIL: 'email',
  SEARCH: 'search',
  GENERAL: 'general',
};

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

  /** Add a user message */
  addUser(content) {
    if (typeof content === 'string' && content.trim()) {
      this.push({ role: 'user', content: content.trim() });
    }
  }

  /** Add an assistant message */
  addAssistant(content) {
    if (typeof content === 'string') {
      this.push({ role: 'assistant', content: content });
    }
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
  if (/\b(search|find|look up|google|web search|weather)\b/i.test(t)) return 'search';

  return 'general';
}

/**
 * getFallbackSuggestions — Suggestion chips based on intent
 * @param {string} userMessage - Last user message
 * @returns {string[]} - Array of suggestion strings
 */
export function getFallbackSuggestions(userMessage) {
  const intent = classifyIntent(userMessage || '');
  const suggestions = {
    greeting: ['What can you do?', 'Tell me about yourself.', 'How does this work?'],
    goodbye: ['See you later!', 'Thanks for your help.', 'Take care!'],
    help: ['What can you do?', 'How do I use voice?', 'Show me an example.'],
    calendar: ['What is on my calendar today?', 'Schedule a meeting for tomorrow.', 'Show my appointments.'],
    email: ['Check my inbox.', 'Send an email.', 'Read my latest messages.'],
    search: ['Search for something.', 'What is the weather?', 'Look up a topic.'],
    general: ['Try asking a question.', 'I can help with various tasks.', 'What would you like to know?'],
  };
  return suggestions[intent] || suggestions.general;
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
  const sanitized = trimmed.length > MAX_INPUT_LENGTH ? trimmed.slice(0, MAX_INPUT_LENGTH) : trimmed;
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: `Input exceeds maximum length (${MAX_INPUT_LENGTH} characters)`, sanitized };
  }
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Input contains disallowed content' };
    }
  }
  return { valid: true, sanitized };
}

/**
 * sanitizeOutput — Guardrails (Chapter 18)
 * Sanitizes assistant output for safe display (XSS prevention).
 * Delegates to security.sanitizeHtml when available; otherwise basic escaping.
 * @param {string} text - Raw assistant reply
 * @returns {string} - Safe string for DOM display
 */
export function sanitizeOutput(text) {
  if (typeof text !== 'string') return '';
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

// --- Prompt Chaining (Chapter 1) ---

/** Extract structured entities from user message for n8n context (first step in prompt chain) */
const ENTITY_PATTERNS = {
  date: [
    /\b(today|tomorrow|yesterday)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/,
  ],
  time: [
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
    /\b(at\s+)?(noon|midnight)\b/i,
    /\b(morning|afternoon|evening)\b/i,
  ],
  number: [/\b\d+\b/g],
  email: [/\b[\w.-]+@[\w.-]+\.\w{2,}\b/g],
  location: [
    /\b(in|at|to|from)\s+([A-Z][a-zA-Z\s]{2,30})\b/g,
    /\b(new\s+york|los\s+angeles|london|paris|berlin|tokyo)\b/i,
  ],
};

/**
 * extractEntities — Prompt Chaining Step 1 (Chapter 1)
 * Extracts dates, times, numbers, emails from text for downstream processing.
 * @param {string} text - User message
 * @returns {{ dates: string[], times: string[], numbers: string[], emails: string[], keywords: string[] }}
 */
export function extractEntities(text) {
  if (typeof text !== 'string') return { dates: [], times: [], numbers: [], emails: [], keywords: [] };
  const t = text.trim();
  if (!t) return { dates: [], times: [], numbers: [], emails: [], keywords: [] };

  const dates = [];
  for (const p of ENTITY_PATTERNS.date) {
    const m = t.match(p);
    if (m) dates.push(m[0]);
  }

  const times = [];
  for (const p of ENTITY_PATTERNS.time) {
    const m = t.match(p);
    if (m) times.push(m[0]);
  }

  const numbers = [];
  const numMatch = t.match(ENTITY_PATTERNS.number[0]);
  if (numMatch) numbers.push(...numMatch.slice(0, 5));

  const emails = [];
  const emailMatch = t.match(ENTITY_PATTERNS.email[0]);
  if (emailMatch) emails.push(...emailMatch);

  const keywords = ['schedule', 'meeting', 'calendar', 'email', 'search', 'book', 'remind'].filter((k) =>
    new RegExp(`\\b${k}\\b`, 'i').test(t)
  );

  return { dates, times, numbers, emails, keywords };
}

/**
 * runPromptChainPipeline — Prompt Chaining (Chapter 1)
 * Multi-step pipeline: extract entities → build agentic hints.
 * Output is merged into payload options.
 * @param {string} message - User message
 * @returns {{ extractedEntities: Object, agenticHints: Object }}
 */
export function runPromptChainPipeline(message) {
  const entities = extractEntities(message);
  const intent = classifyIntent(message);
  const agenticHints = {};
  if (['calendar', 'search', 'email'].includes(intent)) {
    agenticHints.planMode = true;
  }
  if (entities.dates.length > 0 || entities.times.length > 0) {
    agenticHints.hasDateTimeContext = true;
  }
  return { extractedEntities: entities, agenticHints };
}

// --- Reflection (Chapter 4) ---

/** Patterns that indicate a low-quality or non-answering reply */
const REFLECTION_LOW_QUALITY_PATTERNS = [
  /^noted[,.]?\s*(sir)?\.?\s*$/i,
  /^understood[,.]?\s*(sir)?\.?\s*$/i,
  /^okay[,.]?\s*(sir)?\.?\s*$/i,
  /^sure[,.]?\s*(sir)?\.?\s*$/i,
  /^alright[,.]?\s*(sir)?\.?\s*$/i,
  /^got\s+it[,.]?\s*(sir)?\.?\s*$/i,
  /^right[,.]?\s*(sir)?\.?\s*$/i,
  /^of\s+course[,.]?\s*(sir)?\.?\s*$/i,
  /^i\s+don'?t\s+have\s+(access|the ability)/i,
  /^i\s+can'?t\s+(access|retrieve|find)/i,
  /^as\s+(an\s+)?ai\s+(i\s+)?(can'?t|don'?t)/i,
];

/**
 * validateAndRefineReply — Reflection (Chapter 4)
 * Self-correction: validates assistant reply, applies fallback if quality is poor.
 * @param {string} userMessage - Original user message
 * @param {string} reply - Raw reply from n8n/LLM
 * @param {(msg: string) => string|null} [getFallback] - Optional fallback generator (e.g. getNaturalFallback)
 * @returns {{ refined: string, wasRefined: boolean, reason?: string }}
 */
export function validateAndRefineReply(userMessage, reply, getFallback = null) {
  const u = (userMessage || '').trim();
  const r = (reply || '').trim();
  if (!r) {
    const fb = getFallback ? getFallback(u) : null;
    return { refined: fb || "I didn't receive a response. Please try again.", wasRefined: true, reason: 'empty' };
  }
  if (r.length < 3) {
    return { refined: "I'm not sure I understood. Could you rephrase?", wasRefined: true, reason: 'too_short' };
  }
  const isLowQuality = REFLECTION_LOW_QUALITY_PATTERNS.some((p) => p.test(r));
  if (isLowQuality && getFallback) {
    const fb = getFallback(u);
    if (fb) {
      return { refined: fb, wasRefined: true, reason: 'low_quality' };
    }
  }
  return { refined: r, wasRefined: false };
}
