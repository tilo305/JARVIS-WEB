/**
 * Jest global setup for JARVIS-WEB tests.
 * @see jEsT dOcS.md — Project-Specific Setup, Test Setup File
 * ESM: jest is imported so it is available when running with type: "module".
 */
import { expect, jest } from '@jest/globals';

process.env.NODE_ENV = 'test';

// Custom matchers (per jEsT dOcS.md — Advanced Features)
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    }
    return {
      message: () =>
        `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass: false,
    };
  },
});

// Expose jest on global so setup and tests can use it (e.g. jest.clearAllMocks())
global.jest = jest;

const originalConsole = console;

// Optional: suppress log/info/warn for cleaner output (errors still shown). Use JEST_SILENT=1
const silent = process.env.JEST_SILENT === '1' || process.env.JEST_SILENT === 'true';
global.console = {
  ...originalConsole,
  ...(silent
    ? {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      }
    : {}),
};

global.testUtils = {
  createMockRequest: () => ({
    method: 'GET',
    url: '/test',
    headers: {},
    body: {},
  }),

  createMockResponse: () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  }),
};

beforeAll(() => {
  // Global setup
});

afterAll(() => {
  // Global cleanup
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  jest.clearAllMocks();
});
