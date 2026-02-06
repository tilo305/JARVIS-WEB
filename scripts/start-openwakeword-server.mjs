/**
 * Cross-platform wrapper to start OpenWakeWord server.
 * Detects Python, installs dependencies if needed, and starts the server.
 * 
 * Usage: node scripts/start-openwakeword-server.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const serverScript = join(projectRoot, 'scripts', 'openwakeword-server.py');
const requirementsFile = join(projectRoot, 'requirements-openwakeword.txt');

const isWindows = process.platform === 'win32';

/**
 * Find Python executable
 */
async function findPython() {
  const candidates = isWindows 
    ? ['python', 'python3', 'py'] 
    : ['python3', 'python'];
  
  for (const cmd of candidates) {
    try {
      const result = await new Promise((resolve) => {
        const proc = spawn(cmd, ['--version'], { 
          stdio: 'pipe',
          shell: false
        });
        let output = '';
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { output += data.toString(); });
        proc.on('close', (code) => resolve({ code, output }));
        proc.on('error', () => resolve({ code: 1, output: '' }));
      });
      
      if (result.code === 0 && result.output.includes('Python')) {
        console.log(`✓ Found Python: ${cmd} (${result.output.trim()})`);
        return cmd;
      }
    } catch {
      // Continue to next candidate
    }
  }
  
  return null;
}

/**
 * Check if Python package is installed
 */
async function checkPackage(pythonCmd, packageName) {
  try {
    // Handle package names with hyphens (e.g., 'openwakeword' imports as 'openwakeword')
    // Some packages have different import names than their pip names
    const importName = packageName === 'openwakeword' ? 'openwakeword' : packageName;
    
    const result = await new Promise((resolve) => {
      const proc = spawn(pythonCmd, ['-c', `import ${importName}`], {
        stdio: 'pipe',
        shell: false
      });
      // Suppress stderr output for package checking
      proc.stderr.on('data', () => { /* ignore errors */ });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
    return result;
  } catch {
    return false;
  }
}

/**
 * Install Python dependencies
 */
async function installDependencies(pythonCmd) {
  console.log('\n📦 Installing Python dependencies...');
  console.log('   This may take a few minutes on first run.\n');
  
  return new Promise((resolve, reject) => {
    const args = ['-m', 'pip', 'install', '-r', requirementsFile];
    
    const proc = spawn(pythonCmd, args, {
      stdio: 'inherit',
      shell: false,
      cwd: projectRoot
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('\n✓ Dependencies installed successfully\n');
        resolve();
      } else {
        reject(new Error(`pip install failed with code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Start the OpenWakeWord server
 */
function startServer(pythonCmd) {
  console.log('🚀 Starting OpenWakeWord server...\n');
  
  const args = [serverScript];
  // Pass through any additional arguments
  if (process.argv.length > 2) {
    args.push(...process.argv.slice(2));
  }
  
  const proc = spawn(pythonCmd, args, {
    stdio: 'inherit',
    shell: false,
    cwd: projectRoot
  });
  
  proc.on('error', (err) => {
    console.error(`\n❌ Failed to start server: ${err.message}`);
    process.exit(1);
  });
  
  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping OpenWakeWord server...');
    proc.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    proc.kill('SIGTERM');
    process.exit(0);
  });
  
  return proc;
}

/**
 * Main function
 */
async function main() {
  // Find Python
  const pythonCmd = await findPython();
  if (!pythonCmd) {
    // Python not found - this is expected if Python isn't installed
    // Exit silently with code 0 so concurrently doesn't kill the Vite server
    // The app will work fine without wake word support (mic button still works)
    process.exit(0);
  }
  
  console.log('🔍 Checking Python installation...\n');
  
  // Check if server script exists
  if (!existsSync(serverScript)) {
    // Server script missing - exit silently (expected if files are missing)
    process.exit(0);
  }
  
  // Check if requirements file exists
  if (!existsSync(requirementsFile)) {
    // Requirements file missing - exit silently (expected if files are missing)
    process.exit(0);
  }
  
  // Check if dependencies are installed
  console.log('🔍 Checking Python dependencies...\n');
  const requiredPackages = ['aiohttp', 'numpy', 'openwakeword'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    const installed = await checkPackage(pythonCmd, pkg);
    if (!installed) {
      missingPackages.push(pkg);
    } else {
      console.log(`✓ ${pkg} is installed`);
    }
  }
  
  // Install missing dependencies
  if (missingPackages.length > 0) {
    console.log(`\n⚠️  Missing packages: ${missingPackages.join(', ')}`);
    try {
      await installDependencies(pythonCmd);
    } catch {
      // Dependencies failed to install - exit silently (expected if pip fails)
      // User can install manually if needed
      process.exit(0);
    }
  } else {
    console.log('\n✓ All dependencies are installed\n');
  }
  
  // Start the server
  startServer(pythonCmd);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
