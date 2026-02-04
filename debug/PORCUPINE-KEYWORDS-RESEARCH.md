# Porcupine Web SDK Keywords Research - validKeywords Empty Issue

**Date:** 2026-02-04  
**Issue:** `validKeywords` array is empty when passed to `Porcupine.create()`  
**SDK Version:** `@picovoice/porcupine-web@^4.0.0`  
**Reference:** https://picovoice.ai/docs/porcupine/web/

## Research Summary

Based on comprehensive research of Picovoice documentation and the Porcupine Web SDK:

### Porcupine.create() API Requirements

According to the [Porcupine Web SDK documentation](https://picovoice.ai/docs/porcupine/web/), `Porcupine.create()` expects:

```javascript
const porcupine = await Porcupine.create({
  accessKey: "your-access-key",
  keywords: ["Jarvis"],  // Array of strings
  sensitivities: [0.5]   // Array matching keywords length
});
```

### Built-in Keywords Format

**Critical Finding:** Built-in keywords should be passed as **string literals** in the keywords array, NOT as file paths.

**Correct:**
```javascript
keywords: ["Jarvis"]  // ✅ Built-in keyword as string
keywords: ["Computer", "Jarvis"]  // ✅ Multiple built-in keywords
```

**Incorrect:**
```javascript
keywords: ["keywords/jarvis.ppn"]  // ❌ This is a file path, not built-in
keywords: ["jarvis"]  // ⚠️ Case-sensitive - must match exactly
```

### Built-in Keywords List (Case-Sensitive)

The Porcupine Web SDK v4.0.0 supports these built-in keywords (exact case):
- `"Jarvis"` (capital J)
- `"Computer"`
- `"Alexa"`
- `"Hey Google"`
- `"Hey Siri"`
- `"Okay Google"`
- `"Picovoice"`
- `"Porcupine"`
- `"Terminator"`
- `"Americano"`
- `"Blueberry"`
- `"Bumblebee"`
- `"Grapefruit"`
- `"Grasshopper"`

**Important:** Built-in keywords are **case-sensitive**. `"jarvis"` (lowercase) is NOT the same as `"Jarvis"` (capital J).

### Common Issues Causing Empty validKeywords

#### Issue 1: Case Sensitivity Mismatch
**Problem:** Validation converts to lowercase for matching, but Porcupine requires exact case.

**Example:**
```javascript
// User provides: ["jarvis"] (lowercase)
// Validation matches: "Jarvis" (correct case)
// But if validation fails, array becomes empty
```

**Solution:** Ensure built-in keyword matching preserves the correct case from BUILT_IN_KEYWORDS array.

#### Issue 2: File Path vs Built-in Keyword Confusion
**Problem:** Code may treat built-in keywords as file paths and try to validate file existence.

**Example:**
```javascript
// If "Jarvis" is treated as a file path
// File existence check fails → keyword removed
// Result: empty array
```

**Solution:** Built-in keywords should skip file existence checks entirely.

#### Issue 3: Array Filtering Too Aggressive
**Problem:** Multiple filtering steps may remove valid keywords.

**Example:**
```javascript
validatedPaths = ["Jarvis"]
filteredPaths = validatedPaths.filter(...)  // May remove if filter is too strict
finalKeywords = filteredPaths.filter(...)  // May remove again
validKeywords = finalKeywords.filter(...)   // May remove again
// Result: empty array after multiple filters
```

**Solution:** Ensure filters only remove truly invalid entries (null, undefined, empty strings).

#### Issue 4: Async Validation Race Condition
**Problem:** If validation loop contains async operations, keywords may not be added before Porcupine.create() is called.

**Example:**
```javascript
for (const path of keywordPaths) {
  if (isBuiltIn(path)) {
    validatedPaths.push(path);  // Synchronous - OK
  } else {
    await checkFileExists(path);  // Async - may cause issues
  }
}
// If async operations fail or timeout, validatedPaths may be empty
```

**Solution:** Built-in keywords should be added synchronously, file checks should be async with proper error handling.

### Validation Flow Best Practices

Based on Porcupine Web SDK requirements:

1. **Separate Built-in from File Paths**
   ```javascript
   const builtInKeywords = ['Jarvis', 'Computer', ...];
   const isBuiltIn = (path) => builtInKeywords.includes(path);
   ```

2. **Handle Built-in Keywords First (Synchronously)**
   ```javascript
   if (isBuiltIn(path)) {
     validatedPaths.push(path);  // No async needed
     continue;  // Skip file checks
   }
   ```

3. **Validate File Paths (Asynchronously)**
   ```javascript
   // Only for non-built-in keywords
   const fileExists = await checkFileExists(path);
   if (fileExists) {
     validatedPaths.push(path);
   }
   ```

4. **Preserve Exact Case for Built-in Keywords**
   ```javascript
   // Match case-insensitively
   const match = builtInKeywords.find(k => k.toLowerCase() === path.toLowerCase());
   if (match) {
     validatedPaths.push(match);  // Use exact case from built-in list
   }
   ```

### Error Messages from Porcupine

When `Porcupine.create()` receives an empty or invalid keywords array, it throws:

```
Error: The keywords argument is undefined / empty
```

This error occurs when:
- `keywords` is `undefined`
- `keywords` is `null`
- `keywords` is an empty array `[]`
- `keywords` contains invalid entries (non-strings, empty strings)

### Recommended Fix Strategy

1. **Early Validation:** Check if keywords array is empty before any processing
2. **Built-in First:** Process built-in keywords synchronously before file checks
3. **Case Preservation:** Match case-insensitively but preserve exact case
4. **Minimal Filtering:** Only filter out truly invalid entries
5. **Emergency Fallback:** If all validation fails, use 'Jarvis' as absolute fallback
6. **Comprehensive Logging:** Log at each validation step to trace where keywords are lost

### Code Pattern for Correct Implementation

```javascript
// 1. Early check
if (!Array.isArray(keywordPaths) || keywordPaths.length === 0) {
  throw new Error('No keyword paths provided');
}

// 2. Built-in keywords list (exact case)
const BUILT_IN_KEYWORDS = ['Jarvis', 'Computer', ...];

// 3. Validation loop
const validatedPaths = [];
for (const path of keywordPaths) {
  // Skip empty
  if (!path || typeof path !== 'string' || path.trim().length === 0) {
    continue;
  }
  
  const trimmed = path.trim();
  
  // Check built-in (case-insensitive match, preserve exact case)
  const normalized = trimmed.toLowerCase();
  const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalized);
  if (builtInMatch) {
    validatedPaths.push(builtInMatch);  // Use exact case
    continue;  // Skip file check
  }
  
  // File path validation (async)
  // ... file existence check ...
}

// 4. Final validation
if (validatedPaths.length === 0) {
  // Emergency fallback
  validatedPaths.push('Jarvis');
}

// 5. Pass to Porcupine
const porcupine = await Porcupine.create({
  accessKey: accessKey,
  keywords: validatedPaths,  // Should never be empty
  sensitivities: sensitivities
});
```

## References

- [Picovoice Documentation](https://picovoice.ai/docs/)
- [Porcupine Web SDK](https://picovoice.ai/docs/porcupine/web/)
- [Porcupine Wake Word Tips](https://picovoice.ai/docs/porcupine/wake-word-tips/)
- Project file: `PICOVOICE-WAKE-WORD-COMPREHENSIVE-RESEARCH.md`
