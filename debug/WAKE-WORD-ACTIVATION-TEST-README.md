# Wake Word Activation Flow Test Tools

This directory contains tools for testing and debugging the wake word detection → STT activation flow.

## Overview

The wake word activation flow consists of the following steps:

1. **Wake word detection** → Porcupine detects the wake word
2. **Cooldown check** → Prevents re-triggering within 3 seconds
3. **STT pipeline activation** → Activates STT immediately (components are pre-setup)
4. **Pre-speech buffer flush** → Captures audio during detection and sends to STT
5. **Start streaming** → Streams audio to Cartesia STT API
6. **Disable wake word** → Temporarily disables wake word to prevent re-triggering

## Tools

### 1. Browser-Based Test Tool

**File:** `public/debug/wake-word-activation-test.html`

A comprehensive browser-based test tool with visual flow diagram, metrics, and automated tests.

**Usage:**
1. Start the dev server:
   ```bash
   npm run dev:browser
   # or
   npm run vite
   ```

2. Open in browser:
   ```
   http://localhost:3000/debug/wake-word-activation-test.html
   ```

3. Use the tool:
   - Click **"Initialize Bridge"** to set up the audio bridge
   - Click **"Start Wake Word"** to begin wake word detection
   - Say your wake word ("Jarvis") or click **"Simulate Detection"** to test
   - Click **"Run Full Test"** for automated testing
   - Monitor the flow diagram, metrics, and debug logs

**Features:**
- Visual flow diagram showing each step of activation
- Real-time metrics (detections, activation time, buffer flushes, etc.)
- Automated test suite
- Detailed debug logs
- Status indicators for bridge, wake word, STT, and streaming

### 2. Terminal Test Tool

**File:** `debug/tools/test-wake-word-activation-flow.js`

A terminal-based tool that analyzes the code and validates the activation flow implementation.

**Usage:**
```bash
npm run test:wakeword:activation
# or
node debug/tools/test-wake-word-activation-flow.js
```

**What it checks:**
- Configuration (API keys, wake word settings)
- Code analysis (_onWakeWordDetected method, buffer flush, etc.)
- Flow verification (expected steps)
- Browser test instructions

## Testing the Activation Flow

### Manual Testing

1. **Initialize the system:**
   ```javascript
   const bridge = new CartesiaAudioBridge({
     wakeWordEnabled: true,
     picovoiceAccessKey: 'your-key',
     // ... other options
   });
   await bridge.init();
   await bridge._initWakeWordInternal();
   ```

2. **Monitor activation:**
   - Watch for `_onWakeWordDetected()` to be called
   - Verify `_sttActive` becomes `true`
   - Check that `_preSpeechBuffer` is flushed
   - Confirm `_sttStreaming` is `true`
   - Verify wake word is disabled (`wakeWordManager.enabled === false`)

3. **Check console logs:**
   - Enable DEBUG mode to see detailed logs
   - Look for "Wake word detected!" messages
   - Verify "Flushing pre-speech buffer..." appears
   - Confirm "STT streaming confirmed" message

### Automated Testing

Use the browser test tool's "Run Full Test" button to automatically test:
- Pre-setup components (WebSocket, audio graph, VAD)
- Activation flow (STT activation, streaming, wake word disabling)
- Pre-speech buffer (buffer contents, flush function)
- Cooldown period (prevents re-triggering)

## Key Components to Monitor

### 1. Pre-Setup Components

These should be pre-setup during wake word initialization for low latency:

- **STT WebSocket** (`bridge.sttWs`): Should be pre-connected
- **STT Audio Graph** (`bridge.sttNode`): Should be pre-setup
- **VAD** (`bridge.vad`): Should be pre-started

### 2. Activation Flags

Monitor these flags during activation:

- `_wakeWordActive`: Set to `true` when wake word triggers
- `_sttActive`: Set to `true` when STT pipeline activates
- `_sttStreaming`: Set to `true` when streaming to STT API
- `wakeWordManager.enabled`: Should be `false` after activation

### 3. Pre-Speech Buffer

The pre-speech buffer captures audio during wake word detection:

- `_preSpeechBuffer`: Array of audio chunks
- `_flushPreSpeechBuffer()`: Flushes buffer to STT
- Should be called when STT activates

## Troubleshooting

### Issue: Wake word detected but STT doesn't activate

**Check:**
- Is `_onWakeWordDetected()` being called?
- Is cooldown period blocking activation?
- Are pre-setup components (WebSocket, audio graph, VAD) ready?
- Check console for error messages

### Issue: Pre-speech buffer not flushed

**Check:**
- Is `_flushPreSpeechBuffer()` being called?
- Does `_preSpeechBuffer` have chunks?
- Is `_sttStreaming` set to `true` before flush?

### Issue: Wake word not disabled

**Check:**
- Is `wakeWordManager.setEnabled(false)` being called?
- Is `wakeWordManager.enabled` actually `false`?
- Check if wake word is re-enabled too early

### Issue: STT WebSocket not connected

**Check:**
- Was WebSocket pre-connected during initialization?
- Is fallback connection working?
- Check WebSocket `readyState` (should be `OPEN`)

## Metrics to Track

- **Detection count**: Number of wake word detections
- **Activation time**: Time from detection to STT activation (should be < 100ms with pre-setup)
- **Buffer flushes**: Number of times pre-speech buffer was flushed
- **Pre-speech chunks**: Number of audio chunks in buffer before flush

## Best Practices

1. **Always pre-setup components** during wake word initialization for low latency
2. **Monitor cooldown period** to prevent false activations
3. **Flush pre-speech buffer immediately** when STT activates
4. **Disable wake word** during STT to prevent re-triggering
5. **Re-enable wake word** after STT stops
6. **Log all activation steps** for debugging

## Related Documentation

- `WAKE-WORD-PIPELINE-FLOW.md` - Complete pipeline flow documentation
- `wAkE wOrD dOcS.md` - Wake word documentation
- `debug/tools/test-wake-word-detection.js` - Basic wake word detection test

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the debug logs in the test tool
3. Verify configuration (API keys, wake word settings)
4. Check that all dependencies are installed
5. Review the code flow in `cartesia-audio-bridge.js`