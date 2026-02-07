# Comprehensive Research: Mic Button Toggling Unexpectedly

**Date:** 2025-01-XX  
**Issue:** Mic button keeps turning on and off when it's not supposed to

---

## 1. Problem Summary

**Symptoms:**
- Mic button toggles between active (recording) and inactive (idle) states unexpectedly
- Mic appears to turn off right after being turned on
- Mic state doesn't match the actual STT pipeline state
- User sees mic button flickering or rapidly changing states

**Expected Behavior:**
- Mic button should accurately reflect STT pipeline state
- Mic should stay on when STT is active
- Mic should only turn off when explicitly stopped or when timers expire
- No rapid toggling or flickering

---

## 2. Root Cause Analysis

### 2.1 State Management Flow

The mic button state is managed by `syncMicButton(recording, disabled)` which is called from multiple locations:

```
syncMicButton() call sites:
1. Click handler (line 621): syncMicButton(false, true) - disable while connecting
2. Click handler (line 634): syncMicButton(true, false) - enable after startSTT succeeds
3. Click handler (line 639): syncMicButton(false, false) - disable on error
4. onSTTStopped (line 451): syncMicButton(false, false) - ALWAYS sets to idle
5. onError (line 446): syncMicButton(false, false) - disable on error
6. onTranscript restart (line 412): syncMicButton(true, false) - enable after restart
7. onTranscript restart error (line 417): syncMicButton(false, false) - disable on restart error
```

### 2.2 Critical Race Condition: STT Restart After TTS

**Location:** `public/js/app.js` lines 400-414

**The Problem:**
```javascript
await bridge.speakText(replyText);
setStatus('Connecting…', '');
try {
  await bridge.startSTT();        // Line 411: Start STT
  syncMicButton(true, false);     // Line 412: Set mic to recording
  setStatus('Listening…', 'listening');
  bridge.startAgentSilenceTimer();
} catch (sttErr) {
  syncMicButton(false, false);
}
```

**Race Condition Scenario:**
1. User speaks → `onTranscript` fires
2. TTS completes → `bridge.speakText()` finishes
3. Code calls `bridge.startSTT()` (line 411)
4. **BUT** if `onSTTStopped` fires during this time (from a previous timer or cleanup), it calls `syncMicButton(false, false)` (line 451)
5. Then line 412 executes: `syncMicButton(true, false)`
6. **Result:** Mic toggles OFF then ON rapidly

**Why `onSTTStopped` might fire during restart:**
- Previous `silenceAfterSpeechToStopMicMs` timer (3.5s) might still be pending
- `stopSTT()` cleanup might be in progress from a previous operation
- WebSocket cleanup might trigger callbacks

### 2.3 Silence Timer Conflicts

**Location:** `public/js/cartesia-audio-bridge.js` lines 640-647

**The Problem:**
```javascript
onSpeechEnd: () => {
  // ... send finalize ...
  const stopMs = VAD_CONFIG.silenceAfterSpeechToStopMicMs ?? 3500;
  this._clearSilenceStopTimer();
  if (stopMs > 0) {
    this._silenceStopTimer = setTimeout(() => {
      this._silenceStopTimer = null;
      this._stopSTTAndSendTranscript();  // This calls stopSTT() → onSTTStopped
    }, stopMs);
  }
}
```

**Conflict Scenario:**
1. User speaks → `onSpeechEnd` fires → 3.5s timer starts
2. `onTranscript` processes → TTS plays → STT restarts
3. **BUT** the 3.5s timer from step 1 is still running
4. Timer fires → `stopSTT()` → `onSTTStopped` → mic turns OFF
5. **Result:** Mic turns off right after being restarted

**Issue:** The silence timer is not cleared when STT is restarted in `onTranscript`.

### 2.4 No Debouncing on Click Handler

**Location:** `public/js/app.js` lines 605-641

**The Problem:**
```javascript
btnMic.addEventListener('click', async () => {
  if (bridge.isSTTActive()) {
    bridge.stopSTT();
    return;
  }
  // ... start STT ...
});
```

**Issue:** No protection against:
- Multiple rapid clicks
- Click handler being called while async operations are in progress
- State changes during async operations

**Scenario:**
1. User clicks mic → handler starts async `startSTT()`
2. User clicks mic again before `startSTT()` completes
3. First handler: `syncMicButton(false, true)` → `startSTT()` in progress
4. Second handler: `bridge.isSTTActive()` might be false (not started yet) → starts another `startSTT()`
5. **Result:** Multiple STT instances or conflicting state updates

### 2.5 `onSTTStopped` Always Sets Mic to Idle

**Location:** `public/js/app.js` lines 449-454

**The Problem:**
```javascript
onSTTStopped: () => {
  DEBUG.trace('onSTTStopped: mic reverting to idle (syncMicButton false)');
  syncMicButton(false, false);  // ALWAYS sets to idle
  bridge.stopLevelMeter();
  setStatus('Ready');
}
```

**Issue:** `onSTTStopped` is called whenever STT stops, even if it's being immediately restarted. This causes the mic to flicker off then on.

**Better approach:** Check if STT is being restarted before setting mic to idle, or delay the state update.

### 2.6 Multiple State Update Sources Without Coordination

**The Problem:** `syncMicButton()` is called from 7+ different locations without any coordination mechanism. There's no:
- Lock/flag to prevent concurrent updates
- Queue to serialize state updates
- Check to see if an update is already pending

**Result:** Race conditions where multiple calls to `syncMicButton()` happen in quick succession, causing flickering.

---

## 3. Specific Bug Scenarios

### Scenario 1: Rapid Toggle After TTS
```
Timeline:
T+0ms:   User stops speaking → onSpeechEnd → 3.5s timer starts
T+100ms: onTranscript fires → TTS starts
T+2000ms: TTS completes → bridge.startSTT() called
T+2100ms: syncMicButton(true, false) - mic ON
T+3500ms: 3.5s timer fires → stopSTT() → onSTTStopped → syncMicButton(false, false) - mic OFF
Result: Mic toggles ON then OFF in 1.4 seconds
```

### Scenario 2: Double Click Race
```
Timeline:
T+0ms:   User clicks mic → handler starts
T+50ms:  syncMicButton(false, true) - disabled
T+100ms: bridge.startSTT() async operation starts
T+150ms: User clicks mic again → handler starts
T+200ms: bridge.isSTTActive() returns false (not started yet)
T+250ms: Second handler starts another startSTT()
Result: Two STT instances or conflicting state
```

### Scenario 3: Error During Restart
```
Timeline:
T+0ms:   TTS completes → bridge.startSTT() called
T+100ms: startSTT() throws error
T+101ms: catch block → syncMicButton(false, false) - mic OFF
T+102ms: onSTTStopped fires (from cleanup) → syncMicButton(false, false) - mic OFF (duplicate)
Result: Mic turns off (expected) but onSTTStopped still fires
```

---

## 4. Code Locations

| File | Lines | Issue |
|------|-------|-------|
| `public/js/app.js` | 88-101 | `syncMicButton()` function - no coordination |
| `public/js/app.js` | 449-454 | `onSTTStopped` - always sets to idle |
| `public/js/app.js` | 400-414 | STT restart after TTS - doesn't clear timers |
| `public/js/app.js` | 605-641 | Click handler - no debouncing |
| `public/js/cartesia-audio-bridge.js` | 640-647 | Silence timer - not cleared on restart |
| `public/js/cartesia-audio-bridge.js` | 755-840 | `stopSTT()` - always calls `onSTTStopped` |

---

## 5. Recommended Fixes

### Fix 1: Clear Silence Timer Before Restarting STT
**Location:** `public/js/app.js` line 411

**Change:**
```javascript
// Before restarting STT, ensure any pending timers are cleared
// This is handled by stopSTT(), but we should ensure it's called first
if (bridge.isSTTActive()) {
  bridge.stopSTT();  // This clears timers and calls onSTTStopped
}
await bridge.startSTT();
syncMicButton(true, false);
```

**Issue:** This will cause `onSTTStopped` to fire, which sets mic to idle, then immediately sets it back to recording. Still causes flicker.

### Fix 2: Add Flag to Suppress `onSTTStopped` During Restart
**Location:** `public/js/app.js` and `public/js/cartesia-audio-bridge.js`

**Change:**
```javascript
// In app.js
let _isRestartingSTT = false;

// In onTranscript
_isRestartingSTT = true;
await bridge.startSTT();
syncMicButton(true, false);
_isRestartingSTT = false;

// In onSTTStopped
onSTTStopped: () => {
  if (_isRestartingSTT) {
    DEBUG.trace('onSTTStopped: suppressing during restart');
    return;  // Don't set mic to idle if we're restarting
  }
  syncMicButton(false, false);
  // ...
}
```

### Fix 3: Debounce Click Handler
**Location:** `public/js/app.js` line 605

**Change:**
```javascript
let _micClickInProgress = false;

btnMic.addEventListener('click', async () => {
  if (_micClickInProgress) {
    DEBUG.trace('Mic click ignored - operation in progress');
    return;
  }
  
  _micClickInProgress = true;
  try {
    if (bridge.isSTTActive()) {
      bridge.stopSTT();
      return;
    }
    // ... rest of handler ...
  } finally {
    _micClickInProgress = false;
  }
});
```

### Fix 4: Check STT State Before Setting Mic to Idle
**Location:** `public/js/app.js` line 449

**Change:**
```javascript
onSTTStopped: () => {
  DEBUG.trace('onSTTStopped: mic reverting to idle (syncMicButton false)');
  // Only set to idle if STT is actually stopped (not being restarted)
  if (!bridge.isSTTActive()) {
    syncMicButton(false, false);
    bridge.stopLevelMeter();
    setStatus('Ready');
  } else {
    DEBUG.trace('onSTTStopped: STT still active, not updating mic button');
  }
}
```

**Issue:** `bridge.isSTTActive()` might return true if STT was just started, but `onSTTStopped` is called from cleanup. This might not work as expected.

### Fix 5: Use State Machine or Queue for Mic Updates
**Location:** `public/js/app.js` line 88

**Change:** Implement a state machine or queue to serialize mic button updates:

```javascript
let _micStateQueue = [];
let _micStateProcessing = false;

async function syncMicButton(recording = false, disabled = false) {
  _micStateQueue.push({ recording, disabled });
  if (_micStateProcessing) return;
  
  _micStateProcessing = true;
  while (_micStateQueue.length > 0) {
    const state = _micStateQueue.shift();
    // Apply state update
    if (!btnMic) continue;
    DEBUG.trace('syncMicButton', state);
    btnMic.disabled = state.disabled;
    if (state.recording) {
      btnMic.classList.add('active', 'recording');
      btnMic.setAttribute('aria-pressed', 'true');
      btnMic.setAttribute('aria-label', 'Microphone on — click to stop');
    } else {
      btnMic.classList.remove('active', 'recording');
      btnMic.setAttribute('aria-pressed', 'false');
      btnMic.setAttribute('aria-label', 'Microphone — click to talk');
    }
  }
  _micStateProcessing = false;
}
```

---

## 6. Diagnostic Tools

### Enable Debug Logging
Add `?debug=1` to URL or set `window.JARVIS_DEBUG = true` to see:
- `syncMicButton` calls with parameters
- `onSTTStopped` events
- Click handler execution
- STT start/stop operations

### Console Commands
```javascript
// Check current STT state
bridge.isSTTActive()

// Check mic button state
btnMic.classList.contains('recording')
btnMic.getAttribute('aria-pressed')

// Monitor syncMicButton calls
// (requires modifying syncMicButton to log to console)
```

---

## 7. Testing Scenarios

1. **Rapid Click Test:** Click mic button multiple times rapidly (< 500ms apart)
2. **TTS Restart Test:** Speak, wait for TTS, observe mic button during restart
3. **Silence Timer Test:** Speak, wait 3.5s, observe if mic turns off unexpectedly
4. **Error Recovery Test:** Simulate error during startSTT, verify mic state
5. **Concurrent Operations Test:** Start STT while TTS is playing, verify state

---

## 8. Priority Fixes

**High Priority:**
1. Fix 2: Suppress `onSTTStopped` during restart (prevents flicker)
2. Fix 3: Debounce click handler (prevents double-clicks)

**Medium Priority:**
3. Fix 1: Clear timers before restart (prevents timer conflicts)
4. Fix 4: Check STT state in `onSTTStopped` (safety check)

**Low Priority:**
5. Fix 5: State machine/queue (over-engineering for current issue, but more robust)

---

## 9. Files to Modify

1. `public/js/app.js` - Add restart flag, debounce click handler, update `onSTTStopped`
2. `public/js/cartesia-audio-bridge.js` - Potentially add method to check if restart is in progress

---

## 10. Related Issues

- See `debug/FALLBACK-REVERT-RESEARCH.md` for related mic revert issues
- See `debug/FRONTEND-BUTTON-N8N-PAYLOAD-FIXES.md` for button handler issues
