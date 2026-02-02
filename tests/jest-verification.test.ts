/**
 * Jest setup verification - ensures Jest is configured correctly
 */
import { describe, it, expect } from '@jest/globals';

describe('Jest verification', () => {
  it('should run basic assertions', () => {
    expect(1 + 2).toBe(3);
  });

  it('should support async/await', async () => {
    const result = await Promise.resolve('async result');
    expect(result).toBe('async result');
  });

  it('should have testUtils available from setup', () => {
    const mockReq = (global as unknown as { testUtils: { createMockRequest: () => object } }).testUtils.createMockRequest();
    expect(mockReq).toHaveProperty('method', 'GET');
    expect(mockReq).toHaveProperty('url', '/test');
  });

  it('should support object matching', () => {
    const obj = { a: 1, b: 2 };
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});
