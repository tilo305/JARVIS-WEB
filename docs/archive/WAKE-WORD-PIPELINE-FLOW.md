# Wake Word Pipeline - Complete Flow Documentation

This document explains how the full pipeline works with wake word detection, from initialization to response delivery.

## Overview

The wake word pipeline enables **always-listening mode** where the system continuously monitors for a wake word (e.g., "Jarvis") and automatically activates speech recognition when detected. This provides a hands-free voice interaction experience.

---

## 1. Initialization Phase

### 1.1 App Startup (`app.js`)

When the app loads, it creates a `CartesiaAudioBridge` instance with wake word configuration:

```javascript
const bridge = new CartesiaAudioBridge({
  wakeWordEnabled: true,
  wakeWordAccessKey: '...',
  wakeWordKeywordPaths: ['keywords/jarvis_en_wasm_v3_0_0.ppn'],
  wakeWordSensitivities: [0.5],
  // ... other options
});
```

### 1.2 Wake Word Initialization (`cartesia-audio-bridge.js` → `_initWakeWordInternal()`)

**Step 1: Get Microphone Permission**
- Requests `getUserMedia()` for always-listening audio stream
- Configures audio with echo cancellation, noise suppression, auto-gain control
- Stores stream in `this.mediaStream` (kept alive for always-listening)

**Step 2: Create WakeWordManager**
- Instantiates `WakeWordManager` with Porcupine configuration
- Passes callback: `onWakeWordDetected: (keywordIndex) => this._onWakeWordDetected(keywordIndex)`

**Step 3: Initialize Porcupine (`wake-word-manager.js`)**
- Loads Porcupine Web SDK with access key and keyword files
- Validates keyword paths (supports built-in keywords like "Jarvis" or custom .ppn files)
- Creates Porcupine instance with specified sensitivities
- **Timeout: 30 seconds** for slow networks/first-time downloads

**Step 4: Setup AudioWorklet Processor**
- Loads `wake-word-processor.js` AudioWorklet module
- Creates `AudioWorkletNode` connected to microphone stream
- Processor runs in separate thread, processes audio frames at 16kHz
- **Timeout: 15 seconds** for AudioWorklet loading

**Step 5: Pre-optimization Setup (Low Latency Activation)**
To minimize wake word → STT activation latency, the system pre-sets up:

- **Pre-connect STT WebSocket** (`connectSTTWebSocket()`)
  - Establishes WebSocket connection to Cartesia STT API
  - Ready to stream audio immediately when wake word detected
  - **Latency reduction: ~500ms → ~0ms**

- **Pre-setup STT Audio Graph**
  - Creates `MediaStreamSource` → `GainNode` → `AudioWorkletNode` chain
  - Loads `stt-capture-processor.js` AudioWorklet
  - Buffers audio in `_preSpeechBuffer` (captures audio during wake word detection)
  - **Latency reduction: ~10-50ms**

- **Pre-start VAD (Voice Activity Detection)**
  - Initializes `@ricky0123/vad-web` MicVAD
  - Starts VAD but gates callbacks until STT is active
  - **Latency reduction: ~50-200ms**

**Result:** Wake word detection is active and listening continuously.

---

## 2. Always-Listening Phase

### 2.1 Continuous Audio Processing

**Audio Flow:**
```
Microphone → MediaStream → AudioWorkletNode (wake-word-processor)
                                    ↓
                            Processes frames (16kHz, Int16Array)
                                    ↓
                            Porcupine.process(frame)
                                    ↓
                            Detects wake word? → onWakeWordDetected()
```

**Wake Word Processing (`wake-word-manager.js` → `_processFrame()`)**

1. **Frame Validation**
   - Validates frame is `Int16Array` with correct length (matches Porcupine's `frameLength`)
   - Checks cooldown period (3 seconds default) to prevent re-triggering

2. **Porcupine Detection**
   - Calls `porcupine.process(frame)` on each audio frame
   - Returns `keywordIndex >= 0` if wake word detected
   - Updates metrics (detection count, latency, etc.)

3. **Callback Trigger**
   - Calls `onWakeWordDetected(keywordIndex)` callback
   - Records detection timestamp for cooldown tracking

**State:** System is idle, waiting for wake word. STT pipeline is pre-setup but inactive.

---

## 3. Wake Word Detection → STT Activation

### 3.1 Detection Handler (`cartesia-audio-bridge.js` → `_onWakeWordDetected()`)

**Step 1: Cooldown Check**
- Prevents re-triggering within 3 seconds of last detection
- Prevents activation if already active (`_wakeWordActive` flag)

**Step 2: Activate STT Pipeline**
- Sets `_wakeWordActive = true`
- Calls `onWakeWordDetected(keywordIndex)` callback (updates UI)

**Step 3: Ensure STT WebSocket Connected**
- Checks if pre-connected WebSocket is still open
- Falls back to connecting if pre-connection failed

**Step 4: Ensure Audio Graph Setup**
- Checks if pre-setup audio graph exists
- Falls back to setup if pre-setup failed

**Step 5: Ensure VAD Started**
- Checks if pre-started VAD exists
- Falls back to starting VAD if pre-start failed

**Step 6: Activate STT**
- Sets `_sttActive = true`
- Flushes `_preSpeechBuffer` (sends buffered audio captured during wake word detection)
- Sets `_sttStreaming = true` (starts streaming to STT WebSocket)
- Starts max listening timer (if configured)

**Step 7: Disable Wake Word**
- Temporarily disables wake word detection to prevent re-triggering during STT
- Will be re-enabled after STT stops

**Result:** STT pipeline is now active and streaming audio to Cartesia STT API.

---

## 4. Speech Recognition Phase

### 4.1 Audio Streaming

**Audio Flow:**
```
Microphone → MediaStreamSource → GainNode → STT AudioWorkletNode
                                                      ↓
                                            Processes audio chunks
                                                      ↓
                                            _sendChunkToSTT(buffer)
                                                      ↓
                                            STT WebSocket → Cartesia API
```

**Streaming Logic:**
- Audio chunks are captured by `stt-capture-processor.js` AudioWorklet
- Chunks are sent to STT WebSocket if `_sttStreaming === true`
- Audio is also recorded in `_recordedAudioChunks` for attachment payload

### 4.2 Voice Activity Detection (VAD)

**VAD Callbacks:**

**`onSpeechStart()`** (when VAD detects speech):
- Clears silence timers
- Resets audio recording buffer
- Sets `_isRecordingAudio = true`
- Sets `_sttStreaming = true`
- Flushes pre-speech buffer (sends buffered audio)
- Calls `this.onSpeechStart()` (updates UI: "Listening…")

**`onSpeechEnd()`** (when VAD detects speech ended):
- Sets `_sttStreaming = false`
- Sets `_isRecordingAudio = false`
- Calls `this.onSpeechEnd()` (updates UI: "Processing…")
- Sends `'finalize'` message to STT WebSocket
- Starts 2.5 second silence timer (`_silenceStopTimer`)
  - After 2.5s of silence, calls `_stopSTTAndSendTranscript()`

**`onVADMisfire()`** (speech too short):
- Calls `this.onVADMisfire()` (shows "Try again — speak a bit longer")

### 4.3 STT WebSocket Messages

**Incoming Messages from Cartesia STT:**

**Partial Transcript** (`is_final: false`):
- Updates `_lastTranscriptText`
- Calls `onPartialTranscript(text, false)` (shows live transcript in UI)

**Final Transcript** (`is_final: true`):
- Stores in `_pendingFinalTranscript`
- Will be sent to agent when silence timer fires

---

## 5. Transcript Processing → LLM Response

### 5.1 Stop STT and Send Transcript (`_stopSTTAndSendTranscript()`)

**Triggered by:**
- 2.5 second silence timer after `onSpeechEnd()`
- Max listening timer (if configured)
- Manual stop

**Process:**
1. Gets `_pendingFinalTranscript` (final transcript from STT)
2. Falls back to `_lastTranscriptText` if no final transcript
3. Calls `this.stopSTT()` (cleans up STT pipeline)
4. If transcript text exists, calls `this.onTranscript(text, true)` callback

### 5.2 App Handler (`app.js` → `onTranscript()`)

**Step 1: Validate Transcript**
- Trims and validates transcript text
- Skips if empty (no payload sent)

**Step 2: Get Recorded Audio**
- Gets base64-encoded audio from `bridge.getRecordedAudioBase64()`
- Clears recorded audio buffer to free memory
- Creates audio attachment payload

**Step 3: Build Payload**
- Calls `buildPayload(text, { source: 'voice', attachments: [...] })`
- Includes: message, session_id, message_id, timestamp, timezone, location, locale, language, attachments

**Step 4: Send to n8n**
- Calls `getLLMReply(text, { source: 'voice', attachments: [...] })`
- Sends HTTP POST to n8n webhook URL
- Waits for response

**Step 5: Process Response**
- Extracts reply text and data from n8n response
- Appends assistant message to UI
- Extracts file specs (PDFs, images, text files)

**Step 6: Text-to-Speech (if API key available)**
- Calls `bridge.speakText(replyText)`
- Streams TTS audio chunks to user
- Updates UI: "Speaking…"

**Step 7: Restart STT for Next Turn**
- After TTS completes, calls `bridge.startSTT()`
- If wake word enabled, shows "Waiting for wake word…"
- Otherwise, shows "Listening…"
- Starts agent silence timer (10 seconds)

---

## 6. Response Delivery → Return to Always-Listening

### 6.1 TTS Playback

**TTS Flow:**
```
n8n Response → bridge.speakText(text)
                      ↓
              TTS WebSocket → Cartesia API
                      ↓
              Audio chunks (base64 PCM)
                      ↓
              decodeBase64PCM() → Float32Array
                      ↓
              TTS AudioWorkletNode → AudioContext.destination
                      ↓
              User hears response
```

### 6.2 Agent Silence Timer

**After TTS completes:**
- Starts 10 second silence timer
- If no user speech detected within 10 seconds:
  - Calls `onSilenceClosingMessage(phrase)` with closing phrase (e.g., "Standing by, sir.")
  - Speaks closing phrase via TTS
  - Stops STT pipeline
  - Returns to always-listening mode (wake word re-enabled)

### 6.3 Return to Always-Listening

**When STT Stops (`stopSTT()`):**
- Cleans up STT resources (VAD, audio nodes, WebSocket)
- **Keeps media stream alive** (for always-listening)
- **Re-enables wake word** if wake word is enabled
- Calls `onSTTStopped()` (updates UI: "Ready (waiting for wake word)")

**State:** System returns to always-listening mode, waiting for next wake word detection.

---

## 7. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIALIZATION PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. App loads → Creates CartesiaAudioBridge                      │
│ 2. _initWakeWordInternal() called                                │
│ 3. Get microphone permission (getUserMedia)                     │
│ 4. Initialize Porcupine (WakeWordManager)                       │
│ 5. Setup AudioWorklet processor                                 │
│ 6. Pre-connect STT WebSocket                                    │
│ 7. Pre-setup STT audio graph                                    │
│ 8. Pre-start VAD                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  ALWAYS-LISTENING PHASE                          │
├─────────────────────────────────────────────────────────────────┤
│ • Wake word detection active (Porcupine processing frames)      │
│ • STT pipeline pre-setup but inactive                           │
│ • Waiting for wake word detection                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    [Wake Word Detected]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              WAKE WORD DETECTION → STT ACTIVATION               │
├─────────────────────────────────────────────────────────────────┤
│ 1. _onWakeWordDetected() called                                 │
│ 2. Check cooldown (prevent re-triggering)                       │
│ 3. Activate STT pipeline (_sttActive = true)                    │
│ 4. Flush pre-speech buffer (capture audio during detection)    │
│ 5. Start streaming to STT WebSocket                             │
│ 6. Disable wake word (prevent re-triggering)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SPEECH RECOGNITION PHASE                        │
├─────────────────────────────────────────────────────────────────┤
│ • Audio streaming to Cartesia STT API                          │
│ • VAD monitoring for speech start/end                           │
│ • Partial transcripts (live updates)                            │
│ • Final transcript when speech ends                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    [User stops speaking]
                            ↓
                    [2.5s silence timer]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              TRANSCRIPT PROCESSING → LLM RESPONSE               │
├─────────────────────────────────────────────────────────────────┤
│ 1. _stopSTTAndSendTranscript()                                  │
│ 2. Get final transcript                                         │
│ 3. Stop STT pipeline                                            │
│ 4. onTranscript() callback → app.js                             │
│ 5. Build payload (text + audio attachment)                      │
│ 6. Send to n8n webhook                                          │
│ 7. Receive LLM response                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE DELIVERY                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. TTS: speakText(replyText)                                    │
│ 2. Stream audio to user                                         │
│ 3. Restart STT for next turn                                    │
│ 4. Start agent silence timer (10s)                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    [10s silence → closing message]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              RETURN TO ALWAYS-LISTENING                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Stop STT pipeline                                            │
│ 2. Keep media stream alive                                      │
│ 3. Re-enable wake word detection                                │
│ 4. Return to always-listening mode                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    [Loop back to Always-Listening Phase]
```

---

## 8. Key Optimizations

### 8.1 Low Latency Activation

The system pre-sets up components to minimize wake word → STT activation latency:

| Component | Pre-Setup | Latency Reduction |
|-----------|-----------|-------------------|
| STT WebSocket | Pre-connected | ~500ms → ~0ms |
| STT Audio Graph | Pre-setup | ~10-50ms |
| VAD | Pre-started | ~50-200ms |
| **Total** | | **~560-750ms → ~0ms** |

### 8.2 Pre-Speech Buffer

Audio captured during wake word detection is buffered in `_preSpeechBuffer` and flushed when STT activates. This ensures no audio is lost between wake word detection and STT activation.

### 8.3 Cooldown Period

3-second cooldown prevents wake word from re-triggering immediately after detection, avoiding false activations.

---

## 9. Error Handling

### 9.1 Wake Word Initialization Failures

- **Network timeout**: Retries up to 2 times with exponential backoff
- **Missing keyword file**: Falls back to built-in keywords (e.g., "Jarvis")
- **Invalid AccessKey**: Shows helpful error message with recovery suggestions
- **AudioWorklet failure**: Falls back to main-thread processing

### 9.2 STT Activation Failures

- **WebSocket connection failure**: Falls back to connecting on-demand
- **Audio graph setup failure**: Falls back to setup on-demand
- **VAD start failure**: Falls back to starting on-demand

### 9.3 Runtime Errors

- **STT WebSocket errors**: Closes connection, stops STT, re-enables wake word
- **VAD errors**: Logs error, continues with fallback behavior
- **TTS errors**: Logs error, shows text response instead

---

## 10. State Management

### 10.1 Key State Flags

- `_sttActive`: STT pipeline is active (listening for speech)
- `_sttStreaming`: Audio is streaming to STT WebSocket
- `_wakeWordActive`: Wake word triggered current STT session
- `_isRecordingAudio`: Audio is being recorded for attachment payload
- `enabled` (WakeWordManager): Wake word detection is enabled

### 10.2 State Transitions

```
[Always-Listening]
  ↓ (wake word detected)
[STT Active] → [Speech Detected] → [Speech Ended] → [2.5s silence]
  ↓
[Transcript Sent] → [TTS Playing] → [STT Restarted] → [10s silence]
  ↓
[Always-Listening] (loop)
```

---

## 11. Configuration

### 11.1 Wake Word Configuration

```javascript
{
  wakeWordEnabled: true,
  wakeWordAccessKey: 'your-access-key',
  wakeWordKeywordPaths: ['keywords/jarvis_en_wasm_v3_0_0.ppn'],
  wakeWordSensitivities: [0.5], // 0.0-1.0, higher = more sensitive
  wakeWordCooldownMs: 3000 // Cooldown between detections
}
```

### 11.2 VAD Configuration (`vad-config.js`)

```javascript
{
  redemptionMs: 1200, // Silence before speech ends
  preSpeechPadMs: 800, // Audio before speech start
  minSpeechMs: 400, // Minimum speech duration
  silenceAfterSpeechToStopMicMs: 2500, // Silence before stopping mic
  maxListeningMs: 0 // Max listening time (0 = unlimited)
}
```

---

## 12. Performance Metrics

### 12.1 Wake Word Metrics

- Detection count
- Average detection latency
- Detections per hour
- Uptime

### 12.2 STT Metrics

- Transcript latency (speech end → transcript received)
- Payload send latency (transcript → n8n response)
- TTS latency (response → audio playback)

---

## Summary

The wake word pipeline provides a seamless, hands-free voice interaction experience:

1. **Always-listening**: Continuously monitors for wake word
2. **Low latency**: Pre-setup minimizes activation delay
3. **Robust**: Fallback mechanisms handle failures gracefully
4. **Efficient**: Reuses connections and resources
5. **User-friendly**: Clear state transitions and error messages

The system automatically transitions between always-listening mode and active STT sessions, providing a natural conversation flow without requiring manual button clicks.
