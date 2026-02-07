# Fallback Research - Quick Reference

**Quick diagnostic guide for text and audio response fallback issues**

---

## 🚨 Most Common Issues (80% of cases)

### 1. n8n Workflow Configuration
- ❌ Missing "Respond to Webhook" node
- ❌ "Respond" set to "Immediately" (should be "Using Respond to Webhook Node")
- ❌ Workflow not activated
- ❌ Wrong webhook URL (using `/webhook-test/...` instead of `/webhook/...`)

**Quick Fix:**
1. Open n8n workflow
2. Add "Respond to Webhook" node after AI Agent
3. Set "Respond" to "Using Respond to Webhook Node"
4. Activate workflow
5. Use production URL: `/webhook/...` (not `/webhook-test/...`)

---

## 🔍 Quick Diagnosis

### Browser Console
```javascript
// Test webhook
const result = await JARVIS.testN8nWebhook();
console.log('Success:', result.success);
console.log('Reply:', result.reply);
console.log('Body:', result.body);

// Diagnose empty response
JARVIS.diagnoseEmptyN8nResponse();
```

### Check Network Tab
1. Open DevTools → Network
2. Find POST to n8n webhook
3. Check Response:
   - Status: 200? 404? 500?
   - Body: `{}`? Has `output`/`reply` key?
   - Content-Type: `application/json`?

---

## 📋 Response Format Requirements

**n8n must return reply in one of these keys:**
- `output` (preferred)
- `reply`
- `result`
- `text`
- `message`
- `response`
- `answer`
- `content`

**Value must be:**
- ✅ Non-empty string (not `""`)
- ✅ Not just whitespace (not `"   "`)
- ✅ Actual reply text (not metadata like `"ok"`)

**Valid Formats:**
```json
{ "output": "Hello! How can I help?" }
[{ "output": "Hello! How can I help?" }]
[{ "json": { "output": "Hello! How can I help?" } }]
```

**Invalid Formats:**
```json
{}                                    // Empty
{ "reply_text": "Hello" }             // Wrong key
{ "output": "" }                      // Empty string
{ "output": "   " }                   // Whitespace only
{ "output": { "text": "Hello" } }     // Not a string
```

---

## 🎯 Fallback Types

| Type | Message | Trigger |
|------|---------|---------|
| **Natural** | "Hello! How can I assist you today?" | User says "hello", "hi", "thanks" |
| **Generic** | "I heard you. I'm still getting set up..." | No reply extracted, no natural match |
| **Timeout** | "Request timed out..." | 30s timeout exceeded |
| **Network** | "Network error: Could not reach..." | CORS or network failure |
| **Config** | "Configuration error: N8N webhook URL..." | Missing/invalid webhook URL |

---

## 🔧 Fix Checklist

- [ ] n8n workflow has "Respond to Webhook" node
- [ ] "Respond" setting is "Using Respond to Webhook Node"
- [ ] Workflow is activated
- [ ] Using production URL (`/webhook/...` not `/webhook-test/...`)
- [ ] Response includes expected key (`output`, `reply`, etc.)
- [ ] Response value is non-empty string
- [ ] No CORS errors in console
- [ ] Network request succeeds (status 200)
- [ ] Response time < 30s (no timeout)

---

## 📚 Full Documentation

- **Comprehensive Research:** `debug/COMPREHENSIVE-FALLBACK-RESEARCH.md`
- **Original Research:** `debug/FALLBACK-REVERT-RESEARCH.md`
- **Audio Flow:** `debug/AUDIO-FALLBACK-FLOW.md`
- **n8n Config:** `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`
- **Troubleshooting:** `debug/TROUBLESHOOTING-FALLBACK-ISSUE.md`

---

## 🛠️ Diagnostic Tools

**Browser:**
- `JARVIS.testN8nWebhook()` - Test webhook connection
- `JARVIS.diagnoseEmptyN8nResponse()` - Diagnose empty response
- `public/debug/fallback-revert-debug.html` - Diagnostic page

**Node.js:**
- `npm run debug:n8n` - Check webhook (no CORS)
- `node debug/tools/test-extract-reply-fix.js` - Test extraction

**Debug Mode:**
- Add `?debug=1` to URL
- Check console for detailed traces

---

**Last Updated:** 2025-01-XX
