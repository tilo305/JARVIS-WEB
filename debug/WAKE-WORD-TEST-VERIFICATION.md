# Wake Word Configuration Test - Terminal Only

**Date:** 2026-02-02  
**Status:** ✅ **TERMINAL TEST ONLY - NO HTML TEST PAGE**

## Overview

Wake word testing is now done via terminal validation only. The HTML test page has been removed. Use the terminal test to validate configuration, then test actual detection in the main application.

## Terminal Test

### Run the Test

```bash
npm run test:wakeword
```

### What It Checks

1. **Configuration**
   - ✓ PICOVOICE_ACCESS_KEY is set and valid (min 20 chars)
   - ✓ PORCUPINE_KEYWORD is configured
   - ✓ PORCUPINE_SENSITIVITY is valid (0-1 range)
   - ✓ WAKE_WORD_ENABLED status

2. **Dependencies**
   - ✓ @picovoice/porcupine-web is in package.json
   - ✓ Package is installed in node_modules

3. **Vite Configuration**
   - ✓ Environment variables are properly configured

4. **Wake Word Manager**
   - ✓ wake-word-manager.js exists
   - ✓ Correct Porcupine import syntax
   - ✓ Error handling present

## Expected Output

When all checks pass:
```
✓ All checks passed! Wake word is properly configured.

To test wake word detection:
  1. Start dev server: npm run vite
  2. Open: http://localhost:3000
  3. Click the mic button and say your wake word
  4. Check browser console (F12) for detection logs
```

## Testing Actual Detection

After the terminal test passes:

1. **Start Dev Server:**
   ```bash
   npm run vite
   ```

2. **Open Application:**
   ```
   http://localhost:3000
   ```

3. **Test Wake Word:**
   - Click the mic button
   - Say your wake word (e.g., "Jarvis")
   - Check browser console (F12) for detection logs
   - Wake word should trigger the voice interaction

## Troubleshooting

### Terminal Test Errors

1. **"PICOVOICE_ACCESS_KEY is not set or invalid"**
   - Add to `.env`: `PICOVOICE_ACCESS_KEY=your_key_here`
   - Get key from: https://console.picovoice.ai/

2. **"@picovoice/porcupine-web not found"**
   - Run: `npm install`

3. **"wake-word-manager.js not found"**
   - Verify file exists at `public/js/wake-word-manager.js`

### Detection Not Working in Browser

1. **Check browser console for errors**
   - Look for Porcupine initialization errors
   - Check for microphone permission errors

2. **Verify configuration**
   - Run `npm run test:wakeword` to validate setup
   - Check that AccessKey is valid

3. **Microphone permission**
   - Allow microphone access in browser
   - Check browser permissions for localhost

## Files

- **Test Script:** `debug/tools/verify-wake-word-setup.js` (run: `npm run test:wakeword`)
- **Wake Word Manager:** `public/js/wake-word-manager.js`

## Summary

✅ **Terminal test validates configuration** - Use `npm run test:wakeword` to check setup  
✅ **Test detection in main app** - Use the mic button in the application to test actual detection
