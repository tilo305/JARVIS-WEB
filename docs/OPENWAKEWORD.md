# openWakeWord Integration

This project can use [openWakeWord](https://github.com/dscripka/openWakeWord) for wake word detection instead of Picovoice Porcupine. openWakeWord is open-source, supports "hey jarvis" out of the box, and runs in a small Python server that receives audio over WebSocket.

## Architecture

- **Browser**: Captures mic via AudioWorklet at 16 kHz Int16 PCM (aligned with [aUdiO dOcS.md](../aUdiO%20dOcS.md) and [cArTeSiA dOcS.md](../cArTeSiA%20dOcS.md)). Sends 80 ms frames (1280 samples) to the openWakeWord server over WebSocket.
- **Server**: Python script loads the openWakeWord "hey jarvis" model, receives binary PCM, runs `model.predict()`, and sends back JSON `{"activations": ["hey jarvis"]}` when the score is above the threshold (default 0.5).

## Full integration (WebSockets, processors, clients, managers, UI, back-end)

### End-to-end chain

```
[UI] Click/tap → ensureWakeWordListening() → initWakeWord() → _initOpenWakeWord()
       ↓
[Bridge] mediaStream = getUserMedia(); audioContext.init()
       ↓
[OpenWakeWordManager] new OpenWakeWordManager({ wsUrl }); .initialize(ctx, mediaStream, basePath)
       ↓
[Processor] audioWorklet.addModule('wake-word-processor.js') → 1280-sample frames @ 16 kHz Int16
       ↓
[Audio graph] MediaStreamSource(mediaStream) → WakeWordProcessor (AudioWorkletNode)
       ↓
[Manager] wakeWordNode.port.onmessage(audioFrame) → OpenWakeWordClient.sendAudio(frame)
       ↓
[OpenWakeWordClient] WebSocket(wsUrl).connect(); onConnect → sendSampleRate("16000"); send(buffer)
       ↓
[Back-end] Python server /ws ← TEXT "16000" then BINARY Int16 PCM
       ↓
[Back-end] openWakeWord Model.predict() → {"activations": ["hey jarvis"]}
       ↓
[OpenWakeWordClient] onmessage(JSON) → onActivation(keywordIndex)
       ↓
[OpenWakeWordManager] onWakeWordDetected(keywordIndex) → bridge._onWakeWordDetected()
       ↓
[Bridge] _onWakeWordDetected() → onWakeWordDetected(keywordIndex); start VAD; _sttStreaming = true
       ↓
[STT path] sttNode (pre-set in _initOpenWakeWord) already has port.onmessage → _sendChunkToSTT(buf)
       ↓
[Bridge] sttWs.send(buf) → Cartesia STT WebSocket
       ↓
[UI] onTranscript, setStatus, syncMicButton, wakeWordTracker.recordDetection()
```

### Component roles

| Component | Role |
|-----------|------|
| **WebSockets** | (1) OpenWakeWord: browser → Python `/ws` (sample rate + binary PCM). (2) Cartesia STT: browser → `wss://api.cartesia.ai/stt/websocket` (binary PCM). (3) Cartesia TTS: browser → `wss://api.cartesia.ai/tts/websocket` (JSON + base64 audio). |
| **Processors** | `wake-word-processor.js`: mic → 16 kHz Int16, 1280 samples/frame, posts `audioFrame`. `stt-capture-processor.js`: mic → 16 kHz Int16, ~100 ms chunks, posts `audio` for STT. Both fed from the same `mediaStream` (separate MediaStreamSource nodes). |
| **Clients** | `OpenWakeWordClient`: holds WebSocket to Python server; `connect()`, `sendSampleRate()`, `sendAudio()`, `onActivation`; used only by OpenWakeWordManager. |
| **Managers** | `OpenWakeWordManager`: creates processor + client, wires processor → client → server, maps activations → `onWakeWordDetected`. `CartesiaAudioBridge`: owns mediaStream, audioContext, STT/TTS WebSockets, VAD, and OpenWakeWordManager. |
| **Front-end / UI** | `app.js`: config (useOpenWakeWord, openWakeWordWsUrl), bridge options, status text ("Say \"Hey Jarvis\" to start"), wake word tracker, onWakeWordDetected (tracker + sync mic), onError (wake word errors → logWakeWordError). |
| **Back-end** | `scripts/openwakeword-server.py`: aiohttp WebSocket `/ws`, receives sample rate then binary PCM, runs openWakeWord "hey jarvis", sends `{"activations": ["hey jarvis"]}`. |
| **Mic** | Single `getUserMedia` stream; one MediaStreamSource → wake-word processor; another MediaStreamSource → gain → analyser + stt-capture processor. STT graph and `sttNode.port.onmessage` are pre-set in `_initOpenWakeWord` so wake-word → STT path works without running full `startSTT` first. |
| **Mic button** | `bridge.startSTT({ skipWakeWordWait: true })` so the user can talk without saying the wake word; same for both backends. |

## Quick start

1. **Install Python dependencies**
   ```bash
   pip install openwakeword aiohttp resampy numpy
   ```

2. **Start the openWakeWord server**
   ```bash
   python scripts/openwakeword-server.py
   ```
   Default: `http://0.0.0.0:8765`, WebSocket at `/ws`.

3. **Configure the app**
   In `.env` (or env):
   ```env
   VITE_WAKE_WORD_ENABLED=true
   VITE_USE_OPENWAKEWORD=true
   VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws
   ```

4. **Run the app** (e.g. `npm run serve` or Vite dev). Say "Hey Jarvis" to activate STT.

## Server options

```bash
python scripts/openwakeword-server.py --help
```

| Option | Default | Description |
|--------|--------|-------------|
| `--port` | 8765 | HTTP/WebSocket port |
| `--chunk-size` | 1280 | Samples per frame (80 ms @ 16 kHz) |
| `--inference-framework` | onnx | `onnx` or `tflite` |
| `--threshold` | 0.5 | Activation threshold (0–1) |
| `--verbose` | false | Log every prediction |

## Protocol

- **Client → Server**
  - First message: **TEXT** = sample rate (e.g. `16000`).
  - Then: **BINARY** = 16-bit PCM chunks (1280 samples = 80 ms @ 16 kHz recommended).
- **Server → Client**
  - On connect: `{"loaded_models": ["hey jarvis"]}`.
  - On detection: `{"activations": ["hey jarvis"]}` when score ≥ threshold.

## Latency and best practices

- **80 ms frames**: Keeps latency low while matching openWakeWord’s recommended input (see [openWakeWord README](https://github.com/dscripka/openWakeWord#usage)).
- **16 kHz mono**: Same as Cartesia STT; no extra resampling in the browser.
- **Cooldown**: 3 s after each detection to avoid double triggers (configurable via bridge).
- **Reconnect**: Client reconnects automatically (up to 10 attempts, 2 s delay).

## Error handling and logging

- **Server**: Logs connections, activations, and errors with timestamps. Invalid messages (e.g. non-numeric first text) are logged and ignored.
- **Client**: Errors and disconnects are reported via `onError` / `onDisconnect`; `logWakeWordError` is used so the UI can show the last error.
- **Build**: No API keys or keyword files are required; just run the Python server.

## References

- [openWakeWord](https://github.com/dscripka/openWakeWord) – model and usage
- [openWakeWord web example](https://github.com/dscripka/openWakeWord/tree/main/examples/web) – WebSocket streaming
- [aUdiO dOcS.md](../aUdiO%20dOcS.md) – AudioWorklet, 16 kHz, format conversion
- [cArTeSiA dOcS.md](../cArTeSiA%20dOcS.md) – STT/TTS sample rates and encoding
