/**
 * Jest global setup for JARVIS-WEB tests.
 * @see jEsT dOcS.md — Project-Specific Setup, Test Setup File
 */
process.env.NODE_ENV = 'test';

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
