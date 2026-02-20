/**
 * JARVIS Error Log Capture — must load FIRST (in <head>) so it runs before any other script.
 * Patches console.error/warn and listens for uncaught errors and unhandled rejections.
 * Uses window.__JARVIS_CAPTURED_LOGS; UI (copy button, viewer) is wired in index.html.
 */
/* eslint-disable no-console -- intentional: this file patches console methods */
(function () {
  'use strict';
  const maxEntries = 2000;
  window.__JARVIS_CAPTURED_LOGS = window.__JARVIS_CAPTURED_LOGS || [];
  const capturedLogs = window.__JARVIS_CAPTURED_LOGS;
  const capturedEntrySet = new Set();

  function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  function stringifyArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'object') {
      try {
        if (arg instanceof Error) {
          let s = `Error: ${arg.name || 'Error'}\nMessage: ${arg.message || '(no message)'}`;
          if (arg.stack) s += `\nStack:\n${arg.stack}`;
          if (arg.cause) s += `\nCause: ${stringifyArg(arg.cause)}`;
          return s;
        }
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  function formatLogEntry(level, args) {
    const ts = formatTimestamp();
    const msg = args.length === 0 ? '(no message)' : Array.from(args).map(stringifyArg).join('\n');
    return `[${ts}] ${level}\n${msg}`;
  }

  function captureLogEntry(entry) {
    const contentHash = entry.substring(0, 300);
    const timeWindow = Math.floor(Date.now() / 200); // 200ms dedup window
    const entryHash = contentHash + '|' + timeWindow;
    if (capturedEntrySet.has(entryHash)) return;
    capturedEntrySet.add(entryHash);
    capturedLogs.push(entry);
    if (capturedLogs.length > maxEntries) {
      capturedLogs.splice(0, capturedLogs.length - maxEntries);
    }
    if (capturedEntrySet.size > 2000) {
      const entries = Array.from(capturedEntrySet);
      entries.slice(0, entries.length - 1000).forEach(function (h) { capturedEntrySet.delete(h); });
    }
    const countEl = document.getElementById('logCount');
    if (countEl) {
      countEl.textContent = capturedLogs.length > 99 ? '99+' : String(capturedLogs.length);
      countEl.style.display = 'block';
    }
  }

  var originalError = console.error;
  var originalWarn = console.warn;

  console.error = function () {
    originalError.apply(console, arguments);
    captureLogEntry(formatLogEntry('ERROR', arguments));
  };

  console.warn = function () {
    originalWarn.apply(console, arguments);
    captureLogEntry(formatLogEntry('WARN', arguments));
  };

  window.addEventListener('unhandledrejection', function (event) {
    var ts = formatTimestamp();
    var info = '[' + ts + '] UNHANDLED PROMISE REJECTION\n';
    if (event.reason instanceof Error) {
      info += 'Error: ' + (event.reason.name || 'Error') + '\nMessage: ' + (event.reason.message || '(no message)') + '\n';
      if (event.reason.stack) info += 'Stack:\n' + event.reason.stack;
    } else if (event.reason && typeof event.reason === 'object') {
      info += 'Reason: ' + JSON.stringify(event.reason, null, 2);
    } else {
      info += 'Reason: ' + String(event.reason);
    }
    captureLogEntry(info);
    originalError('[JARVIS] Unhandled Promise Rejection:', event.reason);
  }, true);

  window.addEventListener('error', function (event) {
    var ts = formatTimestamp();
    var msg = event.message || '(no message)';
    var src = (event.filename || 'unknown') + ':' + (event.lineno != null ? event.lineno : '?') + ':' + (event.colno != null ? event.colno : '?');
    // When message/source are empty (common with bundled/module scripts in Electron), use event.error
    if (event.error) {
      if (event.error instanceof Error) {
        if (!msg || msg === '(no message)') msg = event.error.message || event.error.name || String(event.error);
        if (event.error.stack) src = event.error.stack.split('\n').slice(0, 3).join('\n');
      } else {
        if (!msg || msg === '(no message)') msg = String(event.error);
      }
    }
    var info = '[' + ts + '] UNCAUGHT EXCEPTION\nMessage: ' + msg + '\nSource: ' + src + '\n';
    if (event.error) {
      if (event.error instanceof Error) {
        if (event.error.stack) info += 'Stack:\n' + event.error.stack;
        if (event.error.cause) info += 'Cause: ' + stringifyArg(event.error.cause) + '\n';
      } else {
        info += 'Thrown: ' + stringifyArg(event.error);
      }
    } else if (msg === '(no message)' && src.indexOf('unknown') !== -1) {
      info += 'Hint: Open DevTools (View → Toggle Developer Tools or F12) before loading to see the full error in the Console.\n';
    }
    captureLogEntry(info);
  }, true);

  // Expose for UI (index.html uses these)
  window.__JARVIS_LOG_CAPTURE_INSTALLED = true;
  window.__JARVIS_CAPTURE_FORMAT_TS = formatTimestamp;
  window.__JARVIS_CAPTURE_STRINGIFY = stringifyArg;
  window.__JARVIS_CAPTURE_FORMAT_ENTRY = formatLogEntry;
  window.__JARVIS_CAPTURE_ENTRY = captureLogEntry;
  window.__JARVIS_CAPTURE_ORIGINAL_ERROR = originalError;
  window.__JARVIS_CAPTURE_ORIGINAL_WARN = originalWarn;
  window.__JARVIS_CAPTURE_ENTRY_SET = capturedEntrySet;
})();
