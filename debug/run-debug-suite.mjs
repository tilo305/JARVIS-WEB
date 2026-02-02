#!/usr/bin/env node
/**
 * Run full debug suite: lint, test, build.
 * Per zEn DeBuGgEr.md - all tests, debugging, errors and fixes.
 */
import { spawn } from 'child_process';

const steps = [
  { name: 'Lint', cmd: 'npm', args: ['run', 'lint'] },
  { name: 'Test', cmd: 'npm', args: ['run', 'test'] },
  { name: 'TypeScript Build', cmd: 'npm', args: ['run', 'build'] },
  { name: 'Vite Build', cmd: 'npm', args: ['run', 'vite', 'build'] },
];

async function run(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => resolve(code));
    proc.on('error', () => resolve(1));
  });
}

async function main() {
  console.log('=== JARVIS-WEB Debug Suite (zEn DeBuGgEr) ===\n');
  const results = [];

  for (const step of steps) {
    process.stdout.write(`[${step.name}] Running... `);
    const code = await run(step.cmd, step.args);
    results.push({ name: step.name, ok: code === 0 });
    console.log(code === 0 ? 'PASS\n' : `FAIL (exit ${code})\n`);
    if (code !== 0) break;
  }

  console.log('--- Summary ---');
  results.forEach((r) => console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}`));
  const allOk = results.every((r) => r.ok);
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
