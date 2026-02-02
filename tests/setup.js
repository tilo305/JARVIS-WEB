/**
 * Jest global setup for JARVIS-WEB tests
 */
process.env.NODE_ENV = 'test';

const originalConsole = console;

global.console = {
  ...originalConsole,
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
