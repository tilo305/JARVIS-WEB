# Desktop Commander MCP — Docker setup for JARVIS-WEB

Use [Desktop Commander MCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) (terminal, filesystem, file editing) with this project by running it in **Docker** and connecting **Cursor** (or another MCP client) to it.

**Reference:** [DesktopCommanderMCP @ 8d1e7e8](https://github.com/wonderwhy-er/DesktopCommanderMCP/tree/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59)

---

## Prerequisites

- **Docker Desktop** installed and running (e.g. 4.59.0).
- **Cursor** (or another MCP host: Claude Desktop, etc.).

---

## 1. Pull the image (one-time)

In PowerShell or WSL:

```powershell
docker pull mcp/desktop-commander:latest
```

---

## 2. Configure Cursor to use Desktop Commander via Docker

You can use either **project-level** config (only when this repo is open) or **global** config (all workspaces).

### Option A — Project-level (recommended for JARVIS-WEB)

This repo already includes `.cursor/mcp.json` so that when you open JARVIS-WEB in Cursor, Desktop Commander is available with this project folder mounted.

- **File:** `.cursor/mcp.json` in the project root.
- The `-v` volume in the config mounts this project directory into the container as `/workspace`. If your clone lives elsewhere, edit the first path in the `-v` entry to your actual path (use forward slashes, e.g. `C:/Users/You/Projects/JARVIS-WEB`).

### Option B — Global Cursor config (all projects)

1. Open or create:
   - **Windows:** `%USERPROFILE%\.cursor\config\mcp.json`
   - **macOS/Linux:** `~/.cursor/mcp.json`
2. Add the `mcpServers` block (see below). For a generic setup you can omit the `-v` line or point it to a folder you often use (e.g. your home or a dev folder).

---

## 3. Example MCP config (Docker)

Use this structure in `.cursor/mcp.json` or in Cursor’s global MCP config.

**Basic (no folder access):**

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp/desktop-commander:latest"
      ]
    }
  }
}
```

**With this project mounted (recommended for JARVIS-WEB):**

Edit `YOUR_PROJECT_PATH` to your actual path (e.g. `C:/Users/lazar/Downloads/Everything AI/Github/JARVIS-WEB`). Use forward slashes.

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "YOUR_PROJECT_PATH:/workspace",
        "mcp/desktop-commander:latest"
      ]
    }
  }
}
```

**Multiple mounts (e.g. project + Downloads):**

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "C:/Users/lazar/Downloads/Everything AI/Github/JARVIS-WEB:/workspace",
        "-v",
        "C:/Users/lazar/Downloads:/mnt/Downloads",
        "mcp/desktop-commander:latest"
      ]
    }
  }
}
```

---

## 4. Restart Cursor

After saving `mcp.json`, restart Cursor so it picks up the new MCP server.

---

## 5. Verify

1. In Cursor, open the project and start a chat (or use the AI panel).
2. Check that the **Desktop Commander** MCP server is listed (e.g. in Cursor Settings → Features → MCP, or in the chat’s tool list).
3. Ask the AI to run a simple command (e.g. “List files in the workspace”) or read a file; it should use Desktop Commander tools.

---

## 6. Docker notes

- **Image:** `mcp/desktop-commander:latest` (auto-updates when you pull).
- **Persistence:** The container is `--rm` (removed after each run). Desktop Commander’s Docker image can use [named volumes](https://github.com/wonderwhy-er/DesktopCommanderMCP#advanced-folder-mounting) for a persistent environment; see the official README if you want that.
- **Windows paths:** In `-v`, use forward slashes: `C:/Users/...`. Avoid spaces in the path if possible, or quote as needed by your shell.

---

## 7. Relation to JARVIS-WEB

- Desktop Commander runs **outside** the JARVIS-WEB app: it’s an MCP server used by Cursor (or Claude Desktop), not by `server.js` or the browser.
- Use it **alongside** JARVIS-WEB: voice/chat in the browser, and in Cursor you get terminal + file + edit tools for this repo.
- For more context, see [DESKTOP-COMMANDER-MCP-RESEARCH.md](./DESKTOP-COMMANDER-MCP-RESEARCH.md).

---

## 8. Troubleshooting

| Issue | What to try |
|-------|---------------------|
| “Docker not found” | Ensure Docker Desktop is running and `docker` is on PATH (e.g. open a new terminal after starting Docker). |
| MCP server not listed | Restart Cursor after editing `mcp.json`; check JSON syntax (no trailing commas). |
| Permission / path errors in container | Confirm the path in `-v` is correct and that the folder exists. On WSL2, use the path as seen from Windows (e.g. `C:/Users/...`) when running from PowerShell. |
| Different commit | Image follows `latest`. For the exact commit [8d1e7e8](https://github.com/wonderwhy-er/DesktopCommanderMCP/tree/8d1e7e8ae95539f10a78fe1c9f4fa7832c53ca59), build from that tag/commit locally and use your own image name in `mcp.json`. |
