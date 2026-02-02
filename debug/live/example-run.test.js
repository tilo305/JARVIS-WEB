/**
 * LIVE test: Verify example can be executed (main runs)
 * Run: npm test -- debug/live/example-run.test.js
 * Skips when CARTESIA_API_KEY is not set (example requires valid API key to connect).
 * @see zEn DeBuGgEr.md
 */
import { spawn } from 'child_process';
import { describe, it, expect } from '@jest/globals';
import { CARTESIA_CONFIG } from '../../dist/config.js';

const API_KEY = process.env.CARTESIA_API_KEY || CARTESIA_CONFIG.API_KEY;
const SKIP_LIVE = !API_KEY || API_KEY.length < 10;

// Run from project root (Jest CJS has no import.meta; Node ESM would use fileURLToPath(import.meta.url))
const root = process.cwd();

function runExample(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/examples/bidirectional-conversation.js'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const t = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ stdout, stderr, killed: true });
    }, timeoutMs);
    child.on('exit', (code) => {
      clearTimeout(t);
      resolve({ stdout, stderr, code, killed: false });
    });
    child.on('error', reject);
  });
}

describe('LIVE: example run', () => {
  it('should run main() and produce output (Windows fix: import.meta.url check)', async () => {
    if (SKIP_LIVE) {
      console.warn('[LIVE] Skipping: CARTESIA_API_KEY not set or invalid');
      return;
    }
    const { stdout } = await runExample(8000);
    // Must see initial banner - proves main() was invoked (fix for Windows path mismatch)
    expect(stdout).toContain('Cartesia Bidirectional Conversation Example');
    // Should reach "Conversation ready" if Cartesia connects; or at least "Example usage"
    expect(
      stdout.includes('Conversation ready') ||
      stdout.includes('Both clients connected') ||
      stdout.includes('Example usage')
    ).toBe(true);
  }, 15000);
});
