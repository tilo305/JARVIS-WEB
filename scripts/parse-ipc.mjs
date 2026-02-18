#!/usr/bin/env node
/**
 * Parse IPC (Inter-Process Communication) across Electron main, preload, and renderer.
 * Extracts:
 * - ipcMain.on / ipcMain.handle channels (main process)
 * - ipcRenderer.send / ipcRenderer.invoke / ipcRenderer.on (preload)
 * - webContents.send (main→renderer)
 * - contextBridge exposed APIs
 * - Renderer usage of electronAPI
 *
 * Usage:
 *   node scripts/parse-ipc.mjs
 *   node scripts/parse-ipc.mjs --output=ipc-parse-results.json
 */

import { readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const ELECTRON_DIR = resolve(ROOT, 'electron');
const PUBLIC_DIR = resolve(ROOT, 'public');

const args = process.argv.slice(2);
const outputFile = args.find((a) => a.startsWith('--output='))?.split('=')[1] || 'ipc-parse-results.json';

// ---------------------------------------------------------------------------
// PARSERS
// ---------------------------------------------------------------------------

function parseMainIpc(content) {
  const result = {
    ipcMain: { on: [], handle: [] },
    webContentsSend: [],
  };

  let m;

  // ipcMain.on('channel', handler)
  const onRegex = /ipcMain\.on\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g;
  while ((m = onRegex.exec(content)) !== null) {
    result.ipcMain.on.push({
      channel: m[1],
      handler: m[2],
      line: content.substring(0, m.index).split('\n').length,
    });
  }

  // ipcMain.handle('channel', handler)
  const handleRegex = /ipcMain\.handle\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g;
  while ((m = handleRegex.exec(content)) !== null) {
    result.ipcMain.handle.push({
      channel: m[1],
      handler: m[2],
      line: content.substring(0, m.index).split('\n').length,
    });
  }

  // webContents.send('channel', ...)
  const sendRegex = /webContents\.send\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = sendRegex.exec(content)) !== null) {
    result.webContentsSend.push({
      channel: m[1],
      line: content.substring(0, m.index).split('\n').length,
    });
  }

  return result;
}

function parsePreloadIpc(content) {
  const result = {
    contextBridge: { exposed: 'electronAPI', apis: [] },
    ipcRenderer: { send: [], invoke: [], on: [] },
  };

  const exposeMatch = content.match(/contextBridge\.exposeInMainWorld\s*\(\s*['"]([^'"]+)['"]/);
  if (exposeMatch) result.contextBridge.exposed = exposeMatch[1];

  const exposeStart = content.indexOf('contextBridge.exposeInMainWorld');
  if (exposeStart >= 0) {
    const afterExpose = content.slice(exposeStart);
    const keyMatches = afterExpose.matchAll(/^\s{2}(\w+)\s*:/gm);
    for (const km of keyMatches) {
      if (!result.contextBridge.apis.includes(km[1])) result.contextBridge.apis.push(km[1]);
    }
  }

  let m;
  const sendRegex = /ipcRenderer\.send\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = sendRegex.exec(content)) !== null) {
    result.ipcRenderer.send.push(m[1]);
  }

  const invokeRegex = /ipcRenderer\.invoke\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = invokeRegex.exec(content)) !== null) {
    result.ipcRenderer.invoke.push(m[1]);
  }

  const onRegex = /ipcRenderer\.on\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = onRegex.exec(content)) !== null) {
    result.ipcRenderer.on.push(m[1]);
  }

  return result;
}

function parseRendererIpcUsage(content) {
  const result = { electronApiUsage: [] };
  const seen = new Set();
  const apiRegex = /window\.electronAPI\??\.(\w+)/g;
  let m;
  while ((m = apiRegex.exec(content)) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      result.electronApiUsage.push(name);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function parseIpc() {
  console.log('🔗 Parsing IPC (main, preload, renderer)...\n');

  const results = {
    main: null,
    preload: null,
    renderer: null,
    summary: {
      channels: [],
      patterns: { oneWay: [], twoWay: [], mainToRenderer: [] },
      exposedApis: [],
      rendererUsage: [],
      mismatches: [],
      errors: [],
    },
  };

  const mainPath = resolve(ELECTRON_DIR, 'main.js');
  const preloadPath = resolve(ELECTRON_DIR, 'preload.js');
  const appPath = resolve(PUBLIC_DIR, 'js', 'app.js');

  if (existsSync(mainPath)) {
    try {
      const content = readFileSync(mainPath, 'utf-8');
      const stat = statSync(mainPath);
      const parsed = parseMainIpc(content);
      results.main = {
        file: relative(ROOT, mainPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsed,
      };
      for (const c of parsed.ipcMain.on) {
        results.summary.channels.push({ channel: c.channel, type: 'on', direction: 'renderer→main' });
        results.summary.patterns.oneWay.push(c.channel);
      }
      for (const c of parsed.ipcMain.handle) {
        results.summary.channels.push({ channel: c.channel, type: 'handle', direction: 'renderer→main' });
        results.summary.patterns.twoWay.push(c.channel);
      }
      for (const s of parsed.webContentsSend) {
        results.summary.channels.push({ channel: s.channel, type: 'send', direction: 'main→renderer' });
        results.summary.patterns.mainToRenderer.push(s.channel);
      }
      console.log(`  ✓ ${results.main.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'electron/main.js', error: err.message });
      console.log(`  ✗ electron/main.js: ${err.message}`);
    }
  }

  if (existsSync(preloadPath)) {
    try {
      const content = readFileSync(preloadPath, 'utf-8');
      const stat = statSync(preloadPath);
      const parsed = parsePreloadIpc(content);
      results.preload = {
        file: relative(ROOT, preloadPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsed,
      };
      results.summary.exposedApis = parsed.contextBridge.apis;
      console.log(`  ✓ ${results.preload.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'electron/preload.js', error: err.message });
      console.log(`  ✗ electron/preload.js: ${err.message}`);
    }
  }

  if (existsSync(appPath)) {
    try {
      const content = readFileSync(appPath, 'utf-8');
      const stat = statSync(appPath);
      const parsed = parseRendererIpcUsage(content);
      results.renderer = {
        file: relative(ROOT, appPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsed,
      };
      results.summary.rendererUsage = parsed.electronApiUsage || [];
      console.log(`  ✓ ${results.renderer.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'public/js/app.js', error: err.message });
      console.log(`  ✗ public/js/app.js: ${err.message}`);
    }
  }

  // Cross-check: exposed APIs not used in renderer, renderer calls not exposed
  if (results.summary.exposedApis?.length && results.summary.rendererUsage?.length) {
    const exposed = new Set(results.summary.exposedApis);
    const used = new Set(results.summary.rendererUsage);
    for (const api of exposed) {
      if (!used.has(api)) results.summary.mismatches.push({ type: 'unused', api });
    }
    for (const api of used) {
      if (!exposed.has(api)) results.summary.mismatches.push({ type: 'missing', api });
    }
  }

  return results;
}

// Run and write
const results = parseIpc();
const outputPath = resolve(ROOT, outputFile);
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n${'='.repeat(60)}`);
console.log('IPC PARSE SUMMARY');
console.log(`${'='.repeat(60)}`);
console.log(`Channels (main): ${results.summary.channels.map((c) => `${c.channel} (${c.type})`).join(', ') || 'none'}`);
console.log(`Pattern 1 (one-way): ${results.summary.patterns.oneWay.join(', ') || 'none'}`);
console.log(`Pattern 2 (two-way): ${results.summary.patterns.twoWay.join(', ') || 'none'}`);
console.log(`Pattern 3 (main→renderer): ${results.summary.patterns.mainToRenderer.join(', ') || 'none'}`);
console.log(`contextBridge APIs: ${results.summary.exposedApis.join(', ') || 'none'}`);
console.log(`Renderer usage: ${results.summary.rendererUsage.join(', ') || 'none'}`);
if (results.summary.mismatches.length > 0) {
  console.log(`\nMismatches: ${results.summary.mismatches.map((m) => `${m.api} (${m.type})`).join(', ')}`);
}
if (results.summary.errors.length > 0) {
  console.log(`\nErrors: ${results.summary.errors.length}`);
}
console.log(`\n✓ Results saved to: ${outputFile}`);
