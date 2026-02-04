# Debug Tools Summary - Comprehensive Research & New Tools

**Date:** 2026-02-02  
**Status:** ✅ All debugging tools created and verified

---

## Overview

Per **zEn DeBuGgEr.md**, comprehensive research was conducted across all JSON, NPM, TS, JS, .md, .txt files in the project to identify all issues, errors, and fixes. New LIVE debugging tools were created for specific issues that lacked dedicated debugging tools.

---

## Existing Debugging Tools (Verified)

### Node.js CLI Tools
- ✅ **check-n8n-webhook.js** - Tests n8n webhook connectivity
- ✅ **check-stt-sample-rate.js** - Validates STT sample rate configuration
- ✅ **check-porcupine-import.js** - Verifies Porcupine wake word import
- ✅ **check-wake-word-config.js** - Validates wake word configuration
- ✅ **debug-wake-word-initialization.js** - Comprehensive wake word initialization debugging
- ✅ **validate-config.js** - Validates Cartesia + n8n configuration
- ✅ **check-env.js** - Validates .env file setup
- ✅ **open-app-debug-send.mjs** - Opens app with debug mode and test message

### Browser-Based Debug Pages
- ✅ **debug-audioworklet.html** - AudioWorklet validation
- ✅ **voice-pipeline-debug.html** - Complete voice pipeline checks
- ✅ **fallback-revert-debug.html** - Tests mic button and text message fallbacks

### Jest Tests
- ✅ **format-boundary-live.test.js** - Audio Float32↔Int16 conversion tests
- ✅ **cartesia-websocket-live.test.ts** - Live Cartesia WebSocket tests
- ✅ **n8n-webhook.test.js** - n8n webhook LIVE test
- ✅ **wake-word-initialization-live.test.js** - Wake word initialization test
- ✅ **porcupine-import.test.js** - Porcupine import resolution test
- ✅ **example-run.test.js** - Bidirectional example execution

---

## New Debugging Tools Created

### 1. AudioContext Autoplay Policy Debug Tool ✅

**File:** `debug/tools/debug-audiocontext-autoplay.js`  
**Output:** `public/debug/audiocontext-autoplay-debug.html`  
**Issue:** AudioContext autoplay policy warning (from browser console image)

**Purpose:**
- Tests AudioContext creation without user gesture (should be suspended)
- Tests AudioContext resume after user gesture
- Validates AudioContext state transitions
- Tests AudioWorklet module loading
- Tests microphone access and audio processing

**Usage:**
```bash
npm run debug:audiocontext
# Then open: http://localhost:3000/debug/audiocontext-autoplay-debug.html
```

**Features:**
- Real-time AudioContext state monitoring
- User gesture detection and resume testing
- AudioWorklet module loading validation
- Microphone access testing
- Comprehensive logging and status display

---

### 2. VAD & Silence Timers Debug Tool ✅

**File:** `debug/tools/debug-vad-silence-timers.js`  
**Output:** `public/debug/vad-silence-timers-debug.html`  
**Issue:** VAD speech detection and silence timer behavior

**Purpose:**
- Tests VAD speech start/end detection
- Monitors post-speech silence timer (3.5s)
- Monitors agent silence timer (3.5s delay + 10s = 13.5s total)
- Validates timer configuration from `vad-config.js`
- Real-time event logging

**Usage:**
```bash
npm run debug:vad
# Then open: http://localhost:3000/debug/vad-silence-timers-debug.html
```

**Features:**
- Real-time VAD event monitoring
- Timer countdown displays
- Configuration display
- Event timeline
- Speech duration tracking
- Manual agent speech simulation

**Related Issues:**
- `debug/SILENCE-AND-CONVERSATION-TIMER-FIXES.md` - Timer fixes documentation
- `debug/errors-and-fixes.md` - 10s silence timer and conversation stopping fixes

---

### 3. TTS Playback Debug Tool ✅

**File:** `debug/tools/debug-tts-playback.js`  
**Output:** `public/debug/tts-playback-debug.html`  
**Issue:** TTS audio playback through AudioWorklet

**Purpose:**
- Tests TTS AudioWorklet processor loading
- Tests PCM audio playback
- Validates audio format conversion (Int16 → Float32)
- Tests chunk streaming
- Monitors playback statistics

**Usage:**
```bash
npm run debug:tts
# Then open: http://localhost:3000/debug/tts-playback-debug.html
```

**Features:**
- AudioContext initialization
- TTS processor loading
- PCM data generation and playback
- Chunk-by-chunk streaming simulation
- Playback statistics (chunks, bytes, time)
- Text-to-speech integration ready

**Related Documentation:**
- `aUdiO dOcS.md` - AudioWorklet and TTS implementation guide
- `cArTeSiA dOcS.md` - Cartesia TTS WebSocket specs

---

### 4. Barge-In Detection Debug Tool ✅

**File:** `debug/tools/debug-barge-in.js`  
**Output:** `public/debug/barge-in-debug.html`  
**Issue:** User speaking during TTS playback (barge-in)

**Purpose:**
- Tests barge-in detection (user speech during TTS)
- Validates TTS interruption on user speech
- Measures barge-in latency
- Tests natural conversational flow

**Usage:**
```bash
npm run debug:bargein
# Then open: http://localhost:3000/debug/barge-in-debug.html
```

**Features:**
- Simultaneous VAD monitoring and TTS playback
- Real-time barge-in detection
- TTS interruption on user speech
- Latency measurement
- Event timeline
- Statistics tracking

**Related Documentation:**
- `aUdiO dOcS.md` - Barge-in implementation
- `bOoK oN vOiCe BoT dEsIgN.md` - Conversational flow design

---

## All Issues Documented

### AudioContext Autoplay Policy
- **Issue:** AudioContext suspended without user gesture
- **Fix:** `audioContext.resume()` after user interaction
- **Tool:** `debug-audiocontext-autoplay.js` ✅

### VAD & Silence Timers
- **Issue:** 10s silence timer starts too early; conversation stops too early
- **Fix:** `silenceClosingDelayAfterTtsMs: 3500`, `silenceAfterSpeechToStopMicMs: 3500`
- **Tool:** `debug-vad-silence-timers.js` ✅
- **Documentation:** `debug/SILENCE-AND-CONVERSATION-TIMER-FIXES.md`

### STT Sample Rate
- **Issue:** Invalid sample rate error from Cartesia STT
- **Fix:** Config in URL query params, not first message
- **Tool:** `check-stt-sample-rate.js` ✅ (existing)
- **Documentation:** `debug/SAMPLE-RATE-RESEARCH.md`

### Wake Word Initialization
- **Issue:** Wake word initialization timeout
- **Fix:** Always return promise with timeout handling
- **Tool:** `debug-wake-word-initialization.js` ✅ (existing)
- **Documentation:** `debug/WAKE-WORD-INITIALIZATION-TIMEOUT-FIX.md`

### TTS Playback
- **Issue:** TTS audio playback issues
- **Tool:** `debug-tts-playback.js` ✅ (new)

### Barge-In Detection
- **Issue:** User speech during TTS not interrupting playback
- **Tool:** `debug-barge-in.js` ✅ (new)

### Fallback Reverts
- **Issue:** Mic button and text messages reverting to fallbacks
- **Tool:** `fallback-revert-debug.html` ✅ (existing)
- **Documentation:** `debug/FALLBACK-REVERT-RESEARCH.md`

### N8N Webhook
- **Issue:** n8n webhook connectivity and payload issues
- **Tool:** `check-n8n-webhook.js` ✅ (existing)
- **Documentation:** `debug/MIC-N8N-PAYLOAD-RESEARCH.md`

---

## NPM Scripts Added

```json
{
  "debug:audiocontext": "node debug/tools/debug-audiocontext-autoplay.js",
  "debug:vad": "node debug/tools/debug-vad-silence-timers.js",
  "debug:tts": "node debug/tools/debug-tts-playback.js",
  "debug:bargein": "node debug/tools/debug-barge-in.js"
}
```

---

## Verification Checklist

- ✅ All existing tools verified and documented
- ✅ AudioContext autoplay tool created
- ✅ VAD & Silence timers tool created
- ✅ TTS playback tool created
- ✅ Barge-in detection tool created
- ✅ All tools generate HTML debug pages in `public/debug/`
- ✅ All tools follow existing patterns and structure
- ✅ NPM scripts added for easy access
- ✅ No redundant tools created (checked against existing tools)
- ✅ All fixes documented in `debug/errors-and-fixes.md`

---

## Usage Guide

### Quick Start
```bash
# Generate all debug HTML pages
npm run debug:audiocontext
npm run debug:vad
npm run debug:tts
npm run debug:bargein

# Then open in browser (after starting server)
# http://localhost:3000/debug/audiocontext-autoplay-debug.html
# http://localhost:3000/debug/vad-silence-timers-debug.html
# http://localhost:3000/debug/tts-playback-debug.html
# http://localhost:3000/debug/barge-in-debug.html
```

### Running Server
```bash
npm run serve  # or npm run vite
```

### All Debug Tools
```bash
# Node.js CLI tools
npm run debug:n8n          # n8n webhook
npm run debug:stt          # STT sample rate
npm run debug:config       # Configuration validation
npm run debug:env          # Environment variables
npm run debug:app          # App debug mode

# Generate browser debug pages
npm run debug:audiocontext # AudioContext autoplay
npm run debug:vad          # VAD & silence timers
npm run debug:tts          # TTS playback
npm run debug:bargein      # Barge-in detection

# Jest tests
npm run debug:live        # Live Jest tests
npm test                   # All tests
```

---

## Related Documentation

- `zEn DeBuGgEr.md` - Original requirements
- `debug/README.md` - Debug suite overview
- `debug/STATUS.md` - Debug system status
- `debug/SUMMARY.md` - Simplified debug tools summary
- `debug/errors-and-fixes.md` - Comprehensive error fixes log
- `aUdiO dOcS.md` - AudioWorklet implementation guide
- `gHiDrA eNgInEeRiNg.md` - Debugging methodology reference

---

## Conclusion

✅ **All debugging tools created and verified**

- **4 new browser-based debug tools** created for specific issues
- **All existing tools** verified and documented
- **No redundant tools** created (checked against existing suite)
- **All fixes** documented and tools created for verification
- **100% working** - All tools generate functional HTML debug pages

The debugging suite is now comprehensive and covers all identified issues with dedicated LIVE testing tools.
