# n8n Webhook HTTP 404: Not Found

**Symptom:** JARVIS (Electron or browser) logs:

- `[JARVIS] [ERROR] n8n webhook network error: HTTP 404: Not Found`
- `404: Webhook not found. In n8n: open the workflow → turn it ON (Active)...`

The app is sending the request correctly; the **n8n server** is responding with 404, which means the webhook path is not registered.

---

## Checklist (fix in this order)

### 1. Use the **production** webhook URL

| Use (production) | Do not use (test) |
|-------------------|--------------------|
| `https://n8n.hempstarai.com/webhook/<id>` | `https://n8n.hempstarai.com/webhook-test/<id>` |

- **Production** (`/webhook/...`) — used by the **active** workflow; this is what JARVIS must call.
- **Test** (`/webhook-test/...`) — only for “Test workflow” in the n8n editor; often returns 404 for external calls.

In `.env` (project root) set:

```env
N8N_WEBHOOK_URL=https://n8n.hempstarai.com/webhook/<your-webhook-id>
VITE_N8N_WEBHOOK_URL=https://n8n.hempstarai.com/webhook/<your-webhook-id>
```

For **Electron**: the main process reads `.env` from the project root (or next to the executable when packaged). Restart the Electron app after changing `.env`.

---

### 2. Turn the workflow **ON** (Active)

- Open n8n → open the workflow that contains the Webhook node.
- Ensure the workflow is **Active** (toggle ON). If it is OFF, the webhook URL is not registered and n8n returns 404.

---

### 3. Copy the URL from n8n

- In the workflow, click the **Webhook** node.
- Copy the **Production** webhook URL (not “Test URL”).
- Put that exact URL in `.env` as above. If you recreated the workflow, the ID will have changed — always copy the current URL from n8n.

---

### 4. Verify with the LIVE debug tool

From the project root:

```bash
node debug/tools/n8n-webhook-live.mjs
```

Or with a message:

```bash
node debug/tools/n8n-webhook-live.mjs "Hello"
```

- **200** → webhook is reachable; if the app still fails, see `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md` (response format).
- **404** → workflow inactive or wrong URL; re-check steps 1–3.

---

## HTTP 500: Internal Server Error

If you see `n8n webhook network error: HTTP 500: Internal Server Error`, the **n8n server or workflow** is returning 500 (not the JARVIS app).

- **Electron:** The main process now logs the n8n response body when status ≥ 400. Look for `[Electron n8n] n8n returned 500 ... — response body: {...}` in the terminal; that JSON often contains the workflow error (e.g. node failure, missing credential).
- **Fix:** In n8n, open the workflow → check **Executions** for the failing run and the error message. Fix the workflow (e.g. credentials, node config, required input) or server/config (e.g. env vars n8n uses).

---

## Related

- **No reply text/voice but not 404:** `debug/N8N-RESPOND-TO-WEBHOOK-FIX.md`
- **CLI test (same idea):** `node scripts/test-n8n-webhook.mjs "Hello"`
- **Browser test:** open `public/debug/fallback-revert-debug.html` and use “Test n8n” (same CORS as main app).
