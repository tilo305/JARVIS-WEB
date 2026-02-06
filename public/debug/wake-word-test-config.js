/**
 * Configuration loader for wake word activation test (OpenWakeWord)
 */

export function getWakeWordTestConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};

  // Check if env vars are explicitly set (Vite may inject 'false' as a string)
  const wakeWordEnabledEnv = env.VITE_WAKE_WORD_ENABLED || env.WAKE_WORD_ENABLED;
  const useOpenWakeWordEnv = env.VITE_USE_OPENWAKEWORD || env.USE_OPENWAKEWORD;
  
  // If env var is explicitly set, use it; otherwise check cfg or default
  const wakeWordEnabled = wakeWordEnabledEnv 
    ? wakeWordEnabledEnv.toLowerCase() === 'true'
    : (cfg.wakeWordEnabled !== undefined ? cfg.wakeWordEnabled : true);
  
  const useOpenWakeWord = useOpenWakeWordEnv
    ? useOpenWakeWordEnv.toLowerCase() === 'true'
    : (cfg.useOpenWakeWord !== undefined ? cfg.useOpenWakeWord : true);
  
  const openWakeWordWsUrl = (env.VITE_OPENWAKEWORD_WS_URL || env.OPENWAKEWORD_WS_URL || cfg.openWakeWordWsUrl || 'ws://localhost:8765/ws').trim();

  return {
    apiKey: env.VITE_CARTESIA_API_KEY || env.CARTESIA_API_KEY || cfg.apiKey || '',
    voiceId: env.VITE_CARTESIA_VOICE_ID || env.CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || env.N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || '',
    wakeWordEnabled,
    useOpenWakeWord,
    openWakeWordWsUrl,
  };
}
