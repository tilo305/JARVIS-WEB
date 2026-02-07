/**
 * Test script to verify n8n error capture in copy log
 * Run this in browser console after loading the app
 */

(function() {
  console.log('%c🧪 Testing n8n Error Capture in Copy Log', 'color: #FFB800; font-size: 16px; font-weight: bold;');
  
  // Check if capture mechanism exists
  if (typeof window.__JARVIS_CAPTURED_ERRORS === 'undefined') {
    console.error('❌ Copy log capture not initialized. Make sure you\'re on the main app page.');
    return;
  }
  
  const captured = window.__JARVIS_CAPTURED_ERRORS;
  const initialCount = captured.length;
  
  console.log(`Initial captured count: ${initialCount}`);
  
  // Test 1: Simulate n8n configuration warning
  console.log('\n📝 Test 1: Simulating n8n configuration warning...');
  const n8nWarningObj = {
    status: 200,
    statusText: 'OK',
    contentType: 'application/json',
    dataKeys: '(empty)',
    issue: 'n8n returned an empty response body ({}). This usually means the Respond to Webhook node is missing or not connected in your workflow.',
    diagnostics: [
      '1. Check n8n workflow: Ensure "Respond to Webhook" node exists',
      '2. Verify Webhook node setting: "Respond" should be set to "Using Respond to Webhook Node"',
      '3. Check workflow is active: The workflow must be saved and activated in n8n'
    ],
    webhookUrl: 'https://test.example.com/webhook/test',
    timestamp: new Date().toISOString()
  };
  
  console.warn('[JARVIS] n8n configuration issue: no reply in response. Using fallback.', n8nWarningObj);
  
  // Wait a bit for capture
  setTimeout(() => {
    const afterWarningCount = captured.length;
    console.log(`After warning: ${afterWarningCount} (added ${afterWarningCount - initialCount})`);
    
    // Check if warning was captured
    const lastEntry = captured[captured.length - 1];
    if (lastEntry && lastEntry.type === 'warn') {
      const hasN8nDiagnostic = lastEntry.message.includes('[n8n Configuration Diagnostic]') || 
                                lastEntry.message.includes('[n8n Diagnostic Details]') ||
                                lastEntry.message.includes('n8n configuration issue');
      
      if (hasN8nDiagnostic) {
        console.log('✅ Test 1 PASSED: n8n warning captured with diagnostic details');
        console.log('Captured message preview:', lastEntry.message.slice(0, 200) + '...');
      } else {
        console.error('❌ Test 1 FAILED: Warning captured but missing n8n diagnostic details');
        console.log('Message:', lastEntry.message);
      }
    } else {
      console.error('❌ Test 1 FAILED: Warning not captured');
    }
    
    // Test 2: Simulate n8n error
    console.log('\n📝 Test 2: Simulating n8n error...');
    const n8nErrorObj = {
      url: 'https://test.example.com/webhook/test',
      error: 'Failed to fetch',
      errorName: 'TypeError',
      corsDetection: {
        isLikelyCORS: true
      }
    };
    
    console.error('[JARVIS] n8n webhook CORS or network error', n8nErrorObj);
    
    setTimeout(() => {
      const afterErrorCount = captured.length;
      console.log(`After error: ${afterErrorCount} (added ${afterErrorCount - afterWarningCount})`);
      
      const lastErrorEntry = captured[captured.length - 1];
      if (lastErrorEntry && lastErrorEntry.type === 'error') {
        const hasN8nError = lastErrorEntry.message.includes('[JARVIS]') && 
                            (lastErrorEntry.message.includes('n8n') || 
                             lastErrorEntry.message.includes('webhook') ||
                             lastErrorEntry.message.includes('CORS'));
        
        if (hasN8nError) {
          console.log('✅ Test 2 PASSED: n8n error captured');
          console.log('Captured message preview:', lastErrorEntry.message.slice(0, 200) + '...');
        } else {
          console.error('❌ Test 2 FAILED: Error captured but missing n8n details');
          console.log('Message:', lastErrorEntry.message);
        }
      } else {
        console.error('❌ Test 2 FAILED: Error not captured');
      }
      
      // Summary
      console.log('\n%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      console.log('%c📊 TEST SUMMARY', 'color: #FFB800; font-weight: bold;');
      console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      console.log(`Total captured: ${captured.length}`);
      console.log(`New entries: ${captured.length - initialCount}`);
      console.log('\nTo verify in copy log:');
      console.log('1. Click "Copy log" button (bottom right)');
      console.log('2. Paste the copied text');
      console.log('3. Search for "[n8n Configuration Diagnostic]" or "[JARVIS] n8n"');
      console.log('4. Verify diagnostic objects are fully captured');
      
      // Check copy log button
      const copyBtn = document.querySelector('.jarvis-copy-log-btn');
      if (copyBtn) {
        console.log(`\n✅ Copy log button found. Current count: ${copyBtn.textContent}`);
      } else {
        console.warn('⚠️ Copy log button not found in DOM');
      }
    }, 100);
  }, 100);
})();
