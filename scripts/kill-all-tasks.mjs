/**
 * Kill all JARVIS-WEB dev tasks: Vite (port 3000), Electron, and related Node processes.
 * Cross-platform (Windows, macOS, Linux). Use: npm run kill:all
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);
loadEnvEverywhere(rootDir);

const PORT = Number(process.env.PORT) || 3000;
const isWindows = process.platform === 'win32';

async function killPortWithRetry(port, maxRetries = 3) {
  try {
    const killPort = (await import('kill-port')).default;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await killPort(port, 'tcp');
        console.log(`✓ Cleared port ${port}.`);
        await new Promise((r) => setTimeout(r, 300));
        return true;
      } catch {
        if (i < maxRetries - 1) await new Promise((r) => setTimeout(r, 500));
      }
    }
  } catch {
    console.warn('  (kill-port not available or port already free)');
  }
  return false;
}

async function killProcessesByName(names) {
  if (!Array.isArray(names)) names = [names];
  for (const name of names) {
    try {
      if (isWindows) {
        const { stdout } = await execAsync(
          `tasklist /FI "IMAGENAME eq ${name}.exe" /FO CSV`
        );
        if (stdout.includes(name)) {
          await execAsync(`taskkill /F /IM ${name}.exe /T`);
          console.log(`✓ Killed ${name} processes.`);
        }
      } else {
        try {
          await execAsync(`pkill -f "${name}"`);
          console.log(`✓ Killed ${name} processes.`);
        } catch {
          /* no match */
        }
      }
    } catch {
      /* ignore */
    }
  }
}

async function killRelatedNodeProcesses() {
  const patterns = [
    'vite',
    'server.js',
    'kill-port-then-vite',
    'concurrently',
    'wait-on',
  ];
  try {
    if (isWindows) {
      const { stdout } = await execAsync(
        `wmic process where "name='node.exe' or name='node'" get commandline,processid /format:csv`
      );
      const lines = stdout.split('\n').filter(Boolean);
      for (const line of lines) {
        const cmd = (line.split(',')[1] || '').toLowerCase();
        const pidMatch = line.match(/,(\d+),/);
        if (
          pidMatch &&
          pidMatch[1] &&
          patterns.some((p) => cmd.includes(p.toLowerCase()))
        ) {
          try {
            await execAsync(`taskkill /F /PID ${pidMatch[1]} /T`);
            console.log(`✓ Killed Node process (PID: ${pidMatch[1]}).`);
          } catch {
            /* already gone */
          }
        }
      }
    } else {
      for (const p of patterns) {
        try {
          await execAsync(`pkill -9 -f "${p}"`);
          console.log(`✓ Killed processes matching "${p}".`);
        } catch {
          /* none found */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

async function main() {
  console.log('\n🛑 Killing all JARVIS-WEB tasks...\n');

  await killRelatedNodeProcesses();
  await new Promise((r) => setTimeout(r, 400));

  await killProcessesByName(['electron']);
  await new Promise((r) => setTimeout(r, 300));

  await killPortWithRetry(PORT);
  await new Promise((r) => setTimeout(r, 300));

  await killProcessesByName(['vite']);
  await new Promise((r) => setTimeout(r, 200));

  const portKilled = await killPortWithRetry(PORT, 2);
  if (!portKilled) {
    console.log(`  Port ${PORT} may still be in use; try closing other apps.`);
  }

  console.log('\n✅ Done.\n');
}

main().catch((err) => {
  console.error('kill-all-tasks error:', err);
  process.exit(1);
});
