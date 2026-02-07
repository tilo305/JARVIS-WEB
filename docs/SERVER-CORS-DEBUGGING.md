# Server-Side CORS Debugging Guide

## Overview

The server now includes comprehensive CORS diagnostics and logging. When CORS errors occur in the browser, they are automatically reported to the server console with detailed information.

## Features

### 1. Automatic CORS Error Reporting

When a CORS error occurs in the browser:
- Error details are automatically sent to the server
- Server console displays comprehensive diagnostic information
- Includes recommendations for fixing the issue

### 2. Server-Side CORS Testing

The server can test CORS configuration directly (bypassing browser restrictions):
- Tests preflight (OPTIONS) requests
- Logs results to server console
- Runs automatically on server startup if webhook URL is configured

### 3. API Endpoints

Two new endpoints for CORS diagnostics:

- **`POST /api/cors-error`** - Receives CORS error reports from browser
- **`POST /api/cors-diagnostic`** - Receives CORS diagnostic reports from browser

## Server Console Output

### On Server Startup

When the server starts, it will:
1. Display server information
2. Show CORS diagnostics status
3. Automatically test CORS if webhook URL is configured

Example output:
```
Server: http://localhost:3000
Serving: public (development)
Note: AudioWorklet requires HTTPS in production.

📊 CORS Diagnostics:
  • CORS errors from browser will be logged to server console
  • Run CORS test: Check n8n webhook URL in environment variables

🔍 Auto-testing CORS for configured webhook...
🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍
[2026-02-06T19:30:00.000Z] Running Server-Side CORS Test
🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍
Webhook URL: https://n8n.hempstarai.com/webhook/...
Origin: http://localhost:3000
Testing preflight (OPTIONS) request...

✅ CORS Preflight Test: SUCCESS
   Status: 200 OK
   CORS Headers Found:
     ✅ Access-Control-Allow-Origin: http://localhost:3000
     ✅ Access-Control-Allow-Methods: POST, OPTIONS
     ✅ Access-Control-Allow-Headers: Content-Type
```

### When CORS Errors Occur

When a CORS error is detected in the browser, the server console will display:

```
⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠
[2026-02-06T19:30:00.000Z] CORS ERROR DETECTED
⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠
Webhook URL: https://n8n.hempstarai.com/webhook/...
Origin: http://localhost:3000
Error Type: TypeError
Error Message: Failed to fetch

🔴 CONFIRMED: This is a CORS error!
   The server at https://n8n.hempstarai.com/webhook/... does not allow requests from http://localhost:3000
   Required: Server must include Access-Control-Allow-Origin header

📋 Possible Causes:
   1. CORS: Server does not allow cross-origin requests from http://localhost:3000
   2. The server must include Access-Control-Allow-Origin header in responses
   3. Preflight (OPTIONS) request may be failing - server must respond to OPTIONS with CORS headers

🔧 Troubleshooting Steps:
   1. CORS Error: Server at https://n8n.hempstarai.com/webhook/... must allow requests from http://localhost:3000
   2. Configure n8n server to include CORS headers (see docs/CORS-CONFIGURATION.md)
   3. Required headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers
   4. Check browser Network tab for OPTIONS (preflight) request status

⚙️  Required CORS Configuration:
   Response Headers:
     Access-Control-Allow-Origin: http://localhost:3000
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type

   n8n Workflow Setup:
     Configure n8n webhook to allow CORS requests
     1. In n8n workflow, add a "Set" node before the webhook response
     2. Set headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers
     3. For OPTIONS requests (preflight), return 200 with CORS headers and empty body
     4. For POST requests, include Access-Control-Allow-Origin in response headers
⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠
```

## Manual CORS Testing

### From Browser Console

Run the diagnostic function:
```javascript
JARVIS_DEBUG_CORS()
```

This will:
- Test CORS from the browser
- Display results in browser console
- Send diagnostic report to server console

### From Server

The server automatically tests CORS on startup if:
- `VITE_N8N_WEBHOOK_URL` or `N8N_WEBHOOK_URL` environment variable is set
- Server can reach the webhook URL

## Configuration

### Environment Variables

Set these to enable auto-testing:
```bash
export VITE_N8N_WEBHOOK_URL="https://n8n.hempstarai.com/webhook/..."
# or
export N8N_WEBHOOK_URL="https://n8n.hempstarai.com/webhook/..."
```

### Server Startup

The server will:
1. Check for webhook URL in environment variables
2. If found, automatically test CORS configuration
3. Log results to console
4. Continue serving files normally

## Troubleshooting

### No CORS Test on Startup

**Cause:** Webhook URL not configured in environment variables

**Solution:** Set `VITE_N8N_WEBHOOK_URL` or `N8N_WEBHOOK_URL`

### CORS Test Fails

**Cause:** Server cannot reach webhook URL or webhook doesn't support OPTIONS

**Solution:**
1. Verify webhook URL is correct
2. Check network connectivity
3. Verify n8n workflow is active
4. Configure n8n to handle OPTIONS requests (see `docs/CORS-CONFIGURATION.md`)

### No Error Reports in Server Console

**Cause:** Browser cannot reach server endpoint

**Solution:**
1. Verify server is running
2. Check browser console for network errors
3. Verify `/api/cors-error` endpoint is accessible

## Files

- **`server-cors-diagnostics.js`** - Server-side CORS testing and logging
- **`server.js`** - Main server with CORS endpoints
- **`public/js/app.js`** - Client-side error reporting
- **`public/js/cors-handler.js`** - Client-side CORS diagnostics

## Related Documentation

- **`docs/CORS-CONFIGURATION.md`** - How to configure n8n server for CORS
- **`docs/CORS-IMPLEMENTATION-SUMMARY.md`** - Overview of CORS implementation
