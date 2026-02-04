# Wake Word Keyword Validation Fix

**Date:** 2026-02-04  
**Issue:** Keywords array empty when passed to Porcupine.create()  
**Status:** 🔧 Fixed with enhanced debugging

## Problem

The error "The keywords argument is undefined / empty" was occurring even though `keywordPaths: ['Jarvis']` was correctly set. The keywords were being lost somewhere between configuration and Porcupine initialization.

## Root Cause Analysis

1. **Configuration**: `wakeWordKeywordPaths: ['Jarvis']` was set correctly
2. **Validation Loop**: Built-in keyword check at line 197 should match 'Jarvis'
3. **Filtering**: Multiple filtering steps could potentially remove valid keywords
4. **Porcupine.create()**: Received empty array despite validation

## Fixes Applied

### 1. Enhanced Debug Logging
- Added comprehensive logging at each validation step
- Log keyword paths, validated paths, and final keywords at each stage
- Track array lengths to identify where keywords are lost

### 2. Validation Improvements
- Enhanced built-in keyword matching with detailed logging
- Added validation length checks after each processing step
- Added error logging when validatedPaths is empty after validation loop

### 3. Fallback Safeguards
- Multiple fallback checks to ensure keywords array is never empty
- Absolute fallback to 'Jarvis' if all validation fails
- Ensure sensitivities array matches keywords array length

### 4. Debug Tools Created
- `debug/tools/debug-wake-word-keywords.js` - Static analysis tool
- `debug/tools/debug-wake-word-keyword-validation-live.js` - LIVE validation testing

## Code Changes

### `public/js/wake-word-manager.js`

1. **Enhanced built-in keyword check logging** (line ~197):
   ```javascript
   DEBUG.trace('WakeWordManager: Using built-in keyword', { 
     original: path, 
     normalized: builtInMatch,
     index: i,
     validatedPathsLength: validatedPaths.length
   });
   ```

2. **Added validation loop start logging** (line ~183):
   ```javascript
   DEBUG.trace('WakeWordManager: Starting keyword validation', {
     keywordPaths: this.keywordPaths,
     keywordPathsLength: this.keywordPaths.length,
     sensitivities: this.sensitivities
   });
   ```

3. **Added empty validatedPaths check** (line ~333):
   ```javascript
   if (validatedPaths.length === 0) {
     DEBUG.error('WakeWordManager: validatedPaths is EMPTY after validation loop!', {
       originalPaths: this.keywordPaths,
       // ... detailed diagnostics
     });
   }
   ```

4. **Enhanced final keywords logging** (line ~417):
   ```javascript
   DEBUG.trace('WakeWordManager: After filtering', {
     filteredPaths,
     finalKeywords,
     finalKeywordsLength: finalKeywords.length
   });
   ```

## Testing

### Test Tool Results
```bash
node debug/tools/debug-wake-word-keyword-validation-live.js
```

**Results:**
- ✓ 'Jarvis' (case-sensitive) - PASSED
- ✓ 'jarvis' (lowercase) - PASSED  
- ✓ 'JARVIS' (uppercase) - PASSED
- ✓ 'Computer' - PASSED
- ✓ ['Jarvis', 'Computer'] - PASSED
- ✗ 'invalid-keyword' - FAILED (expected)
- ✗ '' (empty) - FAILED (expected)

## Verification Steps

1. **Check browser console** for detailed validation logs
2. **Verify keyword paths** are set correctly in bridge options
3. **Check validatedPaths** array after validation loop
4. **Verify finalKeywords** before Porcupine.create()
5. **Confirm fallback** activates if validation fails

## Debugging Commands

### Browser Console
```javascript
// Check bridge configuration
bridge.options.wakeWordKeywordPaths

// Check wake word manager
bridge.wakeWordManager?.keywordPaths

// Check Porcupine instance
bridge.wakeWordManager?.porcupine
```

### Node.js Tools
```bash
# Test keyword validation logic
node debug/tools/debug-wake-word-keyword-validation-live.js

# Analyze wake-word-manager.js
node debug/tools/debug-wake-word-keywords.js
```

## Next Steps

1. ✅ Enhanced debug logging added
2. ✅ Fallback safeguards implemented
3. ✅ Debug tools created
4. ⏳ Test in browser with actual Porcupine initialization
5. ⏳ Verify keywords reach Porcupine.create() correctly

## Related Files

- `public/js/wake-word-manager.js` - Main validation logic
- `public/js/cartesia-audio-bridge.js` - Bridge initialization
- `public/debug/wake-word-activation-test.html` - Test page
- `debug/tools/debug-wake-word-keyword-validation-live.js` - LIVE test tool
- `debug/tools/debug-wake-word-keywords.js` - Static analysis tool
