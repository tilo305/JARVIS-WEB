#!/usr/bin/env node
/**
 * Verify Electron is integrated, bridged, and connected correctly to:
 * - Vite (dev server + build output)
 * - UI/Frontend (preload bridge, electronAPI)
 * - Backend (n8n webhook via main process)
 *
 * Run: node debug/tools/verify-electron-integration.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const checks = [];
let failed = 0;

function ok(msg) {
  checks.push({ ok: true, msg });
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  checks.push({ ok: false, msg });
  failed++;
  console.error(`  ✗ ${msg}`);
}

console.log('\n🔌 Electron Integration Verification\n');

// 1. Electron ↔ Vite
console.log('1. Electron ↔ Vite');
const mainJs = resolve(ROOT, 'electron', 'main.js');
const preloadJs = resolve(ROOT, 'electron', 'preload.js');
const distIndex = resolve(ROOT, 'dist-public', 'index.html');
const distAudio = resolve(ROOT, 'dist-public', 'audio');

if (existsSync(mainJs)) ok('electron/main.js exists');
else fail('electron/main.js missing');

if (existsSync(preloadJs)) ok('electron/preload.js exists');
else fail('electron/preload.js missing');

if (existsSync(distIndex)) {
  ok('dist-public/index.html exists (Vite build output)');
  const html = readFileSync(distIndex, 'utf8');
  if (html.includes('./assets/') && html.includes('.js')) ok('Built index.html has relative asset paths (file:// compatible)');
  else fail('Built index.html may have wrong script paths');
} else {
  fail('dist-public/index.html missing — run: npm run vite:build');
}

if (existsSync(distAudio)) ok('dist-public/audio/ exists (AudioWorklet processors)');
else fail('dist-public/audio/ missing — Vite static copy');

const sttProcessor = resolve(ROOT, 'dist-public', 'audio', 'stt-capture-processor.js');
const ttsProcessor = resolve(ROOT, 'dist-public', 'audio', 'tts-playback-processor.js');
if (existsSync(sttProcessor)) ok('stt-capture-processor.js in build');
else fail('stt-capture-processor.js not in build');
if (existsSync(ttsProcessor)) ok('tts-playback-processor.js in build');
else fail('tts-playback-processor.js not in build');

// 2. Preload bridge
console.log('\n2. Preload bridge (contextBridge)');
const preloadContent = readFileSync(preloadJs, 'utf8');
if (preloadContent.includes('contextBridge.exposeInMainWorld')) ok('contextBridge.exposeInMainWorld used');
else fail('contextBridge.exposeInMainWorld not found');
if (preloadContent.includes("'electronAPI'")) ok('electronAPI exposed');
else fail('electronAPI not exposed');
if (preloadContent.includes('invokeN8nWebhook')) ok('invokeN8nWebhook in preload');
else fail('invokeN8nWebhook missing');
if (preloadContent.includes('setTitle')) ok('setTitle (Pattern 1 one-way) in preload');
else fail('setTitle missing');
if (preloadContent.includes('onMenuAction')) ok('onMenuAction (Pattern 3 main→renderer) in preload');
else fail('onMenuAction missing');
if (preloadContent.includes('ipcRenderer.invoke')) ok('ipcRenderer.invoke for n8n-webhook');
else fail('ipcRenderer.invoke not found');
if (!preloadContent.includes('ipcRenderer') || preloadContent.includes('invoke(')) ok('Preload uses safe wrapper (no raw ipcRenderer exposed)');
else fail('Preload may expose raw ipcRenderer');

// 3. Main process
console.log('\n3. Main process');
const mainContent = readFileSync(mainJs, 'utf8');
if (mainContent.includes("ipcMain.on('set-title'")) ok('ipcMain.on set-title (Pattern 1) registered');
else fail('set-title IPC handler missing');
if (mainContent.includes("ipcMain.handle('n8n-webhook'")) ok('ipcMain.handle n8n-webhook registered');
else fail('n8n-webhook IPC handler missing');
if (mainContent.includes("webContents.send('menu-action'")) ok('webContents.send menu-action (Pattern 3)');
else fail('menu-action Main→Renderer missing');
if (mainContent.includes('preload:')) ok('Preload path configured');
else fail('Preload not configured');
if (mainContent.includes('contextIsolation: true')) ok('contextIsolation enabled');
else fail('contextIsolation should be true');
if (mainContent.includes('nodeIntegration: false')) ok('nodeIntegration disabled');
else fail('nodeIntegration should be false');
if (mainContent.includes('sandbox: true')) ok('Sandbox enabled');
else fail('Sandbox should be true');
if (mainContent.includes('getN8nProxyTimeoutMs') && mainContent.includes('90_000')) ok('n8n webhook timeout 90s default (env override)');
else if (mainContent.includes('N8N_PROXY_TIMEOUT_MS') || mainContent.includes('N8N_WEBHOOK_TIMEOUT_MS')) ok('n8n webhook timeout env override present');
else fail('n8n webhook timeout should be 90s default with env override');
// Dev: loadURL localhost; Built: loadURL app://bundle/ or loadFile (app:// = secure context for mic)
if (mainContent.includes('loadURL') && (mainContent.includes('loadFile') || mainContent.includes('app://bundle'))) ok('Dev (loadURL) and built (loadURL app:// or loadFile) modes');
else if (mainContent.includes('loadURL')) ok('loadURL for dev and/or built');
else fail('Missing loadURL or loadFile');

// 4. Frontend
console.log('\n4. Frontend (app.js)');
const appJs = resolve(ROOT, 'public', 'js', 'app.js');
const appContent = readFileSync(appJs, 'utf8');
if (appContent.includes('window.electronAPI?.isElectron')) ok('Electron detection (electronAPI.isElectron)');
else fail('Electron detection missing');
if (appContent.includes('JARVIS_IS_ELECTRON')) ok('JARVIS_IS_ELECTRON flag set');
else fail('JARVIS_IS_ELECTRON not set');
if (appContent.includes('invokeN8nWebhook')) ok('invokeN8nWebhook used for n8n');
else fail('invokeN8nWebhook not used');
if (appContent.includes('useElectronProxy')) ok('Electron proxy detection for n8n');
else fail('Electron proxy logic missing');
if (appContent.includes('electronAPI?.isElectron') && appContent.includes('window.location.origin') && appContent.includes('/audio/')) ok('Electron-specific AudioWorklet base path (origin + /audio/)');
else if (appContent.includes('audioWorkletBasePath')) ok('Bridge receives audioWorkletBasePath');
else fail('AudioWorklet base path for Electron missing');
if (appContent.includes('JARVIS_VERIFY_ELECTRON_MIC')) ok('JARVIS_VERIFY_ELECTRON_MIC() runtime mic verification helper');
else fail('JARVIS_VERIFY_ELECTRON_MIC missing');
if (appContent.includes('checkRecordingSupport') && appContent.includes('Electron')) ok('Electron startup mic check');

// 5. Bridge ↔ AudioWorklet ↔ VAD
console.log('\n5. Bridge ↔ AudioWorklet ↔ VAD');
const bridgePath = resolve(ROOT, 'public', 'js', 'cartesia-audio-bridge.js');
const bridgeContent = existsSync(bridgePath) ? readFileSync(bridgePath, 'utf8') : '';
if (bridgeContent.includes('audioWorklet.addModule')) ok('Bridge loads AudioWorklet processors');
if (bridgeContent.includes('MicVAD') && bridgeContent.includes('VAD_CONFIG')) ok('Bridge uses VAD (MicVAD + VAD_CONFIG)');
if (bridgeContent.includes('stt-capture-processor') && bridgeContent.includes('tts-playback-processor')) ok('STT and TTS processors referenced');
if (bridgeContent.includes("startsWith('app:')")) ok('Bridge supports app:// protocol for Electron');
const vadConfigPath = resolve(ROOT, 'public', 'js', 'vad-config.js');
const vadContent = existsSync(vadConfigPath) ? readFileSync(vadConfigPath, 'utf8') : '';
if (vadContent.includes('VAD_CONFIG') && vadContent.includes('baseAssetPath')) ok('VAD config has CDN paths for Electron');

// 6. Vite config
console.log('\n6. Vite config');
const viteConfig = resolve(ROOT, 'vite.config.js');
const viteContent = readFileSync(viteConfig, 'utf8');
if (viteContent.includes("base: './'")) ok("Vite base: './' (relative paths for file://)");
else fail("Vite base should be './'");
if (viteContent.includes('dist-public')) ok('Vite outDir: dist-public');
else fail('Vite outDir should be dist-public');
if (viteContent.includes('preserve-index-html') || viteContent.includes('preserveIndexHtml')) ok('preserveIndexHtmlPlugin for Electron build');
else fail('preserveIndexHtmlPlugin may be missing');

// 7. package.json
console.log('\n7. package.json scripts');
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
if (pkg.main === 'electron/main.js') ok('main points to electron/main.js');
else fail('main should be electron/main.js');
if (pkg.scripts.electron) ok('electron script defined');
else fail('electron script missing');
if (pkg.scripts['electron:built']) ok('electron:built script defined');
else fail('electron:built script missing');
if (pkg.scripts['electron:build']) ok('electron:build script defined');
else fail('electron:build script missing');

console.log('\n' + (failed === 0 ? '✅ All checks passed. Electron is integrated correctly.\n' : `❌ ${failed} check(s) failed.\n`));
process.exit(failed > 0 ? 1 : 0);
