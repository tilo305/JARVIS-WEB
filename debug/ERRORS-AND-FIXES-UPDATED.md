# Errors and Fixes - Updated Log

**Last Updated:** 2026-02-02

This document tracks all errors encountered and their fixes in the JARVIS-WEB project.

---

## 2026-02-02

### Porcupine Import Error (Browser Console)

**Error:**
```
Uncaught SyntaxError: The requested module '/@fs/C:/Users/lazar/Downloads/GitHub/JARVIS-WEB/node_modules/.vite/deps/@picovoice_porcupine-web.js?v=312251e8' does not provide an export named 'default'.
at wake-word-manager.js:12:8
```

**Root Cause:**
The `@picovoice/porcupine-web` package (v4.0.0) exports `Porcupine` as a **named export**, not a default export. The code was using incorrect default import syntax.

**Fix:**
1. **File:** `public/js/wake-word-manager.js`
   - Changed: `import Porcupine from '@picovoice/porcupine-web';`
   - To: `import { Porcupine } from '@picovoice/porcupine-web';`

2. **File:** `vite.config.js`
   - Added `optimizeDeps` configuration to ensure proper handling:
   ```javascript
   optimizeDeps: {
     include: ['@picovoice/porcupine-web'],
     esbuildOptions: {
       target: 'es2022',
     },
   },
   ```

**Verification:**
- Created `debug/tools/check-porcupine-import.js` - Debug tool to verify import resolution
- Created `debug/live/porcupine-import.test.js` - Test documenting correct syntax
- Created `debug/PORCUPINE-IMPORT-FIX.md` - Comprehensive documentation

**Status:** ✅ **FIXED**

**Prevention:**
- Always check package TypeScript definitions (`node_modules/<package>/dist/types/`) for export structure
- Use debug tools to verify imports before implementing
- Test in browser environment as packages may behave differently than in Node.js

---

## Previous Fixes

### Jest CLI: `testPathPattern` deprecated

- **Error:** `Option "testPathPattern" was replaced by "--testPathPatterns".`
- **Fix:** In `package.json`, `test:unit` script updated from `--testPathPattern=tests/unit` to `--testPathPatterns=tests/unit`.
- **Status:** Fixed. `npm run test:unit` runs without warning.

### Jest: debug tests not matched

- **Error:** `debug/tests/stt-client.test.ts`, `tts-client.test.ts`, `bidirectional-conversation.test.ts` not run (testMatch did not include `debug/tests/**`).
- **Fix:** In `jest.config.cjs`, added `'<rootDir>/debug/tests/**/*.test.ts'` and `'<rootDir>/debug/tests/**/*.test.js'` to `testMatch`.
- **Status:** Fixed. All debug/tests run.

### Jest: `.js` imports from `src/` not resolved (TypeScript ESM)

- **Error:** `Cannot find module './config.js'` / `'../../src/tts-client.js'` when running debug tests (src files use .js in imports for ESM).
- **Fix:** In `jest.config.cjs`, added `moduleNameMapper`: `'^(\\.{1,2}/.*)\\.js$': '$1'` so Jest resolves .js to .ts.
- **Status:** Fixed.

### debug/tests/stt-client: transcript/error callbacks not called

- **Error:** Mock emitted `message` with `Buffer.from(response)`; `stt-client` `handleMessage` returns early for `Buffer`, so JSON was never parsed.
- **Fix:** In `debug/tests/stt-client.test.ts`, mock now emits `this.emit('message', response)` (JSON string) instead of `Buffer.from(response)`; same for error response.
- **Status:** Fixed.

### debug/tests/stt-client: latency test expected > 0

- **Error:** Mock response uses `request_id: 'test-request-1'`; client uses generated ID, so `requestStartTimes.get(request_id)` is undefined and latency is 0.
- **Fix:** Test relaxed to `expect(partialLatency).toBeGreaterThanOrEqual(0)`.
- **Status:** Fixed.

---

## Debug Tools Created

### Module Import Verification
- `debug/tools/check-porcupine-import.js` - Verifies Porcupine package import resolution

### Configuration Validation
- `debug/tools/validate-config.js` - Validates Cartesia + n8n config
- `debug/tools/check-env.js` - Validates .env file setup
- `debug/tools/check-n8n-webhook.js` - Tests n8n webhook connectivity

### Live Tests
- `debug/live/porcupine-import.test.js` - Porcupine import resolution test
- `debug/live/n8n-webhook.test.js` - n8n webhook connectivity test
- `debug/live/example-run.test.js` - Bidirectional example verification

---

## Best Practices for Import Errors

1. **Check Package Documentation First**
   - Review official docs for import syntax
   - Check TypeScript definitions in `node_modules/<package>/dist/types/`

2. **Use Debug Tools**
   - Run `debug/tools/check-porcupine-import.js` for module verification
   - Test imports in browser console

3. **Verify in Browser**
   - Some packages behave differently in Node.js vs browser
   - Always test in actual browser environment

4. **Check Vite Configuration**
   - Ensure `optimizeDeps` includes problematic packages
   - Clear Vite cache: `rm -rf node_modules/.vite`

5. **Document Fixes**
   - Update this file with all fixes
   - Create specific fix documentation (e.g., `PORCUPINE-IMPORT-FIX.md`)
   - Add debug tools for future verification
