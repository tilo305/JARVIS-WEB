# MCP Alternatives to Desktop Commander — Research for JARVIS-WEB

**Research date:** February 8, 2026  
**Scope:** GitHub and MCP ecosystem alternatives that provide terminal, filesystem, and/or file-editing capabilities similar to [Desktop Commander MCP](https://github.com/wonderwhy-er/DesktopCommanderMCP).

---

## 1. Executive Summary

| Goal | Best alternatives |
|------|-------------------|
| **Use alongside JARVIS-WEB (Claude/Cursor)** | **Official filesystem** + **terminal server** (e.g. iris-networks/terminal_mcp, GongRzhe/terminal-controller-mcp), or **mark3labs/mcp-filesystem-server** (Go, single binary, filesystem-only). |
| **Web/HTTP-friendly (expose to n8n or a backend)** | **cyanheads/filesystem-mcp-server** (STDIO + **HTTP + JWT**). |
| **Closest “all-in-one” replacement for Desktop Commander** | **GongRzhe/terminal-controller-mcp** (terminal + filesystem + file editing in one server; TypeScript/Python; ~97 stars). |
| **Minimal / official-only stack** | **@modelcontextprotocol/server-filesystem** (filesystem) + a separate terminal MCP (e.g. **RinardNick/mcp-terminal** or **iris-networks/terminal_mcp**). |

**Desktop Commander** remains the most feature-rich single server (terminal + process management + filesystem + Excel/PDF + edit_block + in-memory code execution). The alternatives below are either **lighter**, **official**, **HTTP-capable**, or **multi-transport**, depending on what you need for JARVIS-WEB.

---

## 2. Comparison Matrix

| Server | Terminal | Filesystem | File edit | Transport | Language | Stars (approx) | Fit for JARVIS |
|--------|----------|------------|-----------|-----------|----------|----------------|-----------------|
| **Desktop Commander** | ✅ Full | ✅ Full | ✅ edit_block | stdio | TypeScript | 5.4k | Reference baseline |
| **@modelcontextprotocol/server-filesystem** | ❌ | ✅ Full | ✅ edit_file | stdio | TypeScript | — (official) | Filesystem-only; pair with terminal server |
| **mark3labs/mcp-filesystem-server** | ❌ | ✅ Full | ✅ modify_file | stdio | Go | 593 | Single binary; fs + search + modify |
| **cyanheads/filesystem-mcp-server** | ❌ | ✅ Full | ✅ | **STDIO + HTTP (JWT)** | TypeScript | 32 | **Best for web/n8n** (HTTP) |
| **GongRzhe/terminal-controller-mcp** | ✅ | ✅ | ✅ row-based edits | stdio | TypeScript/Python | 97 | **Closest all-in-one alternative** |
| **iris-networks/terminal_mcp** | ✅ Persistent shells | ❌ | ❌ | stdio + **StreamableHTTP** | Go | 9 | Terminal + HTTP option |
| **RinardNick/mcp-terminal** | ✅ Allowlist | ❌ | ❌ | stdio | JavaScript | 8 | Secure terminal-only |
| **stat-guy/terminal** | ✅ | ❌ | ❌ | stdio | JavaScript | 8 | Simple terminal-only |
| **tufantunc/ssh-mcp** | ✅ (remote SSH) | ❌ | ❌ | stdio | — | — | Remote execution |

---

## 3. Alternative Servers (Detailed)

### 3.1 Official & High-Trust

#### **@modelcontextprotocol/server-filesystem** (Official MCP)

- **Repo / package:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) (src/filesystem), [npm](https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem)
- **Features:** read/write files, create/list/delete directories, move, search, get_file_info, **edit_file** (pattern-based edits, dry-run), directory_tree, list_allowed_directories. Dynamic access via **MCP Roots** (no restart for directory updates).
- **Transport:** stdio only.
- **Why consider:** Official, maintained, 154k+ weekly npm downloads. Desktop Commander is built on top of this; using it directly gives you filesystem + editing without terminal. Pair with any terminal MCP for “Desktop Commander–lite.”
- **JARVIS:** Use in Claude/Cursor alongside a terminal server; not suitable for in-browser or n8n unless you add an MCP client proxy.

---

#### **mark3labs/mcp-filesystem-server** (Go)

- **Repo:** [mark3labs/mcp-filesystem-server](https://github.com/mark3labs/mcp-filesystem-server)
- **Features:** read/write/copy/move/delete files, **modify_file** (find/replace with regex), list_directory, tree, search_files, search_within_files, get_file_info. Path validation, symlink handling, allowed-directories restriction.
- **Transport:** stdio.
- **Why consider:** Single Go binary, ~593 stars, strong filesystem + search + modify; no terminal. Good if you want one filesystem server and a separate terminal server.
- **JARVIS:** Same as official filesystem — use in desktop MCP host; not HTTP.

---

### 3.2 HTTP / Web-Friendly (Good for n8n or Backend)

#### **cyanheads/filesystem-mcp-server** (TypeScript, HTTP + JWT)

- **Repo:** [cyanheads/filesystem-mcp-server](https://github.com/cyanheads/filesystem-mcp-server)
- **Features:** Read, write, update, manage files and directories; path sanitization; **STDIO and HTTP** transport; **JWT authentication** for HTTP.
- **Transport:** STDIO + **HTTP** (Express, JWT). Config via env (e.g. `FS_BASE_DIRECTORY`, auth secrets).
- **Why consider:** Only filesystem MCP in this list with **HTTP + auth** out of the box. Lets a backend (or n8n calling your API) talk MCP over HTTP instead of spawning a stdio process.
- **JARVIS:** **Best candidate** if you want to expose “filesystem MCP” to an n8n workflow or a Node backend: run this server in HTTP mode and call it from your proxy/API.

---

#### **iris-networks/terminal_mcp** (Go, HTTP optional)

- **Repo:** [iris-networks/terminal_mcp](https://github.com/iris-networks/terminal_mcp)
- **Features:** execute_command, **persistent_shell**, session_manager. Configurable timeout (`MCP_COMMAND_TIMEOUT`), custom shell (`MCP_SHELL`). macOS/Linux.
- **Transport:** STDIO and **StreamableHTTP** (can run on a port).
- **Why consider:** Terminal-only but with **HTTP transport** option; persistent shell sessions. Useful if you need terminal over the network (e.g. from a backend that can’t spawn stdio).
- **JARVIS:** Use in HTTP mode if you want n8n/backend to trigger remote terminal commands via MCP over HTTP.

---

### 3.3 Combined Terminal + Filesystem (Desktop Commander–Style)

#### **GongRzhe/terminal-controller-mcp** (TypeScript/Python)

- **Repo:** [GongRzhe/terminal-controller-mcp](https://github.com/GongRzhe/terminal-controller-mcp)
- **Features:** **Terminal:** execute_command (timeout, safety checks e.g. block `rm -rf /`), command history, get/change directory, list_directory. **Files:** read_file, write_file, insert/update/delete by row. Windows + UNIX.
- **Transport:** stdio.
- **Why consider:** Single server for both terminal and filesystem + simple file edits; ~97 stars; MIT. Less features than Desktop Commander (no Excel/PDF, no edit_block, no process management) but closest “all-in-one” alternative.
- **JARVIS:** Good drop-in for “terminal + files + basic edits” in Claude/Cursor without installing Desktop Commander.

---

### 3.4 Terminal-Only

#### **RinardNick/mcp-terminal** (JavaScript)

- **Repo:** [RinardNick/mcp-terminal](https://github.com/RinardNick/mcp-terminal)
- **Features:** Execute shell commands with **allowlist** (e.g. python, pip, git, ls, cd), timeout, max output size. Security-focused.
- **Transport:** stdio.
- **Why consider:** Small, secure terminal-only; install via PyPI or npm; good for “only these commands” use cases.
- **JARVIS:** Pair with official (or mark3labs) filesystem server for a minimal, locked-down setup.

---

#### **stat-guy/terminal** (JavaScript/TypeScript)

- **Repo:** [stat-guy/terminal](https://github.com/stat-guy/terminal)
- **Features:** execute_command, change_directory, get_current_directory, get_terminal_info. User permission via Claude Desktop.
- **Transport:** stdio.
- **Why consider:** Simple terminal MCP; 8 stars; easy to clone and customize.
- **JARVIS:** Minimal terminal option; combine with filesystem server.

---

#### **tufantunc/ssh-mcp** (SSH)

- **Repo:** [tufantunc/ssh-mcp](https://github.com/tufantunc/ssh-mcp)
- **Features:** exec, sudo-exec on **remote** hosts via SSH; timeout and process management.
- **Transport:** stdio.
- **Why consider:** When you need **remote** command execution (Linux/Windows over SSH), not local.
- **JARVIS:** Only if your “commands” are meant to run on a remote server, not on the same machine as JARVIS/n8n.

---

## 4. Recommendations for JARVIS-WEB

### 4.1 “Use alongside JARVIS-WEB” (same AI, more tools in Claude/Cursor)

- **Option A — Minimal official stack:**  
  **@modelcontextprotocol/server-filesystem** + **RinardNick/mcp-terminal** (or **stat-guy/terminal**).  
  Gives filesystem + edits + terminal with minimal surface; no Desktop Commander.

- **Option B — Single combined server:**  
  **GongRzhe/terminal-controller-mcp**.  
  One server for terminal + files + row-based edits; good if you don’t need Excel/PDF/process management.

- **Option C — Keep Desktop Commander.**  
  Still the most capable single server; use it as in [DESKTOP-COMMANDER-MCP-RESEARCH.md](./DESKTOP-COMMANDER-MCP-RESEARCH.md) (Option B).

### 4.2 “Expose to n8n / backend” (voice → n8n → run command or file op)

- **Filesystem over HTTP:** Run **cyanheads/filesystem-mcp-server** in **HTTP mode with JWT**. Your backend (or an n8n-triggered service) calls its HTTP MCP endpoint to do file ops. No stdio in the web path.
- **Terminal over HTTP:** Run **iris-networks/terminal_mcp** in **StreamableHTTP** mode; backend/n8n calls it to run commands (with proper auth and network lockdown).
- **Alternative:** Skip MCP and use **n8n nodes** (Execute Command, Read/Write File) or a small **HTTP proxy** that runs commands/edits files and is called from n8n (as in DESKTOP-COMMANDER-MCP-RESEARCH.md Option C).

### 4.3 “Replace Desktop Commander” feature-by-feature

| Desktop Commander feature | Alternative |
|---------------------------|------------|
| Terminal + process mgmt | **GongRzhe/terminal-controller-mcp** (terminal only; no process list/kill) or **iris-networks/terminal_mcp** (sessions) |
| Filesystem | **@modelcontextprotocol/server-filesystem** or **mark3labs/mcp-filesystem-server** |
| Surgical edits | **@modelcontextprotocol/server-filesystem** `edit_file` or **mark3labs** `modify_file` |
| Excel/PDF / in-memory code | No direct MCP alternative in this research; keep Desktop Commander or implement custom tools in n8n |

---

## 5. References

- **MCP Registry:** [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io)  
- **Official servers:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)  
- **Official filesystem (npm):** [@modelcontextprotocol/server-filesystem](https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem)  
- **Desktop Commander:** [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP)  
- **JARVIS integration context:** [DESKTOP-COMMANDER-MCP-RESEARCH.md](./DESKTOP-COMMANDER-MCP-RESEARCH.md), [INTEGRATION.md](./INTEGRATION.md)

---

## 6. Quick Links (GitHub)

| Server | GitHub URL |
|--------|------------|
| Official filesystem | <https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem> |
| mark3labs filesystem | <https://github.com/mark3labs/mcp-filesystem-server> |
| cyanheads filesystem (HTTP) | <https://github.com/cyanheads/filesystem-mcp-server> |
| GongRzhe terminal-controller | <https://github.com/GongRzhe/terminal-controller-mcp> |
| iris-networks terminal | <https://github.com/iris-networks/terminal_mcp> |
| RinardNick mcp-terminal | <https://github.com/RinardNick/mcp-terminal> |
| stat-guy terminal | <https://github.com/stat-guy/terminal> |
| tufantunc ssh-mcp | <https://github.com/tufantunc/ssh-mcp> |
