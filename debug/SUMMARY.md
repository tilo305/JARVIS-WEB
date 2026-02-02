# Debug Tools Summary (Simplified)

## Overview

Streamlined debugging and validation for JARVIS-WEB. Duplicates and low-value tools were removed.

## Tools Kept

### Validation Scripts
- **validate-config.js** – Validates Cartesia + n8n config (requires build)
- **check-n8n-webhook.js** – Tests n8n webhook connectivity
- **check-env.js** – Validates .env file

### Main Runner
- **run-debug-suite.mjs** – Runs: lint → test → build → vite build

### Tests (Jest)
- **format-boundary-live.test.js** – Audio Float32↔Int16 (tests `audio-utils.js`)
- **cartesia-websocket-live.test.ts** – Live Cartesia WebSocket (skips if no API key)
- **n8n-webhook.test.js** – n8n webhook LIVE test
- **example-run.test.js** – Bidirectional example execution
- **stt-client.test.ts**, **tts-client.test.ts**, **bidirectional-conversation.test.ts** – Unit tests

### Browser
- **debug-audioworklet.html** – AudioWorklet validation in browser

## Scripts

| Script | Command |
|--------|---------|
| `debug` | Main suite (lint, test, build, vite) |
| `debug:config` | Config validation |
| `debug:n8n` | n8n webhook check |
| `debug:env` | .env validation |
| `debug:live` | LIVE Jest tests |
| `test:integration` | Cartesia integration tests |

## Removed (Redundant)

- **websocket-debugger.ts** – Duplicate of `cartesia-websocket-live.test.ts`
- **audio-debugger.ts** – Duplicate of `format-boundary-live.test.js` (tests real code)
- **error-detector.ts** – ESLint covers this
- **fix-websocket-errors.ts** – Did not apply fixes, produced false positives
- **run-all-debug.ts** – Heavy runner, overlapped with Jest
- **verify-all-working.mjs** – Redundant with run-debug-suite
