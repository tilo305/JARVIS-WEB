/**
 * Cartesia API Configuration
 * cArTeSiA dOcS.md: optimal latency and bidirectional flow.
 * cArTeSiA wEbSoCkEt.md: research https://docs.cartesia.ai/api-reference/tts/websocket for issues/fixes.
 */
const defaultN8n = 'https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4';
export const N8N_WEBHOOK_URL =
  process.env.VITE_N8N_WEBHOOK_URL ?? process.env.N8N_WEBHOOK_URL ?? defaultN8n;

export const CARTESIA_CONFIG = {
  API_KEY: process.env.CARTESIA_API_KEY ?? process.env.VITE_CARTESIA_API_KEY ?? '',
  VOICE_ID: process.env.CARTESIA_VOICE_ID ?? process.env.VITE_CARTESIA_VOICE_ID ?? '95131c95-525c-463b-893d-803bafdf93c4',
  API_VERSION: '2025-04-16',

  // TTS: cArTeSiA dOcS — sonic-turbo 40ms first byte (real-time), sonic-3 90ms (emotive)
  // Note: Using 44100 Hz (not 8000) for better quality; processor expects 44100
  TTS: {
    ENDPOINT: 'wss://api.cartesia.ai/tts/websocket',
    MODEL: 'sonic-3' as const, // 90ms first byte, most emotive (better quality); use 'sonic-turbo' for 40ms latency
    LANGUAGE: 'en',
    SAMPLE_RATE: 44100, // Matches bridge and processor; 8000 is lower latency but 44100 is better quality
    ENCODING: 'pcm_s16le',
    // 0 = no server buffering when streaming client-side (cArTeSiA dOcS: optimal latency)
    MAX_BUFFER_DELAY_MS: 0,
  },

  // STT: cArTeSiA dOcS — 100ms chunks, ink-whisper, pcm_s16le 16kHz
  STT: {
    ENDPOINT: 'wss://api.cartesia.ai/stt/websocket',
    MODEL: 'ink-whisper',
    LANGUAGE: 'en',
    SAMPLE_RATE: 16000,
    ENCODING: 'pcm_s16le',
    MIN_VOLUME: '0.0',
    MAX_SILENCE_DURATION_SECS: '2.0',
    AUDIO_CHUNK_MS: 100,
  },
  
  // WebSocket Settings
  WS: {
    RECONNECT_DELAY: 1000,
    MAX_RECONNECT_ATTEMPTS: 5,
    TIMEOUT_MS: 180000, // 3 minutes
  }
} as const;
