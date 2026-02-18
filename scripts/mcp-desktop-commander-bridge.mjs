/**
 * MCP bridge: runs Desktop Commander MCP server (Docker or npx) and exposes
 * callTool / listTools for use by server.js API routes.
 * Used when ENABLE_MCP=1 so JARVIS-WEB (or n8n) can invoke Desktop Commander tools.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const MCP_USE_DOCKER = process.env.MCP_USE_DOCKER !== '0' && process.env.MCP_USE_DOCKER !== 'false';
const MCP_DOCKER_IMAGE = process.env.MCP_DOCKER_IMAGE || 'mcp/desktop-commander:latest';
const MCP_WORKSPACE_PATH = process.env.MCP_WORKSPACE_PATH || process.cwd();

let client = null;
let transport = null;

function getServerParams() {
  if (MCP_USE_DOCKER) {
    const args = ['run', '-i', '--rm'];
    if (MCP_WORKSPACE_PATH) {
      // Windows paths: use forward slashes for Docker -v (Docker Desktop accepts C:/path)
      const mountPath = MCP_WORKSPACE_PATH.replace(/\\/g, '/');
      args.push('-v', `${mountPath}:/workspace`, MCP_DOCKER_IMAGE);
    } else {
      args.push(MCP_DOCKER_IMAGE);
    }
    return { command: 'docker', args };
  }
  return {
    command: 'npx',
    args: ['-y', '@wonderwhy-er/desktop-commander@latest'],
  };
}

/**
 * Connect to Desktop Commander MCP server (lazy). Call once before listTools/callTool.
 * @returns {Promise<void>}
 */
export async function connect() {
  if (client) return;
  const serverParams = getServerParams();
  transport = new StdioClientTransport(serverParams);
  client = new Client(
    { name: 'jarvis-web-mcp-client', version: '1.0.0' },
    { capabilities: {} }
  );
  await client.connect(transport);
}

/**
 * List tools offered by the MCP server.
 * @returns {Promise<{ tools: Array<{ name: string, description?: string, inputSchema?: object }> }>}
 */
export async function listTools() {
  if (!client) await connect();
  return client.listTools();
}

/**
 * Call a single MCP tool.
 * @param {string} name - Tool name (e.g. read_file, start_process)
 * @param {Record<string, unknown>} args - Tool arguments
 * @returns {Promise<{ content?: Array<{ type: string, text?: string }>, isError?: boolean }>}
 */
export async function callTool(name, args = {}) {
  if (!client) await connect();
  return client.callTool({ name, arguments: args });
}

/**
 * Close the MCP connection and kill the server process.
 */
export async function close() {
  if (transport) {
    await transport.close();
    transport = null;
  }
  client = null;
}
