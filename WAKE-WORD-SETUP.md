# Wake Word Detection Setup Guide

This guide explains how to set up Porcupine wake word detection for JARVIS-WEB.

## Prerequisites

1. **Picovoice Console Account**: Sign up at https://console.picovoice.ai/ (free, no credit card required)
2. **AccessKey**: Copy your AccessKey from the Picovoice Console home page
3. **Custom Wake Word**: Train a wake word model via Picovoice Console

## Step-by-Step Setup

### 1. Get Your Picovoice AccessKey

1. Go to https://console.picovoice.ai/
2. Sign up or log in
3. Copy your `AccessKey` from the home page

### 2. Create a Custom Wake Word

1. In Picovoice Console, navigate to the **Porcupine** page
2. Select your language (e.g., English)
3. Type your wake phrase (e.g., "Hey JARVIS", "Computer")
4. Click **Test** to test the wake word in your browser
5. Click **Train** and select **Web** platform
6. Download the `.ppn` file

**Wake Word Best Practices:**
- 3-5 words ideal
- At least 6 phonemes
- Mix of consonants and vowels
- Avoid very short phrases or common words

### 3. Place Keyword File

Place the downloaded `.ppn` file in the `public/keywords/` directory:

```
public/
  keywords/
    jarvis_en_wasm_v3_0_0.ppn  (or your custom filename)
```

**Note:** The default naming pattern is `{keyword}_en_wasm_v3_0_0.ppn`. You can use any filename, but update the path in your configuration if different.

### 4. Configure Environment Variables

Create a `.env` file in the project root with the following:

```env
# WAKE WORD / VAD (Voice Activity Detection)
# ============================================
PICOVOICE_ACCESS_KEY=your_access_key_here
PORCUPINE_KEYWORD=jarvis
PORCUPINE_SENSITIVITY=0.3
WAKE_WORD_ENABLED=false
VAD_SILENCE_THRESHOLD=0.01
VAD_SILENCE_DURATION=3000
VAD_MIN_SPEECH_DURATION=300
DEBUG_WAKE_WORD=true
DEBUG_VAD=true
```

**Configuration Options:**

- `PICOVOICE_ACCESS_KEY`: Your Picovoice AccessKey (required if wake word enabled)
- `PORCUPINE_KEYWORD`: The keyword name (used to construct file path)
- `PORCUPINE_SENSITIVITY`: Sensitivity (0.0-1.0). Lower = fewer false alarms, may miss detections. Higher = more detections, higher false alarm rate. Default: 0.5
- `WAKE_WORD_ENABLED`: Set to `true` to enable wake word detection
- `DEBUG_WAKE_WORD`: Set to `true` for debug logging

**Sensitivity Tuning:**
- Start at 0.5
- If missing detections: increase to 0.6-0.7
- If too many false alarms: decrease to 0.3-0.4

### 5. Customize Keyword Path (Optional)

If your keyword file has a different name or location, you can override the path in `public/index.html`:

```javascript
window.JARVIS_CONFIG = window.JARVIS_CONFIG || {};
window.JARVIS_CONFIG.keywordPaths = [
  'keywords/your-custom-filename.ppn'
];
```

Or use a full URL if hosting the file elsewhere:

```javascript
window.JARVIS_CONFIG.keywordPaths = [
  'https://your-cdn.com/keywords/jarvis.ppn'
];
```

## How It Works

### Architecture

When wake word detection is enabled:

1. **Always-Listening Mode**: Porcupine continuously processes audio for the wake word
2. **On Wake Word Detected**: 
   - Activates the STT pipeline
   - Enables VAD (Voice Activity Detection)
   - User can now speak and be transcribed
3. **Normal Flow**: After wake word, the conversation proceeds normally with VAD gating STT

### Integration Points

- **AudioWorklet**: Wake word processor runs in parallel with STT capture
- **Sample Rate**: Both use 16kHz (matches Cartesia STT requirement)
- **Format**: Int16 PCM (shared conversion with STT pipeline)
- **VAD Compatibility**: Wake word activates VAD, then VAD gates STT as normal

## Testing

1. Set `WAKE_WORD_ENABLED=true` in `.env`
2. Restart the dev server: `npm run vite`
3. Open the app in your browser
4. Click the mic button to start listening
5. Say your wake word (e.g., "Hey JARVIS")
6. You should see "Wake word detected — listening…" status
7. Continue speaking - your speech will be transcribed

## Troubleshooting

### Wake Word Not Detected

- **Check sensitivity**: Try increasing to 0.6-0.7
- **Verify keyword file**: Ensure `.ppn` file is in `public/keywords/` and path is correct
- **Check AccessKey**: Verify `PICOVOICE_ACCESS_KEY` is correct
- **Browser console**: Check for errors in browser DevTools
- **Test in quiet environment**: Background noise can interfere

### Too Many False Alarms

- **Decrease sensitivity**: Try 0.3-0.4
- **Retrain wake word**: Choose a more unique phrase
- **Check environment**: Reduce background noise

### Audio Pipeline Conflicts

- **Check AudioWorklet support**: Requires HTTPS or localhost
- **Verify browser**: Use Chrome, Firefox, Edge, or Safari 14.1+
- **Check console**: Look for AudioWorklet loading errors

### Keyword File Not Found

- **Verify path**: Check that file exists in `public/keywords/`
- **Check filename**: Default pattern is `{keyword}_en_wasm_v3_0_0.ppn`
- **Override path**: Use `window.JARVIS_CONFIG.keywordPaths` if needed

## Advanced Configuration

### Multiple Wake Words

You can detect multiple wake words by providing multiple keyword files:

```javascript
window.JARVIS_CONFIG.keywordPaths = [
  'keywords/jarvis_en_wasm_v3_0_0.ppn',
  'keywords/computer_en_wasm_v3_0_0.ppn'
];
window.JARVIS_CONFIG.wakeWordSensitivities = [0.5, 0.6]; // Match keywordPaths length
```

### Custom Wake Word Callback

The wake word detection triggers `onWakeWordDetected` callback in `app.js`. You can customize the behavior:

```javascript
bridge.onWakeWordDetected = (keywordIndex) => {
  console.log('Wake word detected!', keywordIndex);
  // Custom behavior here
};
```

## References

- [Porcupine Documentation](https://picovoice.ai/docs/porcupine/)
- [Picovoice Console](https://console.picovoice.ai/)
- [wAkE wOrD dOcS.md](./wAkE%20wOrD%20dOcS.md) - Comprehensive technical documentation
- [cArTeSiA dOcS.md](./cArTeSiA%20dOcS.md) - **Cartesia STT/TTS WebSocket specifications** (sample rates, encoding, optimal latency)
- [aUdiO dOcS.md](./aUdiO%20dOcS.md) - AudioWorklet architecture

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set correctly
3. Ensure keyword file is in the correct location
4. Review [wAkE wOrD dOcS.md](./wAkE%20wOrD%20dOcS.md) for technical details
