#!/usr/bin/env node
/**
 * Python Installation Test Tool
 * 
 * Tests Python installation, dependencies, and script functionality.
 * Usage: node debug/tools/test-python-installation.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const serverScript = join(projectRoot, 'scripts', 'openwakeword-server.py');
const requirementsFile = join(projectRoot, 'requirements-openwakeword.txt');

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
async function testImports(pythonCmd) {
  const required = ['aiohttp', 'numpy', 'openwakeword'];
  const optional = ['resampy'];
  
  const results = {
    required: {},
    optional: {},
    allRequiredOk: true
  };
  
  for (const pkg of required) {
    const result = await runCommand(pythonCmd, ['-c', `import ${pkg}`]);
    const ok = result.code === 0;
    results.required[pkg] = ok;
    if (!ok) {
      results.allRequiredOk = false;
    }
  }
  
  for (const pkg of optional) {
    const result = await runCommand(pythonCmd, ['-c', `import ${pkg}`]);
    results.optional[pkg] = result.code === 0;
  }
  
  return results;
}

/**
 * Test script syntax
 */
async function testScriptSyntax(pythonCmd) {
  const result = await runCommand(pythonCmd, ['-m', 'py_compile', serverScript]);
  return result.code === 0;
}

/**
 * Test script help
 */
async function testScriptHelp(pythonCmd) {
  const result = await runCommand(pythonCmd, [serverScript, '--help']);
  return result.code === 0 && result.stdout.includes('openWakeWord');
}

/**
 * Main test function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Python Installation Test');
  console.log('='.repeat(60));
  console.log();
  
  // Test 1: Find Python
  console.log('Test 1: Finding Python...');
  const python = await findPython();
  if (!python) {
    console.log('❌ Python not found!');
    console.log('\nPlease install Python 3.8+ from:');
    console.log('  https://www.python.org/downloads/');
    process.exit(1);
  }
  console.log(`✓ Found: ${python.cmd}`);
  console.log(`  Version: ${python.version}`);
  console.log();
  
  // Test 2: Check pip
  console.log('Test 2: Checking pip...');
  const pipResult = await runCommand(python.cmd, ['-m', 'pip', '--version']);
  if (pipResult.code === 0) {
    console.log(`✓ pip: ${pipResult.stdout}`);
  } else {
    console.log('❌ pip not available');
    process.exit(1);
  }
  console.log();
  
  // Test 3: Test imports
  console.log('Test 3: Testing Python dependencies...');
  const imports = await testImports(python.cmd);
  
  for (const [pkg, ok] of Object.entries(imports.required)) {
    console.log(`  ${ok ? '✓' : '❌'} ${pkg}`);
    if (!ok) {
      console.log(`    Install: ${python.cmd} -m pip install ${pkg}`);
    }
  }
  
  for (const [pkg, ok] of Object.entries(imports.optional)) {
    console.log(`  ${ok ? '✓' : '⚠'} ${pkg} (optional)`);
  }
  
  if (!imports.allRequiredOk) {
    console.log('\n❌ Missing required dependencies!');
    console.log(`Install with: ${python.cmd} -m pip install -r ${requirementsFile}`);
    process.exit(1);
  }
  console.log();
  
  // Test 4: Script syntax
  console.log('Test 4: Testing script syntax...');
  const syntaxOk = await testScriptSyntax(python.cmd);
  if (syntaxOk) {
    console.log('✓ Script syntax is valid');
  } else {
    console.log('❌ Script has syntax errors');
    process.exit(1);
  }
  console.log();
  
  // Test 5: Script help
  console.log('Test 5: Testing script help...');
  const helpOk = await testScriptHelp(python.cmd);
  if (helpOk) {
    console.log('✓ Script help works');
  } else {
    console.log('❌ Script help failed');
    process.exit(1);
  }
  console.log();
  
  // Summary
  console.log('='.repeat(60));
  console.log('✅ All tests passed!');
  console.log('='.repeat(60));
  console.log();
  console.log('Python installation is ready.');
  console.log(`Start server with: ${python.cmd} ${serverScript}`);
  console.log();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
