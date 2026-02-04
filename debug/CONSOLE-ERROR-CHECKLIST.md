# Console Error Checklist

**Date:** 2026-02-04  
**Purpose:** Guide for checking browser console errors for wake word issues

## How to Check Console

1. **Open Browser Console:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Or right-click → "Inspect" → "Console" tab

2. **Enable Verbose Logging:**
   - In console, click the filter dropdown
   - Select "Verbose" or "All levels" to see `DEBUG.trace` messages
   - Or set filter to show all: `[JARVIS]`, `[WakeWordTest]`, `WakeWordManager`

## Key Log Messages to Look For

### ✅ Success Messages (Should See These)
```
WakeWordManager: Starting keyword validation
WakeWordManager: Processing keyword 1/1
WakeWordManager: Built-in keyword check
WakeWordManager: Using built-in keyword
WakeWordManager: Added built-in keyword to validatedPaths
WakeWordManager: Validated keyword paths
WakeWordManager: About to call Porcupine.create()
```

### ❌ Error Messages (Indicate Problems)

**If you see:**
```
WakeWordManager: validatedPaths is EMPTY after validation loop!
```
→ The validation loop didn't add any keywords

**If you see:**
```
WakeWordManager: CRITICAL - validKeywords is empty right before Porcupine.create()!
WakeWordManager: Using emergency fallback - forcing "Jarvis" keyword
```
→ Keywords were lost during filtering, emergency fallback activated

**If you see:**
```
WakeWordManager: FATAL - validKeywords is still empty after emergency fallback!
```
→ Emergency fallback failed (should never happen)

## What to Check

### 1. Check Bridge Configuration
In console, run:
```javascript
bridge.options.wakeWordKeywordPaths
```
**Expected:** `['Jarvis']` or similar array

### 2. Check Wake Word Manager
In console, run:
```javascript
bridge.wakeWordManager?.keywordPaths
```
**Expected:** `['Jarvis']` or similar array

### 3. Check Validation Logs
Look for these DEBUG.trace messages:
- `WakeWordManager: Starting keyword validation` - Should show keywordPaths
- `WakeWordManager: Processing keyword 1/1` - Should show the keyword being processed
- `WakeWordManager: Built-in keyword check` - Should show if 'Jarvis' matches
- `WakeWordManager: Added built-in keyword to validatedPaths` - Should show keyword added

### 4. Check Array Contents
Look for logs showing:
- `validatedPaths: ['Jarvis']` - After validation
- `filteredPaths: ['Jarvis']` - After filtering
- `finalKeywords: ['Jarvis']` - Before Porcupine
- `validKeywords: ['Jarvis']` - Right before Porcupine.create()

## Common Issues

### Issue 1: Keywords Not Set
**Symptom:** `keywordPaths: []` or `undefined`
**Fix:** Check bridge initialization - ensure `wakeWordKeywordPaths: ['Jarvis']` is set

### Issue 2: Validation Loop Not Running
**Symptom:** No "Processing keyword" logs
**Fix:** Check if `this.keywordPaths` is empty or undefined

### Issue 3: Built-in Keyword Not Matching
**Symptom:** "Not a built-in keyword" log appears
**Fix:** Check if keyword matches exactly (case-insensitive should work)

### Issue 4: Keywords Lost During Filtering
**Symptom:** `validatedPaths` has keywords but `finalKeywords` is empty
**Fix:** Check filtering logic - keywords shouldn't be filtered out

## Debug Commands

### Check Current State
```javascript
// Check bridge
console.log('Bridge options:', bridge.options);
console.log('Wake word enabled:', bridge.options.wakeWordEnabled);
console.log('Keyword paths:', bridge.options.wakeWordKeywordPaths);

// Check manager (if initialized)
if (bridge.wakeWordManager) {
  console.log('Manager keyword paths:', bridge.wakeWordManager.keywordPaths);
  console.log('Manager access key:', bridge.wakeWordManager.accessKey ? 'Set' : 'Not set');
  console.log('Porcupine instance:', bridge.wakeWordManager.porcupine ? 'Created' : 'Not created');
}
```

### Enable Debug Mode
```javascript
// Enable verbose DEBUG logging
window.JARVIS_DEBUG = true;
// Then refresh page
```

## Files to Check

- `public/js/wake-word-manager.js` - Main validation logic
- `public/js/cartesia-audio-bridge.js` - Bridge initialization
- `public/debug/wake-word-activation-test.html` - Test page

## Next Steps

1. Open browser console (F12)
2. Enable verbose logging
3. Refresh test page
4. Click "Initialize Bridge" → "Start Wake Word"
5. Look for the log messages listed above
6. Share the console output for analysis
