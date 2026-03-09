/**
 * Runs Electron loading from dist-public (built files).
 * Used by electron:build after vite build completes.
 */
import { spawn } from 'child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const env = { ...process.env, ELECTRON_LOAD_FILE: '1' };

const child = spawn('npx', ['electron', '.'], {
  stdio: 'inherit',
  cwd: root,
  env,
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
