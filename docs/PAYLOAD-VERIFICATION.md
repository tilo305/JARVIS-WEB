# Payload Verification System

> **Note (2026-02-07):** The runtime module `public/js/payload-verification.js` was removed as orphaned (not imported by the app). This doc is kept for reference; payload building and reply extraction remain in `n8n-payload.js`.

This document describes the comprehensive payload verification system that ensures the front-end, UI, and back-end are sending and receiving payloads correctly.

## Overview

The payload verification system provides:

- **Payload validation** before sending to n8n
- **Response validation** after receiving from n8n
- **Payload monitoring** to track all sends and receives
- **Health checks** to verify the payload flow is working correctly

## Components

### 1. Payload Verification Module (`public/js/payload-verification.js`)

#### `validatePayload(payload)`

Validates payload structure before sending:

- Checks all required fields are present
- Validates field types and values
- Checks for consistency (e.g., `session_id` matches `sessionId`)
- Validates timestamp format
- Validates attachments structure

**Returns:**

```javascript
{
  valid: boolean,
  errors: string[],
  warnings: string[]
}
```

#### `validateResponse(response)`

Validates response structure from n8n:

- Checks if response is an object
- Looks for expected reply keys (`output`, `reply`, `result`, etc.)
- Handles array responses (n8n item format)
- Checks nested objects

**Returns:**

```javascript
{
  valid: boolean,
  hasReply: boolean,
  replyKey: string|null,
  errors: string[],
  warnings: string[]
}
```

#### `PayloadMonitor` Class

Tracks all payload sends and receives:

- Records payload details (size, source, attachments, validation)
- Records response details (status, validation)
- Maintains history (last 100 records)
- Provides statistics

**Methods:**

- `recordSend(payload, url, timestamp)` - Record a payload send
- `recordReceive(response, status, url, timestamp)` - Record a response receive
- `getStats()` - Get statistics about payload flow
- `getRecentHistory(count)` - Get recent sends/receives
- `clear()` - Clear history

#### `verifyPayloadFlow()`

Comprehensive health check:

- Checks if payloads are being sent
- Checks if responses are being received
- Validates payload structure
- Validates response structure
- Identifies issues and warnings

**Returns:**

```javascript
{
  healthy: boolean,
  stats: {
    sends: { total, recent, valid, invalid, ... },
    receives: { total, recent, withReply, withoutReply, ... },
    health: { sendHealth, receiveHealth, overallHealth }
  },
  issues: Array<{ severity: 'error'|'warning', message: string }>,
  recent: { sends: [], receives: [] },
  timestamp: string
}
```

## Integration

The verification system is automatically integrated into `app.js`:

1. **Before sending payload:**
   - Validates payload structure
   - Records send in monitor
   - Logs validation results

2. **After receiving response:**
   - Validates response structure
   - Records receive in monitor
   - Logs validation results

## Usage

### In Browser Console

#### Check Payload Flow Health

```javascript
JARVIS_DEBUG_VERIFY_PAYLOADS()
```

This will:

- Show overall health status
- Display statistics about sends/receives
- List any issues found
- Show recent payload history

#### Access Payload Monitor

```javascript
// Get statistics
JARVIS_PAYLOAD_MONITOR.getStats()

// Get recent history
JARVIS_PAYLOAD_MONITOR.getRecentHistory(10)

// Clear history
JARVIS_PAYLOAD_MONITOR.clear()
```

#### Manual Validation

```javascript
// Validate a payload before sending
import { validatePayload } from './payload-verification.js';
const validation = validatePayload(myPayload);
console.log(validation);

// Validate a response after receiving
import { validateResponse } from './payload-verification.js';
const validation = validateResponse(myResponse);
console.log(validation);
```

## Expected Payload Structure

### Required Fields

- `message` (string, non-empty)
- `session_id` (string)
- `sessionId` (string, should match `session_id`)
- `timestamp` (string, ISO 8601 format)
- `source` ('voice' | 'text')
- `message_id` (string)
- `messageId` (string, should match `message_id`)

### Optional Fields

- `timezone` (string)
- `location` (string)
- `attachments` (array of objects with `name`, `type`, `size`, optional `data`)
- `locale` (string)
- `language` (string)
- `conversationHistory` (array)
- `intent` (string)
- `agenticHints` (object)
- `contextEnrichment` (object)

## Expected Response Structure

The system looks for reply text in these keys (in order):

1. `output`
2. `reply`
3. `result`
4. `text`
5. `message`
6. `response`
7. `answer`
8. `content`
9. `body`
10. `responseText`

Also handles:

- Array responses: `[{ output: "..." }]`
- n8n item format: `[{ json: { output: "..." } }]`
- Nested objects

## Console Logging

The system provides comprehensive logging:

### Payload Sending

- `[JARVIS] Payload SENT` - Summary of payload being sent
- `[JARVIS] VERIFY: Full payload being sent` - Complete payload structure
- `[JARVIS] PAYLOAD VALIDATION` - Validation results (errors/warnings)

### Response Receiving

- `[JARVIS] VERIFY: Full response received from n8n` - Complete response
- `[JARVIS] VERIFY: Response validation` - Validation results
- `[JARVIS] Payload RECEIVED` - Summary of response received

## Troubleshooting

### Issue: No payloads being sent

**Check:**

1. Are UI buttons working? (Send button, Mic button)
2. Check console for errors
3. Run `JARVIS_DEBUG_VERIFY_PAYLOADS()` to see statistics

### Issue: Payloads sent but no responses

**Check:**

1. Network connection
2. n8n webhook URL is correct
3. n8n workflow is active
4. Check browser Network tab for failed requests
5. Run `JARVIS_DEBUG_VERIFY_PAYLOADS()` to see receive statistics

### Issue: Responses received but no reply extracted

**Check:**

1. Response structure - does it have one of the expected keys?
2. Run `JARVIS_DEBUG_VERIFY_PAYLOADS()` to see validation details
3. Check console for `[JARVIS] VERIFY: Response validation` logs
4. Ensure n8n workflow returns JSON with `output`, `reply`, or similar field

### Issue: Payload validation errors

**Check:**

1. Required fields are present
2. Field types are correct
3. `session_id` matches `sessionId`
4. `message_id` matches `messageId`
5. Check console for specific validation errors

## Example Output

### Healthy Flow

```javascript
JARVIS_DEBUG_VERIFY_PAYLOADS()
// Output:
// [JARVIS DEBUG] Payload Flow Verification
// [JARVIS DEBUG] Verification Results: {
//   healthy: true,
//   stats: {
//     sends: { total: 5, recent: 5, valid: 5, invalid: 0, ... },
//     receives: { total: 5, recent: 5, withReply: 5, withoutReply: 0, ... },
//     health: { sendHealth: 100, receiveHealth: 100, overallHealth: 100 }
//   },
//   issues: [],
//   ...
// }
```

### Issues Detected

```javascript
JARVIS_DEBUG_VERIFY_PAYLOADS()
// Output:
// [JARVIS DEBUG] Payload Flow Verification
// [JARVIS DEBUG] Verification Results: {
//   healthy: false,
//   stats: { ... },
//   issues: [
//     { severity: 'warning', message: '2 of 5 recent responses had no reply field.' },
//     { severity: 'error', message: '1 of 5 recent responses had HTTP errors.' }
//   ],
//   ...
// }
```

## Best Practices

1. **Regular Health Checks**: Run `JARVIS_DEBUG_VERIFY_PAYLOADS()` periodically to monitor system health
2. **Monitor Console**: Watch for validation warnings and errors in console
3. **Check Statistics**: Review `JARVIS_PAYLOAD_MONITOR.getStats()` to understand payload patterns
4. **Fix Issues Promptly**: Address validation errors and warnings to ensure reliable operation

## Related Documentation

- `docs/INTEGRATION.md` - Full-stack integration overview
- `docs/n8n-webhooks-research.md` - n8n webhook details
- `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md` - Fixing n8n response issues
- `public/js/n8n-payload.js` - Payload builder implementation
