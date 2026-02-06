/**
 * Live test: Wake word initialization (OpenWakeWord)
 *
 * Run in browser or as part of automated testing.
 * Requires OpenWakeWord server: python scripts/openwakeword-server.py
 */

import { CartesiaAudioBridge } from '../../../public/js/cartesia-audio-bridge.js';

/**
 * Test wake word initialization (OpenWakeWord)
 * @param {Object} options - Test options
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 15000)
 * @param {string} options.wsUrl - OpenWakeWord WebSocket URL
 * @returns {Promise<{success: boolean, result?: any, error?: Error, duration?: number}>}
 */
export async function testWakeWordInitialization(options = {}) {
  const { timeoutMs = 15000, wsUrl = 'ws://localhost:8765/ws' } = options;

  const startTime = performance.now();
  const results = {
    success: false,
    duration: 0,
    steps: [],
    errors: []
  };

  console.log('[WAKE WORD TEST] Starting OpenWakeWord initialization test...');
  console.log('[WAKE WORD TEST] Configuration:', { timeoutMs, wsUrl });

  results.steps.push({ name: 'Validate configuration', status: 'pending' });
  if (!wsUrl || typeof wsUrl !== 'string' || !wsUrl.trim()) {
    const error = new Error('OpenWakeWord WebSocket URL is required');
    results.errors.push(error);
    results.steps[0].status = 'failed';
    results.steps[0].error = error.message;
    return { ...results, success: false };
  }
  results.steps[0].status = 'passed';

  results.steps.push({ name: 'Create CartesiaAudioBridge', status: 'pending' });
  let bridge;
  try {
    bridge = new CartesiaAudioBridge({
      wakeWordEnabled: true,
      useOpenWakeWord: true,
      openWakeWordWsUrl: wsUrl,
      onError: (error) => {
        console.error('[WAKE WORD TEST] Bridge error:', error);
        results.errors.push(new Error(error));
      }
    });
    results.steps[1].status = 'passed';
  } catch (err) {
    results.steps[1].status = 'failed';
    results.steps[1].error = err.message;
    results.errors.push(err);
    return { ...results, success: false };
  }

  results.steps.push({ name: 'Initialize wake word (with timeout)', status: 'pending' });
  const initPromise = bridge.initWakeWord();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Initialization timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    const result = await Promise.race([initPromise, timeoutPromise]);
    const duration = performance.now() - startTime;
    results.duration = duration;

    if (result && result.success) {
      results.steps[2].status = 'passed';
      results.steps[2].result = result;
      results.success = true;
      console.log('[WAKE WORD TEST] ✓ Initialization successful!', { duration: `${duration.toFixed(2)}ms` });
      return { ...results, result, success: true };
    } else {
      results.steps[2].status = 'failed';
      results.steps[2].result = result;
      const error = new Error(result?.reason || 'Initialization returned failure');
      results.errors.push(error);
      return { ...results, result, success: false, error };
    }
  } catch (err) {
    const duration = performance.now() - startTime;
    results.duration = duration;
    results.steps[2].status = 'failed';
    results.steps[2].error = err.message;
    results.errors.push(err);
    return { ...results, success: false, error: err };
  } finally {
    try {
      if (bridge?.wakeWordManager?.release) {
        await bridge.wakeWordManager.release();
      }
    } catch (cleanupErr) {
      console.warn('[WAKE WORD TEST] Cleanup error (non-fatal):', cleanupErr);
    }
  }
}

export async function runWakeWordInitializationTests() {
  console.log('[WAKE WORD TEST] Running OpenWakeWord initialization tests...\n');
  const wsUrl = typeof window !== 'undefined' && window.JARVIS_CONFIG?.openWakeWordWsUrl
    ? window.JARVIS_CONFIG.openWakeWordWsUrl
    : 'ws://localhost:8765/ws';

  console.log('[WAKE WORD TEST] Running test with wsUrl:', wsUrl);
  const result = await testWakeWordInitialization({ wsUrl, timeoutMs: 10000 });
  if (result.success) {
    console.log('[WAKE WORD TEST] ✓ PASSED');
  } else {
    console.error('[WAKE WORD TEST] ✗ FAILED:', result.error?.message);
  }
  return result;
}
