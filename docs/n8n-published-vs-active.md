# n8n: Published vs Active — Why Your Production Webhook Returns 404

Based on [docs.n8n.io](https://docs.n8n.io) and related docs.

---

## Summary

- **Published** = A specific version of the workflow is “live” (production webhook URL is registered, schedules and triggers are defined).
- **Active** = The workflow is set to **run automatically** when triggers fire (e.g. when someone calls the production webhook).

A workflow can be **Published** but **Inactive**. In that case the production webhook URL is **not** registered, and you get:

```json
{
  "code": 404,
  "message": "The requested webhook \"POST ...\" is not registered.",
  "hint": "The workflow must be active for a production URL to run successfully..."
}
```

So for production webhooks to work you need **both**: **Published** and **Active**.

---

## Official sources

### 1. Save and publish

- [Save and publish | n8n Docs](https://docs.n8n.io/workflows/publish/)
- **Publishing** makes the workflow “live” and locks a version:
  - “Webhook and form triggers will use their production URLs”
  - “When you publish, your workflow will enable the following: … Webhook and form triggers will use their production URLs”
- Unpublish: version history page, workflow list, or dropdown next to Publish (`Cmd/Ctrl+u`).

### 2. Production executions (the “Active” toggle)

- [Manual, partial, and production executions | n8n Docs](https://docs.n8n.io/workflows/executions/manual-partial-and-production-executions/)
- **Production executions** = workflow runs automatically when a trigger fires (e.g. webhook call).
- Exact quote:  
  **“To configure production executions, you must attach a trigger node … and switch workflow's toggle to Active. Once published, the workflow automatically executes whenever the trigger condition occurs.”**
- So: **Publish** + **toggle to Active** = production webhook listens and runs.

### 3. Webhook: Test URL vs Production URL

- [Webhook node common issues | n8n Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/common-issues/)

| URL type     | How to trigger              | Listening duration        |
|-------------|-----------------------------|----------------------------|
| Test URL    | Click “Listen for test event” then send request | 120 seconds        |
| Production URL | **Publish the workflow** (and set workflow **Active**) | Until workflow is unpublished/inactive |

- Production URL only works when the workflow is **published** and **active**.

### 4. Only one webhook per path and method

- Same doc: “n8n only permits registering one webhook for each path and HTTP method combination.”
- If you get “path and method already in use” (or the webhook seems not registered), either:
  - Change the webhook path/method in one of the workflows, or
  - **Unpublish** (or deactivate) the other workflow that uses that path.

---

## Where is the “Active” toggle?

- Official and community docs describe an **activation toggle** that you use to “switch workflow’s toggle to Active”.
- It is typically on the **workflow list** (main Workflows page), not only in the editor.
- In the editor you often see:
  - **Published** (green) = a version is published.
  - **Production checklist** (e.g. 0/4) = optional production checklist, **not** the same as the Active toggle.
- So: go to the **Workflows** list, find **JARVIS PORTABLE**, and look for an **on/off** or **Active** control on that workflow’s card/row. Turn it **on** so the workflow is Active.

---

## Steps to fix “webhook not registered” (404)

1. **Publish** the workflow (you already have “Published”).
2. **Activate** the workflow:
   - Open the main **Workflows** page.
   - Find **JARVIS PORTABLE**.
   - Turn the workflow **Active** (toggle on).
3. Use the **Production URL** (not Test) in Postman:  
   `https://n8n.hempstarai.com/webhook/7600d4d1-e268-4c35-a853-b39ce7014e96`
4. Send a **POST** request with your JSON body (e.g. voice payload).
5. If you still get 404:
   - Check no **other** workflow is using the same webhook path (unpublish or change path).
   - Unpublish this workflow, save, then publish again and set Active again.
   - If self-hosted: restart n8n so webhook registration is refreshed.

---

## References

- [Save and publish](https://docs.n8n.io/workflows/publish/)
- [Manual, partial, and production executions](https://docs.n8n.io/workflows/executions/manual-partial-and-production-executions/)
- [Webhook node common issues](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/common-issues/)
- [Webhook workflow development](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/workflow-development/)
