# Debug System Status

**Last Updated**: 2025-02-01 (simplified - removed redundant tools)
**Status**: Streamlined and operational

## Tools Kept

| Category | Tool | Status |
|----------|------|--------|
| Runner | `run-debug-suite.mjs` | ✅ |
| Config | `validate-config.js`, `check-env.js` | ✅ |
| n8n | `check-n8n-webhook.js` | ✅ |
| Tests | Jest tests in `debug/tests/`, `debug/live/` | ✅ |

## Removed (Redundant)

- websocket-debugger.ts → covered by `cartesia-websocket-live.test.ts`
- audio-debugger.ts → covered by `format-boundary-live.test.js`
- error-detector.ts → ESLint covers this
- fix-websocket-errors.ts → did not apply fixes
- run-all-debug.ts → overlapped with Jest
- verify-all-working.mjs → redundant with run-debug-suite

## Usage

```bash
npm run debug            # Lint, test, build, vite
npm run debug:config     # Validate config
npm run debug:n8n        # Test n8n webhook
npm run debug:env        # Check .env
npm run debug:live       # LIVE Jest tests
npm run test:integration # Cartesia integration
```
