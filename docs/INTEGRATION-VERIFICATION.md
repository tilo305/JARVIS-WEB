# Integration Verification - openWakeWord Full Stack

This document verifies that openWakeWord and all components are fully integrated, bridged, and connected properly to the front-end, UI, mic button, send button, and backend.

## ✅ Complete Integration Chain

### 1. Frontend → Backend (openWakeWord Server)

**Path:** `app.js` → `CartesiaAudioBridge` → `OpenWakeWordManager` → `OpenWakeWordClient` → Python Server

- ✅ **Initialization**: `bridge.initWakeWord()` → `_initOpenWakeWord()` → `OpenWakeWordManager.initialize()`
- ✅ **AudioWorklet**: `wake-word-processor.js` loads and processes audio at 16kHz Int16
- ✅ **WebSocket Connection**: `OpenWakeWordClient.connect()` → `ws://localhost:8765/ws`
- ✅ **Audio Streaming**: Processor → Manager → Client → Server (1280-sample frames)
- ✅ **Activation Detection**: Server → Client → Manager → Bridge `_onWakeWordDetected()`

**Files:**
- `public/js/cartesia-audio-bridge.js` (lines 453-595): `_initOpenWakeWord()`
- `public/js/openwakeword-manager.js`: Manager initialization
- `public/js/openwakeword-client.js`: WebSocket client
- `public/audio/wake-word-processor.js`: AudioWorklet processor
- `scripts/openwakeword-server.py`: Python backend server

### 2. Mic Button Integration

**Path:** `btnMic` click → `bridge.startSTT({ skipWakeWordWait: true })` → Wake word init → STT activation

- ✅ **Button Handler**: `app.js` line 1324-1396: Click handler attached
- ✅ **STT Start**: `bridge.startSTT({ skipWakeWordWait: true })` (line 1365)
- ✅ **Wake Word Init**: `startSTT()` initializes wake word if enabled
- ✅ **UI Sync**: `syncMicButton(true, false)` updates button state (line 1366)
- ✅ **Status Updates**: `setStatus('Listening…', 'listening')` (line 1367)

**Files:**
- `public/js/app.js` (lines 1324-1396): Mic button click handler
- `public/js/cartesia-audio-bridge.js`: `startSTT()` method

### 3. Send Button Integration

**Path:** `btnSend` click → `getLLMReply()` → n8n webhook → Response → TTS

- ✅ **Button Handler**: `app.js` line 1144-1254: Click handler attached
- ✅ **Payload Building**: `buildPayload(text, { source: 'text', attachments })` (line 1175)
- ✅ **Backend Request**: `getLLMReply()` → POST to `n8nWebhookUrl` (line 1201)
- ✅ **Response Handling**: Extract reply, show in chat, play TTS if `apiKey` set
- ✅ **Error Handling**: Comprehensive error handling for network, CORS, timeout

**Files:**
- `public/js/app.js` (lines 1144-1254): Send button click handler
- `public/js/app.js` (lines 317-489): `getLLMReply()` function
- `public/js/n8n-payload.js`: Payload building utilities

### 4. Wake Word Detection → STT → Backend

**Path:** Wake word detected → `_onWakeWordDetected()` → STT activation → Transcript → n8n

- ✅ **Detection**: `OpenWakeWordManager` → `onWakeWordDetected(keywordIndex)` (line 97)
- ✅ **Bridge Handler**: `CartesiaAudioBridge._onWakeWordDetected()` (line 1161)
- ✅ **STT Activation**: Pre-setup audio graph activates immediately (line 1322-1362)
- ✅ **Transcript Flow**: STT → `onTranscript` → `getLLMReply()` → n8n (line 543-696)
- ✅ **UI Updates**: `onWakeWordDetected` callback updates status and mic button (line 749-782)

**Files:**
- `public/js/cartesia-audio-bridge.js` (lines 1161-1375): `_onWakeWordDetected()`
- `public/js/app.js` (lines 543-696): `onTranscript` handler
- `public/js/app.js` (lines 749-782): `onWakeWordDetected` callback

### 5. Audio Pipeline Integration

**Path:** MediaStream → Wake Word Processor + STT Processor (parallel)

- ✅ **Single Stream**: One `getUserMedia()` stream feeds both processors
- ✅ **Wake Word Processor**: `MediaStreamSource` → `wake-word-processor` (AudioWorklet)
- ✅ **STT Processor**: `MediaStreamSource` → `gain` → `stt-capture-processor` (AudioWorklet)
- ✅ **Parallel Processing**: Both processors run simultaneously from same stream
- ✅ **Format**: Both output 16kHz Int16 PCM (aligned with Cartesia STT specs)

**Files:**
- `public/js/cartesia-audio-bridge.js` (lines 494-536): STT graph pre-setup
- `public/js/openwakeword-manager.js` (lines 144-145): Wake word graph connection
- `public/audio/wake-word-processor.js`: Wake word AudioWorklet
- `public/audio/stt-capture-processor.js`: STT AudioWorklet

### 6. UI Integration

**Path:** Status updates, mic button sync, wake word tracker

- ✅ **Status Display**: `setStatus()` updates header status (line 209-213)
- ✅ **Mic Button Sync**: `syncMicButton()` keeps button in sync with STT state (line 216-229)
- ✅ **Wake Word Tracker**: `WakeWordTracker` shows detection metrics (line 113-175)
- ✅ **Error Display**: `onError` callback shows errors in UI (line 698-721)
- ✅ **Callbacks**: All bridge callbacks properly wired to UI updates

**Files:**
- `public/js/app.js` (lines 209-229): Status and mic button sync
- `public/js/app.js` (lines 523-813): Bridge callbacks configuration
- `public/js/wake-word-tracker.js`: Wake word tracker UI component

## 🔍 Verification Checklist

### Configuration
- [x] `VITE_WAKE_WORD_ENABLED=true` in `.env`
- [x] `VITE_USE_OPENWAKEWORD=true` in `.env`
- [x] `VITE_OPENWAKEWORD_WS_URL=ws://localhost:8765/ws` in `.env`
- [x] `VITE_CARTESIA_API_KEY` set for STT/TTS
- [x] `VITE_N8N_WEBHOOK_URL` set for backend

### Backend Server
- [x] Python server running: `python scripts/openwakeword-server.py`
- [x] Server listening on port 8765 (or configured port)
- [x] Dependencies installed: `openwakeword`, `aiohttp`, `resampy`, `numpy`

### Frontend Initialization
- [x] `CartesiaAudioBridge` created with wake word config
- [x] `OpenWakeWordManager` initialized on first user gesture
- [x] AudioWorklet processors loaded (`wake-word-processor.js`, `stt-capture-processor.js`)
- [x] WebSocket connections established (openWakeWord, STT, TTS)

### Button Connections
- [x] Mic button (`#btnMic`) click handler attached
- [x] Send button (`#btnSend`) click handler attached
- [x] Both buttons properly connected to bridge methods

### Data Flow
- [x] Wake word detection → STT activation works
- [x] Mic button → STT activation works
- [x] STT transcript → n8n backend works
- [x] Send button → n8n backend works
- [x] n8n response → TTS playback works

## 🧪 Testing Steps

1. **Start Backend Server**
   ```bash
   python scripts/openwakeword-server.py
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   # or
   npm run serve
   ```

3. **Test Mic Button**
   - Click mic button
   - Speak a command
   - Verify transcript appears in chat
   - Verify response from n8n
   - Verify TTS plays (if API key set)

4. **Test Send Button**
   - Type a message
   - Click send button
   - Verify message appears in chat
   - Verify response from n8n
   - Verify TTS plays (if API key set)

5. **Test Wake Word**
   - Wait for wake word initialization (first user gesture)
   - Say "Hey Jarvis"
   - Verify STT activates automatically
   - Speak a command
   - Verify transcript and response

## 🐛 Troubleshooting

### Wake Word Not Working
- Check console for `[JARVIS OpenWakeWord]` logs
- Verify Python server is running
- Check WebSocket URL in `.env`
- Check browser console for WebSocket errors

### Mic Button Not Working
- Check `CARTESIA_API_KEY` is set
- Check microphone permissions
- Check browser console for errors
- Verify STT WebSocket connection

### Send Button Not Working
- Check `N8N_WEBHOOK_URL` is set
- Check network tab for POST request
- Verify n8n workflow is active
- Check CORS settings

### No Audio/Transcript
- Check microphone permissions
- Check AudioContext state (should be 'running')
- Check STT WebSocket connection
- Verify audio processors are loaded

## 📝 Key Integration Points

1. **Bridge → Manager**: `CartesiaAudioBridge._initOpenWakeWord()` creates `OpenWakeWordManager`
2. **Manager → Client**: `OpenWakeWordManager` creates `OpenWakeWordClient`
3. **Client → Server**: `OpenWakeWordClient` connects to Python WebSocket server
4. **Processor → Manager**: `wake-word-processor.js` sends frames to `OpenWakeWordManager`
5. **Manager → Bridge**: `OpenWakeWordManager.onWakeWordDetected()` → `Bridge._onWakeWordDetected()`
6. **Bridge → UI**: `Bridge.onWakeWordDetected` → `app.js` callback → UI updates
7. **STT → Backend**: `Bridge.onTranscript` → `getLLMReply()` → n8n webhook
8. **Backend → UI**: n8n response → chat display + TTS playback

## ✅ Integration Status: COMPLETE

All components are properly integrated, bridged, and connected:
- ✅ Frontend ↔ Backend (openWakeWord server)
- ✅ UI ↔ Bridge (callbacks and status)
- ✅ Mic Button ↔ STT ↔ Backend
- ✅ Send Button ↔ Backend
- ✅ Wake Word ↔ STT ↔ Backend
- ✅ Audio Pipeline (parallel processing)
- ✅ Error Handling (comprehensive)
