/**
 * Runs Electron dev: starts Vite (with dynamic port), waits for server, launches Electron.
 * Vite writes the resolved port to .vite-dev-port so we can connect regardless of which port it picked.
 */
import { spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);
loadEnvEverywhere(rootDir);

const PORT_FILE = join(rootDir, '.vite-dev-port');
const POLL_MS = 200;
const POLL_TIMEOUT_MS = 60_000;

function pollForPort() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const id = setInterval(() => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        clearInterval(id);
        reject(new Error('Timeout waiting for Vite dev server'));
        return;
      }
      if (existsSync(PORT_FILE)) {
        clearInterval(id);
        try {
          const port = readFileSync(PORT_FILE, 'utf8').trim();
          if (port) resolve(port);
          else reject(new Error('.vite-dev-port was empty'));
        } catch (e) {
          reject(e);
        }
      }
    }, POLL_MS);
  });
}

async function main() {
  // Clean stale port file from a previous run
  if (existsSync(PORT_FILE)) {
    try {
      unlinkSync(PORT_FILE);
    } catch {
      // ignore
    }
  }

  const killPortScript = join(__dirname, 'kill-port-then-vite.mjs');
  const node = process.execPath;

  const vite = spawn(node, [killPortScript], {
    stdio: 'inherit',
    cwd: rootDir,
    windowsHide: true,
    env: { ...process.env, VITE_SKIP_KILL_PORT: '1' },
  });

  let port;
  try {
    port = await pollForPort();
  } catch (err) {
    console.error(err.message);
    vite.kill();
    process.exit(1);
  }

  const url = `http://localhost:${port}`;
  console.log(`\n✓ Vite running at ${url}\n`);

  const waitOn = spawn('npx', ['wait-on', url, '--timeout', '15000'], {
    stdio: 'inherit',
    cwd: rootDir,
    shell: true,
  });

  const waitOnExit = new Promise((res) => waitOn.on('exit', res));
  const waitResult = await waitOnExit;
  if (waitResult !== 0) {
    vite.kill();
    process.exit(waitResult);
  }

  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, ELECTRON_LOAD_URL: url },
    shell: true,
  });

  electron.on('exit', (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    electron.kill('SIGINT');
    vite.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    electron.kill('SIGTERM');
    vite.kill('SIGTERM');
  });
}

main().catch((err) => {
  console.error('electron-dev failed:', err);
  process.exit(1);
});
