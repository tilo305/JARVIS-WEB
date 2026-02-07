/**
 * QUICK DEBUG - Paste this entire code into your browser console
 * 
 * This will run the test and show detailed results
 */

(async function() {
  if (typeof window.JARVIS === 'undefined' || !window.JARVIS.testN8nWebhook) {
    console.error('❌ JARVIS is not available. Make sure you\'re on the JARVIS app page.');
    return;
  }

  console.log('%c🔍 n8n Response Debug', 'color: #FFB800; font-size: 16px; font-weight: bold;');
  console.log('Running test...\n');

  try {
    const result = await window.JARVIS.testN8nWebhook();
    
    // Quick summary
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
    if (result.success) {
      console.log('%c✅ TEST PASSED - Reply extracted successfully!', 'color: #00FF00; font-weight: bold;');
      console.log('Reply:', result.reply);
    } else {
      console.log('%c❌ TEST FAILED - No reply extracted', 'color: #FF4444; font-weight: bold;');
    }
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
    
    // Key information
    console.log('\n📋 Response Info:');
    console.log('  Status:', result.status);
    console.log('  Has Reply:', result.hasReply ? '✅' : '❌');
    console.log('  Is Empty:', result.isEmptyResponse ? '⚠️ Yes' : '✅ No');
    console.log('  Response Keys:', result.dataKeys);
    
    // Found keys analysis
    if (result.foundKeysWithValues && result.foundKeysWithValues.length > 0) {
      console.log('\n🔑 Found Expected Keys:');
      result.foundKeysWithValues.forEach(k => {
        const icon = k.isString && !k.isEmpty ? '✅' : '❌';
        console.log(`  ${icon} ${k.key}:`, {
          value: typeof k.value === 'string' ? `"${k.value.slice(0, 50)}${k.value.length > 50 ? '...' : ''}"` : k.value,
          type: k.type,
          valid: k.isString && !k.isEmpty ? 'YES' : 'NO'
        });
      });
    } else {
      console.log('\n⚠️ No Expected Keys Found');
      console.log('  Expected:', result.expectedKeys?.join(', ') || 'output, reply, result, etc.');
      console.log('  Found:', result.dataKeys);
    }
    
    // Full response
    console.log('\n📦 Full Response Body:');
    console.log(JSON.stringify(result.body, null, 2));
    
    // Diagnostics
    if (result.diagnostics && result.diagnostics.length > 0) {
      console.log('\n💡 Diagnostics:');
      result.diagnostics.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
    }
    
    // Quick fix recommendations
    console.log('\n💡 Quick Fix:');
    if (!result.hasReply) {
      if (result.isEmptyResponse) {
        console.log('  → Add "Respond to Webhook" node in n8n workflow');
        console.log('  → Set "Respond" to "Using Respond to Webhook Node"');
      } else if (result.foundKeysWithValues && result.foundKeysWithValues.some(k => !k.isString || k.isEmpty)) {
        console.log('  → Expected keys exist but values are invalid');
        console.log('  → Ensure values are non-empty strings (not objects/arrays/empty)');
      } else {
        console.log('  → n8n must return reply in one of these keys:');
        console.log('  →', (result.expectedKeys || ['output', 'reply', 'result', 'text', 'message']).join(', '));
      }
    } else {
      console.log('  → ✅ Everything is working correctly!');
    }
    
    // Return result for further inspection
    console.log('\n📊 Full result object available in console');
    window.lastN8nTestResult = result;
    console.log('  (Also saved to window.lastN8nTestResult)');
    
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
})();
