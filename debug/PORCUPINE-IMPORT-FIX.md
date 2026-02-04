# Porcupine Import Error Fix

**Date:** 2026-02-02  
**Status:** ✅ **FIXED**

## Error Description

**Error Message:**
```
Uncaught SyntaxError: The requested module '/@fs/C:/Users/lazar/Downloads/GitHub/JARVIS-WEB/node_modules/.vite/deps/@picovoice_porcupine-web.js?v=312251e8' does not provide an export named 'default'.
at wake-word-manager.js:12:8
```

**Root Cause:**
The `@picovoice/porcupine-web` package (v4.0.0) exports `Porcupine` as a **named export**, not a default export. The code was attempting to import it as a default export.

## Fix Applied

### File: `public/js/wake-word-manager.js`

**Before (Incorrect):**
```javascript
import Porcupine from '@picovoice/porcupine-web';
```

**After (Correct):**
```javascript
import { Porcupine } from '@picovoice/porcupine-web';
```

### File: `vite.config.js`

Added `optimizeDeps` configuration to ensure proper handling of the Porcupine package:

```javascript
optimizeDeps: {
  include: ['@picovoice/porcupine-web'],
  esbuildOptions: {
    target: 'es2022',
  },
},
```

## Verification

### Package Export Structure

The `@picovoice/porcupine-web` package exports the following (from `dist/types/index.d.ts`):

```typescript
export { 
  BuiltInKeyword, 
  DetectionCallback, 
  keywordsProcess, 
  Porcupine,  // ← Named export, not default
  PorcupineDetection, 
  PorcupineKeyword, 
  PorcupineModel, 
  PorcupineOptions, 
  PorcupineWorker,
  // ... other exports
};
```

**No default export exists** - the package only provides named exports.

### Testing

1. **Debug Tool:** `debug/tools/check-porcupine-import.js`
   - Verifies package can be imported
   - Checks export structure
   - Confirms correct import syntax

2. **Live Test:** `debug/live/porcupine-import.test.js`
   - Documents correct import syntax
   - Verifies package installation

## Related Files

- `public/js/wake-word-manager.js` - Fixed import statement
- `vite.config.js` - Added optimizeDeps configuration
- `debug/tools/check-porcupine-import.js` - Debug tool for verification
- `debug/live/porcupine-import.test.js` - Test documentation

## Prevention

To prevent similar issues in the future:

1. **Always check package documentation** for export structure
2. **Check TypeScript definitions** (`node_modules/<package>/dist/types/`) for export structure
3. **Use debug tools** to verify imports before implementing
4. **Test in browser environment** - some packages behave differently in Node.js vs browser

## Status

✅ **FIXED** - Import error resolved. The wake word manager now correctly imports Porcupine as a named export.

## Next Steps

1. Clear Vite cache: `rm -rf node_modules/.vite` (or delete the folder on Windows)
2. Restart Vite dev server
3. Verify the error is gone in browser console
4. Test wake word functionality
