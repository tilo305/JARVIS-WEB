/**
 * Security event logger for JARVIS-WEB.
 * Logs auth failures, rate limit hits, and other security events.
 * Based on OWASP: "Implement Security Logging and Monitoring".
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * @param {Object} opts
 * @param {boolean} [opts.enabled=true]
 * @param {string} [opts.level='warn']
 */
export function createSecurityLogger(opts = {}) {
  const { enabled = true, level = 'warn' } = opts;
  const minLevel = LEVELS[level] ?? LEVELS.warn;

  function shouldLog(evtLevel) {
    return enabled && (LEVELS[evtLevel] ?? LEVELS.info) >= minLevel;
  }

  function format(evt) {
    const ts = new Date().toISOString();
    return `[SEC] ${ts} ${evt.type} ${JSON.stringify(evt)}`;
  }

  return {
    authFailure(/** @type {string} */ reason, /** @type {Record<string, unknown>} */ meta = {}) {
      if (!shouldLog('warn')) return;
      console.warn(format({ type: 'auth_failure', reason, ...meta }));
    },

    rateLimit(/** @type {string} */ key, /** @type {Record<string, unknown>} */ meta = {}) {
      if (!shouldLog('warn')) return;
      console.warn(format({ type: 'rate_limit', key, ...meta }));
    },

    wsAuthReject(/** @type {string} */ reason) {
      if (!shouldLog('warn')) return;
      console.warn(format({ type: 'ws_auth_reject', reason }));
    },

    proxyReject(/** @type {string} */ reason, /** @type {Record<string, unknown>} */ meta = {}) {
      if (!shouldLog('warn')) return;
      console.warn(format({ type: 'proxy_reject', reason, ...meta }));
    },

    error(/** @type {string} */ message, /** @type {Record<string, unknown>} */ meta = {}) {
      if (!shouldLog('error')) return;
      console.error(format({ type: 'error', message, ...meta }));
    },

    info(/** @type {string} */ message, /** @type {Record<string, unknown>} */ meta = {}) {
      if (!shouldLog('info')) return;
      console.log(format({ type: 'info', message, ...meta }));
    },
  };
}
