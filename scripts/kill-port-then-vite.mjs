/**
 * Kills any process on Vite's dev server port, then runs Vite.
 * Cross-platform (Windows, macOS, Linux). Use: npm run vite
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const isBuild = process.argv.includes('build');
  const viteArgs = isBuild ? ['vite', 'build'] : ['vite'];

  try {
    const killPort = (await import('kill-port')).default;
    await killPort(PORT, 'tcp');
    console.log(`Cleared port ${PORT} (previous Vite or other process).`);
  } catch {
    // No process on port or kill-port not found — continue
  }

  const vite = spawn('npx', viteArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: rootDir,
  });

  vite.on('exit', (code, signal) => {
    process.exit(code != null ? code : signal ? 1 : 0);
  });
}

main();
