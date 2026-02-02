# JARVIS-WEB Debug Suite

Lightweight debugging and validation tools. Kept essential tools only; redundant ones removed.

## Structure

| Path | Purpose |
|------|---------|
| `debug/tools/` | Standalone validation scripts (config, n8n webhook) |
| `debug/live/` | LIVE Jest tests (n8n, example run) and env check |
| `debug/tests/` | Unit + integration tests (STT, TTS, bidirectional, audio, Cartesia) |
| `debug/results/` | Test run output (optional) |

## Running

```bash
# Main debug suite (lint → test → build → vite build)
npm run debug

# Validate config (requires build first)
npm run debug:config

# Test n8n webhook connectivity
npm run debug:n8n

# Open app with ?debug=1 and send test message from console
npm run debug:app

# Check .env setup (no build required)
npm run debug:env

# Run LIVE Jest tests (n8n, example)
npm run debug:live

# Run integration tests (Cartesia WebSocket - skips if no API key)
npm run test:integration
```

## Tools Kept

| Tool | Purpose |
|------|---------|
| `run-debug-suite.mjs` | CI-style pipeline: lint, test, build, vite build |
| `check-n8n-webhook.js` | Quick n8n webhook connectivity check |
| `open-app-debug-send.mjs` | Opens app at `?debug=1`, runs Node fetch test, then you run `JARVIS_DEBUG_SEND_TEST()` in the browser console to send a message and check for reply/errors |
| `validate-config.js` | Validates Cartesia + n8n config (post-build) |
| `check-env.js` | Validates .env file exists and has required keys |
| `n8n-webhook.test.js` | Jest LIVE test for n8n webhook |
| `example-run.test.js` | Verifies bidirectional example runs |
| `format-boundary-live.test.js` | Audio Float32↔Int16 boundary tests |
| `cartesia-websocket-live.test.ts` | Live Cartesia TTS/STT WebSocket (skips if no key) |
| `debug-audioworklet.html` | Browser AudioWorklet validation |
| `public/debug/fallback-revert-debug.html` | Live n8n test from browser (CORS context) — diagnose mic/text fallback reverts |
| `FALLBACK-REVERT-RESEARCH.md` | Root-cause analysis: mic button and text message fallback reverts |
