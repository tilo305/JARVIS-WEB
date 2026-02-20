#!/usr/bin/env node
/**
 * Run full debug suite: lint, test, build.
 * Per zEn DeBuGgEr.md - all tests, debugging, errors and fixes.
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const steps = [
  { name: 'Lint', script: 'npm run lint:check' },
  { name: 'Strip-Markdown Sync', script: 'node debug/tools/validate-strip-markdown-sync.js' },
  { name: 'TTS HTML Entity Decode', script: 'node debug/tools/test-tts-html-entity-live.mjs' },
  { name: 'Text Response Fix', script: 'node debug/tools/test-text-response-fix.js' },
  { name: 'Terminal Logging', script: 'node debug/tools/validate-terminal-logging.mjs' },
  { name: 'CORS Handler', script: 'node debug/tools/validate-cors-handler.js' },
  { name: 'Agentic Patterns', script: 'node debug/tools/validate-agentic-patterns.js' },
  { name: 'Security Modules', script: 'node debug/tools/validate-security-modules.mjs' },
  { name: 'Test', script: 'npm test -- --watchAll=false --collectCoverage=false' },
  { name: 'TypeScript Build', script: 'npm run build' },
  { name: 'Vite Build', script: 'npm run vite:build' },
  { name: 'Electron Paths', script: 'node debug/tools/validate-electron-paths.js' },
  { name: 'Electron Parse', script: 'npm run parse:electron' },
  { name: 'Node.js Parse', script: 'npm run parse:nodejs' },
  { name: 'NPM Audit Fix', script: 'node debug/tools/validate-npm-audit-fix.mjs' },
  { name: 'Electron Integration', script: 'node debug/tools/verify-electron-integration.mjs' },
  { name: 'Electron Built Smoke', script: 'node debug/tools/smoke-electron-built.mjs' },
  { name: 'Kill All Tasks', script: 'npm run kill:all' },
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
