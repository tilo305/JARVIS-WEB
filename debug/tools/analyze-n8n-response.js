/**
 * Diagnostic tool to analyze n8n response structure
 * Helps identify why extractReplyFromJson might be failing
 * 
 * Usage in browser console:
 *   const response = await fetch(n8nWebhookUrl, {...}).then(r => r.json());
 *   analyzeN8nResponse(response);
 */

export function analyzeN8nResponse(data) {
  const N8N_REPLY_KEYS = ['output', 'reply', 'result', 'text', 'message', 'response', 'answer', 'content', 'body', 'responseText'];
  
  const analysis = {
    input: data,
    inputType: typeof data,
    isArray: Array.isArray(data),
    isObject: data && typeof data === 'object' && !Array.isArray(data),
    isEmpty: !data || (typeof data === 'object' && Object.keys(data).length === 0),
    keys: data && typeof data === 'object' ? Object.keys(data) : [],
    expectedKeys: N8N_REPLY_KEYS,
    foundExpectedKeys: [],
    foundKeysDetails: [],
    extractionResult: null,
    issues: [],
    recommendations: []
  };
  
  if (!data || typeof data !== 'object') {
    analysis.issues.push('Response is not an object');
    analysis.recommendations.push('n8n should return a JSON object, not a primitive value');
    return analysis;
  }
  
  if (Array.isArray(data)) {
    analysis.isArray = true;
    if (data.length === 0) {
      analysis.issues.push('Response is an empty array');
      analysis.recommendations.push('n8n should return a non-empty array or object');
    } else {
      analysis.firstItem = data[0];
      analysis.firstItemType = typeof data[0];
      if (typeof data[0] === 'string') {
        analysis.extractionResult = data[0];
        analysis.recommendations.push('✅ Array with string first item - this should work!');
      } else if (typeof data[0] === 'object') {
        // Check first item for expected keys
        for (const key of N8N_REPLY_KEYS) {
          if (key in data[0]) {
            analysis.foundExpectedKeys.push(key);
            const value = data[0][key];
            analysis.foundKeysDetails.push({
              key,
              value,
              type: typeof value,
              isString: typeof value === 'string',
              isEmpty: typeof value === 'string' && value.trim().length === 0,
              location: '[0].' + key
            });
          }
        }
        // Check for n8n item format
        if (data[0].json && typeof data[0].json === 'object') {
          analysis.hasJsonWrapper = true;
          for (const key of N8N_REPLY_KEYS) {
            if (key in data[0].json) {
              analysis.foundExpectedKeys.push(key);
              const value = data[0].json[key];
              analysis.foundKeysDetails.push({
                key,
                value,
                type: typeof value,
                isString: typeof value === 'string',
                isEmpty: typeof value === 'string' && value.trim().length === 0,
                location: '[0].json.' + key
              });
            }
          }
        }
      }
    }
  } else {
    // Check top-level keys
    for (const key of N8N_REPLY_KEYS) {
      if (key in data) {
        analysis.foundExpectedKeys.push(key);
        const value = data[key];
        analysis.foundKeysDetails.push({
          key,
          value,
          type: typeof value,
          isString: typeof value === 'string',
          isEmpty: typeof value === 'string' && value.trim().length === 0,
          location: key
        });
      }
    }
    
    // Check nested structures
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const replyKey of N8N_REPLY_KEYS) {
          if (replyKey in value) {
            analysis.foundExpectedKeys.push(replyKey);
            const replyValue = value[replyKey];
            analysis.foundKeysDetails.push({
              key: replyKey,
              value: replyValue,
              type: typeof replyValue,
              isString: typeof replyValue === 'string',
              isEmpty: typeof replyValue === 'string' && replyValue.trim().length === 0,
              location: `${key}.${replyKey}`
            });
          }
        }
      } else if (Array.isArray(value) && value.length > 0) {
        // Check array items
        if (typeof value[0] === 'object') {
          for (const replyKey of N8N_REPLY_KEYS) {
            if (replyKey in value[0]) {
              analysis.foundExpectedKeys.push(replyKey);
              const replyValue = value[0][replyKey];
              analysis.foundKeysDetails.push({
                key: replyKey,
                value: replyValue,
                type: typeof replyValue,
                isString: typeof replyValue === 'string',
                isEmpty: typeof replyValue === 'string' && replyValue.trim().length === 0,
                location: `${key}[0].${replyKey}`
              });
            }
          }
        }
      }
    }
  }
  
  // Analyze found keys
  const validKeys = analysis.foundKeysDetails.filter(k => k.isString && !k.isEmpty);
  if (validKeys.length > 0) {
    analysis.extractionResult = validKeys[0].value.trim();
    analysis.recommendations.push(`✅ Found valid reply in ${validKeys[0].location}: "${validKeys[0].value.slice(0, 50)}"`);
  } else {
    if (analysis.foundKeysDetails.length > 0) {
      const invalidKeys = analysis.foundKeysDetails.filter(k => !k.isString || k.isEmpty);
      analysis.issues.push(`Found expected keys but values are invalid: ${invalidKeys.map(k => `${k.location} (${k.type}${k.isEmpty ? ', empty' : ''})`).join(', ')}`);
      analysis.recommendations.push('Expected keys exist but contain non-string or empty values');
      analysis.recommendations.push('n8n should return string values in expected keys');
    } else {
      analysis.issues.push('No expected reply keys found in response');
      analysis.recommendations.push(`n8n should return one of these keys: ${N8N_REPLY_KEYS.join(', ')}`);
      analysis.recommendations.push('Current response keys: ' + analysis.keys.join(', ') || '(none)');
    }
  }
  
  return analysis;
}

// For browser console usage
if (typeof window !== 'undefined') {
  window.analyzeN8nResponse = analyzeN8nResponse;
}
