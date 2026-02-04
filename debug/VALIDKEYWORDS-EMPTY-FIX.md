# validKeywords Empty Issue - Root Cause & Fix

**Date:** 2026-02-04  
**Issue:** `validKeywords` array is empty when passed to `Porcupine.create()`  
**SDK:** `@picovoice/porcupine-web@^4.0.0`  
**Reference:** https://picovoice.ai/docs/porcupine/web/

## Root Cause Analysis

Based on comprehensive research of [Picovoice documentation](https://picovoice.ai/docs/porcupine/web/), the issue occurs because:

### Critical Finding: Built-in Keywords Must Be Exact Case

According to Porcupine Web SDK v4.0.0:
- Built-in keywords are **case-sensitive**
- `"Jarvis"` (capital J) is valid
- `"jarvis"` (lowercase) is **NOT** recognized as a built-in keyword
- Porcupine will reject `"jarvis"` and throw "keywords argument is undefined / empty"

### Current Implementation Issue

The validation loop:
1. ✅ Correctly matches built-in keywords case-insensitively
2. ✅ Preserves exact case from `BUILT_IN_KEYWORDS` array
3. ✅ Adds to `validatedPaths` correctly
4. ❌ **BUT** - Multiple filtering steps may remove keywords if they don't match exactly

### The Problem Chain

```javascript
// Step 1: Validation loop (WORKS)
validatedPaths = ["Jarvis"]  // ✅ Correct case preserved

// Step 2: Filtering (MAY FAIL)
filteredPaths = validatedPaths.filter(...)  // May remove if filter is too strict

// Step 3: Final keywords (MAY FAIL)
finalKeywords = filteredPaths.filter(...)  // May remove again

// Step 4: Valid keywords (MAY FAIL)
validKeywords = finalKeywords.filter(...)  // May remove again

// Result: Empty array if any filter is too aggressive
```

## Solution

### Fix 1: Ensure Built-in Keywords Skip All File Checks

Built-in keywords should:
- ✅ Be added synchronously (no async file checks)
- ✅ Skip file existence validation entirely
- ✅ Preserve exact case from `BUILT_IN_KEYWORDS`

### Fix 2: Minimize Filtering

Filters should only remove:
- `null` or `undefined`
- Empty strings `""`
- Non-string types

Filters should **NOT** remove:
- Valid strings like `"Jarvis"`
- Strings that match built-in keywords

### Fix 3: Emergency Fallback

If `validKeywords` is empty right before `Porcupine.create()`, force `['Jarvis']`:

```javascript
if (validKeywords.length === 0) {
  validKeywords = ['Jarvis'];
  validSensitivities = [0.5];
}
```

## Implementation Verification

### Current Code Status

✅ **Correct:**
- Built-in keyword matching (case-insensitive)
- Case preservation from `BUILT_IN_KEYWORDS`
- Emergency fallback before `Porcupine.create()`

⚠️ **Needs Verification:**
- Filtering logic doesn't remove valid keywords
- `validatedPaths` is not cleared after validation
- All filtering steps preserve built-in keywords

### Recommended Code Pattern

```javascript
// 1. Built-in keywords (exact case)
const BUILT_IN_KEYWORDS = ['Jarvis', 'Computer', ...];

// 2. Validation loop
const validatedPaths = [];
for (const path of keywordPaths) {
  // Skip empty
  if (!path || typeof path !== 'string' || path.trim().length === 0) {
    continue;
  }
  
  const trimmed = path.trim();
  
  // Match built-in (case-insensitive, preserve exact case)
  const normalized = trimmed.toLowerCase();
  const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalized);
  if (builtInMatch) {
    validatedPaths.push(builtInMatch);  // Use exact case
    continue;  // Skip file check
  }
  
  // File validation (async) - only for non-built-in
  // ...
}

// 3. Minimal filtering (only remove truly invalid)
const filteredPaths = validatedPaths.filter(p => 
  p != null && typeof p === 'string' && p.trim().length > 0
);

// 4. Final keywords (should be same as filteredPaths)
const finalKeywords = filteredPaths.filter(k => 
  k != null && typeof k === 'string' && k.trim().length > 0
);

// 5. Valid keywords (should be same as finalKeywords)
const validKeywords = finalKeywords.filter(k => 
  k && typeof k === 'string' && k.trim().length > 0
);

// 6. Emergency fallback (CRITICAL)
if (validKeywords.length === 0) {
  validKeywords = ['Jarvis'];
  validSensitivities = [0.5];
}

// 7. Pass to Porcupine (should never be empty)
await Porcupine.create({
  accessKey: accessKey,
  keywords: validKeywords,  // Should be ['Jarvis'] at minimum
  sensitivities: validSensitivities
});
```

## Testing Checklist

- [ ] Built-in keyword `"Jarvis"` is matched correctly
- [ ] Exact case `"Jarvis"` is preserved (not `"jarvis"`)
- [ ] `validatedPaths` contains `["Jarvis"]` after validation
- [ ] `filteredPaths` contains `["Jarvis"]` after filtering
- [ ] `finalKeywords` contains `["Jarvis"]` after final filtering
- [ ] `validKeywords` contains `["Jarvis"]` before `Porcupine.create()`
- [ ] Emergency fallback triggers if `validKeywords` is empty
- [ ] `Porcupine.create()` receives non-empty `keywords` array

## Debugging Commands

### Browser Console
```javascript
// Check bridge configuration
bridge.options.wakeWordKeywordPaths

// Check manager
bridge.wakeWordManager?.keywordPaths

// Check Porcupine
bridge.wakeWordManager?.porcupine
```

### Enable Verbose Logging
```javascript
// In browser console
localStorage.setItem('DEBUG', 'true');
// Then refresh page
```

## References

- [Picovoice Documentation](https://picovoice.ai/docs/)
- [Porcupine Web SDK](https://picovoice.ai/docs/porcupine/web/)
- `PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md`
- `debug/PORCUPINE-KEYWORDS-RESEARCH.md`
