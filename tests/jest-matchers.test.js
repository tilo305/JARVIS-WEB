/**
 * Custom Jest matcher verification.
 * @see jEsT dOcS.md — Advanced Features, Custom Matchers
 */
import { describe, it, expect } from '@jest/globals';

describe('Custom matchers (jest-matchers)', () => {
  it('should support toBeWithinRange from setup', () => {
    expect(100).toBeWithinRange(90, 110);
    expect(50).not.toBeWithinRange(90, 110);
  });
});
