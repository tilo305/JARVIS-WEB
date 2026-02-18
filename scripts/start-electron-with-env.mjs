#!/usr/bin/env node
/**
 * Start Electron with .env loaded so main.js gets PORT and other vars.
 * Ensures Electron and Vite use the same PORT when in dev mode.
 */
import { spawn } from 'node:child_process';
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);
loadEnvEverywhere(rootDir);

const electronCli = join(rootDir, 'node_modules', 'electron', 'cli.js');
const mainJs = join(rootDir, 'electron', 'main.js');

// Suppress "Insecure Content-Security-Policy" warning in dev (Vite HMR requires unsafe-eval)
const env = { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: '1' };

const proc = spawn(process.execPath, [electronCli, mainJs], {
  stdio: 'inherit',
  cwd: rootDir,
  env,
});

proc.on('exit', (code) => process.exit(code ?? 1));
