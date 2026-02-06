/**
 * Wake Word Console Logger
 *
 * Ensures all wake word errors and warnings are visible in the browser console
 * with a consistent tag so you can filter by "JARVIS Wake Word Error" or
 * "JARVIS Wake Word" to see only wake-word-related messages.
 *
 * Usage: Filter DevTools Console by: JARVIS Wake Word Error
 */

const PREFIX_ERROR = '[JARVIS Wake Word Error]';
const PREFIX_WARN = '[JARVIS Wake Word]';
const MAX_RECENT = 20;
/** Dedupe window: same message logged again within this ms is not printed to console (UI still updated). */
const DEDUPE_WINDOW_MS = 3000;

const recentErrors = [];
/** @type {{ message: string, time: number } | null} */
let lastErrorLog = null;
/** @type {{ message: string, time: number } | null} */
let lastWarnLog = null;

function safeConsole() {
  return typeof console !== 'undefined' ? console : { error: () => {}, warn: () => {}, log: () => {} };
}

/**
 * Log a wake word error to the console (always, not gated by debug).
 * Identical messages within DEDUPE_WINDOW_MS are not printed again (reduces spam); UI still gets the update.
 * @param {string} message - User-facing error message
 * @param {object|Error|string} [detail] - Optional detail (object, Error, or string)
 */
export function logWakeWordError(message, detail) {
  const c = safeConsole();
  const msg = typeof message === 'string' ? message : String(message);
  const now = Date.now();
  const isDuplicate = lastErrorLog && lastErrorLog.message === msg && (now - lastErrorLog.time) < DEDUPE_WINDOW_MS;
  if (c.error && !isDuplicate) {
    if (detail !== undefined && detail !== null) {
      c.error(PREFIX_ERROR, msg, detail);
    } else {
      c.error(PREFIX_ERROR, msg);
    }
    lastErrorLog = { message: msg, time: now };
  }
  recentErrors.push({
    type: 'error',
    message: msg,
    detail: detail instanceof Error ? detail.message : detail,
    time: new Date().toISOString(),
  });
  if (recentErrors.length > MAX_RECENT) {
    recentErrors.shift();
  }
  notifyListeners();
}

/**
 * Log a wake word warning to the console (always).
 * Identical messages within DEDUPE_WINDOW_MS are not printed again; UI still gets the update.
 * @param {string} message - Warning message
 * @param {object|string} [detail] - Optional detail
 */
export function logWakeWordWarn(message, detail) {
  const c = safeConsole();
  const msg = typeof message === 'string' ? message : String(message);
  const now = Date.now();
  const isDuplicate = lastWarnLog && lastWarnLog.message === msg && (now - lastWarnLog.time) < DEDUPE_WINDOW_MS;
  if (c.warn && !isDuplicate) {
    if (detail !== undefined && detail !== null) {
      c.warn(PREFIX_WARN, msg, detail);
    } else {
      c.warn(PREFIX_WARN, msg);
    }
    lastWarnLog = { message: msg, time: now };
  }
  recentErrors.push({
    type: 'warn',
    message: msg,
    detail: detail,
    time: new Date().toISOString(),
  });
  if (recentErrors.length > MAX_RECENT) {
    recentErrors.shift();
  }
  notifyListeners();
}

const listeners = new Set();

/**
 * Subscribe to new wake word errors (e.g. to update UI).
 * @param {() => void} callback - Called when a new error/warn is logged
 * @returns {() => void} Unsubscribe function
 */
export function onWakeWordError(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
  }
  return () => listeners.delete(callback);
}

function notifyListeners() {
  const last = getLastError();
  listeners.forEach((cb) => {
    try {
      cb(last);
    } catch {
      // ignore listener errors
    }
  });
}

/**
 * Get the most recently logged error/warn entry.
 * @returns {{ type: string, message: string, detail?: any, time: string } | null}
 */
export function getLastError() {
  return recentErrors.length ? recentErrors[recentErrors.length - 1] : null;
}

/**
 * Get recent wake word errors (for UI or copy-paste).
 * @returns {Array<{ type: string, message: string, detail?: any, time: string }>}
 */
export function getRecentErrors() {
  return [...recentErrors];
}

/**
 * Clear recent errors (e.g. after user dismisses or retries).
 */
export function clearRecentErrors() {
  recentErrors.length = 0;
  notifyListeners();
}
