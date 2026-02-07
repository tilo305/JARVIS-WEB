/**
 * Browser Console Debug Helper for n8n Response Issues
 * 
 * Paste this into your browser console to get detailed diagnostics
 */

(function() {
  if (typeof window.JARVIS === 'undefined' || !window.JARVIS.testN8nWebhook) {
    console.error('❌ JARVIS is not available. Make sure you\'re on the JARVIS app page.');
    return;
  }

  console.log('%c🔍 n8n Response Debug Helper', 'color: #FFB800; font-size: 16px; font-weight: bold;');
  console.log('Running comprehensive test...\n');

  window.debugN8nResponse = async function() {
    try {
      const result = await window.JARVIS.testN8nWebhook();
      
      console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      console.log('%c📊 TEST RESULTS', 'color: #FFB800; font-size: 14px; font-weight: bold;');
      console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      
      // Status
      if (result.success) {
        console.log('%c✅ TEST PASSED', 'color: #00FF00; font-weight: bold;');
        console.log('Reply extracted:', result.reply);
      } else {
        console.log('%c❌ TEST FAILED', 'color: #FF4444; font-weight: bold;');
      }
      
      console.log('\n%c📋 BASIC INFO', 'color: #4488FF; font-weight: bold;');
      console.log('Status:', result.status, result.statusText || '');
      console.log('Has Reply:', result.hasReply ? '✅ Yes' : '❌ No');
      console.log('Is Empty:', result.isEmptyResponse ? '⚠️ Yes' : '✅ No');
      console.log('Response Keys:', result.dataKeys);
      
      // Found keys
      if (result.foundKeysWithValues && result.foundKeysWithValues.length > 0) {
        console.log('\n%c🔑 FOUND EXPECTED KEYS', 'color: #FFB800; font-weight: bold;');
        result.foundKeysWithValues.forEach(k => {
          const status = k.isString && !k.isEmpty ? '✅' : '❌';
          console.log(`${status} ${k.key}:`, {
            value: k.value,
            type: k.type,
            isString: k.isString,
            isEmpty: k.isEmpty,
            location: k.location || 'top-level'
          });
        });
      } else {
        console.log('\n%c⚠️ NO EXPECTED KEYS FOUND', 'color: #FFB800; font-weight: bold;');
        console.log('Expected keys:', result.expectedKeys || ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content']);
        console.log('Response has keys:', result.dataKeys);
      }
      
      // Response structure
      if (result.extractionDebug) {
        console.log('\n%c🏗️ RESPONSE STRUCTURE', 'color: #4488FF; font-weight: bold;');
        console.log('Type:', result.extractionDebug.responseType);
        console.log('Is Array:', result.extractionDebug.isArray);
        if (result.extractionDebug.arrayLength !== null) {
          console.log('Array Length:', result.extractionDebug.arrayLength);
        }
        if (result.extractionDebug.firstItemType) {
          console.log('First Item Type:', result.extractionDebug.firstItemType);
        }
      }
      
      // Full response
      console.log('\n%c📦 FULL RESPONSE BODY', 'color: #4488FF; font-weight: bold;');
      console.log(JSON.stringify(result.body, null, 2));
      
      // Diagnostics
      if (result.diagnostics && result.diagnostics.length > 0) {
        console.log('\n%c💡 DIAGNOSTICS', 'color: #FFB800; font-weight: bold;');
        result.diagnostics.forEach((diag, i) => {
          console.log(`${i + 1}. ${diag}`);
        });
      }
      
      // Recommendations
      console.log('\n%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      console.log('%c💡 RECOMMENDATIONS', 'color: #FFB800; font-weight: bold;');
      console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
      
      if (!result.hasReply) {
        if (result.isEmptyResponse) {
          console.log('1. ❌ Empty response: Add "Respond to Webhook" node in n8n');
          console.log('2. Set "Respond" to "Using Respond to Webhook Node"');
          console.log('3. Connect it after your AI Agent node');
        } else if (result.foundKeysWithValues && result.foundKeysWithValues.length > 0) {
          const invalid = result.foundKeysWithValues.filter(k => !k.isString || k.isEmpty);
          if (invalid.length > 0) {
            console.log('1. ❌ Expected keys found but values are invalid:');
            invalid.forEach(k => {
              console.log(`   - ${k.key}: ${k.type}${k.isEmpty ? ' (empty)' : ''}`);
            });
            console.log('2. Fix: Ensure values are non-empty strings');
          }
        } else {
          console.log('1. ❌ No expected keys found in response');
          console.log('2. Fix: n8n must return reply in one of:', result.expectedKeys?.join(', ') || 'output, reply, result, etc.');
          console.log('3. Check "Respond to Webhook" node configuration');
        }
      } else {
        console.log('✅ Everything looks good! Reply was successfully extracted.');
      }
      
      console.log('\n%c📚 For more help, see: debug/TROUBLESHOOTING-FALLBACK-ISSUE.md', 'color: #888; font-style: italic;');
      
      return result;
    } catch (error) {
      console.error('❌ Error running test:', error);
      throw error;
    }
  };

  console.log('✅ Helper loaded! Run: debugN8nResponse()');
  console.log('Or use: JARVIS.testN8nWebhook() for raw results\n');
  
  // Auto-run if requested
  if (window.autoDebugN8n) {
    window.debugN8nResponse();
  }
})();
