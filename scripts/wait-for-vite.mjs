#!/usr/bin/env node
/**
 * Wait for Vite dev server to be ready before launching Electron.
 * Uses PORT from .env (or 3000) so Electron and Vite stay in sync.
 */
import { spawn } from 'node:child_process';
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);
loadEnvEverywhere(rootDir);

const PORT = Number(process.env.PORT) || 3000;
const url = `http://localhost:${PORT}`;

const waitOnBin = join(rootDir, 'node_modules', 'wait-on', 'bin', 'wait-on');
const proc = spawn(process.execPath, [waitOnBin, url], {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, PORT: String(PORT) },
});

proc.on('exit', (code) => process.exit(code ?? 1));
