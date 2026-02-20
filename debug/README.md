# JARVIS-WEB Debug Suite

Lightweight debugging and validation. Only essential tools are kept; redundant and obsolete ones have been removed.

## Structure

| Path | Purpose |
|------|---------|
| `debug/tools/` | Standalone scripts (console check, copy-log, greeting, timestamp, text-response tests) |
| `debug/tests/` | Jest tests: STT, TTS, bidirectional, integration, audio, greeting, timestamp, etc. |
| `debug/results/` | Optional test run output |

## Running

```bash
# Full debug suite (lint → test → build → vite build)
npm run debug

# All tests (including debug/tests)
npm test

# Integration tests only (Cartesia WebSocket; skips if no API key)
npm run test:integration
```

## Tools

| Tool | Purpose |
|------|---------|
| `run-debug-suite.mjs` | CI-style pipeline: lint, test, build, vite build |
| `check-console-errors.js` | Static check for bad patterns in app and bridge |
| `test-copy-log-reset.js` | Copy-log reset behavior |
| `test-text-response-fix.js` | Text response handling |
| `test-timestamp-live.js` | Timestamp checks |
| `test-greeting-live.html` | Browser greeting/time-of-day test |
| `n8n-webhook-live.mjs` | LIVE n8n webhook test (404 diagnostic). Run: `node debug/tools/n8n-webhook-live.mjs [message]` |

## Browser debug pages (`public/debug/`)

- **debug-audioworklet.html** — AudioWorklet validation
- **voice-pipeline-debug.html** — Voice pipeline checks
- **fallback-revert-debug.html** — Mic/text fallbacks and n8n test
- **console-errors-live.html** — Live console error capture (use main app with `?capture_errors=1`)

## Docs

- `DEBUG-TOOLS-SUMMARY.md` — Current tools and scripts
- `ORPHANED-DUPLICATE-OLD-CODE.md` — Audit of removed/duplicate code
- `CONSOLE-ERROR-CHECK-GUIDE.md` — Console error checking
- `errors-and-fixes.md` — Error fixes log
- `N8N-WEBHOOK-404-FIX.md` — n8n HTTP 404 checklist (workflow ON, production URL, .env)
- `N8N-RESPOND-TO-WEBHOOK-FIX.md` — n8n webhook response fix (referenced by app and docs)
