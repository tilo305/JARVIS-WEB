# Debug Tools Summary (Simplified)

Streamlined debugging and validation. Duplicates and low-value tools have been removed.

## Tools kept

### Scripts (`debug/tools/`)

- **check-console-errors.js** — Static check for bad patterns in app and bridge
- **test-copy-log-reset.js** — Copy-log reset tests
- **test-text-response-fix.js** — Text response tests
- **test-timestamp-live.js** — Timestamp checks
- **test-greeting-live.html** — Browser greeting test

### Main runner

- **run-debug-suite.mjs** — Runs: lint → test → build → vite build

### Tests (Jest, `debug/tests/`)

- **format-boundary-live.test.js** — Audio Float32↔Int16 (`audio-utils.js`)
- **cartesia-websocket-live.test.ts** — Live Cartesia WebSocket (skips if no API key)
- **stt-client.test.ts**, **tts-client.test.ts**, **bidirectional-conversation.test.ts** — Unit tests
- **greeting-time-of-day.test.js**, **timestamp-display.test.js**, **strip-markdown-for-tts.test.js**, **websocket-optimization.test.ts** — Feature tests
- **chat-layout-fit.test.js** — Chat interface responsive layout (fits viewport when collapsed)

### Browser

- **debug-audioworklet.html** — AudioWorklet validation
- **voice-pipeline-debug.html**, **fallback-revert-debug.html**, **console-errors-live.html** — Pipeline and error capture

## Scripts

| Script | Command |
|--------|--------|
| `debug` | Main suite (lint, test, build, vite) |
| `test` | All Jest tests |
| `test:integration` | Cartesia integration tests only |

## Removed (redundant / orphaned)

- Wake word CLI tools and pages (feature removed)
- **check-n8n-webhook.js**, **validate-config.js**, **check-env.js** — not present in repo; docs updated
- **debug/live/** — removed; `debug:live` script removed
- Various old verification and paste scripts (see `ORPHANED-DUPLICATE-OLD-CODE.md`)
