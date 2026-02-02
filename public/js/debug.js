/**
 * JARVIS Debug Logger
 * Enable via: window.JARVIS_DEBUG = true or ?debug=1 in URL
 */
/* eslint-disable no-console -- intentional: debug logger outputs to console */
function isDebugEnabled() {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get('debug') === '1' || url.searchParams.get('debug') === 'true') return true;
  return !!(window.JARVIS_DEBUG || window.JARVIS_CONFIG?.debug);
}

const DEBUG = {
  enabled: false,
  prefix: '[JARVIS]',

  init() {
    this.enabled = isDebugEnabled();
    if (this.enabled) {
      this.log('Debug mode enabled');
    }
  },

  log(...args) {
    if (this.enabled && typeof console !== 'undefined' && console.log) {
      console.log(this.prefix, ...args);
    }
  },

  warn(...args) {
    if (this.enabled && typeof console !== 'undefined' && console.warn) {
      console.warn(this.prefix, '[WARN]', ...args);
    }
  },

  error(...args) {
    if (typeof console !== 'undefined' && console.error) {
      console.error(this.prefix, '[ERROR]', ...args);
    }
  },

  trace(label, data) {
    if (this.enabled) {
      this.log(`[TRACE] ${label}`, data !== undefined ? data : '');
    }
  },
};

DEBUG.init();
export { DEBUG };
