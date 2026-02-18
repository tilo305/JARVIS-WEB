#!/usr/bin/env node
/**
 * Smoke test: spawn Electron with USE_BUILT=1, capture stderr for a few seconds,
 * then exit. Fails if stderr contains path/load errors. Per zEn DeBuGgEr.md.
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

const electronCli = resolve(root, 'node_modules', 'electron', 'cli.js');
const mainJs = resolve(root, 'electron', 'main.js');

const electron = spawn(
  process.execPath,
  [electronCli, mainJs],
  {
    cwd: root,
    env: { ...process.env, USE_BUILT: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let stderr = '';
let stdout = '';
electron.stderr.setEncoding('utf8');
electron.stdout.setEncoding('utf8');
electron.stderr.on('data', (chunk) => { stderr += chunk; });
electron.stdout.on('data', (chunk) => { stdout += chunk; });

const failPatterns = [
  /ENOENT/,
  /Cannot find.*(file|module)/i,
  /could not load (file|url)/i,
  /preload.*(error|failed)/i,
  /Error:.*path/i,
  /loadFile.*error/i,
  /violates the following Content Security Policy/i,
  /The action has been blocked/i,
];

let exited = false;
function finish(ok, msg) {
  if (exited) return;
  exited = true;
  clearTimeout(timeout);
  try { electron.kill(); } catch { /* process may already have exited */ }
  if (!ok) {
    console.error('Electron built smoke test FAILED:', msg);
    const out = (stderr + stdout).slice(-2000);
    if (out) console.error(out);
    process.exit(1);
  }
  console.log('Electron built smoke test OK.');
  process.exit(0);
}

const timeout = setTimeout(() => {
  const allOutput = stderr + stdout;
  const hasError = failPatterns.some((p) => p.test(allOutput));
  finish(!hasError, hasError ? 'output contained load/path/CSP error' : '');
}, 5000);

electron.on('error', (err) => {
  finish(false, err.message);
});

electron.on('exit', (code, _signal) => {
  if (exited) return;
  const hasError = failPatterns.some((p) => p.test(stderr + stdout));
  if (code !== 0 && code !== null && hasError) {
    finish(false, 'exit with error and path/load error in stderr');
  } else {
    finish(true, '');
  }
});
