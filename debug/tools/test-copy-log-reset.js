/**
 * Test script for Copy Error Logs Button Reset Functionality
 * 
 * This test verifies that the copy error logs button properly resets
 * when resetToReady() is called, including:
 * - Button title reset
 * - Timeout clearing
 * - Log clearing
 * - Badge visibility
 */

(function() {
  'use strict';
  
  console.log('🧪 Starting Copy Error Logs Button Reset Test...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  function assert(condition, message) {
    if (condition) {
      testResults.passed++;
      console.log(`✅ PASS: ${message}`);
    } else {
      testResults.failed++;
      testResults.errors.push(message);
      console.error(`❌ FAIL: ${message}`);
    }
  }
  
  function testButtonExists() {
    console.log('\n📋 Test 1: Button exists in DOM');
    const btn = document.getElementById('btnCopyLog');
    assert(btn !== null, 'btnCopyLog button exists');
    assert(btn !== undefined, 'btnCopyLog button is defined');
    return btn;
  }
  
  function testInitialState(btn) {
    console.log('\n📋 Test 2: Initial button state');
    assert(btn.title === 'Copy error logs', 'Initial title is "Copy error logs"');
    assert(btn._copyLogTimeout === undefined || btn._copyLogTimeout === null, 'No timeout initially');
    
    const logCount = document.getElementById('logCount');
    if (logCount) {
      const isHidden = logCount.style.display === 'none' || 
                      (window.getComputedStyle(logCount).display === 'none');
      assert(isHidden || window.JARVIS_GET_LOGS().length === 0, 'Badge is hidden when no logs');
    }
  }
  
  function testLogCapture(_btn) {
    console.log('\n📋 Test 3: Log capture and badge display');
    
    // Clear logs first
    if (window.JARVIS_CLEAR_LOGS) {
      window.JARVIS_CLEAR_LOGS();
    }
    
    // Generate some test errors
    console.error('Test error 1');
    console.warn('Test warning 1');
    console.error('Test error 2');
    
    // Wait a bit for capture
    setTimeout(() => {
      const logs = window.JARVIS_GET_LOGS();
      assert(logs.length >= 2, `At least 2 logs captured (got ${logs.length})`);
      
      const logCount = document.getElementById('logCount');
      if (logCount) {
        const isVisible = logCount.style.display !== 'none' && 
                         window.getComputedStyle(logCount).display !== 'none';
        assert(isVisible, 'Badge is visible when logs exist');
        assert(parseInt(logCount.textContent) >= 2, 'Badge shows correct count');
      }
    }, 100);
  }
  
  function testCopyLogsFunction(btn) {
    console.log('\n📋 Test 4: copyLogs function sets timeout');
    
    // Clear any existing timeout
    if (btn._copyLogTimeout) {
      clearTimeout(btn._copyLogTimeout);
      btn._copyLogTimeout = null;
    }
    
    // Mock clipboard API
    const originalWriteText = navigator.clipboard.writeText;
    let clipboardCalled = false;
    navigator.clipboard.writeText = function(_text) {
      clipboardCalled = true;
      return Promise.resolve();
    };
    
    // Call copyLogs
    if (window.JARVIS_COPY_LOGS) {
      window.JARVIS_COPY_LOGS();
    }
    
    setTimeout(() => {
      assert(clipboardCalled, 'Clipboard writeText was called');
      assert(btn.title === 'Copied!', 'Title changed to "Copied!"');
      assert(btn._copyLogTimeout !== null && btn._copyLogTimeout !== undefined, 'Timeout was set');
      
      // Restore clipboard
      navigator.clipboard.writeText = originalWriteText;
    }, 50);
  }
  
  function testResetClearsTimeout(btn) {
    console.log('\n📋 Test 5: resetToReady clears timeout');
    
    // Set up a timeout first
    if (btn._copyLogTimeout) {
      clearTimeout(btn._copyLogTimeout);
    }
    btn.title = 'Copied!';
    btn._copyLogTimeout = setTimeout(() => {
      btn.title = 'Should not reach here';
    }, 2000);
    
    // Get the status element and trigger reset
    const statusEl = document.getElementById('status');
    if (statusEl && typeof statusEl.onclick === 'function' || statusEl.addEventListener) {
      // Trigger reset by clicking status
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      statusEl.dispatchEvent(clickEvent);
    } else {
      // Try to call resetToReady directly if available
      if (window.resetToReady) {
        window.resetToReady();
      }
    }
    
    setTimeout(() => {
      assert(btn._copyLogTimeout === null || btn._copyLogTimeout === undefined, 
             'Timeout was cleared after reset');
      assert(btn.title === 'Copy error logs', 'Title was reset to "Copy error logs"');
    }, 100);
  }
  
  function testResetClearsLogs(_btn) {
    console.log('\n📋 Test 6: resetToReady clears logs');
    
    // Add some logs
    console.error('Test error for clearing');
    console.warn('Test warning for clearing');
    
    setTimeout(() => {
      const logsBefore = window.JARVIS_GET_LOGS();
      assert(logsBefore.length > 0, 'Logs exist before reset');
      
      // Trigger reset
      const statusEl = document.getElementById('status');
      if (statusEl) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });
        statusEl.dispatchEvent(clickEvent);
      }
      
      setTimeout(() => {
        const logsAfter = window.JARVIS_GET_LOGS();
        assert(logsAfter.length === 0, 'Logs were cleared after reset');
        
        const logCount = document.getElementById('logCount');
        if (logCount) {
          const isHidden = logCount.style.display === 'none' || 
                          (window.getComputedStyle(logCount).display === 'none');
          assert(isHidden, 'Badge is hidden after logs cleared');
        }
      }, 100);
    }, 100);
  }
  
  function testTimeoutExpiration(btn) {
    console.log('\n📋 Test 7: Timeout expires correctly');
    
    // Mock clipboard
    const originalWriteText = navigator.clipboard.writeText;
    navigator.clipboard.writeText = function(_text) {
      return Promise.resolve();
    };
    
    // Clear any existing timeout
    if (btn._copyLogTimeout) {
      clearTimeout(btn._copyLogTimeout);
      btn._copyLogTimeout = null;
    }
    
    // Call copyLogs
    if (window.JARVIS_COPY_LOGS) {
      window.JARVIS_COPY_LOGS();
    }
    
    setTimeout(() => {
      assert(btn.title === 'Copied!', 'Title is "Copied!" after copy');
      
      // Wait for timeout to expire (2 seconds)
      setTimeout(() => {
        assert(btn.title === 'Copy error logs', 'Title reset after timeout expires');
        assert(btn._copyLogTimeout === null || btn._copyLogTimeout === undefined, 
               'Timeout cleared after expiration');
        
        // Restore clipboard
        navigator.clipboard.writeText = originalWriteText;
      }, 2100);
    }, 50);
  }
  
  function testMultipleResets(btn) {
    console.log('\n📋 Test 8: Multiple resets work correctly');
    
    // Set up state
    btn.title = 'Copied!';
    btn._copyLogTimeout = setTimeout(() => {}, 2000);
    console.error('Test error');
    
    setTimeout(() => {
      // First reset
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      
      setTimeout(() => {
        assert(btn.title === 'Copy error logs', 'First reset worked');
        assert(btn._copyLogTimeout === null || btn._copyLogTimeout === undefined, 
               'Timeout cleared on first reset');
        
        // Second reset (should be idempotent)
        if (statusEl) {
          statusEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
        
        setTimeout(() => {
          assert(btn.title === 'Copy error logs', 'Second reset still correct');
          assert(btn._copyLogTimeout === null || btn._copyLogTimeout === undefined, 
                 'Timeout still cleared on second reset');
        }, 50);
      }, 50);
    }, 50);
  }
  
  // Run all tests
  function runTests() {
    const btn = testButtonExists();
    if (!btn) {
      console.error('❌ Cannot run tests: button not found');
      return;
    }
    
    testInitialState(btn);
    testLogCapture(btn);
    testCopyLogsFunction(btn);
    testResetClearsTimeout(btn);
    testResetClearsLogs(btn);
    testTimeoutExpiration(btn);
    testMultipleResets(btn);
    
    // Wait for all async tests to complete
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('📊 Test Results Summary');
      console.log('='.repeat(60));
      console.log(`✅ Passed: ${testResults.passed}`);
      console.log(`❌ Failed: ${testResults.failed}`);
      
      if (testResults.errors.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.errors.forEach((error, i) => {
          console.log(`  ${i + 1}. ${error}`);
        });
      }
      
      if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed!');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.');
      }
      
      // Expose results globally
      window.__COPY_LOG_RESET_TEST_RESULTS = testResults;
    }, 3000);
  }
  
  // Wait for DOM and functions to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runTests, 500);
    });
  } else {
    setTimeout(runTests, 500);
  }
})();
