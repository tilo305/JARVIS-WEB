# Debug System Status

**Last Updated**: 2026-02-06 (cleaned up orphaned and redundant debug tools)
**Status**: Streamlined and operational

## Tools Kept

| Category | Tool | Status |
|----------|------|--------|
| Runner | `run-debug-suite.mjs` | ✅ |
| Config | `validate-config.js`, `check-env.js` | ✅ |
| n8n | `check-n8n-webhook.js` | ✅ |
| Tests | Jest tests in `debug/tests/`, `debug/live/` | ✅ |

## Removed (Redundant/Orphaned)

### Previously Removed
- websocket-debugger.ts → covered by `cartesia-websocket-live.test.ts`
- audio-debugger.ts → covered by `format-boundary-live.test.js`
- error-detector.ts → ESLint covers this
- fix-websocket-errors.ts → did not apply fixes
- run-all-debug.ts → overlapped with Jest
- verify-all-working.mjs → redundant with run-debug-suite

### Recently Removed (Orphaned Tools)
- analyze-n8n-response.js, console-debug-helper.js, quick-debug-paste.js → browser console helpers, not standalone tools
- debug-n8n-response.html → orphaned HTML page
- diagnose-empty-n8n-response.js → browser console helper
- test-all-error-capture.js, test-copy-log-n8n-capture.js → browser console paste scripts
- test-extract-reply-fix.js, test-n8n-warning-improvements.js → old test scripts, covered by Jest
- test-final-verification.js, test-javascript-handbook-integration.js, test-latency-optimizations.js → old test files
- test-mic-button-comprehensive.js, test-mic-button-fixes.js, test-timestamp-in-browser.html → old test files

## Usage

```bash
npm run debug            # Lint, test, build, vite
npm run debug:config     # Validate config
npm run debug:n8n        # Test n8n webhook
npm run debug:stt        # Check STT sample rate
npm run debug:env        # Check .env
npm run debug:live       # LIVE Jest tests
npm run debug:app        # Open app with debug mode
npm run test:integration # Cartesia integration
```
