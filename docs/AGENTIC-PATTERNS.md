# Agentic Design Patterns in JARVIS-WEB

This document describes how patterns from *Agentic Design Patterns: A Hands-On Guide to Building Intelligent Systems* are implemented in JARVIS-WEB. The project uses a **browser + n8n webhook** architecture: the LLM and orchestration run in n8n; the client provides supporting patterns.

## Implemented Patterns

### 1. Memory (Chapter 8)

**Purpose**: Maintain short-term conversational context so the backend can produce coherent, context-aware replies.

**Implementation**:

- `ConversationHistory` in `public/js/agentic-patterns.js` stores the last 20 user/assistant turns in memory.
- On each request, the last 10 turns are sent to n8n in `conversationHistory`.
- n8n can use this array to ground the LLM in prior context.

**Payload field**:

```json
{
  "conversationHistory": [
    { "role": "user", "content": "What's on my calendar today?" },
    { "role": "assistant", "content": "You have two meetings..." }
  ]
}
```

### 2. Routing (Chapter 2)

**Purpose**: Classify intent so n8n can route to different workflows or prompt branches.

**Implementation**:

- `classifyIntent(text)` in `agentic-patterns.js` does rule-based intent classification.
- Intents: `greeting`, `goodbye`, `help`, `calendar`, `email`, `search`, `general`.
- The `intent` field is sent in every payload.

**Payload field**:

```json
{
  "intent": "calendar"
}
```

### 3. Context Engineering (Ch 1, Preface)

**Purpose**: Enrich the payload with device and environment context.

**Implementation**:

- `getContextEnrichment()` adds viewport size, voice support, and a truncated `userAgent`.
- Sent as `contextEnrichment` in the payload for n8n to use for personalization.

**Payload field**:

```json
{
  "contextEnrichment": {
    "viewportWidth": 1920,
    "viewportHeight": 1080,
    "preferVoice": true,
    "userAgentHint": "Mozilla/5.0..."
  }
}
```

### 4. Guardrails / Safety (Chapter 18)

**Purpose**: Validate and sanitize user input before sending to the backend.

**Implementation**:

- `validateInput(text)`:
  - Rejects non-strings, empty text.
  - Enforces max length (8000 chars).
  - Blocks obvious prompt-injection patterns.
- Invalid input is rejected before the n8n call.

### 5. Exception Handling and Recovery (Chapter 12)

**Purpose**: Make requests more resilient to transient failures.

**Implementation**:

- `runWithRetry(fn, options)` wraps the n8n `fetch` call.
- Retries up to 3 times with exponential backoff for `AbortError`, `Failed to fetch`, timeout, etc.
- Non-retryable errors fail immediately.

### 6. Prompt Chaining / Tool Use (Chapters 1, 5)

**Purpose**: The n8n workflow can use `conversationHistory`, `intent`, and `attachments` to drive multi-step or tool-using flows. The client supplies the structured payload; chaining and tool use are implemented in n8n.

## n8n Payload Shape

The full payload sent to the webhook includes:

| Field | Description |
|-------|-------------|
| `message` | Current user message |
| `session_id`, `sessionId` | Session continuity |
| `timestamp` | ISO 8601 |
| `timezone`, `location` | IANA timezone |
| `source` | `voice` or `text` |
| `attachments` | Files with optional `ocrText` |
| `conversationHistory` | Recent turns (Memory) |
| `intent` | Classified intent (Routing) |
| `contextEnrichment` | Device/environment hints |
| `agenticHints` | Optional `{ planMode, refineMode }` for workflow selection |

## n8n Workflow Tips

To use the agentic fields in n8n:

1. **Memory**: In your LLM prompt, include:

   ```
   Previous conversation:
   {{ $json.conversationHistory }}
   Current message: {{ $json.message }}
   ```

2. **Routing**: Use an IF node or Switch node on `{{ $json.intent }}` to branch to different sub-workflows.

3. **Context**: Reference `{{ $json.contextEnrichment.viewportWidth }}` or similar for responsive or personalized behavior.

## Debug

With `?debug=1` or when debug mode is enabled:

- **Chat history** is not cleared by any in-app action; it persists until the site is refreshed.
- **Inspect history** (read-only): Run in the console:

  ```js
  window.JARVIS_CONVERSATION_HISTORY?.getRecent?.(20)
  ```

## References

- *Agentic Design Patterns: A Hands-On Guide to Building Intelligent Systems*
- [JARVIS-WEB Integration](INTEGRATION.md)
- [n8n Webhook docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
