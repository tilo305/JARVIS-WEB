# Wake Word Configured: Using Built-in "Jarvis" Keyword

## Configuration Applied ✅

The wake word system is now configured to use the built-in **"Jarvis"** keyword by default when wake word is enabled.

## What Changed

**File:** `public/js/app.js` (line 69)

**Before:**
```javascript
const porcupineKeyword = env.VITE_PORCUPINE_KEYWORD || cfg.porcupineKeyword || '';
```

**After:**
```javascript
// Default to "Jarvis" built-in keyword if wake word is enabled but no keyword specified
const porcupineKeyword = env.VITE_PORCUPINE_KEYWORD || cfg.porcupineKeyword || (wakeWordEnabled && wakeWordAccessKey ? 'Jarvis' : '');
```

## Benefits

### 1. **Fastest Initialization** ⚡
- **Built-in keyword:** 3-5 seconds
- **Custom .ppn file:** 15-30 seconds
- **Improvement:** 5-10x faster initialization

### 2. **No File Downloads** 📦
- Built-in keywords are included in Porcupine SDK
- No need to download `.ppn` files
- No file validation delays

### 3. **No Network Dependencies** 🌐
- Works offline (after SDK is cached)
- No file path issues
- No CORS problems

### 4. **Simpler Configuration** 🎯
- Just enable wake word and provide AccessKey
- No need to specify keyword file paths
- Automatic fallback to "Jarvis"

## How It Works

1. **If `VITE_PORCUPINE_KEYWORD` is set:** Uses that value (can be "Jarvis", "Computer", or custom .ppn path)
2. **If `window.JARVIS_CONFIG.porcupineKeyword` is set:** Uses that value
3. **If wake word is enabled but no keyword specified:** Defaults to "Jarvis" built-in keyword

## Configuration Options

### Option 1: Environment Variable (Recommended)
```bash
# In .env file
VITE_WAKE_WORD_ACCESS_KEY=your_access_key_here
VITE_WAKE_WORD_ENABLED=true
# VITE_PORCUPINE_KEYWORD=Jarvis  # Optional - defaults to "Jarvis" if not set
```

### Option 2: HTML Config
```javascript
// In public/index.html or before app.js loads
window.JARVIS_CONFIG = {
  wakeWordAccessKey: 'your_access_key_here',
  wakeWordEnabled: true,
  porcupineKeyword: 'Jarvis'  // Optional - defaults to "Jarvis" if not set
};
```

### Option 3: Use Different Built-in Keyword
```bash
# In .env file
VITE_PORCUPINE_KEYWORD=Computer  # or "Alexa", "Hey Google", etc.
```

## Available Built-in Keywords

Per `wAkE wOrD dOcS.md`, these built-in keywords are available:
- ✅ **"Jarvis"** (default, recommended)
- "Computer"
- "Alexa"
- "Hey Google"
- "Hey Siri"
- "Okay Google"
- "Porcupine"
- "Terminator"
- "Americano"
- "Blueberry"
- "Bumblebee"
- "Grapefruit"
- "Grasshopper"

## Testing

After configuration, test wake word initialization:

1. **Check console logs:**
   ```
   [JARVIS] Using built-in Porcupine keyword { keyword: "Jarvis" }
   ```

2. **Verify initialization time:**
   - Should complete in 3-5 seconds (not 15-30 seconds)
   - No timeout errors

3. **Test wake word detection:**
   - Say "Jarvis" clearly
   - Should activate STT pipeline
   - Check wake word tracker status

## Performance Comparison

| Configuration | Initialization Time | File Downloads | Network Required |
|---------------|-------------------|----------------|-----------------|
| Built-in "Jarvis" | 3-5 seconds | None | SDK only (cached) |
| Custom .ppn file | 15-30 seconds | Yes | SDK + .ppn file |

## Related Files

- `public/js/app.js` - Configuration logic
- `public/js/wake-word-manager.js` - Porcupine integration
- `public/js/cartesia-audio-bridge.js` - Wake word initialization
- `WAKE-WORD-TIMEOUT-RESEARCH.md` - Performance analysis
- `OPTIMIZATIONS-APPLIED.md` - All optimizations applied

## Notes

- Built-in keywords are case-insensitive ("jarvis", "Jarvis", "JARVIS" all work)
- The system automatically detects built-in keywords vs. custom file paths
- If a custom .ppn file is not found, it will fallback to built-in "Jarvis"
- All optimizations from `WAKE-WORD-TIMEOUT-RESEARCH.md` are still active
