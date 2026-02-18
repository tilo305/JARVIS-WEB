#!/usr/bin/env node
/**
 * Validate Electron main/preload and built app paths (no redundant tool).
 * Ensures paths used by electron/main.js exist so Electron can load.
 * Run after vite:build so dist-public exists. Per zEn DeBuGgEr.md.
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const ELECTRON_DIR = resolve(ROOT, 'electron');
const MAIN_JS = resolve(ELECTRON_DIR, 'main.js');
const PRELOAD_JS = resolve(ELECTRON_DIR, 'preload.js');
const BUILT_INDEX = resolve(ELECTRON_DIR, '..', 'dist-public', 'index.html');

const checks = [
  { name: 'electron/main.js', path: MAIN_JS },
  { name: 'electron/preload.js', path: PRELOAD_JS },
  { name: 'dist-public/index.html (built)', path: BUILT_INDEX },
];

let failed = 0;
for (const { name, path } of checks) {
  if (existsSync(path)) {
    console.log(`✓ ${name}`);
  } else {
    console.error(`✗ ${name} not found: ${path}`);
    failed++;
  }
}

if (failed > 0) {
  if (!existsSync(resolve(ROOT, 'dist-public', 'index.html'))) {
    console.error('\nRun: npm run vite:build (then re-run this script).');
  }
  process.exit(1);
}
console.log('\nElectron paths OK.');
process.exit(0);
