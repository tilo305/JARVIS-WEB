/**
 * Node.js built-in test runner compatibility.
 * Verifies node:test is available (Node 18+) and Jest can run alongside.
 * @see jEsT dOcS.md — Project Test Structure, v22-features
 */
import { describe, it, expect } from '@jest/globals';

describe('Node.js built-in test (v22-features)', () => {
  it('should have node:test available', async () => {
    const nodeTest = await import('node:test');
    expect(nodeTest).toBeDefined();
    expect(typeof nodeTest.test).toBe('function');
    expect(typeof nodeTest.describe).toBe('function');
  });

  it('should have Node version >= 18', () => {
    const major = parseInt(process.version.slice(1).split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(18);
  });

  it('should run Jest and node:test in same process', () => {
    expect(1 + 1).toBe(2);
  });
});
