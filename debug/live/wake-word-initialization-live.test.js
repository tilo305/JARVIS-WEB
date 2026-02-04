/**
 * Live test: Wake word initialization with timeout detection
 * 
 * This test simulates wake word initialization and detects timeout issues.
 * Run in browser console or as part of automated testing.
 * 
 * Usage:
 *   - In browser: Open console and run this file
 *   - Or: Import and call testWakeWordInitialization()
 */

import { CartesiaAudioBridge } from '../../../public/js/cartesia-audio-bridge.js';
import { DEBUG } from '../../../public/js/debug.js';

/**
 * Test wake word initialization with timeout detection
 * @param {Object} options - Test options
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 15000)
 * @param {string} options.accessKey - Picovoice access key
 * @param {string[]} options.keywordPaths - Keyword paths
 * @param {number[]} options.sensitivities - Sensitivities array
 * @returns {Promise<{success: boolean, result?: any, error?: Error, duration?: number}>}
 */
export async function testWakeWordInitialization(options = {}) {
  const {
    timeoutMs = 15000,
    accessKey = '',
    keywordPaths = [],
    sensitivities = [0.5]
  } = options;

  const startTime = performance.now();
  const results = {
    success: false,
    duration: 0,
    steps: [],
    errors: []
  };

  console.log('[WAKE WORD TEST] Starting wake word initialization test...');
  console.log('[WAKE WORD TEST] Configuration:', {
    timeoutMs,
    hasAccessKey: !!accessKey,
    keywordCount: keywordPaths.length,
    keywordPaths
  });

  // Step 1: Validate configuration
  results.steps.push({ name: 'Validate configuration', status: 'pending' });
  if (!accessKey || accessKey.length < 20) {
    const error = new Error('Invalid or missing Picovoice AccessKey');
    results.errors.push(error);
    results.steps[0].status = 'failed';
    results.steps[0].error = error.message;
    console.error('[WAKE WORD TEST] Configuration invalid:', error.message);
    return { ...results, success: false };
  }
  results.steps[0].status = 'passed';

  if (keywordPaths.length === 0) {
    const error = new Error('No keyword paths provided');
    results.errors.push(error);
    results.steps[0].status = 'failed';
    results.steps[0].error = error.message;
    console.error('[WAKE WORD TEST] Configuration invalid:', error.message);
    return { ...results, success: false };
  }

  // Step 2: Create bridge instance
  results.steps.push({ name: 'Create CartesiaAudioBridge', status: 'pending' });
  let bridge;
  try {
    bridge = new CartesiaAudioBridge({
      picovoiceAccessKey: accessKey,
      wakeWordEnabled: true,
      wakeWordKeywordPaths: keywordPaths,
      wakeWordSensitivities: sensitivities,
      onError: (error) => {
        console.error('[WAKE WORD TEST] Bridge error:', error);
        results.errors.push(new Error(error));
      }
    });
    results.steps[1].status = 'passed';
    console.log('[WAKE WORD TEST] Bridge created successfully');
  } catch (err) {
    results.steps[1].status = 'failed';
    results.steps[1].error = err.message;
    results.errors.push(err);
    console.error('[WAKE WORD TEST] Failed to create bridge:', err);
    return { ...results, success: false };
  }

  // Step 3: Test initialization with timeout
  results.steps.push({ name: 'Initialize wake word (with timeout)', status: 'pending' });
  
  const initPromise = bridge.initWakeWord();
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Initialization timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([initPromise, timeoutPromise]);
    const duration = performance.now() - startTime;
    results.duration = duration;
    
    if (result && result.success) {
      results.steps[2].status = 'passed';
      results.steps[2].result = result;
      results.success = true;
      console.log('[WAKE WORD TEST] ✓ Initialization successful!', {
        duration: `${duration.toFixed(2)}ms`,
        reason: result.reason
      });
      return { ...results, result, success: true };
    } else {
      results.steps[2].status = 'failed';
      results.steps[2].result = result;
      const error = new Error(result?.reason || 'Initialization returned failure');
      results.errors.push(error);
      console.error('[WAKE WORD TEST] ✗ Initialization failed:', result?.reason);
      return { ...results, result, success: false, error };
    }
  } catch (err) {
    const duration = performance.now() - startTime;
    results.duration = duration;
    results.steps[2].status = 'failed';
    results.steps[2].error = err.message;
    results.errors.push(err);
    
    if (err.message.includes('timeout')) {
      console.error('[WAKE WORD TEST] ✗ TIMEOUT ERROR:', err.message);
      console.error('[WAKE WORD TEST] Duration:', `${duration.toFixed(2)}ms`);
      console.error('[WAKE WORD TEST] This indicates initialization is hanging or taking too long');
    } else {
      console.error('[WAKE WORD TEST] ✗ Initialization error:', err);
    }
    
    return { ...results, success: false, error: err };
  } finally {
    // Cleanup
    try {
      if (bridge && bridge.wakeWordManager) {
        await bridge.wakeWordManager.release();
      }
    } catch (cleanupErr) {
      console.warn('[WAKE WORD TEST] Cleanup error (non-fatal):', cleanupErr);
    }
  }
}

/**
 * Run comprehensive wake word initialization tests
 */
export async function runWakeWordInitializationTests() {
  console.log('[WAKE WORD TEST] Running comprehensive wake word initialization tests...\n');

  // Get configuration from environment or window
  const accessKey = typeof window !== 'undefined' && window.JARVIS_CONFIG?.picovoiceAccessKey
    ? window.JARVIS_CONFIG.picovoiceAccessKey
    : '';
  const keywordPaths = typeof window !== 'undefined' && window.JARVIS_CONFIG?.keywordPaths
    ? window.JARVIS_CONFIG.keywordPaths
    : ['Jarvis']; // Default to built-in keyword

  if (!accessKey) {
    console.error('[WAKE WORD TEST] No access key found. Set window.JARVIS_CONFIG.picovoiceAccessKey');
    return;
  }

  const tests = [
    {
      name: 'Test with built-in keyword (Jarvis)',
      options: {
        accessKey,
        keywordPaths: ['Jarvis'],
        sensitivities: [0.5],
        timeoutMs: 10000
      }
    },
    {
      name: 'Test with custom keyword file (if available)',
      options: {
        accessKey,
        keywordPaths: keywordPaths.filter(p => !['Jarvis', 'Computer', 'Alexa'].includes(p)),
        sensitivities: [0.5],
        timeoutMs: 15000
      }
    }
  ];

  for (const test of tests) {
    if (test.options.keywordPaths.length === 0) {
      console.log(`[WAKE WORD TEST] Skipping: ${test.name} (no keyword paths)`);
      continue;
    }

    console.log(`\n[WAKE WORD TEST] Running: ${test.name}`);
    console.log('[WAKE WORD TEST] Options:', test.options);
    
    try {
      const result = await testWakeWordInitialization(test.options);
      
      if (result.success) {
        console.log(`[WAKE WORD TEST] ✓ ${test.name} PASSED`);
      } else {
        console.error(`[WAKE WORD TEST] ✗ ${test.name} FAILED`);
        if (result.error) {
          console.error('[WAKE WORD TEST] Error:', result.error.message);
        }
      }
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[WAKE WORD TEST] ✗ ${test.name} ERROR:`, err);
    }
  }

  console.log('\n[WAKE WORD TEST] All tests completed');
}

// Auto-run if in browser and debug mode
if (typeof window !== 'undefined' && (DEBUG?.enabled || window.location?.search?.includes('debug=1'))) {
  console.log('[WAKE WORD TEST] Auto-running tests in 2 seconds...');
  setTimeout(() => {
    runWakeWordInitializationTests().catch(err => {
      console.error('[WAKE WORD TEST] Auto-run failed:', err);
    });
  }, 2000);
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testWakeWordInitialization = testWakeWordInitialization;
  window.runWakeWordInitializationTests = runWakeWordInitializationTests;
  console.log('[WAKE WORD TEST] Test functions available:');
  console.log('  - window.testWakeWordInitialization(options)');
  console.log('  - window.runWakeWordInitializationTests()');
}
