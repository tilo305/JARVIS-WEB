# Debug Tools Verification Report

## Current Structure (Simplified)

### ✅ Tools Kept

| Tool | Purpose |
|------|---------|
| `run-debug-suite.mjs` | Main runner: lint → test → build → vite build |
| `check-n8n-webhook.js` | n8n webhook connectivity check |
| `validate-config.js` | Config validation (Cartesia + n8n) |
| `check-env.js` | .env file validation |

### ✅ Tests

| Test | Purpose |
|------|---------|
| `format-boundary-live.test.js` | Audio Float32↔Int16 (tests `audio-utils.js`) |
| `cartesia-websocket-live.test.ts` | Live Cartesia WebSocket (skips if no key) |
| `n8n-webhook.test.js` | n8n webhook LIVE test |
| `example-run.test.js` | Bidirectional example execution |
| `stt-client.test.ts`, `tts-client.test.ts`, `bidirectional-conversation.test.ts` | Unit tests |

### ✅ Scripts

```bash
npm run debug          # Main suite
npm run debug:config   # Config validation
npm run debug:n8n      # n8n webhook check
npm run debug:env      # .env validation
npm run debug:live     # LIVE Jest tests
npm run test:integration  # Cartesia integration
```

## Status: ✅ Simplified and Working
