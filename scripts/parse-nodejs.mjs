#!/usr/bin/env node
/**
 * Parse Node.js files (server.js, scripts, electron main) and extract:
 * - Node.js built-in module imports (node:http, node:fs, node:path, etc.)
 * - process.env usage
 * - Key functions and patterns
 * - Child process / spawn usage
 * - File system operations
 *
 * Usage:
 *   node scripts/parse-nodejs.mjs
 *   node scripts/parse-nodejs.mjs --output=nodejs-parse-results.json
 */

import { readFileSync, statSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const outputFile =
  args.find((a) => a.startsWith('--output='))?.split('=')[1] || 'nodejs-parse-results.json';

// ---------------------------------------------------------------------------
// PARSERS
// ---------------------------------------------------------------------------

function parseNodeJsFile(content, _filePath) {
  const result = {
    nodeModules: [],
    processEnv: [],
    functions: [],
    childProcess: { spawn: [], exec: [] },
    fsOps: { sync: [], async: [] },
    httpUsage: false,
    pathUsage: false,
    bufferUsage: false,
    urlUsage: false,
  };

  // node: module imports
  const nodeImportRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+))\s+from\s+['"]node:([^'"]+)['"]/g;
  let m;
  while ((m = nodeImportRegex.exec(content)) !== null) {
    const module = m[3];
    const bindings = m[1] ? m[1].split(',').map((b) => b.trim().split(/\s+as\s+/).pop()?.trim() || b.trim()) : [m[2]];
    if (!result.nodeModules.some((n) => n.module === module)) {
      result.nodeModules.push({ module, bindings });
    } else {
      const existing = result.nodeModules.find((n) => n.module === module);
      existing.bindings = [...new Set([...existing.bindings, ...bindings])];
    }
  }

  // require('node:...') or require('http') etc.
  const requireRegex = /require\s*\(\s*['"](node:)?([^'"]+)['"]\s*\)/g;
  while ((m = requireRegex.exec(content)) !== null) {
    const module = m[2];
    if (['http', 'https', 'fs', 'path', 'url', 'child_process', 'buffer', 'process', 'util'].includes(module.split('/')[0])) {
      if (!result.nodeModules.some((n) => n.module === module)) {
        result.nodeModules.push({ module, bindings: ['*'] });
      }
    }
  }

  // process.env.X
  const envRegex = /process\.env\.(\w+)/g;
  while ((m = envRegex.exec(content)) !== null) {
    if (!result.processEnv.includes(m[1])) result.processEnv.push(m[1]);
  }

  // Top-level functions
  const fnRegex = /(?:async\s+)?function\s+(\w+)\s*\(/g;
  while ((m = fnRegex.exec(content)) !== null) {
    result.functions.push(m[1]);
  }

  // spawn / exec
  const spawnRegex = /spawn\s*\(\s*['"]([^'"]+)['"]/g;
  while ((m = spawnRegex.exec(content)) !== null) {
    result.childProcess.spawn.push(m[1]);
  }
  const execRegex = /exec\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((m = execRegex.exec(content)) !== null) {
    result.childProcess.exec.push(m[1]);
  }

  // fs operations
  const fsSyncOps = ['readFileSync', 'writeFileSync', 'existsSync', 'readdirSync', 'statSync', 'rmSync', 'mkdirSync'];
  const fsAsyncOps = ['readFile', 'writeFile', 'readdir', 'stat', 'rm', 'mkdir'];
  for (const op of fsSyncOps) {
    if (new RegExp(`\\b${op}\\s*\\(`).test(content)) result.fsOps.sync.push(op);
  }
  for (const op of fsAsyncOps) {
    if (new RegExp(`\\b${op}\\s*\\(`).test(content)) result.fsOps.async.push(op);
  }

  result.httpUsage = /createServer|\.listen\s*\(|req\.|res\./.test(content);
  result.pathUsage = /join\s*\(|dirname\s*\(|resolve\s*\(|extname\s*\(|normalize\s*\(/.test(content);
  result.bufferUsage = /Buffer\.|Buffer\.concat/.test(content);
  result.urlUsage = /fileURLToPath|pathToFileURL|new URL/.test(content);

  return result;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function parseNodeJs() {
  console.log('📦 Parsing Node.js files...\n');

  const results = {
    server: null,
    scripts: [],
    electron: null,
    summary: {
      files: [],
      nodeModules: new Set(),
      processEnv: new Set(),
      errors: [],
    },
  };

  // server.js
  const serverPath = resolve(ROOT, 'server.js');
  if (existsSync(serverPath)) {
    try {
      const content = readFileSync(serverPath, 'utf-8');
      const stat = statSync(serverPath);
      const parsed = parseNodeJsFile(content, serverPath);
      results.server = {
        file: relative(ROOT, serverPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsed,
      };
      results.summary.files.push(results.server.file);
      parsed.nodeModules.forEach((n) => results.summary.nodeModules.add(n.module));
      parsed.processEnv.forEach((e) => results.summary.processEnv.add(e));
      console.log(`  ✓ ${results.server.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'server.js', error: err.message });
      console.log(`  ✗ server.js: ${err.message}`);
    }
  }

  // scripts/*.mjs
  const scriptsDir = resolve(ROOT, 'scripts');
  if (existsSync(scriptsDir)) {
    const files = readdirSync(scriptsDir).filter((f) => f.endsWith('.mjs') || f.endsWith('.js'));
    for (const file of files) {
      const filePath = join(scriptsDir, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        const stat = statSync(filePath);
        const parsed = parseNodeJsFile(content, filePath);
        results.scripts.push({
          file: relative(ROOT, filePath),
          sizeKB: (stat.size / 1024).toFixed(2),
          ...parsed,
        });
        results.summary.files.push(relative(ROOT, filePath));
        parsed.nodeModules.forEach((n) => results.summary.nodeModules.add(n.module));
        parsed.processEnv.forEach((e) => results.summary.processEnv.add(e));
        console.log(`  ✓ scripts/${file}`);
      } catch (err) {
        results.summary.errors.push({ file: `scripts/${file}`, error: err.message });
        console.log(`  ✗ scripts/${file}: ${err.message}`);
      }
    }
  }

  // electron/main.js
  const electronMainPath = resolve(ROOT, 'electron', 'main.js');
  if (existsSync(electronMainPath)) {
    try {
      const content = readFileSync(electronMainPath, 'utf-8');
      const stat = statSync(electronMainPath);
      const parsed = parseNodeJsFile(content, electronMainPath);
      results.electron = {
        file: relative(ROOT, electronMainPath),
        sizeKB: (stat.size / 1024).toFixed(2),
        ...parsed,
      };
      results.summary.files.push(results.electron.file);
      parsed.nodeModules.forEach((n) => results.summary.nodeModules.add(n.module));
      parsed.processEnv.forEach((e) => results.summary.processEnv.add(e));
      console.log(`  ✓ ${results.electron.file}`);
    } catch (err) {
      results.summary.errors.push({ file: 'electron/main.js', error: err.message });
      console.log(`  ✗ electron/main.js: ${err.message}`);
    }
  }

  // Convert Sets to arrays for JSON
  results.summary.nodeModules = [...results.summary.nodeModules].sort();
  results.summary.processEnv = [...results.summary.processEnv].sort();

  return results;
}

// Run and write
const results = parseNodeJs();
const outputPath = resolve(ROOT, outputFile);
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n${'='.repeat(60)}`);
console.log('NODE.JS PARSE SUMMARY');
console.log(`${'='.repeat(60)}`);
console.log(`Files: ${results.summary.files.length}`);
console.log(`Node modules: ${results.summary.nodeModules.join(', ') || 'none'}`);
console.log(`process.env: ${results.summary.processEnv.join(', ') || 'none'}`);
if (results.summary.errors.length > 0) {
  console.log(`\nErrors: ${results.summary.errors.length}`);
}
console.log(`\n✓ Results saved to: ${outputFile}`);
