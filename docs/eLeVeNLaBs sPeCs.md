# eLeVeNLaBs sPeCs

Specification document for the ElevenLabs Conversational AI embed **as provided** (no implementation guidance).

---

## 1. Provided Specifications

### 1.1 Custom element (widget container)

```html
<elevenlabs-convai agent-id="agent_7601k23b460aeejb2pvyfcvw6atk"></elevenlabs-convai>
```

| Item | Value |
|------|--------|
| **Tag name** | `elevenlabs-convai` |
| **Custom element type** | Web Component (custom element) |
| **Attribute** | `agent-id` |
| **Agent ID (this project)** | `agent_7601k23b460aeejb2pvyfcvw6atk` |

The element is a custom HTML element. The script (below) registers it and renders the conversational AI widget inside it. The `agent-id` attribute tells the widget which ElevenLabs agent to use.

### 1.2 Script (widget loader)

```html
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

| Item | Value |
|------|--------|
| **CDN** | unpkg |
| **URL** | `https://unpkg.com/@elevenlabs/convai-widget-embed` |
| **Package** | `@elevenlabs/convai-widget-embed` |
| **Load behavior** | `async` |
| **MIME type** | `text/javascript` |

The script loads the ElevenLabs Conversational AI Widget bundle from unpkg. It is loaded asynchronously; the widget will initialize when the script runs and will find any `<elevenlabs-convai>` elements on the page.

---

## 2. Research Summary (context only)

- **Package**: `@elevenlabs/convai-widget-embed` (also listed in some places as `@11labs/convai-widget-embed`). Described as “The Conversational AI Widget bundled with all dependencies for easy embedding.” MIT license; source in `elevenlabs/packages` (e.g. `packages/convai-widget-embed`).
- **Agent ID format**: IDs follow the pattern `agent_` + alphanumeric string (e.g. `agent_7601k23b460aeejb2pvyfcvw6atk`). Each ID uniquely identifies one agent in your ElevenLabs account.
- **Platform**: Part of ElevenLabs’ Conversational AI / Agents Platform. The widget can support modality settings, visual customization, runtime configuration, and dynamic variables per ElevenLabs’ own docs; those are not specified here.
- **Other CDNs**: The same package is available via jsDelivr; the spec above uses **unpkg** only.

---

## 3. Single reference: your embed

**Element:**

```html
<elevenlabs-convai agent-id="agent_7601k23b460aeejb2pvyfcvw6atk"></elevenlabs-convai>
```

**Script:**

```html
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

Place the script where you load global scripts (e.g. head or before `</body>`). Place the custom element where the widget should appear on the page.

---

## 4. Agents Platform overview (research)

*Source: [Agents Platform — ElevenLabs](https://elevenlabs.io/docs/agents-platform/overview)*

The platform is for building, launching, and scaling agents that accomplish tasks through natural dialogue. It provides voice-rich models, developer tools for multimodal agents, and tools to monitor and evaluate performance.

### 4.1 Pillars

| Pillar | Purpose |
|--------|--------|
| **Configure** | Multimodal agents via developer toolkit, dashboard, or visual workflow builder |
| **Deploy** | Integrate agents across telephony, web, and mobile |
| **Monitor** | Testing, evals, and analytics for agent performance |

### 4.2 Architecture (4 components)

1. **ASR** — Fine-tuned Speech-to-Text for recognition  
2. **LLM** — Your chosen language model (or [custom LLM](https://elevenlabs.io/docs/agents-platform/customization/llm/custom-llm))  
3. **TTS** — Low-latency Text-to-Speech (5k+ voices, 31 languages)  
4. **Turn-taking** — Proprietary model for conversation timing  

### 4.3 Relevant doc links (from overview)

- **System prompt / prompting:** [System prompt](https://elevenlabs.io/docs/agents-platform/best-practices/prompting-guide) — best practices for prompts  
- **Personalization:** [Personalization](https://elevenlabs.io/docs/agents-platform/customization/personalization) — dynamic variables and overrides  
- **Widget:** [Widget](https://elevenlabs.io/docs/agents-platform/customization/widget) — embed and customize the web widget  

---

## 5. Best practices: prompting personality and responsibilities

*Sources: [Prompting guide](https://elevenlabs.io/docs/agents-platform/best-practices/prompting-guide), [How to Prompt a Conversational AI System](https://elevenlabs.io/blog/how-to-prompt-a-conversational-ai-system), [Conversational voice design](https://elevenlabs.io/docs/agents-platform/best-practices/conversational-voice-design), [Building the ElevenLabs documentation agent](https://elevenlabs.io/docs/agents-platform/guides/elevenlabs-docs-agent)*

### 5.1 Core prompt-engineering principles

| Principle | Recommendation |
|-----------|----------------|
| **Structure** | Separate instructions into **clean, distinct sections** (not one long block). |
| **Length** | **Be as concise as possible**; brief instructions improve clarity and performance. |
| **Priority** | **Emphasize critical instructions** so the agent prioritizes them. |
| **Consistency** | **Normalize inputs and outputs** so the agent behaves predictably. |

Avoid reusing “training playbooks” written for humans; LLMs need prompts tailored to how they work and to spoken interaction (default tone and scope are not tuned for voice by default).

### 5.2 Defining personality and responsibilities

- **Personality / role**  
  Define who the agent is (role, expertise, tone). Example from ElevenLabs’ own docs agent (“Alexis”): *technical expertise with warm, approachable explanations* and *professional knowledge with a relaxed conversational style*.

- **Responsibilities / task**  
  State clearly what the agent should do (e.g. answer from docs, redirect, escalate to humans). Keep this in its own section so it’s easy to emphasize and update.

- **Prompt building blocks (conceptual)**  
  The docs reference structuring the system prompt around: **personality**, **environment** (context), **task** (responsibilities), **style** (how to speak), and **constraints** (what not to do). Use these as sections when drafting the system prompt.

### 5.3 Voice and “character” (complement to the prompt)

- **Voice settings** affect perceived personality (e.g. [Conversational voice design](https://elevenlabs.io/docs/agents-platform/best-practices/conversational-voice-design)): stability (emotional range vs consistency), similarity, speed.  
- **Voice Design** can align the voice with the character (e.g. role, age, accent, tone, pacing) so personality in the prompt matches the voice.

### 5.4 Per-conversation customization

- Use [Personalization](https://elevenlabs.io/docs/agents-platform/customization/personalization) and [Overrides](https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides) to pass dynamic variables (e.g. user context) so the same agent can adapt tone or responsibilities per conversation without changing the base system prompt.

---

*Document: eLeVeNLaBs sPeCs. Specifications and research only; no implementation steps.*
