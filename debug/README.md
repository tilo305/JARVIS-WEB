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

# Run LIVE Jest tests (debug/live)
npm run debug:live

# Wake word: verify setup (config, .env, keywords)
npm run test:wakeword

# Wake word: activation flow test
npm run test:wakeword:activation

# Wake word: interactive CLI test
npm run test:wakeword:cli

# Run integration tests (Cartesia WebSocket - skips if no API key)
npm run test:integration
```

## Tools

| Tool | Purpose |
|------|---------|
| `run-debug-suite.mjs` | CI-style pipeline: lint, test, build, vite build |
| `tools/check-console-errors.js` | Static check for bad patterns in source code |
| `tools/check-porcupine-import.js` | Verifies wake word package import resolution |
| `tools/verify-wake-word-setup.js` | Full wake word setup (.env, keywords, paths) — `npm run test:wakeword` |
| `tools/debug-wake-word-initialization.js` | Wake word initialization debugging |
| `tools/debug-wake-word-keyword-validation-live.js` | Live keyword validation (built-in vs custom) |
| `tools/test-wake-word-activation-flow.js` | Activation flow test — `npm run test:wakeword:activation` |
| `tools/wake-word-activation-test-cli.js` | Interactive CLI wake word test — `npm run test:wakeword:cli` |
| `public/debug/console-errors-live.html` | Live console error capture (main app with `?capture_errors=1`) |
| `public/debug/wake-word-activation-test.html` | Wake word activation test in browser |
| `public/debug/debug-audioworklet.html` | Browser AudioWorklet validation |
| `public/debug/voice-pipeline-debug.html` | Voice pipeline checks |
| `public/debug/fallback-revert-debug.html` | Mic/text fallback revert diagnosis |
| `live/`, `tests/` | Jest and live tests (Porcupine, Cartesia, audio, etc.) |