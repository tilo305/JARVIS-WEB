# No Text or Voice in Chat: n8n Respond to Webhook Fix

**Symptom:** The frontend shows no assistant text in the chat and no voice (TTS) plays. The Webhook receives the request (e.g. "Hello from JARVIS debug") but the frontend never gets a reply.

**Causes (check both):**

1. **Webhook Respond setting** — Must be "Using Respond to Webhook Node" (not "Immediately").
2. **Respond to Webhook node missing or not connected** — n8n shows: *"Insert a 'Respond to Webhook' node to control when and how you respond."* That means either the node is missing, or it's not in the execution path so it never runs.

---

## 1. Webhook trigger node

1. Select the **Webhook** node.
2. **Respond** must be **"Using Respond to Webhook Node"** (you already have this).
3. If you see the yellow warning **"Insert a 'Respond to Webhook' node…"**, go to section 2.

---

## 2. Insert and connect the Respond to Webhook node (fixes the yellow warning)

The Webhook is waiting for a **Respond to Webhook** node to run. If that node doesn't exist or isn't in the flow, no response is ever sent and the frontend gets nothing.

1. **Add the node:** In the same workflow, add a **Respond to Webhook** node (search "Respond to Webhook" in the node list).
2. **Put it in the path:** Connect it **after** the node that has the reply (e.g. AI Agent). Flow should be:  
   **Webhook** → … → **AI Agent** (or whatever builds the reply) → **Respond to Webhook**.
3. **Configure it:**
   - **Respond With:** "First Incoming Item" (so it uses the data from the previous node).
   - The response **body** must be JSON. The frontend looks for the reply in one of: `output`, `reply`, `result`, `text`, `message`, `response`, `answer`, `content`. For example: `{"output": "Hello, sir. How may I assist you today?"}`.
4. **Save and activate** the workflow.

After this, each request that hits the Webhook will get a response when the **Respond to Webhook** node runs, and the chat will show text and play voice.

**URL check (most common cause when the workflow is correct):** The frontend must call the **production** webhook URL, not the Test URL.

| Use this (production) | Not this (test) |
|------------------------|-----------------|
| `https://n8n.hempstarai.com/webhook/e7278dba-076f-4fe9-8c8f-0241e4103ac4` | `https://n8n.hempstarai.com/webhook-test/e7278dba-076f-4fe9-8c8f-0241e4103ac4` |

- **Production** (`/webhook/...`) runs your active workflow and returns the Respond to Webhook body (e.g. `[{ "output": "Hello, sir. ..." }]`).
- **Test** (`/webhook-test/...`) is for the n8n editor "Test workflow" and may not return that same response to an external app.

In JARVIS: set `VITE_N8N_WEBHOOK_URL` (or `window.JARVIS_CONFIG.n8nWebhookUrl`) to the **production** URL above. Then reload the app and try again.

---

## 2b. Workflow verified (JARVIS PORTABLE)

Your workflow already has the right structure:

- **Webhook** (`responseMode: "responseNode"`) → **AI Agent** → **Respond to Webhook**
- The reply shape `[{ "output": "Hello, sir. How may I assist you today?" }]` is supported: the frontend reads `output` from the first item in the array.

So the remaining fix is almost always: **use the production webhook URL** (see URL check above). If you already use it, open the app with `?debug=1`, send a message, and in the browser console check the `n8n: response` log to see the exact response body and whether a reply was found.

---

## 3. Why voice is missing too

Voice is generated **on the frontend** with Cartesia TTS. Flow:

1. Frontend gets reply **text** from the n8n webhook response body.
2. It appends that text to the chat and calls `bridge.speakText(replyText)`.

If the frontend never gets the reply (because no Respond to Webhook node ran), it never shows a message or plays TTS. **Getting the Respond to Webhook node in the flow fixes both text and voice.**

---

## 4. Quick check

After the Respond to Webhook node is in the path and the workflow is active:

- Send a message (text or voice) from the JARVIS UI.
- You should see the assistant message in the chat and hear TTS.
- In browser DevTools → Network, the webhook request should show response body like `{"output": "..."}`.

If the response body is empty or missing, the Respond to Webhook node either didn't run (check connections and that you're using the production webhook URL, not the test URL) or the Webhook node's Respond setting was reverted.
