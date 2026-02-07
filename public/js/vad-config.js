/**
 * VAD Configuration — Voice Activity Detection
 * Aligned with Voice Bot Design principles (bOoK oN vOiCe BoT dEsIgN.md)
 *
 * Design rationale:
 * - Turn-taking (S7): "Give users a chance before jumping in" — redemptionMs delays
 *   end-of-speech so we don't cut off users who pause mid-sentence
 * - Error handling: "No speech detected" — VAD gates audio to STT; we only send
 *   when speech is detected, avoiding empty/silence submissions
 * - Heuristic S4: Gracefully end when user is done — VAD detects natural end of turn
 * - Heuristic S2: Clear system status — onSpeechStart/onSpeechEnd drive UI feedback
 *
 * Keys passed to @ricky0123/vad-web MicVAD: model, redemptionMs, preSpeechPadMs,
 * minSpeechMs, positiveSpeechThreshold, negativeSpeechThreshold, submitUserSpeechOnPause,
 * baseAssetPath, onnxWASMBasePath. App-only (used by cartesia-audio-bridge): silenceAfterSpeechToStopMicMs,
 * silenceClosingMessageMs, silenceClosingPhrases.
 */
export const VAD_CONFIG = {
  // Silero model: "v5" (newer, more accurate) or "legacy"
  model: 'v5',

  // redemptionMs: Time of silence before considering speech "ended".
  // Higher = more patient, don't cut off users who pause (Heuristic S7).
  // Optimized to 900ms for lower latency while still being patient enough for natural pauses
  redemptionMs: 900,

  // preSpeechPadMs: Audio to include before detected speech start (ms).
  // Ensures we capture utterance onset (e.g. "I want...").
  // Optimized to 600ms for faster response while still capturing speech onset
  preSpeechPadMs: 600,

  // minSpeechMs: Minimum duration to count as valid speech.
  // Avoids processing very short noise/false triggers.
  // Reduced to 300ms for faster detection of valid speech
  minSpeechMs: 300,

  // positiveSpeechThreshold: Probability [0–1] to enter "speaking" state.
  // Optimized to 0.28 for slightly more sensitive detection (lower latency)
  positiveSpeechThreshold: 0.28,

  // negativeSpeechThreshold: Probability [0–1] to exit "speaking" state.
  // Optimized to 0.22 for slightly more sensitive end detection (lower latency)
  negativeSpeechThreshold: 0.22,

  // submitUserSpeechOnPause: If true, pause() triggers onSpeechEnd.
  // Useful when user clicks stop mic mid-utterance.
  submitUserSpeechOnPause: true,

  // silenceAfterSpeechToStopMicMs: After user stops speaking (onSpeechEnd), wait this
  // many ms of silence. Then stop mic and send buffered transcript to agent.
  // Optimized to 2500ms for faster turn-taking while still allowing natural pauses
  silenceAfterSpeechToStopMicMs: 2500,

  // maxListeningMs: Maximum time the mic can stay on in one session (ms). After this,
  // we force-stop and send any transcript. Ensures the mic always stops even if VAD
  // never fires onSpeechEnd (e.g. constant background noise).
  maxListeningMs: 60000,

  // silenceClosingDelayAfterTtsMs: Wait this long after TTS "done" before starting the
  // 10s silence countdown. TTS "done" fires when the server finishes sending audio;
  // playback may still be draining. This avoids the 10s feeling like it started too soon.
  silenceClosingDelayAfterTtsMs: 3500,

  // silenceClosingMessageMs: After the agent finishes speaking (TTS done + delay above), wait this
  // many ms of no user speech. Then output a single dynamic closing message to let
  // the user know the agent is still there, then INACTIVE.
  silenceClosingMessageMs: 10000,

  // British closing phrases (5–10 words) for silence timeout; one chosen at random.
  silenceClosingPhrases: [
    'Standing by if you need anything, sir.',
    "I'll be here when you need me, sir.",
    'At your service whenever you need me.',
    'Ready when you are, sir.',
    'I shall be here if you need me.',
    'Standing by. Do call if you need anything.',
    'Here whenever you need me, sir.',
  ],

  // CDN paths for ONNX model and WASM (no build-time copy needed)
  baseAssetPath: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/',
  onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
};
