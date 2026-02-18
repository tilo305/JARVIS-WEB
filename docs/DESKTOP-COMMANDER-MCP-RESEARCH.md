# Desktop Commander MCP — Integration Research for JARVIS-WEB

**Research date:** February 8, 2026  
**Desktop Commander ref:** [wonderwhy-er/DesktopCommanderMCP @ 8d1e7e8](https://github.com/wonderwhy-er/DesktopCommanderMCP/tree/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59)

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| **Can Desktop Commander be implemented into JARVIS-WEB?** | **Yes, in specific ways** — but not by “embedding” the MCP server inside the web app. |
| **Recommended approach** | Use Desktop Commander **alongside** JARVIS-WEB (e.g., in Claude Desktop / Cursor) so the same AI that drives your n8n/JARVIS flow can also run terminal and file operations. Alternatively, expose Desktop Commander–style **tools** to your n8n workflow (e.g., custom n8n nodes or a small proxy). |
| **Not a fit** | Running the Desktop Commander MCP server inside the browser or inside `server.js` — it is a **stdio MCP server** designed for desktop AI clients. |

---

## 2. What Is Desktop Commander MCP?

- **What it is:** An [MCP](https://modelcontextprotocol.io/) (Model Context Protocol) server that gives an AI assistant (e.g., Claude Desktop, Cursor) the ability to:
  - Run **terminal commands** (with streaming, timeouts, background execution, process management).
  - Perform **filesystem operations** (read/write/search files, list dirs, move, metadata).
  - Do **surgical code edits** (search/replace blocks, fuzzy matching).
  - Work with **Excel, PDF, URLs** (read/write Excel, read/write PDFs, fetch URLs).
- **Transport:** **stdio** — the server is started as a subprocess by the host (e.g., Claude Desktop), and the host talks to it via stdin/stdout using the MCP JSON-RPC protocol.
- **Typical use:** User runs Claude Desktop (or similar) with Desktop Commander configured as an MCP server; Claude can then run shell commands, edit files, and search the filesystem on the user’s machine.

Key docs: [README](https://github.com/wonderwhy-er/DesktopCommanderMCP/blob/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59/README.md), [server.json](https://github.com/wonderwhy-er/DesktopCommanderMCP/blob/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59/server.json).

---

## 3. What Is JARVIS-WEB?

- **What it is:** A **browser-based voice + chat app** (Iron Man–themed) that:
  - Uses **Cartesia** for STT (speech-to-text) and TTS (text-to-speech) over WebSockets.
  - Sends user messages (text or final voice transcript) to an **n8n webhook** via `POST` (see `public/js/app.js` → `getLLMReply` → `buildN8nPayload`).
  - Gets back a **reply** (and optional file specs) and speaks the reply with TTS.
- **Backend:** `server.js` is a **static file server** (+ optional WebSocket for status). It does **not** run an LLM or MCP server; the “brain” is the **n8n workflow** (and whatever LLM/tools n8n uses).
- **MCP in JARVIS today:** Your prompts (e.g. `docs/JARVIS-system-prompt-elevenlabs.md`) **mention** MCP tools (Tavily, Google MCP) as capabilities the **assistant** should use — but those tools are intended to be used **inside the n8n/LLM side**, not inside the JARVIS-WEB repo itself.

So: JARVIS-WEB = front-end (voice + chat) + n8n webhook as the backend “brain.” No MCP server runs inside this repo.

---

## 4. Can We “Implement” Desktop Commander Into This Project?

### 4.1 What “implement” could mean

1. **Run the Desktop Commander MCP server inside JARVIS-WEB (e.g. in `server.js` or the browser)**  
2. **Use Desktop Commander alongside JARVIS-WEB** (same machine, same user)  
3. **Give JARVIS’s “brain” (n8n/LLM) the ability to run terminal/file operations** (e.g. by exposing similar tools to n8n)

### 4.2 Option A — Run Desktop Commander inside JARVIS-WEB

| Aspect | Conclusion |
|--------|------------|
| **In the browser** | **No.** Desktop Commander is a Node.js MCP server using stdio; browsers cannot run it. |
| **In `server.js`** | **Theoretically possible but wrong fit.** You could spawn `npx @wonderwhy-er/desktop-commander@latest` as a subprocess and speak MCP over stdio from Node — but then you’d need an **MCP client** that connects to that process. The natural MCP clients are **Claude Desktop, Cursor, etc.**, not your static HTTP server. So you’d be building a custom MCP client in Node and then still need to expose “run command / edit file” to the browser or n8n — which is exactly what Option C below is about. |

**Verdict:** Do **not** run the Desktop Commander process as part of the JARVIS-WEB app server or front end. It doesn’t match the process model (stdio MCP host) of Desktop Commander.

### 4.3 Option B — Use Desktop Commander alongside JARVIS-WEB (recommended for “same AI, more tools”)

- **Idea:** Install Desktop Commander in **Claude Desktop** (or Cursor / another MCP host) and use JARVIS-WEB in the browser for voice/chat. When you work in Claude/Cursor, that same AI has terminal + file + edit tools via Desktop Commander.
- **Relation to this repo:** No code changes in JARVIS-WEB. You only:
  - Install Desktop Commander in your MCP host (e.g. [npx setup](https://github.com/wonderwhy-er/DesktopCommanderMCP#option-1-install-through-npx--auto-updates-requires-nodejs)).
  - Use JARVIS-WEB for voice/conversation; use Claude Desktop (or Cursor) when you want the AI to run commands or edit files.
- **Verdict:** **Yes, “implement” in the sense of “use with”:** add Desktop Commander to your AI environment; keep JARVIS-WEB as the voice/chat UI. No integration code in this project required.

### 4.4 Option C — Expose “Desktop Commander–style” tools to n8n (so JARVIS voice can trigger them)

- **Idea:** The user speaks in JARVIS → transcript goes to n8n → n8n (or an LLM in n8n) decides to run a shell command or edit a file. So you need something that **n8n can call** (HTTP or similar) that runs commands or file operations on a server.
- **Ways to do it:**
  1. **Custom n8n node** (or subflow) that calls a **small proxy service** you build. That service (Node.js) could:
     - Use Node APIs (`child_process`, `fs`, etc.) to run commands and file ops, **or**
     - Spawn Desktop Commander as a subprocess and drive it via MCP (complex: you’d implement an MCP client in Node and map n8n inputs to MCP tool calls).
  2. **Existing n8n nodes:** e.g. “Execute Command” / “Run script” / “Read/Write File” nodes that run on the machine where n8n runs (or a worker). That gives “Desktop Commander–style” capabilities (run command, edit file) without using Desktop Commander itself.
  3. **Remote MCP (Desktop Commander):** Desktop Commander supports [Remote MCP](https://mcp.desktopcommander.app) so ChatGPT/Claude web can use it. That path is “user runs a remote device on their computer”; the AI (e.g. in the cloud) sends commands to that device. Your JARVIS-WEB UI still talks to n8n; n8n doesn’t talk to Desktop Commander unless you explicitly add a step that calls some API that forwards to the Remote Device (possible but custom).

**Verdict:** **Yes, we can implement “Desktop Commander–style” behavior into the JARVIS flow** by giving n8n the ability to run commands and file operations (via a small proxy or n8n nodes). Using the **actual** Desktop Commander binary from inside n8n is possible only via a custom MCP client that talks stdio to the process and exposes HTTP (or similar) for n8n — doable but heavier; often simpler to use n8n’s own nodes or a thin proxy.

---

## 5. Technical Snapshot: Desktop Commander

- **Runtime:** Node.js ≥18, ESM.
- **Key dependency:** `@modelcontextprotocol/sdk` (MCP).
- **Transport:** stdio (see `server.json`: `"transport": { "type": "stdio" }`).
- **Entry:** `dist/index.js` (after build); started by the host (e.g. Claude Desktop) with `npx @wonderwhy-er/desktop-commander@latest`.
- **Tools (high level):** Configuration, terminal (start_process, interact_with_process, list_sessions, kill_process, etc.), filesystem (read_file, write_file, list_directory, search, move, get_file_info), text editing (edit_block), analytics/feedback.

So: it’s a **standalone MCP server**, not a library you `require` inside your app. Integration = run it as a separate process and talk MCP, or reimplement a subset of its tools elsewhere (e.g. n8n + proxy).

---

## 6. Recommendations

1. **If the goal is “I want to use Desktop Commander when I use an AI”**  
   → **Implement by installing it in your AI environment** (Claude Desktop / Cursor) and keep using JARVIS-WEB for voice/chat. No code changes in JARVIS-WEB.

2. **If the goal is “I want JARVIS (voice) to be able to run terminal commands or edit files”**  
   → **Implement by adding “command/file” capabilities to the n8n side:**
   - Prefer **n8n nodes** (Execute Command, Read/Write File, etc.) on the node where n8n runs, **or**
   - Add a **small HTTP proxy** in this repo (or elsewhere) that runs commands/edits files and is called from n8n; keep security and sandboxing in mind (allowed dirs, allowed commands, auth).

3. **Do not** try to run the Desktop Commander MCP server inside `server.js` or the browser as the primary integration; it’s the wrong architecture. Option B or C above are the right ways to “implement” Desktop Commander in relation to this project.

---

## 7. References

- Desktop Commander MCP: [GitHub (commit 8d1e7e8)](https://github.com/wonderwhy-er/DesktopCommanderMCP/tree/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59), [README](https://github.com/wonderwhy-er/DesktopCommanderMCP/blob/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59/README.md).
- Remote MCP: [mcp.desktopcommander.app](https://mcp.desktopcommander.app).
- JARVIS-WEB: `README.md`, `docs/INTEGRATION.md`, `docs/n8n-webhooks-research.md`, `public/js/app.js`, `public/js/n8n-payload.js`.
- MCP: [modelcontextprotocol.io](https://modelcontextprotocol.io).
