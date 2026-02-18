/**
 * In-memory server-side rate limiter.
 * Based on OWASP: "Implement Security Logging and Monitoring" and token bucket.
 *
 * Uses sliding window per key. Keys are typically IP or session ID.
 */

/**
 * @param {Object} opts
 * @param {number} [opts.windowMs=60000]
 * @param {number} [opts.maxRequests=100]
 */
export function createRateLimiter(opts = {}) {
  const { windowMs = 60_000, maxRequests = 100 } = opts;
  const /** @type {Map<string, number[]>} */ store = new Map();

  /** Prune old entries to avoid unbounded growth */
  function prune(key) {
    const now = Date.now();
    const timestamps = store.get(key) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) store.delete(key);
    else store.set(key, valid);
    return valid;
  }

  /**
   * Check if request is allowed. Returns true if allowed, false if rate limited.
   * @param {string} key - Identifier (e.g. IP, session ID)
   * @returns {{ allowed: boolean; remaining: number }}
   */
  function check(key) {
    const now = Date.now();
    const timestamps = prune(key);
    if (timestamps.length >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    timestamps.push(now);
    store.set(key, timestamps);
    return { allowed: true, remaining: maxRequests - timestamps.length };
  }

  return { check, prune };
}
