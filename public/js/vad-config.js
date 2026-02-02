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
 */
export const VAD_CONFIG = {
  // Silero model: "v5" (newer, more accurate) or "legacy"
  model: 'v5',

  // redemptionMs: Time of silence before considering speech "ended".
  // Higher = more patient, don't cut off users who pause (Heuristic S7).
  // 1200ms balances turn-taking with live real-time responsiveness
  redemptionMs: 1200,

  // preSpeechPadMs: Audio to include before detected speech start (ms).
  // Ensures we capture utterance onset (e.g. "I want...").
  preSpeechPadMs: 800,

  // minSpeechMs: Minimum duration to count as valid speech.
  // Avoids processing very short noise/false triggers.
  minSpeechMs: 400,

  // positiveSpeechThreshold: Probability [0–1] to enter "speaking" state.
  positiveSpeechThreshold: 0.3,

  // negativeSpeechThreshold: Probability [0–1] to exit "speaking" state.
  negativeSpeechThreshold: 0.25,

  // submitUserSpeechOnPause: If true, pause() triggers onSpeechEnd.
  // Useful when user clicks stop mic mid-utterance.
  submitUserSpeechOnPause: true,

  // silenceAfterSpeechToStopMicMs: After VAD fires onSpeechEnd, wait this many ms
  // of continued silence then auto-stop the mic (turn off STT, update button).
  // Gives time for agent to respond while mic stops recording.
  silenceAfterSpeechToStopMicMs: 2500,

  // silenceClosingMessageMs: After the agent finishes speaking (TTS done), wait this
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
