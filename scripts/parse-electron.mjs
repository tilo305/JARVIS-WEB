#!/usr/bin/env node
/**
 * Parse Electron files (main.js, preload.js) and extract:
 * - IPC channels (ipcMain.on, ipcMain.handle, ipcRenderer.send, ipcRenderer.invoke)
 * - contextBridge exposed APIs
 * - BrowserWindow config
 * - Menu structure
 * - Security settings (webPreferences, CSP, permission handlers)
 * - Integration points (n8n, MCP, Vite)
 *
 * Usage:
 *   node scripts/parse-electron.mjs
 *   node scripts/parse-electron.mjs --output=electron-parse-results.json
 */

import { readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const ELECTRON_DIR = resolve(ROOT, 'electron');

const args = process.argv.slice(2);
const outputFile = args.find((a) => a.startsWith('--output='))?.split('=')[1] || 'electron-parse-results.json';

// ---------------------------------------------------------------------------
// PARSERS
// ---------------------------------------------------------------------------

function parseMainJs(content) {
  const result = {
    imports: [],
    ipcChannels: { on: [], handle: [] },
    browserWindow: null,
    menu: { items: [] },
    security: {
      webPreferences: {},
      csp: null,
      permissionHandler: false,
      navigationRestrictions: false,
      setWindowOpenHandler: false,
      willAttachWebview: false,
    },
    integrations: {
      n8n: false,
      mcp: false,
      vite: false,
    },
    functions: [],
    constants: [],
  };

  // Imports
  const importRegex = /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    result.imports.push({ source: m[m.length - 1], line: content.substring(0, m.index).split('\n').length });
  }

  // ipcMain.on('channel', handler)
  const ipcOnRegex = /ipcMain\.on\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = ipcOnRegex.exec(content)) !== null) {
    result.ipcChannels.on.push({
      channel: m[1],
      line: content.substring(0, m.index).split('\n').length,
    });
  }

  // ipcMain.handle('channel', handler)
  const ipcHandleRegex = /ipcMain\.handle\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = ipcHandleRegex.exec(content)) !== null) {
    result.ipcChannels.handle.push({
      channel: m[1],
      line: content.substring(0, m.index).split('\n').length,
    });
  }

  // BrowserWindow config
  const bwMatch = content.match(/new\s+BrowserWindow\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  if (bwMatch) {
    const config = bwMatch[1];
    result.browserWindow = {
      width: /width:\s*(\d+)/.exec(config)?.[1],
      height: /height:\s*(\d+)/.exec(config)?.[1],
      minWidth: /minWidth:\s*(\d+)/.exec(config)?.[1],
      minHeight: /minHeight:\s*(\d+)/.exec(config)?.[1],
      backgroundColor: /backgroundColor:\s*['"]([^'"]+)['"]/.exec(config)?.[1],
      title: /title:\s*['"]([^'"]+)['"]/.exec(config)?.[1],
      nodeIntegration: /nodeIntegration:\s*(\w+)/.exec(config)?.[1],
      contextIsolation: /contextIsolation:\s*(\w+)/.exec(config)?.[1],
      sandbox: /sandbox:\s*(\w+)/.exec(config)?.[1],
      webSecurity: /webSecurity:\s*(\w+)/.exec(config)?.[1],
      preload: /preload:\s*(\w+)/.exec(config)?.[1] ? 'PRELOAD_PATH' : null,
    };
  }

  // Menu items (label + role/click)
  const menuLabelRegex = /label:\s*['"]([^'"]+)['"]/g;
  while ((m = menuLabelRegex.exec(content)) !== null) {
    if (!result.menu.items.includes(m[1])) result.menu.items.push(m[1]);
  }

  // Security
  result.security.permissionHandler = /setPermissionRequestHandler/.test(content);
  result.security.navigationRestrictions = /will-navigate|willNavigate/.test(content);
  result.security.setWindowOpenHandler = /setWindowOpenHandler/.test(content);
  result.security.willAttachWebview = /will-attach-webview/.test(content);
  if (/Content-Security-Policy|ContentSecurityPolicy|csp/.test(content)) {
    const cspMatch = content.match(/"default-src[^"]+"/);
    result.security.csp = cspMatch ? 'present' : 'dynamic';
  }

  // Integrations
  result.integrations.n8n = /n8n-webhook|handleN8nWebhook|invokeN8nWebhook/.test(content);
  result.integrations.mcp = /mcp-list-tools|mcp-call|handleMcpListTools|handleMcpCall/.test(content);
  result.integrations.vite = /VITE_DEV_PORT|localhost.*3000|loadURL|loadFile/.test(content);

  // Top-level functions
  const fnRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
  while ((m = fnRegex.exec(content)) !== null) {
    result.functions.push(m[1]);
  }

  return result;
}

function parsePreloadJs(content) {
  const result = {
    moduleType: /require\s*\(/.test(content) ? 'CommonJS' : 'ESM',
    contextBridge: {
      exposed: 'electronAPI',
      apis: [],
    },
    ipcRenderer: {
      send: [],
      invoke: [],
      on: [],
    },
  };

  // contextBridge.exposeInMainWorld('electronAPI', { ... })
  const exposeMatch = content.match(/contextBridge\.exposeInMainWorld\s*\(\s*['"]([^'"]+)['"]/);
  if (exposeMatch) result.contextBridge.exposed = exposeMatch[1];

  // Exposed API keys: top-level keys in expose object have 2-space indent
  const exposeStart = content.indexOf('contextBridge.exposeInMainWorld');
  if (exposeStart >= 0) {
    const afterExpose = content.slice(exposeStart);
    const keyMatches = afterExpose.matchAll(/^\s{2}(\w+)\s*:/gm);
    for (const km of keyMatches) {
      if (!result.contextBridge.apis.includes(km[1])) result.contextBridge.apis.push(km[1]);
    }
  }

  // ipcRenderer.send('channel', ...)
  let m;
  const sendRegex = /ipcRenderer\.send\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = sendRegex.exec(content)) !== null) {
    result.ipcRenderer.send.push(m[1]);
  }

  // ipcRenderer.invoke('channel', ...)
  const invokeRegex = /ipcRenderer\.invoke\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = invokeRegex.exec(content)) !== null) {
    result.ipcRenderer.invoke.push(m[1]);
  }

  // ipcRenderer.on('channel', ...)
  const onRegex = /ipcRenderer\.on\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = onRegex.exec(content)) !== null) {
    result.ipcRenderer.on.push(m[1]);
  }

  return result;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function parseElectron() {
  console.log('🔌 Parsing Electron files...\n');

  const results = {
    main: null,
    preload: null,
    summary: {
      files: [],
      ipcChannels: [],
      contextBridgeApis: [],
      errors: [],
    },
  };

  const mainPath = resolve(ELECTRON_DIR, 'main.js');
  const preloadPath = resolve(ELECTRON_DIR, 'preload.js');

  if (existsSync(mainPath)) {
    try {
      const content = readFileSync(mainPath, 'utf-8');
      const stat = statSync(mainPath);
      results.main = {
        file: relative(ROOT, mainPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parseMainJs(content),
      };
      results.summary.files.push(results.main.file);
      results.summary.ipcChannels.push(
        ...(results.main.ipcChannels?.on?.map((c) => ({ channel: c.channel, type: 'on' })) || []),
        ...(results.main.ipcChannels?.handle?.map((c) => ({ channel: c.channel, type: 'handle' })) || [])
      );
      console.log(`  ✓ ${results.main.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'electron/main.js', error: err.message });
      console.log(`  ✗ electron/main.js: ${err.message}`);
    }
  } else {
    results.summary.errors.push({ file: 'electron/main.js', error: 'File not found' });
    console.log('  ✗ electron/main.js not found');
  }

  if (existsSync(preloadPath)) {
    try {
      const content = readFileSync(preloadPath, 'utf-8');
      const stat = statSync(preloadPath);
      results.preload = {
        file: relative(ROOT, preloadPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsePreloadJs(content),
      };
      results.summary.files.push(results.preload.file);
      results.summary.contextBridgeApis = results.preload.contextBridge?.apis || [];
      console.log(`  ✓ ${results.preload.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'electron/preload.js', error: err.message });
      console.log(`  ✗ electron/preload.js: ${err.message}`);
    }
  } else {
    results.summary.errors.push({ file: 'electron/preload.js', error: 'File not found' });
    console.log('  ✗ electron/preload.js not found');
  }

  return results;
}

// Run and write
const results = parseElectron();
const outputPath = resolve(ROOT, outputFile);
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n${'='.repeat(60)}`);
console.log('ELECTRON PARSE SUMMARY');
console.log(`${'='.repeat(60)}`);
console.log(`Files: ${results.summary.files.join(', ') || 'none'}`);
console.log(`IPC channels: ${results.summary.ipcChannels.map((c) => `${c.channel} (${c.type})`).join(', ') || 'none'}`);
console.log(`contextBridge APIs: ${results.summary.contextBridgeApis.join(', ') || 'none'}`);
if (results.main?.integrations) {
  console.log(`Integrations: n8n=${results.main.integrations.n8n}, mcp=${results.main.integrations.mcp}, vite=${results.main.integrations.vite}`);
}
if (results.summary.errors.length > 0) {
  console.log(`\nErrors: ${results.summary.errors.length}`);
}
console.log(`\n✓ Results saved to: ${outputFile}`);
