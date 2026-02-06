/**
 * Kills any process on Vite's dev server port, then runs Vite.
 * Cross-platform (Windows, macOS, Linux). Use: npm run vite
 * Aggressively kills all previous tasks on the port and related processes.
 */
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnvEverywhere, getProjectRoot } from './load-env-everywhere.mjs';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = getProjectRoot(__dirname);
// Load .env from project root only
loadEnvEverywhere(rootDir);

const PORT = Number(process.env.PORT) || 3000;

const isWindows = process.platform === 'win32';

/**
 * Kill processes by port with retry logic
 */
async function killPortWithRetry(port, maxRetries = 3) {
  try {
    const killPort = (await import('kill-port')).default;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await killPort(port, 'tcp');
        console.log(`✓ Cleared port ${port} (attempt ${i + 1}/${maxRetries}).`);
        // Wait a bit to ensure port is fully released
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      } catch {
        if (i < maxRetries - 1) {
          console.log(`  Retrying port kill (attempt ${i + 2}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  } catch {
    console.warn(`  Warning: kill-port failed, trying alternative method...`);
  }
  return false;
}

/**
 * Kill processes by name (cross-platform)
 */
async function killProcessesByName(names) {
  if (!Array.isArray(names)) names = [names];
  
  for (const name of names) {
    try {
      if (isWindows) {
        // Windows: Use taskkill
        const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${name}.exe" /FO CSV`);
        if (stdout.includes(name)) {
          await execAsync(`taskkill /F /IM ${name}.exe /T`);
          console.log(`✓ Killed ${name} processes.`);
        }
      } else {
        // Unix-like: Use pkill
        try {
          await execAsync(`pkill -f "${name}"`);
          console.log(`✓ Killed ${name} processes.`);
        } catch {
          // pkill returns non-zero if no processes found, which is fine
        }
      }
    } catch {
      // Process might not exist, which is fine
    }
  }
}

/**
 * Kill Node processes that might be running vite or server.js
 */
async function killRelatedNodeProcesses() {
  try {
    if (isWindows) {
      // Windows: Find and kill node processes with vite or server.js in command line
      const { stdout } = await execAsync(`wmic process where "name='node.exe' or name='node'" get commandline,processid /format:csv`);
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('vite') || line.includes('server.js') || line.includes('kill-port-then-vite')) {
          const match = line.match(/,(\d+),/);
          if (match && match[1]) {
            try {
              await execAsync(`taskkill /F /PID ${match[1]} /T`);
              console.log(`✓ Killed related Node process (PID: ${match[1]}).`);
            } catch {
              // Process might have already terminated
            }
          }
        }
      }
    } else {
      // Unix-like: Use ps and kill
      try {
        await execAsync(`ps aux | grep -E "[v]ite|[s]erver.js|[k]ill-port-then-vite" | awk '{print $2}' | xargs -r kill -9`);
        console.log(`✓ Killed related Node processes.`);
      } catch {
        // No processes found or already killed
      }
    }
  } catch {
    // Ignore errors - processes might not exist
  }
}


async function main() {
  const isBuild = process.argv.includes('build');
  const viteArgs = isBuild ? ['vite', 'build'] : ['vite'];

  console.log(`\n🔧 Cleaning up previous tasks on port ${PORT}...\n`);

  // Step 1: Kill related Node processes first
  await killRelatedNodeProcesses();
  await new Promise(resolve => setTimeout(resolve, 300));

  // Step 2: Kill processes by port with retry
  const portKilled = await killPortWithRetry(PORT);
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 3: Kill vite processes by name (if any are still running)
  await killProcessesByName(['vite']);
  await new Promise(resolve => setTimeout(resolve, 300));

  // Step 4: Final port check and kill
  if (!portKilled) {
    console.log(`  Attempting final port cleanup...`);
    await killPortWithRetry(PORT, 2);
  }

  console.log(`\n🚀 Starting Vite...\n`);

  // Use project's local Vite binary directly (avoids npx installing to wrong location)
  const viteBin = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const node = process.execPath;
  const spawnArgs = [viteBin, ...viteArgs.slice(1)];
  const spawnOptions = {
    stdio: 'inherit',
    cwd: rootDir,
    // Don't use shell: true — it breaks when node path has spaces (e.g. "C:\Program Files\...")
    windowsHide: true,
  };
  const vite = spawn(node, spawnArgs, spawnOptions);

  vite.on('exit', (code, signal) => {
    process.exit(code != null ? code : signal ? 1 : 0);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    vite.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    vite.kill('SIGTERM');
  });
}

main().catch((err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});
