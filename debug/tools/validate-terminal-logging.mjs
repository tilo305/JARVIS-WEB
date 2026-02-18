#!/usr/bin/env node
/**
 * Validates that terminal logging is set up so every console.error and console.warn
 * (and uncaught errors) are logged to the terminal. Per zEn DeBuGgEr.md.
 *
 * Usage: node debug/tools/validate-terminal-logging.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const checks = [
  {
    file: join(root, 'server.js'),
    name: 'server.js',
    patterns: [
      { re: /console\.error\s*=\s*function/, msg: 'console.error override' },
      { re: /console\.warn\s*=\s*function/, msg: 'console.warn override' },
      { re: /\[ERROR\]|\[WARN\]/, msg: 'timestamped [ERROR]/[WARN] in output' },
      { re: /process\.on\s*\(\s*['"]uncaughtException['"]/, msg: 'uncaughtException handler' },
      { re: /process\.on\s*\(\s*['"]unhandledRejection['"]/, msg: 'unhandledRejection handler' },
      { re: /origStderrWrite|process\.stderr\.write\.bind/, msg: 'stderr write for terminal' },
    ],
  },
  {
    file: join(root, 'electron', 'main.js'),
    name: 'electron/main.js',
    patterns: [
      { re: /console\.error\s*=\s*function/, msg: 'console.error override (main)' },
      { re: /console\.warn\s*=\s*function/, msg: 'console.warn override (main)' },
      { re: /\[Electron Main\].*\[ERROR\]|\[Electron Main\].*\[WARN\]/, msg: '[Electron Main] tagged output' },
      { re: /process\.on\s*\(\s*['"]uncaughtException['"]/, msg: 'uncaughtException handler' },
      { re: /process\.on\s*\(\s*['"]unhandledRejection['"]/, msg: 'unhandledRejection handler' },
      { re: /console-message|webContents\.on\s*\(\s*['"]console-message['"]/, msg: 'renderer console-message forward' },
      { re: /level\s*===\s*3|level\s*===\s*2/, msg: 'level 3 (error) / level 2 (warn) handling' },
    ],
  },
];

let failed = 0;
for (const { file, name, patterns } of checks) {
  if (!existsSync(file)) {
    console.error(`✗ ${name} not found`);
    failed++;
    continue;
  }
  const content = readFileSync(file, 'utf8');
  for (const { re, msg } of patterns) {
    if (!re.test(content)) {
      console.error(`✗ ${name}: missing ${msg}`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.error('\nTerminal logging validation FAILED.');
  process.exit(1);
}
console.log('✓ Terminal logging validation passed (server + Electron).');
process.exit(0);
