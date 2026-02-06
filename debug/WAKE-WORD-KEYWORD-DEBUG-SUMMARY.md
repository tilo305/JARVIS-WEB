# Wake Word Keyword Debug Summary

**Date:** 2026-02-04  
**Issue:** Keywords array empty when passed to Porcupine.create()  
**Status:** 🔧 Enhanced debugging and safeguards added

## Problem

Despite `keywordPaths: ['Jarvis']` being correctly set, Porcupine.create() receives an empty keywords array, causing initialization to fail with "The keywords argument is undefined / empty".

## Enhanced Debugging Added

### 1. Validation Loop Logging
- Logs each keyword as it's processed
- Shows built-in keyword matching results
- Tracks validatedPaths array growth
- Logs when keywords are skipped or added

### 2. Post-Validation Checks
- Logs validatedPaths after validation loop completes
- Error if validatedPaths is empty
- Fallback to extract built-in keywords from original paths

### 3. Filtering Stage Logging
- Logs filteredPaths after filtering
- Logs finalKeywords after final filtering
- Shows exactly what gets filtered out

### 4. Pre-Porcupine Logging
- Logs validKeywords right before Porcupine.create()
- Shows exact array contents and types
- Emergency fallback if validKeywords is empty

### 5. Emergency Safeguard
- If validKeywords is empty right before Porcupine.create(), force 'Jarvis'
- This ensures Porcupine ALWAYS receives at least one keyword
- Logs when emergency fallback is triggered

## How to Debug

### 1. Open Browser Console
- Press F12 → Console tab
- Enable "Verbose" or "All levels" to see DEBUG.trace logs

### 2. Look for These Log Messages

**During Validation:**
```
WakeWordManager: Starting keyword validation
WakeWordManager: Processing keyword 1/1
WakeWordManager: Using built-in keyword
WakeWordManager: Added built-in keyword to validatedPaths
```

**After Validation:**
```
WakeWordManager: Validated keyword paths
WakeWordManager: validatedPaths is EMPTY after validation loop! (if error)
```

**Before Porcupine:**
```
WakeWordManager: About to call Porcupine.create()
WakeWordManager: CRITICAL - validKeywords is empty! (if error)
WakeWordManager: Using emergency fallback - forcing "Jarvis" keyword
```

### 3. Check These Values

In browser console, run:
```javascript
// Check bridge options
bridge.options.wakeWordKeywordPaths

// Check wake word manager (if initialized)
bridge.wakeWordManager?.keywordPaths

// Check if Porcupine was created
bridge.wakeWordManager?.porcupine
```

## Expected Flow

1. **Configuration**: `wakeWordKeywordPaths: ['Jarvis']` set in bridge options
2. **Validation Loop**: 'Jarvis' matches built-in keyword → added to validatedPaths
3. **Filtering**: validatedPaths → filteredPaths → finalKeywords → validKeywords
4. **Emergency Check**: If validKeywords empty → force 'Jarvis'
5. **Porcupine.create()**: Called with non-empty validKeywords array

## Files Modified

- `public/js/wake-word-manager.js` - Enhanced logging and safeguards
- `public/debug/wake-word-activation-test.html` - Enhanced config loading
- `public/debug/wake-word-test-config.js` - New config module

## Debug Tools Created

- `debug/tools/debug-wake-word-keyword-validation-live.js` - Live keyword validation
- `debug/tools/debug-wake-word-keyword-validation-live.js` - LIVE testing
- `debug/WAKE-WORD-KEYWORD-VALIDATION-FIX.md` - Fix documentation

## Next Steps

1. ✅ Enhanced debugging added
2. ✅ Emergency safeguards implemented  
3. ⏳ Test in browser and check console logs
4. ⏳ Identify exact point where keywords are lost
5. ⏳ Apply final fix based on debug output

## If Issue Persists

The enhanced logging will show exactly where keywords are lost. Check the browser console for:
- Which validation step fails
- What the arrays contain at each stage
- Whether emergency fallback is triggered
- What Porcupine actually receives
