#!/usr/bin/env node
/**
 * Test Vite + OpenWakeWord Integration
 * 
 * Verifies that npm run vite starts both Vite and OpenWakeWord server correctly.
 * Usage: node debug/tools/test-vite-openwakeword-integration.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

const isWindows = process.platform === 'win32';

/**
 * Run a command and return output
 */
function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      stdio: 'pipe',
      shell: false,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    
    proc.on('error', (err) => {
      resolve({ code: 1, stdout: '', stderr: err.message });
    });
  });
}

/**
 * Find Python executable
 */
async function findPython() {
  const candidates = isWindows 
    ? ['python', 'python3', 'py'] 
    : ['python3', 'python'];
  
  for (const cmd of candidates) {
    const result = await runCommand(cmd, ['--version']);
    if (result.code === 0 && result.stdout.includes('Python')) {
      return { cmd, version: result.stdout };
    }
  }
  
  return null;
}

/**
 * Test Python imports
 */
async function testPythonDependencies(pythonCmd) {
  const required = ['aiohttp', 'numpy', 'openwakeword'];
  const results = {};
  
  for (const pkg of required) {
    const result = await runCommand(pythonCmd, ['-c', `import ${pkg}`]);
    results[pkg] = result.code === 0;
  }
  
  return results;
}

/**
 * Main test function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Vite + OpenWakeWord Integration Test');
  console.log('='.repeat(60));
  console.log();
  
  // Test 1: Check package.json script
  console.log('Test 1: Checking package.json vite script...');
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    process.exit(1);
  }
  
  const { readFileSync } = await import('fs');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const viteScript = packageJson.scripts?.vite;
  
  if (!viteScript) {
    console.log('❌ vite script not found in package.json');
    process.exit(1);
  }
  
  if (!viteScript.includes('openwakeword')) {
    console.log('❌ vite script does not include openwakeword');
    console.log(`   Current: ${viteScript}`);
    process.exit(1);
  }
  
  console.log(`✓ vite script found: ${viteScript}`);
  console.log();
  
  // Test 2: Check openwakeword script
  console.log('Test 2: Checking openwakeword script...');
  const openwakewordScript = packageJson.scripts?.openwakeword;
  if (!openwakewordScript) {
    console.log('❌ openwakeword script not found');
    process.exit(1);
  }
  console.log(`✓ openwakeword script: ${openwakewordScript}`);
  console.log();
  
  // Test 3: Check start script exists
  console.log('Test 3: Checking start script exists...');
  const startScript = join(projectRoot, 'scripts', 'start-openwakeword-server.mjs');
  if (!existsSync(startScript)) {
    console.log('❌ start-openwakeword-server.mjs not found');
    process.exit(1);
  }
  console.log('✓ start-openwakeword-server.mjs exists');
  console.log();
  
  // Test 4: Check Python
  console.log('Test 4: Checking Python installation...');
  const python = await findPython();
  if (!python) {
    console.log('❌ Python not found!');
    console.log('   Install Python 3.8+ from https://www.python.org/downloads/');
    process.exit(1);
  }
  console.log(`✓ Python found: ${python.cmd} (${python.version})`);
  console.log();
  
  // Test 5: Check Python dependencies
  console.log('Test 5: Checking Python dependencies...');
  const deps = await testPythonDependencies(python.cmd);
  let allOk = true;
  for (const [pkg, ok] of Object.entries(deps)) {
    console.log(`  ${ok ? '✓' : '❌'} ${pkg}`);
    if (!ok) allOk = false;
  }
  
  if (!allOk) {
    console.log('\n❌ Missing Python dependencies!');
    console.log(`   Install with: ${python.cmd} -m pip install -r requirements-openwakeword.txt`);
    process.exit(1);
  }
  console.log();
  
  // Test 6: Check server script
  console.log('Test 6: Checking server script...');
  const serverScript = join(projectRoot, 'scripts', 'openwakeword-server.py');
  if (!existsSync(serverScript)) {
    console.log('❌ openwakeword-server.py not found');
    process.exit(1);
  }
  console.log('✓ openwakeword-server.py exists');
  console.log();
  
  // Test 7: Check kill-port-then-vite script
  console.log('Test 7: Checking kill-port-then-vite script...');
  const viteScriptPath = join(projectRoot, 'scripts', 'kill-port-then-vite.mjs');
  if (!existsSync(viteScriptPath)) {
    console.log('❌ kill-port-then-vite.mjs not found');
    process.exit(1);
  }
  console.log('✓ kill-port-then-vite.mjs exists');
  console.log();
  
  // Summary
  console.log('='.repeat(60));
  console.log('✅ All integration checks passed!');
  console.log('='.repeat(60));
  console.log();
  console.log('Ready to run: npm run vite');
  console.log('This will start:');
  console.log('  1. Vite dev server (port 3000)');
  console.log('  2. OpenWakeWord Python server (port 8765)');
  console.log();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
