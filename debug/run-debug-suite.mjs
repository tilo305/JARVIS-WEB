#!/usr/bin/env node
/**
 * Run full debug suite: lint, test, build.
 * Per zEn DeBuGgEr.md - all tests, debugging, errors and fixes.
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const steps = [
  { name: 'Lint', script: 'npm run lint' },
  { name: 'Test', script: 'npm run test' },
  { name: 'TypeScript Build', script: 'npm run build' },
  { name: 'Vite Build', script: 'npm run vite:build' },
];

async function run(script) {
  try {
    await execAsync(script, { 
      // exec handles Windows properly without deprecation warnings
      // Output is automatically shown via exec
    });
    return 0;
  } catch (error) {
    // execAsync rejects on non-zero exit, but we want to return the code
    return error.code || 1;
  }
}

async function main() {
  console.log('=== JARVIS-WEB Debug Suite (zEn DeBuGgEr) ===\n');
  const results = [];

  for (const step of steps) {
    process.stdout.write(`[${step.name}] Running... `);
    const code = await run(step.script);
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
