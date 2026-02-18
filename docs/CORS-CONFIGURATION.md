# CORS Configuration Guide for JARVIS-WEB

## Overview

This guide explains how to configure Cross-Origin Resource Sharing (CORS) for JARVIS-WEB when using an n8n webhook. Based on [MDN CORS documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

## Understanding CORS

**Cross-Origin Resource Sharing (CORS)** is an HTTP-header based mechanism that allows a server to indicate which origins (domain, scheme, or port) are permitted to access its resources.

### Why CORS is Needed

When JARVIS-WEB (running at `http://localhost:3000`) makes a POST request to your n8n webhook (e.g., `https://n8n.hempstarai.com/webhook/...`), the browser enforces the **same-origin policy**. Since these are different origins, the browser blocks the request unless the server explicitly allows it via CORS headers.

### What Triggers CORS Preflight

According to MDN, a **preflight request** (OPTIONS) is triggered when:

- The request method is anything other than GET, HEAD, or POST
- POST requests with `Content-Type: application/json` (which JARVIS-WEB uses)
- Custom headers are included

JARVIS-WEB sends POST requests with `Content-Type: application/json`, so **preflight is always triggered**.

## The CORS Flow

1. **Browser sends OPTIONS (preflight) request** to n8n webhook
   - Headers: `Origin`, `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: content-type`

2. **Server must respond to OPTIONS** with:
   - `Access-Control-Allow-Origin: <origin>` (or `*`)
   - `Access-Control-Allow-Methods: POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`
   - Status: `200 OK`

3. **Browser sends actual POST request** if preflight succeeds

4. **Server must include CORS headers in POST response**:
   - `Access-Control-Allow-Origin: <origin>` (or `*`)

## n8n Server Configuration

### Option 1: Using n8n "Set" Node (Recommended)

Add a "Set" node in your n8n workflow to add CORS headers:

1. **Before the Webhook Response:**
   - Add a "Set" node after your processing logic
   - Configure it to set response headers

2. **Set Node Configuration:**

   ```
   Mode: "Respond to Webhook"
   Options → Response Headers:
     - Name: Access-Control-Allow-Origin
       Value: http://localhost:3000
     - Name: Access-Control-Allow-Methods
       Value: POST, OPTIONS
     - Name: Access-Control-Allow-Headers
       Value: Content-Type
   ```

3. **Handle OPTIONS (Preflight) Requests:**
   - Add an "IF" node to check if request method is OPTIONS
   - If OPTIONS, return early with CORS headers and status 200
   - If POST, continue with normal processing

### Option 2: Using n8n Webhook Settings

Some n8n versions allow configuring CORS in webhook settings:

1. Open your webhook node
2. Look for "CORS" or "Response Headers" settings
3. Enable CORS and specify allowed origins

### Option 3: Reverse Proxy / API Gateway

If you control the infrastructure:

1. Configure your reverse proxy (nginx, Apache, etc.) to add CORS headers
2. Or use an API gateway that handles CORS

**Example nginx configuration:**

```nginx
location /webhook/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'http://localhost:3000';
        add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type';
        add_header 'Access-Control-Max-Age' 86400;
        return 204;
    }
    
    add_header 'Access-Control-Allow-Origin' 'http://localhost:3000' always;
    add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    
    proxy_pass http://n8n-server;
}
```

## Complete n8n Workflow Example

### Workflow Structure

```
[Webhook Trigger]
    ↓
[IF: Request Method = OPTIONS?]
    ↓ Yes → [Set Headers] → [Respond to Webhook] (Status: 200, Body: {})
    ↓ No (POST)
[Your Processing Logic]
    ↓
[Set CORS Headers]
    ↓
[Respond to Webhook]
```

### Step-by-Step n8n Setup

1. **Webhook Trigger Node:**
   - Method: `POST`
   - Path: `/webhook/your-webhook-id`
   - Respond: `Using Respond to Webhook Node`

2. **IF Node (Check for OPTIONS):**
   - Condition: `{{ $json.headers['method'] }}` equals `OPTIONS`
   - Or: Check `{{ $json.method }}` if available

3. **Set Node (For OPTIONS Response):**
   - Mode: `Respond to Webhook`
   - Response Headers:

     ```
     Access-Control-Allow-Origin: http://localhost:3000
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     ```

   - Response Code: `200`
   - Response Body: `{}` (empty JSON)

4. **Your Processing Logic:**
   - LLM calls, data processing, etc.

5. **Set Node (For POST Response):**
   - Mode: `Respond to Webhook`
   - Response Headers:

     ```
     Access-Control-Allow-Origin: http://localhost:3000
     ```

   - Response Code: `200`
   - Response Body: Your JSON response with `output`, `reply`, etc.

## Testing CORS Configuration

### Using JARVIS-WEB Debug Tools

1. Open JARVIS-WEB with `?debug=1` in URL
2. Open browser console (F12)
3. Run: `JARVIS_DEBUG_CORS()`
4. This will test both preflight (OPTIONS) and actual (POST) requests

### Manual Testing

**Test Preflight (OPTIONS):**

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v \
  https://n8n.hempstarai.com/webhook/your-webhook-id
```

**Expected Response Headers:**

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Test Actual Request (POST):**

```bash
curl -X POST \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","source":"text"}' \
  -v \
  https://n8n.hempstarai.com/webhook/your-webhook-id
```

**Expected Response Headers:**

```
Access-Control-Allow-Origin: http://localhost:3000
```

## Common CORS Errors

### Error: "Failed to fetch"

**Symptoms:**

- Browser console shows "Failed to fetch" or "TypeError: Failed to fetch"
- Network tab shows OPTIONS request failed or blocked

**Causes:**

1. Server doesn't respond to OPTIONS requests
2. Server doesn't include `Access-Control-Allow-Origin` header
3. Server includes wrong origin in `Access-Control-Allow-Origin`
4. Server doesn't allow `Content-Type` header

**Solutions:**

1. Ensure n8n workflow handles OPTIONS requests
2. Verify CORS headers are set correctly
3. Check that origin matches exactly (including protocol and port)

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms:**

- Browser console shows specific CORS error message
- Preflight may succeed but POST fails

**Solutions:**

1. Add `Access-Control-Allow-Origin` header to POST responses
2. Ensure header value matches your origin exactly

### Error: Preflight succeeds but POST fails

**Symptoms:**

- OPTIONS request returns 200 with CORS headers
- POST request fails with CORS error

**Solutions:**

1. Ensure POST response also includes `Access-Control-Allow-Origin`
2. Check that workflow doesn't remove headers between OPTIONS and POST

## Production Considerations

### Allowing Multiple Origins

For production, you may need to allow multiple origins:

**n8n Set Node (Dynamic Origin):**

```javascript
// In n8n Code node or Set node expression
const origin = $json.headers['origin'] || $json.headers['Origin'];
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

if (allowedOrigins.includes(origin)) {
  return { 'Access-Control-Allow-Origin': origin };
} else {
  return { 'Access-Control-Allow-Origin': 'null' };
}
```

### Security Best Practices

1. **Never use `Access-Control-Allow-Origin: *`** with credentials
2. **Whitelist specific origins** instead of allowing all
3. **Use HTTPS** in production
4. **Validate origins** server-side before setting headers

## Troubleshooting

### Check Browser Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for OPTIONS request (preflight)
4. Check:
   - Status code (should be 200)
   - Response headers (should include CORS headers)
   - Request headers (should include Origin)

### Use JARVIS-WEB Diagnostics

Run in browser console:

```javascript
// Full CORS diagnostics
JARVIS_DEBUG_CORS()

// Just test preflight
JARVIS_DEBUG_CORS_PREFLIGHT()
```

### Verify n8n Workflow

1. Check workflow is **active**
2. Verify webhook URL is correct
3. Test webhook directly (bypassing CORS) using curl or Postman
4. Check n8n execution logs for errors

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [n8n Documentation](https://docs.n8n.io/)
- [CORS on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Quick Reference: Required Headers

### For OPTIONS (Preflight) Response

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400 (optional, caches preflight for 24h)
```

### For POST Response

```
Access-Control-Allow-Origin: http://localhost:3000
```

### Important Notes

- Origin must match **exactly** (including protocol, domain, and port)
- `http://localhost:3000` ≠ `http://localhost:3000/` (trailing slash matters)
- Headers are case-insensitive but values are case-sensitive
