#!/usr/bin/env node
/**
 * JARVIS Error Log Checker
 *
 * Parses JARVIS Error & Warning Log output (from Copy Logs or saved file),
 * extracts errors, and suggests fixes for common patterns.
 *
 * Usage:
 *   node debug/tools/check-error-logs.js [file]
 *   node debug/tools/check-error-logs.js < path/to/logs.txt
 *   # Or paste logs and pipe: echo "paste logs" | node debug/tools/check-error-logs.js
 *
 * Exit codes: 0 = no serious errors, 1 = errors found
 */

import { readFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';

function log(msg, type = 'info') {
  const prefixes = { info: '•', success: '✓', warning: '⚠', error: '✗' };
  console.log(`${prefixes[type] || '•'} ${msg}`);
}

/** Parse JARVIS log format into structured entries */
function parseLog(text) {
  const entries = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  let body = [];

  for (const line of lines) {
    const header = line.match(/^\[(\d{1,2}:\d{2}:\d{2}\.\d{3})\]\s+(.+)$/);
    if (header) {
      if (current) {
        current.body = body.join('\n').trim();
        entries.push(current);
      }
      const [, ts, level] = header;
      current = { timestamp: ts, level: level.trim(), body: '' };
      body = [];
    } else if (current && !line.match(/^-+$/) && !line.startsWith('==========')) {
      body.push(line);
    }
  }
  if (current) {
    current.body = body.join('\n').trim();
    entries.push(current);
  }
  return entries;
}

/** Map common error patterns to suggested fixes */
function suggestFix(entry) {
  const level = entry.level.toUpperCase();
  const body = (entry.body || '').toLowerCase();
  const suggestions = [];

  if (level === 'UNCAUGHT EXCEPTION') {
    if (body.includes('(no message)') || body.includes('no message')) {
      suggestions.push('Error has no message — often script load failure, CORS, or cross-origin.');
      suggestions.push('Fix: Open DevTools (F12) before load to see full error in Console.');
      suggestions.push('Check: Network tab for failed requests (VAD, app.js, CDN scripts).');
    }
    if (body.includes('missing required dom') || body.includes('chatcontainer') || body.includes('status')) {
      suggestions.push('DOM elements missing — app.js loaded before HTML ready or wrong page.');
      suggestions.push('Fix: Ensure app.js loads after DOM (script at end of body).');
    }
    if (body.includes('cartesia') || body.includes('websocket')) {
      suggestions.push('Cartesia/WebSocket error — check API key, network, CORS.');
      suggestions.push('Fix: Verify VITE_CARTESIA_API_KEY and Cartesia service status.');
    }
    if (body.includes('vad') || body.includes('onnx') || body.includes('wasm')) {
      suggestions.push('VAD/WASM load failure — CDN or network issue.');
      suggestions.push('Fix: Check connectivity to cdn.jsdelivr.net, try different network.');
    }
    if (body.includes('resizeobserver')) {
      suggestions.push('ResizeObserver — often benign; can wrap in try/catch if noisy.');
    }
  }

  if (level === 'UNHANDLED PROMISE REJECTION') {
    if (body.includes('network') || body.includes('failed') || body.includes('fetch')) {
      suggestions.push('Network/promise rejection — check API URL, CORS, n8n webhook.');
    }
    if (body.includes('n8n') || body.includes('webhook')) {
      suggestions.push('n8n webhook error — verify URL, workflow is running, CORS.');
    }
  }

  if (level === 'ERROR' || level === 'ASSERT FAILED') {
    if (body.includes('getusermedia') || body.includes('microphone')) {
      suggestions.push('Microphone access — ensure HTTPS or localhost, user granted permission.');
    }
  }

  return suggestions.length ? suggestions : ['Review the full error message and stack trace.'];
}

function main() {
  const args = process.argv.slice(2);
  let input = '';

  const readStdin = () =>
    new Promise((resolve) => {
      const rl = createInterface({ input: process.stdin });
      const chunks = [];
      rl.on('line', (line) => chunks.push(line));
      rl.on('close', () => resolve(chunks.join('\n')));
    });

  (async () => {
    if (args.length && args[0] !== '-') {
      const file = join(process.cwd(), args[0]);
      if (!existsSync(file)) {
        log(`File not found: ${file}`, 'error');
        process.exit(2);
      }
      input = readFileSync(file, 'utf8');
    } else {
      input = await readStdin();
    }

    if (!input.trim()) {
      log('No input. Provide a file path or pipe logs.', 'warning');
      log('  node debug/tools/check-error-logs.js path/to/logs.txt');
      log('  node debug/tools/check-error-logs.js < logs.txt');
      process.exit(2);
    }

    const entries = parseLog(input);
    const serious = entries.filter(
      (e) =>
        /UNCAUGHT EXCEPTION|UNHANDLED PROMISE REJECTION|ERROR|ASSERT FAILED/i.test(e.level)
    );
    const warnings = entries.filter((e) => /^WARN$/i.test(e.level));

    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('  JARVIS Error Log Checker');
    console.log('══════════════════════════════════════════════════════════════════════\n');

    log(`Total entries: ${entries.length}`, 'info');
    log(`Errors/exceptions: ${serious.length}`, serious.length ? 'error' : 'success');
    log(`Warnings: ${warnings.length}`, warnings.length ? 'warning' : 'info');

    if (serious.length === 0 && warnings.length === 0) {
      log('\nNo errors or warnings found.', 'success');
      process.exit(0);
    }

    let exitCode = 0;
    serious.forEach((e, i) => {
      console.log('\n------------------------------------------------------------');
      log(`[${i + 1}] ${e.level} @ ${e.timestamp}`, 'error');
      console.log(e.body ? e.body.slice(0, 500) + (e.body.length > 500 ? '...' : '') : '(no body)');
      const fixes = suggestFix(e);
      if (fixes.length) {
        log('\nSuggested fixes:', 'info');
        fixes.forEach((f) => log(`  ${f}`, 'info'));
      }
      exitCode = 1;
    });

    if (warnings.length > 0 && serious.length === 0) {
      log('\nWarnings (non-fatal):', 'warning');
      warnings.slice(0, 5).forEach((w) => {
        console.log(`  [${w.timestamp}] ${w.body?.slice(0, 120) || ''}${(w.body?.length || 0) > 120 ? '...' : ''}`);
      });
      if (warnings.length > 5) log(`  ... and ${warnings.length - 5} more`, 'info');
    }

    console.log('\n══════════════════════════════════════════════════════════════════════\n');
    process.exit(exitCode);
  })().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}

main();
