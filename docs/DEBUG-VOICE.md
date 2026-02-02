# JARVIS Voice Pipeline Debug Guide

Use this guide when the microphone/voice flow isn't working (e.g. you only get the "10 seconds of silence" response).

## 1. Enable Debug Logging

Open the app with `?debug=1` in the URL:

```
http://localhost:3000/?debug=1
```

Or set in the console before loading:

```js
window.JARVIS_DEBUG = true;
```

Then open DevTools (F12) → Console. You'll see detailed logs for:

- **VAD**: `onSpeechStart`, `onSpeechEnd`, misfires
- **STT**: WebSocket connect, transcript received, audio chunks
- **n8n**: Payload sent, response received

## 2. Run Voice Pipeline Checks

Go to: `http://localhost:3000/debug/voice-pipeline-debug.html`

Click **Run all checks**. This validates:

- Secure context (HTTPS or localhost)
- getUserMedia
- AudioContext and sample rate
- AudioWorklet processors (STT capture, TTS playback)
- Microphone stream
- STT capture receiving audio chunks

If "STT capture received no audio chunks" fails, the mic audio isn't reaching the processor.

## 3. Run n8n Webhook Check

```bash
npm run debug:n8n
```

Ensures the n8n webhook is reachable and responding.

## 4. Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "10 seconds of silence" only | VAD detected brief noise but no real speech; or audio not reaching Cartesia STT | Check console: `VAD onSpeechStart` should fire when you speak. If `stt-capture: audio chunk received` never appears, mic isn't reaching the processor. |
| No transcript from STT | Cartesia API key missing/invalid; STT WebSocket error | Set `VITE_CARTESIA_API_KEY` in `.env` or `window.JARVIS_CONFIG.apiKey` |
| n8n not responding | Webhook URL wrong; workflow inactive | Run `npm run debug:n8n`. Activate the n8n workflow. |
| Microphone not available | HTTP (not HTTPS/localhost); permission denied | Use `http://localhost` or HTTPS. Allow mic permission in browser. |

## 5. Checklist

1. [ ] Running on `localhost` or HTTPS
2. [ ] Microphone permission granted
3. [ ] `CARTESIA_API_KEY` (or `VITE_CARTESIA_API_KEY`) set
4. [ ] n8n webhook returns 200 (`npm run debug:n8n`)
5. [ ] DevTools console shows no red errors
6. [ ] With `?debug=1`: `VAD onSpeechStart` fires when you speak
7. [ ] With `?debug=1`: `STT transcript` appears when you speak
