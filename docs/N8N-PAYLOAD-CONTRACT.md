# n8n Webhook Payload Contract

Single source of truth for the request/response contract between JARVIS frontend and n8n.

---

## Request (Frontend → n8n)

**Method:** `POST`  
**Content-Type:** `application/json`  
**URL:** Production = `/webhook/<id>` (not `/webhook-test/<id>`)

### Required fields (Electron validates these)

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | User message (trimmed) |
| `query` | string | Same as `message` (alias for n8n workflows) |
| `input` | string | Same as `message` (alias for n8n workflows) |
| `session_id` | string | Per-session ID, e.g. `sess_<timestamp>_<random>` |
| `sessionId` | string | Same as `session_id` (camelCase) |
| `source` | string | `'voice'` or `'text'` |
| `attachments` | array | `[]` or `[{ name, type, size, data?, ocrText? }]` |

### Optional fields (always sent by frontend)

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | ISO 8601 when message was sent |
| `timezone` | string | User IANA timezone (e.g. `America/New_York`) |
| `location` | string | Same as `timezone` |
| `message_id` | string | Unique per message |
| `messageId` | string | Same as `message_id` |
| `locale` | string | Browser locale (e.g. `en-US`) |
| `language` | string | Browser language |
| `conversation_history` | array | Previous turns `[{ role, content }]` |
| `conversationHistory` | array | Same (camelCase) |
| `intent` | string | e.g. `greeting`, `general` |
| `contextEnrichment` | object | `{ viewportWidth, viewportHeight, userAgentHint }` |

### Minimal payload (n8n can rely on)

n8n workflows should read the user message from `$json.message` (or `$json.query` / `$json.input` — all identical).

---

## Response (n8n → Frontend)

**Status:** `200`–`299` for success. `404` = webhook not found or workflow inactive.

**Body:** JSON. The frontend extracts the reply string from these keys (in order):

1. `output`
2. `reply`
3. `result`
4. `text`
5. `message`
6. `response`
7. `answer`
8. `content`
9. `body`

Also supports array format: `[{ "output": "Hello, sir." }]` (first item).

### Example responses

```json
{ "output": "Hello, sir. How may I assist you today?" }
```

```json
{ "reply": "Good morning. What can I do for you?" }
```

```json
[{ "json": { "output": "Understood, sir." } }]
```

---

## HTTP 404: Not Found

**Cause:** The webhook URL does not exist or the workflow is not active.

**Checklist:**

1. **URL format**
   - ✅ Production: `https://n8n.hempstarai.com/webhook/<uuid>`
   - ❌ Test: `https://n8n.hempstarai.com/webhook-test/<uuid>` (editor-only)

2. **Exact URL from n8n**
   - In n8n: open the Webhook node → copy the **Production URL** (not Test URL)
   - Put it in `.env`: `VITE_N8N_WEBHOOK_URL=https://...` and `N8N_WEBHOOK_URL=https://...`
   - **Electron:** reads `.env` at runtime — no rebuild needed. Check the startup log: `[JARVIS] Electron: n8n webhook URL (from .env): ...`
   - **Browser:** rebuild after changing: `npm run vite:build`

3. **Workflow**
   - Workflow must be **activated** (toggle in n8n)
   - Webhook node path must match the URL

---

## Test with curl

```bash
# Replace URL with your actual webhook URL from .env
curl -X POST "https://n8n.hempstarai.com/webhook/YOUR-WEBHOOK-ID" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "query": "Hello",
    "input": "Hello",
    "session_id": "sess_test_123",
    "sessionId": "sess_test_123",
    "source": "voice",
    "attachments": [],
    "timestamp": "2025-02-15T12:00:00.000Z",
    "timezone": "UTC",
    "location": "UTC",
    "message_id": "msg_test_456",
    "messageId": "msg_test_456"
  }'
```

Or use the npm script:

```bash
npm run test:n8n-webhook
```

---

## Files

| File | Role |
|------|------|
| `public/js/n8n-payload.js` | `buildN8nPayload`, `validateN8nPayload`, `extractReplyFromJson` |
| `public/js/app.js` | `buildPayload`, `getLLMReply` |
| `electron/main.js` | `validateN8nPayloadShape`, `handleN8nWebhook` |
