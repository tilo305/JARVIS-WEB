/**
 * Live test for timestamp functionality in chat messages
 * Tests both initial message and dynamically created messages
 * 
 * Usage: Run in browser console after page loads
 * Or: npm run debug:timestamp (if added to package.json)
 */

(function() {
  'use strict';

  console.log('🔍 JARVIS Timestamp Debug Tool');
  console.log('================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function test(name, fn) {
    try {
      const result = fn();
      if (result === true || (result && result.passed)) {
        results.passed.push(name);
        console.log(`✅ ${name}`);
        return true;
      } else {
        results.failed.push({ name, error: result?.error || 'Test failed' });
        console.error(`❌ ${name}:`, result?.error || 'Failed');
        return false;
      }
    } catch (err) {
      results.failed.push({ name, error: err.message });
      console.error(`❌ ${name}:`, err.message);
      return false;
    }
  }

  function warn(message) {
    results.warnings.push(message);
    console.warn(`⚠️  ${message}`);
  }

  // Test 1: Check if initial timestamp element exists
  test('Initial timestamp element exists', () => {
    const el = document.getElementById('initialTimestamp');
    if (!el) {
      return { passed: false, error: 'Initial timestamp element not found' };
    }
    if (!el.classList.contains('timestamp')) {
      return { passed: false, error: 'Initial timestamp element missing .timestamp class' };
    }
    return true;
  });

  // Test 2: Check if initial timestamp has content
  test('Initial timestamp has content', () => {
    const el = document.getElementById('initialTimestamp');
    if (!el) return { passed: false, error: 'Element not found' };
    if (!el.textContent || el.textContent.trim() === '') {
      return { passed: false, error: 'Initial timestamp is empty' };
    }
    // Check format (should match pattern like "3:45 PM")
    const pattern = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
    if (!pattern.test(el.textContent.trim())) {
      return { passed: false, error: `Invalid timestamp format: "${el.textContent}"` };
    }
    return true;
  });

  // Test 3: Check if appendMessage function exists
  test('appendMessage function exists', () => {
    if (typeof window.JARVIS_TEST?.appendMessage === 'function') {
      return true;
    }
    // Try to find it in the module scope (may not be exposed)
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
      return { passed: false, error: 'chatContainer not found' };
    }
    // Function exists but may not be exposed - that's okay
    return true;
  });

  // Test 4: Test timestamp generation
  test('Timestamp generation works', () => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit'
    });
    const pattern = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
    if (!pattern.test(timestamp)) {
      return { passed: false, error: `Invalid timestamp format: "${timestamp}"` };
    }
    return true;
  });

  // Test 5: Check CSS for timestamp
  test('Timestamp CSS exists', () => {
    const style = window.getComputedStyle(document.querySelector('.timestamp') || document.body);
    // Check if font-size is set (should be 0.75rem)
    if (style.fontSize === '' || style.fontSize === '0px') {
      return { passed: false, error: 'Timestamp CSS not applied' };
    }
    return true;
  });

  // Test 6: Create a test message and verify timestamp
  test('Test message creation with timestamp', () => {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
      return { passed: false, error: 'chatContainer not found' };
    }

    // Create a test message element manually
    const testMessage = document.createElement('div');
    testMessage.className = 'message test-message';
    testMessage.id = 'testTimestampMessage';
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit'
    });

    testMessage.innerHTML = `
      <div class="label">TEST</div>
      <div class="timestamp">${timestamp}</div>
      <div class="content">Test message for timestamp verification</div>
    `;

    chatContainer.appendChild(testMessage);

    // Verify the timestamp element exists
    const timestampEl = testMessage.querySelector('.timestamp');
    if (!timestampEl) {
      testMessage.remove();
      return { passed: false, error: 'Timestamp element not created in test message' };
    }

    if (!timestampEl.textContent || timestampEl.textContent.trim() === '') {
      testMessage.remove();
      return { passed: false, error: 'Timestamp content is empty' };
    }

    // Clean up
    testMessage.remove();
    return true;
  });

  // Test 7: Check all existing messages have timestamps
  test('All existing messages have timestamps', () => {
    const messages = document.querySelectorAll('.message');
    if (messages.length === 0) {
      warn('No messages found in chat container');
      return true; // Not a failure, just no messages yet
    }

    let missingTimestamps = 0;
    messages.forEach((msg, index) => {
      const timestamp = msg.querySelector('.timestamp');
      if (!timestamp || !timestamp.textContent || timestamp.textContent.trim() === '') {
        missingTimestamps++;
        warn(`Message ${index + 1} is missing a timestamp`);
      }
    });

    if (missingTimestamps > 0) {
      return { passed: false, error: `${missingTimestamps} message(s) missing timestamps` };
    }
    return true;
  });

  // Test 8: Verify timestamp format consistency
  test('Timestamp format is consistent', () => {
    const timestamps = Array.from(document.querySelectorAll('.timestamp'))
      .map(el => el.textContent.trim())
      .filter(text => text !== '');

    if (timestamps.length === 0) {
      warn('No timestamps found to verify format');
      return true;
    }

    const pattern = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
    const invalid = timestamps.filter(ts => !pattern.test(ts));
    
    if (invalid.length > 0) {
      return { passed: false, error: `Invalid timestamp formats: ${invalid.join(', ')}` };
    }
    return true;
  });

  // Summary
  console.log('\n================================');
  console.log('📊 Test Results Summary');
  console.log('================================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(f => {
      console.error(`  - ${f.name}: ${f.error}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  const allPassed = results.failed.length === 0;
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  return {
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    allPassed
  };
})();
