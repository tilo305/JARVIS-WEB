/**
 * Configuration loader for wake word activation test
 * This module can access Vite's import.meta.env, unlike inline scripts
 */

export function getWakeWordTestConfig() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const win = typeof window !== 'undefined' ? window : {};
  const cfg = win.JARVIS_CONFIG || {};
  
  const picovoiceAccessKey = env.VITE_PICOVOICE_ACCESS_KEY || cfg.picovoiceAccessKey || '';
  const wakeWordEnabled = (env.VITE_WAKE_WORD_ENABLED || cfg.wakeWordEnabled || 'true').toLowerCase() === 'true';
  const rawKeyword = env.VITE_PORCUPINE_KEYWORD || cfg.porcupineKeyword || '';
  const trimmedKeyword = rawKeyword.trim();
  const porcupineKeyword = trimmedKeyword || (wakeWordEnabled && picovoiceAccessKey ? 'Jarvis' : '');
  const porcupineSensitivity = parseFloat(env.VITE_PORCUPINE_SENSITIVITY || cfg.porcupineSensitivity || '0.5');
  
  // Built-in keywords list (exact case as required by Porcupine)
  const BUILT_IN_KEYWORDS = ['Alexa', 'Americano', 'Blueberry', 'Bumblebee', 'Computer', 
    'Grapefruit', 'Grasshopper', 'Hey Google', 'Hey Siri', 'Jarvis', 
    'Okay Google', 'Picovoice', 'Porcupine', 'Terminator'];
  
  // Generate keywordPaths array
  let keywordPaths = [];
  if (porcupineKeyword && picovoiceAccessKey) {
    // Check if it's a built-in keyword (case-insensitive match, preserve exact case)
    const normalizedKeyword = porcupineKeyword.toLowerCase();
    const builtInMatch = BUILT_IN_KEYWORDS.find(k => k.toLowerCase() === normalizedKeyword);
    if (builtInMatch) {
      // Use exact case from built-in list
      keywordPaths = [builtInMatch];
    } else {
      // Custom keyword - assume it's a file path
      const keywordName = porcupineKeyword.toLowerCase().replace(/\s+/g, '-');
      keywordPaths = [`keywords/${keywordName}.ppn`];
    }
  }
  
  return {
    apiKey: env.VITE_CARTESIA_API_KEY || cfg.apiKey || '',
    picovoiceAccessKey,
    voiceId: env.VITE_CARTESIA_VOICE_ID || cfg.voiceId || '',
    n8nWebhookUrl: env.VITE_N8N_WEBHOOK_URL || cfg.n8nWebhookUrl || '',
    wakeWordEnabled,
    porcupineKeyword,
    porcupineSensitivity: isNaN(porcupineSensitivity) ? 0.5 : Math.max(0, Math.min(1, porcupineSensitivity)),
    keywordPaths: (() => {
      // Allow override from window.JARVIS_CONFIG
      if (cfg.keywordPaths && Array.isArray(cfg.keywordPaths) && cfg.keywordPaths.length > 0) {
        const filtered = cfg.keywordPaths.filter(p => p && typeof p === 'string' && p.trim().length > 0);
        return filtered.length > 0 ? filtered : keywordPaths;
      }
      return keywordPaths;
    })(),
  };
}
