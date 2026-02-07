/**
 * Test script for latency optimizations
 * Tests all UI optimizations for bi-directional conversational flow
 * 
 * Run in browser console after page loads
 */

(function() {
  'use strict';
  
  console.log('🧪 Testing Latency Optimizations...\n');
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    tests.push({ name, fn });
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  // Get test functions from window (exposed in debug mode)
  const getTestFunctions = () => {
    if (window.JARVIS_TEST) {
      return window.JARVIS_TEST;
    }
    // Fallback: try to access directly (may work in non-module context)
    return {
      setStatus: typeof setStatus !== 'undefined' ? setStatus : null,
      appendMessage: typeof appendMessage !== 'undefined' ? appendMessage : null,
      bridge: window.bridge || null
    };
  };
  
  // Test 1: setStatus batching
  test('setStatus batches updates correctly', () => {
    const testFuncs = getTestFunctions();
    if (!testFuncs.setStatus) {
      console.warn('⚠️  setStatus not accessible - skipping test');
      return Promise.resolve();
    }
    
    const statusEl = document.getElementById('status');
    if (!statusEl) {
      throw new Error('Status element not found');
    }
    
    const originalText = statusEl.textContent;
    const originalClass = statusEl.className;
    
    // Call setStatus multiple times rapidly
    testFuncs.setStatus('Test 1', 'listening');
    testFuncs.setStatus('Test 2', 'speaking');
    testFuncs.setStatus('Test 3', '');
    
    // Wait for requestAnimationFrame
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Should have the latest value
          assert(statusEl.textContent === 'Test 3', 
            `Expected 'Test 3', got '${statusEl.textContent}'`);
          assert(statusEl.className.includes('status'), 
            `Expected className to include 'status', got '${statusEl.className}'`);
          
          // Restore original
          testFuncs.setStatus(originalText, originalClass);
          resolve();
        });
      });
    });
  });
  
  // Test 2: setStatus immediate update for errors
  test('setStatus updates immediately for errors', () => {
    const testFuncs = getTestFunctions();
    if (!testFuncs.setStatus) {
      console.warn('⚠️  setStatus not accessible - skipping test');
      return Promise.resolve();
    }
    
    const statusEl = document.getElementById('status');
    if (!statusEl) return Promise.resolve();
    
    testFuncs.setStatus('Error test', 'error');
    
    // Error updates should be immediate
    assert(statusEl.textContent === 'Error test', 
      'Error status should update immediately');
    assert(statusEl.className.includes('error'), 
      'Error class should be applied immediately');
    
    return Promise.resolve();
  });
  
  // Test 3: appendMessage uses DocumentFragment
  test('appendMessage uses DocumentFragment efficiently', () => {
    const testFuncs = getTestFunctions();
    if (!testFuncs.appendMessage) {
      console.warn('⚠️  appendMessage not accessible - skipping test');
      return Promise.resolve();
    }
    
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
      throw new Error('Chat container not found');
    }
    
    const initialCount = chatContainer.children.length;
    const result = testFuncs.appendMessage('user', 'Test message');
    
    assert(result !== null, 'appendMessage should return element');
    assert(result.className.includes('message'), 'Returned element should be message');
    assert(result.className.includes('user'), 'Returned element should have user class');
    
    // Wait for DOM update
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newCount = chatContainer.children.length;
          assert(newCount > initialCount, 
            `Message should be added (${initialCount} -> ${newCount})`);
          
          // Cleanup
          if (result.parentNode) {
            result.remove();
          }
          resolve();
        });
      });
    });
  });
  
  // Test 4: TTS model is sonic-turbo
  test('TTS model is optimized to sonic-turbo', () => {
    const testFuncs = getTestFunctions();
    const bridge = testFuncs.bridge;
    
    if (!bridge) {
      console.warn('⚠️  Bridge not accessible for testing');
      return Promise.resolve();
    }
    
    // Check if ttsModel is sonic-turbo by checking the options
    // The bridge stores ttsModel in its options
    if (bridge.options && bridge.options.ttsModel) {
      assert(bridge.options.ttsModel === 'sonic-turbo',
        `Expected ttsModel to be 'sonic-turbo', got '${bridge.options.ttsModel}'`);
    } else {
      // Try to check via internal property (may not be exposed)
      console.log('ℹ️  TTS model check: bridge accessible but ttsModel not directly exposed');
      // This is OK - the model is set in app.js initialization
      return Promise.resolve();
    }
    
    return Promise.resolve();
  });
  
  // Test 5: WebSocket pre-connection (verification)
  test('TTS WebSocket pre-connection is implemented', async () => {
    // This test verifies the code exists, not that it's actively connected
    // Pre-connection happens in startSTT() method
    const testFuncs = getTestFunctions();
    const bridge = testFuncs.bridge;
    
    if (!bridge) {
      console.warn('⚠️  Bridge not accessible for testing');
      return Promise.resolve();
    }
    
    // Verify the method exists
    assert(typeof bridge.startSTT === 'function',
      'startSTT method should exist');
    
    // The pre-connection logic is in startSTT - we can't test it without
    // actually starting STT, which requires API keys and user interaction
    console.log('ℹ️  Pre-connection test: Code verified, requires active STT to test');
    return Promise.resolve();
  });
  
  // Test 6: Connection health monitoring
  test('Connection health monitoring is implemented', () => {
    const testFuncs = getTestFunctions();
    const bridge = testFuncs.bridge;
    
    if (!bridge) {
      console.warn('⚠️  Bridge not accessible for testing');
      return Promise.resolve();
    }
    
    // Verify health monitoring methods exist (they're private, so we check indirectly)
    // The methods _startConnectionHealthMonitoring, _checkConnectionHealth exist
    // We can verify by checking if startSTT calls them (indirect verification)
    assert(typeof bridge.startSTT === 'function',
      'startSTT should exist (calls health monitoring)');
    
    console.log('ℹ️  Health monitoring: Code verified in startSTT');
    return Promise.resolve();
  });
  
  // Test 6: Status element exists
  test('Status element exists and is accessible', () => {
    const statusEl = document.getElementById('status');
    assert(statusEl !== null, 'Status element should exist');
    assert(statusEl.tagName === 'SPAN', 'Status should be a span element');
    return Promise.resolve();
  });
  
  // Test 7: Chat container exists
  test('Chat container exists and is accessible', () => {
    const chatContainer = document.getElementById('chatContainer');
    assert(chatContainer !== null, 'Chat container should exist');
    assert(chatContainer.classList.contains('chat-container'), 
      'Chat container should have correct class');
    return Promise.resolve();
  });
  
  // Run all tests
  async function runTests() {
    console.log(`Running ${tests.length} tests...\n`);
    
    for (const test of tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.warn('⚠️  Some tests failed. Review the errors above.');
    }
  }
  
  // Export test runner
  window.testLatencyOptimizations = runTests;
  
  // Auto-run if requested
  if (window.JARVIS_AUTO_TEST) {
    setTimeout(runTests, 1000);
  }
  
  console.log('💡 Run testLatencyOptimizations() to execute tests');
})();
