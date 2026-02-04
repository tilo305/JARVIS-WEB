# Porcupine Keyword Files

This directory is for custom Porcupine wake word model files (`.ppn`). However, you can also use **built-in keywords** without any files!

## Option 1: Built-in Keywords (Recommended for Quick Start)

**No files needed!** Just use the keyword name directly.

Available built-in keywords:
- `Jarvis` - "Jarvis" wake word
- `Computer` - "Computer" wake word
- `Alexa` - "Alexa" wake word
- `Hey Google` - "Hey Google" wake word
- `Hey Siri` - "Hey Siri" wake word
- `Okay Google` - "Okay Google" wake word
- `Picovoice` - "Picovoice" wake word
- `Porcupine` - "Porcupine" wake word
- `Terminator` - "Terminator" wake word
- `Americano`, `Blueberry`, `Bumblebee`, `Grapefruit`, `Grasshopper` - Other built-in options

**Configuration:**
```javascript
window.JARVIS_CONFIG = window.JARVIS_CONFIG || {};
window.JARVIS_CONFIG.porcupineKeyword = 'Jarvis'; // Use built-in keyword
```

Or via environment variable:
```bash
VITE_PORCUPINE_KEYWORD=Jarvis
```

## Option 2: Custom Keyword Files

If you want a custom wake word, place your Porcupine wake word model files (`.ppn`) in this directory.

### Getting Custom Keyword Files

1. Go to https://console.picovoice.ai/
2. Navigate to **Porcupine** page
3. Create or select your wake word
4. Train for **Web** platform
5. Download the `.ppn` file
6. Place it in this directory

### Default Naming

The default naming pattern is: `{keyword}_en_wasm_v3_0_0.ppn`

For example, if your keyword is "jarvis", the file would be:
- `jarvis_en_wasm_v3_0_0.ppn`

### Custom Paths

If your file has a different name, you can override the path in `public/index.html`:

```javascript
window.JARVIS_CONFIG = window.JARVIS_CONFIG || {};
window.JARVIS_CONFIG.keywordPaths = [
  'keywords/your-custom-filename.ppn'
];
```

### Automatic Fallback

If a custom `.ppn` file is not found, the system will automatically fall back to a built-in keyword (e.g., "Jarvis") if the keyword name matches.

## Example Files

- `jarvis_en_wasm_v3_0_0.ppn` - Custom "Hey JARVIS" wake word
- `computer_en_wasm_v3_0_0.ppn` - Custom "Computer" wake word

See [WAKE-WORD-SETUP.md](../../WAKE-WORD-SETUP.md) for complete setup instructions.
