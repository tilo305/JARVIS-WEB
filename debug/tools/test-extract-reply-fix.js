/**
 * Debug tool to test extractReplyFromJson fix for fallback revert issues
 * Tests various n8n response formats to ensure replies are extracted correctly
 * 
 * Usage: node debug/tools/test-extract-reply-fix.js
 */

import { extractReplyFromJson, N8N_REPLY_KEYS } from '../../public/js/n8n-payload.js';

const testCases = [
  // Standard cases
  {
    name: 'Standard output key',
    data: { output: 'Hello from n8n' },
    expected: 'Hello from n8n',
    shouldPass: true
  },
  {
    name: 'Standard reply key',
    data: { reply: 'This is a reply' },
    expected: 'This is a reply',
    shouldPass: true
  },
  
  // Edge cases that were causing fallbacks
  {
    name: 'Whitespace-only string (should return null)',
    data: { output: '   ' },
    expected: null,
    shouldPass: true
  },
  {
    name: 'Empty string (should return null)',
    data: { output: '' },
    expected: null,
    shouldPass: true
  },
  {
    name: 'String with whitespace (should trim)',
    data: { output: '  Trimmed reply  ' },
    expected: 'Trimmed reply',
    shouldPass: true
  },
  
  // Priority tests - should not return metadata strings
  {
    name: 'Metadata string vs expected key (should prioritize expected key)',
    data: { status: 'ok', output: 'Actual reply' },
    expected: 'Actual reply',
    shouldPass: true
  },
  {
    name: 'Multiple expected keys (should prioritize order)',
    data: { message: 'first', reply: 'second', output: 'third' },
    expected: 'third', // output is first in N8N_REPLY_KEYS
    shouldPass: true
  },
  
  // Nested structures
  {
    name: 'Deeply nested expected key',
    data: { wrapper: { nested: { deep: { output: 'Deep reply' } } } },
    expected: 'Deep reply',
    shouldPass: true
  },
  {
    name: 'Array with nested expected key',
    data: { items: [{ status: 'ok', reply: 'Array reply' }] },
    expected: 'Array reply',
    shouldPass: true
  },
  
  // n8n item format
  {
    name: 'n8n item format with json wrapper',
    data: [{ json: { output: 'From json wrapper' } }],
    expected: 'From json wrapper',
    shouldPass: true
  },
  {
    name: 'Wrapped array response',
    data: { data: [{ output: 'From wrapped array' }] },
    expected: 'From wrapped array',
    shouldPass: true
  },
  
  // Edge cases that should return null
  {
    name: 'Empty object',
    data: {},
    expected: null,
    shouldPass: true
  },
  {
    name: 'Empty array',
    data: [],
    expected: null,
    shouldPass: true
  },
  {
    name: 'Non-string expected key value',
    data: { output: 123 },
    expected: null,
    shouldPass: true
  },
  {
    name: 'Null expected key value',
    data: { output: null },
    expected: null,
    shouldPass: true
  },
  {
    name: 'Object expected key value',
    data: { output: {} },
    expected: null,
    shouldPass: true
  },
  
  // Complex nested structures
  {
    name: 'Mixed array and object with expected key',
    data: { 
      metadata: 'ignore',
      results: [{ json: { output: 'Nested array reply' } }]
    },
    expected: 'Nested array reply',
    shouldPass: true
  },
  
  // Real-world scenarios that were causing fallbacks
  {
    name: 'Response with status and message key (message is valid reply key)',
    data: { status: 'success', message: 'Operation completed' },
    expected: 'Operation completed', // 'message' is in N8N_REPLY_KEYS, so it's a valid reply
    shouldPass: true
  },
  {
    name: 'Response with status but no expected keys (should return null)',
    data: { status: 'success', info: 'No reply here' },
    expected: null, // No expected keys present
    shouldPass: true
  },
  {
    name: 'Response with status and output (should return output)',
    data: { status: 'success', output: 'Here is your answer' },
    expected: 'Here is your answer',
    shouldPass: true
  }
];

console.log('🧪 Testing extractReplyFromJson Fix\n');
console.log(`Expected reply keys (in order): ${N8N_REPLY_KEYS.join(', ')}\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const testCase of testCases) {
  const result = extractReplyFromJson(testCase.data);
  const success = result === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ ${testCase.name}`);
    if (result !== null) {
      console.log(`   Result: "${result}"`);
    } else {
      console.log(`   Result: null`);
    }
  } else {
    failed++;
    failures.push({
      ...testCase,
      actual: result
    });
    console.log(`❌ ${testCase.name}`);
    console.log(`   Expected: ${testCase.expected === null ? 'null' : `"${testCase.expected}"`}`);
    console.log(`   Actual: ${result === null ? 'null' : `"${result}"`}`);
    console.log(`   Data: ${JSON.stringify(testCase.data)}`);
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${testCases.length} total\n`);

if (failed > 0) {
  console.log('❌ FAILURES DETECTED:\n');
  failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.name}`);
    console.log(`   Expected: ${failure.expected === null ? 'null' : `"${failure.expected}"`}`);
    console.log(`   Actual: ${failure.actual === null ? 'null' : `"${failure.actual}"`}`);
    console.log(`   Data: ${JSON.stringify(failure.data, null, 2)}\n`);
  });
  process.exit(1);
} else {
  console.log('✅ All tests passed! The fix is working correctly.\n');
  process.exit(0);
}
