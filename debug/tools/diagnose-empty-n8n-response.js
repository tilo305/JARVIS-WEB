/**
 * Diagnostic tool for empty n8n response issue
 * 
 * Usage: Run this in browser console after getting empty response from n8n
 */

(function() {
  console.log('%c🔍 n8n Empty Response Diagnostic Tool', 'color: #FFB800; font-size: 16px; font-weight: bold;');
  console.log('This tool helps diagnose why n8n is returning empty responses.\n');

  async function diagnoseEmptyResponse() {
    // Run the test
    if (!window.JARVIS || !window.JARVIS.testN8nWebhook) {
      console.error('❌ JARVIS.testN8nWebhook is not available');
      return;
    }

    console.log('Running n8n webhook test...\n');
    const result = await window.JARVIS.testN8nWebhook();

    console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');
    console.log('%c📊 DIAGNOSIS RESULTS', 'color: #FFB800; font-weight: bold;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #FFB800;');

    if (result.isEmptyResponse) {
      console.log('%c❌ ISSUE: Empty Response Body', 'color: #FF4444; font-weight: bold;');
      console.log('n8n returned: {}');
      console.log('This means the "Respond to Webhook" node is missing or not connected.\n');

      console.log('%c🔧 FIX STEPS:', 'color: #FFB800; font-weight: bold;');
      console.log('1. Open your n8n workflow');
      console.log('2. Check if "Respond to Webhook" node exists');
      console.log('3. If missing: Add "Respond to Webhook" node after your AI Agent node');
      console.log('4. If exists: Check connection - it must be connected AFTER the AI Agent node');
      console.log('5. Configure the node:');
      console.log('   - Set "Respond" to "Using Respond to Webhook Node" (NOT "Immediately")');
      console.log('   - Set "Response Data" to "First Incoming Item"');
      console.log('6. Ensure your AI Agent node outputs the reply in one of these keys:');
      console.log('   - output (preferred)');
      console.log('   - reply');
      console.log('   - result');
      console.log('   - text');
      console.log('   - message');
      console.log('   - response');
      console.log('   - answer');
      console.log('   - content');
      console.log('7. Save and ACTIVATE the workflow\n');

      console.log('%c📋 WORKFLOW STRUCTURE SHOULD BE:', 'color: #4488FF; font-weight: bold;');
      console.log('Webhook → AI Agent → Respond to Webhook');
      console.log('                    ↑');
      console.log('              (must be connected)\n');

      console.log('%c💡 EXAMPLE n8n FUNCTION NODE:', 'color: #00FF00; font-weight: bold;');
      console.log('If you need to format the response, add a Function node before Respond to Webhook:');
      console.log(`
// In n8n Function node (between AI Agent and Respond to Webhook):
const aiResponse = $input.item.json;
return {
  output: aiResponse.reply || aiResponse.message || aiResponse.text || "Default reply"
};
      `);

      console.log('\n%c🔗 WEBHOOK URL:', 'color: #FFB800; font-weight: bold;');
      console.log(result.webhookUrl);

      console.log('\n%c✅ AFTER FIXING:', 'color: #00FF00; font-weight: bold;');
      console.log('1. Save and activate the workflow in n8n');
      console.log('2. Run: JARVIS.testN8nWebhook() again');
      console.log('3. Should see: success: true, hasReply: true');

    } else if (!result.hasReply) {
      console.log('%c⚠️ ISSUE: Response Received But No Reply', 'color: #FFB800; font-weight: bold;');
      console.log('n8n returned a response but no reply was found in expected keys.\n');
      console.log('Response keys:', result.dataKeys);
      console.log('Expected keys:', result.expectedKeys);
      
      if (result.foundKeysWithValues && result.foundKeysWithValues.length > 0) {
        console.log('\nFound expected keys but values are invalid:');
        result.foundKeysWithValues.forEach(k => {
          console.log(`  - ${k.key}: ${k.type}${k.isEmpty ? ' (empty)' : ''}`);
        });
        console.log('\nFix: Ensure values are non-empty strings');
      } else {
        console.log('\nFix: n8n must return reply in one of the expected keys');
      }
    } else {
      console.log('%c✅ SUCCESS!', 'color: #00FF00; font-weight: bold;');
      console.log('Reply extracted:', result.reply);
    }

    return result;
  }

  // Auto-run
  diagnoseEmptyResponse().catch(err => {
    console.error('Error:', err);
  });

  // Expose function
  window.diagnoseEmptyN8nResponse = diagnoseEmptyResponse;
  console.log('\n💡 Function available: diagnoseEmptyN8nResponse()');
})();
