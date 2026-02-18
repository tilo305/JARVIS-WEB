# JARVIS-WEB - Jest Testing Documentation

## 🚨 CRITICAL: MANDATORY RESEARCH PROTOCOL (MUST READ FIRST)

### BEFORE USING THIS DOCUMENTATION, YOU MUST

#### 1. COMPREHENSIVE RESEARCH ON JESTJS.IO/DOCS (MANDATORY FIRST STEP)

- **ALWAYS** start by doing comprehensive research on: **<https://jestjs.io/docs/getting-started>**
- This is the **official Jest documentation**
- Covers Jest fundamentals, configuration, mocking, matchers, and testing best practices
- Essential for understanding Jest testing framework before diving into this project-specific guide
- **THIS MUST BE DONE FIRST** before using any content from this document

#### 2. THEN RESEARCH THIS DOCUMENT

- After researching jestjs.io/docs, read this document thoroughly
- This document is **Jest project-specific** for the JARVIS-WEB application
- Covers project-specific patterns, configurations, and implementations
- Both documents are complementary and should be used together

#### 3. RESEARCH HIERARCHY

```
1. https://jestjs.io/docs/getting-started (FIRST - Official Jest documentation)
   ↓
2. This document (Project-specific Jest implementation)
   ↓
3. Related testing docs (Web testing, E2E testing, etc.)
```

#### 4. WHY THIS ORDER MATTERS

- **jestjs.io/docs** teaches Jest fundamentals (configuration, matchers, mocking, async testing)
- **This document** teaches project-specific implementation and best practices
- Understanding Jest fundamentals first makes test implementation much easier to grasp
- Prevents confusion between general Jest and project-specific patterns

### ⚠️ CRITICAL WARNINGS

- **DO NOT** skip researching jestjs.io/docs - it's essential foundational knowledge
- **DO NOT** confuse Jest with other testing frameworks
- **ALWAYS** verify which version of Jest you're working with
- **CHECK** the project configuration files (jest.config.js) to understand the test setup

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [Writing Tests](#writing-tests)
5. [Testing Patterns](#testing-patterns)
6. [Mocking](#mocking)
7. [Async Testing](#async-testing)
8. [Coverage](#coverage)
9. [Advanced Features](#advanced-features)
10. [Project-Specific Setup](#project-specific-setup)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### What is Jest for JARVIS-WEB?

Jest is a JavaScript testing framework designed to ensure correctness of any JavaScript codebase. For JARVIS-WEB, Jest provides comprehensive testing for web applications, WebSocket integration, and real-time audio processing.

### Key Features

- **Zero Configuration**: Works out of the box for web applications
- **Snapshots**: Capture large objects with ease for web testing
- **Isolated**: Tests run in parallel processes for web performance
- **Great API**: Built-in matchers and assertions for web validation
- **Code Coverage**: Built-in coverage reports for web applications
- **Mocking**: Powerful mocking capabilities for web services
- **Web Integration**: Specialized testing for browser and Node.js environments
- **Real-time Testing**: Testing for live audio processing and WebSocket communication

---

## 📦 Installation & Setup

### Basic Installation

```bash
# Using npm for web applications
npm install --save-dev jest @jest/globals

# Install web-specific testing dependencies
npm install --save-dev @testing-library/jest-dom

# Install TypeScript support
npm install --save-dev @types/jest ts-jest babel-jest
```

### TypeScript Support

```bash
# Install TypeScript support
npm install --save-dev @types/jest @jest/globals ts-jest

# Or use Babel for TypeScript
npm install --save-dev @babel/preset-typescript babel-jest
```

### Project Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## ⚙️ Configuration

### Basic Configuration (`jest.config.cjs`)

```javascript
export default {
  // Test environment
  testEnvironment: 'node', // or 'jsdom' for browser testing
  
  // File extensions to consider
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};
```

### TypeScript Configuration

#### Using ts-jest

```javascript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

#### Using Babel

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ]
};
```

### ES Modules Support

```javascript
// jest.config.js
export default {
  // Enable ES modules
  extensionsToTreatAsEsm: ['.js'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1'
  }
};
```

---

## ✍️ Writing Tests

### Basic Test Structure

```javascript
// sum.test.js
import { describe, it, expect } from '@jest/globals';

function sum(a, b) {
  return a + b;
}

describe('sum function', () => {
  it('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('adds negative numbers correctly', () => {
    expect(sum(-1, -2)).toBe(-3);
  });

  it('handles zero correctly', () => {
    expect(sum(0, 5)).toBe(5);
  });
});
```

### Test Structure Best Practices

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Component/Module Name', () => {
  // Setup and teardown
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

---

## 🎯 Testing Patterns

### Unit Tests

```javascript
// utils.test.js
import { describe, it, expect } from '@jest/globals';
import { formatDate, validateEmail } from '../src/utils/helpers.js';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25');
      expect(formatDate(date)).toBe('2023-12-25');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe(null);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });
});
```

### Integration Tests

```javascript
// integration.test.js
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { WebSocket } from 'ws';

describe('WebSocket Integration', () => {
  let server;
  let wsServer;

  beforeEach(async () => {
    server = createServer();
    wsServer = new WebSocketServer({ server });
    
    await new Promise((resolve) => {
      server.listen(0, () => resolve());
    });
  });

  afterEach(async () => {
    if (wsServer) {
      wsServer.close();
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should handle client connections', async () => {
    const client = new WebSocket(`ws://localhost:${server.address().port}`);
    
    await new Promise((resolve) => {
      client.on('open', resolve);
    });

    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });
});
```

### Component Tests (React)

```javascript
// Button.test.jsx
import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../src/components/Button.jsx';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies disabled state correctly', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

---

## 🎭 Mocking

### Function Mocking

```javascript
// Mock a function
const mockFunction = jest.fn();

// Mock with return value
const mockFunction = jest.fn().mockReturnValue('mocked value');

// Mock with implementation
const mockFunction = jest.fn().mockImplementation((arg) => {
  return `processed: ${arg}`;
});

// Mock async function
const mockAsyncFunction = jest.fn().mockResolvedValue('async result');
const mockAsyncFunction = jest.fn().mockRejectedValue(new Error('async error'));
```

### Module Mocking

```javascript
// Mock entire module
jest.mock('../src/services/api.js');

// Mock with implementation
jest.mock('../src/services/api.js', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked' }),
  postData: jest.fn().mockResolvedValue({ success: true })
}));

// Partial mocking
jest.mock('../src/services/api.js', () => ({
  ...jest.requireActual('../src/services/api.js'),
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked' })
}));
```

### WebSocket Mocking

```javascript
// Mock WebSocket
jest.mock('ws');

import { WebSocket } from 'ws';

describe('WebSocket Tests', () => {
  it('should handle WebSocket connections', () => {
    const mockWebSocket = {
      readyState: 1, // OPEN
      send: jest.fn(),
      ping: jest.fn(),
      close: jest.fn(),
      terminate: jest.fn()
    };

    // Use mock in tests
    expect(mockWebSocket.readyState).toBe(1);
  });
});
```

### Database Mocking

```javascript
// Mock Supabase
jest.mock('@supabase/supabase-js');

import { createClient } from '@supabase/supabase-js';

describe('Database Tests', () => {
  it('should handle database operations', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1 } })
    };

    createClient.mockReturnValue(mockSupabase);

    // Test your database operations
    const result = await mockSupabase.from('users').select('*').single();
    expect(result.data).toEqual({ id: 1 });
  });
});
```

---

## ⏰ Async Testing

### Promises

```javascript
describe('Async Operations', () => {
  it('should handle promises', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('result'), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('result');
  });

  it('should handle promise rejections', async () => {
    const failingFunction = async () => {
      throw new Error('Something went wrong');
    };

    await expect(failingFunction()).rejects.toThrow('Something went wrong');
  });
});
```

### Callbacks

```javascript
describe('Callback Testing', () => {
  it('should handle callbacks', (done) => {
    const callbackFunction = (callback) => {
      setTimeout(() => {
        callback(null, 'success');
      }, 100);
    };

    callbackFunction((error, result) => {
      expect(error).toBeNull();
      expect(result).toBe('success');
      done();
    });
  });
});
```

### Timers

```javascript
describe('Timer Testing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle setTimeout', () => {
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle setInterval', () => {
    const callback = jest.fn();
    
    setInterval(callback, 100);
    
    jest.advanceTimersByTime(300);
    
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
```

---

## 📊 Coverage

### Coverage Configuration

```javascript
// jest.config.js
export default {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/**/node_modules/**',
    '!src/**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Per-file thresholds
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### Coverage Commands

```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report
jest --coverage

# Coverage for specific files
jest --coverage --collectCoverageFrom="src/utils/**/*.js"

# Coverage with watch mode
jest --coverage --watch
```

### Coverage Reports

- **Text**: Console output
- **HTML**: Interactive browser report
- **LCOV**: For CI/CD integration
- **JSON**: For programmatic access

---

## 🔧 Advanced Features

### Custom Matchers

```javascript
// setup.js
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// In tests
expect(100).toBeWithinRange(90, 110);
```

### Custom Test Environment

```javascript
// custom-environment.js
const NodeEnvironment = require('jest-environment-node');

class CustomEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    // Custom setup
  }

  async teardown() {
    // Custom teardown
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
```

### Parallel Testing

```javascript
// jest.config.js
export default {
  // Run tests in parallel
  maxWorkers: '50%',
  
  // Or specify exact number
  maxWorkers: 4,
  
  // Worker configuration
  workerIdleMemoryLimit: '512MB'
};
```

### Test Suites Organization

```javascript
// Use describe.each for parameterized tests
describe.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });
});

// Use test.each for individual test cases
test.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('.add(%i, %i)', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

---

## 🏗️ Project-Specific Setup

### JARVIS-WEB Jest Configuration

Based on your current project setup:

```javascript
// jest.config.js (Current Configuration)
export default {
  // Test environment
  testEnvironment: 'node',
  
  // File extensions
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/node_modules/**'
  ],
  
  // Coverage thresholds (lowered for initial setup)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Test Setup File

```javascript
// tests/setup.js
process.env.NODE_ENV = 'test';

// Mock console methods for cleaner test output
const originalConsole = console;

global.console = {
  ...originalConsole,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  createMockRequest: () => ({
    method: 'GET',
    url: '/test',
    headers: {},
    body: {}
  }),
  
  createMockResponse: () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  })
};

// Setup and teardown
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
  // Cleanup after each test
  jest.clearAllMocks();
});
```

### Project Test Structure

```
tests/
├── setup.js                    # Global test setup
├── core-functionality.test.js  # Core functionality tests
├── integration.test.js          # Integration tests
├── jest-verification.test.js    # Jest setup verification
├── cors.test.js                # CORS tests
├── unit/                       # Unit tests
│   ├── cartesia.test.js
│   ├── ollama.test.js
│   └── supabase.test.js
├── integration/                # Integration tests
│   └── voice-pipeline.test.js
└── v22-features/              # Node.js v22 feature tests
    └── builtin-test.test.js
```

### Available Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/core-functionality.test.js",
    "test:integration": "jest --testPathPattern=tests/integration.test.js",
    "test:all": "jest --coverage --verbose",
    "test:ci": "jest --coverage --ci --watchAll=false"
  }
}
```

---

## 🎯 Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain what is being tested
3. **Follow the AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** - one concept per test
5. **Use meaningful assertions** with specific matchers

### Test Naming

```javascript
// Good test names
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {
      // test implementation
    });

    it('should throw error when email is invalid', () => {
      // test implementation
    });

    it('should hash password before saving', () => {
      // test implementation
    });
  });
});

// Bad test names
describe('UserService', () => {
  it('works', () => {
    // too vague
  });

  it('test1', () => {
    // not descriptive
  });
});
```

### Mock Management

```javascript
describe('Service Tests', () => {
  let mockService;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockService = {
      fetchData: jest.fn(),
      processData: jest.fn()
    };
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should use mock correctly', () => {
    mockService.fetchData.mockResolvedValue({ data: 'test' });
    
    // Test implementation
    
    expect(mockService.fetchData).toHaveBeenCalledTimes(1);
  });
});
```

### Error Testing

```javascript
describe('Error Handling', () => {
  it('should throw specific error', () => {
    expect(() => {
      throw new Error('Specific error message');
    }).toThrow('Specific error message');
  });

  it('should handle async errors', async () => {
    const asyncFunction = async () => {
      throw new Error('Async error');
    };

    await expect(asyncFunction()).rejects.toThrow('Async error');
  });

  it('should validate error properties', () => {
    try {
      throw new CustomError('message', 'code');
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('message');
      expect(error.code).toBe('code');
    }
  });
});
```

### Performance Testing

```javascript
describe('Performance Tests', () => {
  it('should complete within time limit', async () => {
    const startTime = Date.now();
    
    await performOperation();
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Less than 1 second
  });

  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => i);
    
    const startTime = Date.now();
    const result = processLargeDataset(largeDataset);
    const duration = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(duration).toBeLessThan(100); // Less than 100ms
  });
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. ES Modules Issues

```javascript
// Problem: ES modules not working
// Solution: Update jest.config.js
export default {
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
```

#### 2. Import Path Issues

```javascript
// Problem: Module not found
// Solution: Configure moduleNameMapper
export default {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1'
  }
};
```

#### 3. Async Test Timeouts

```javascript
// Problem: Tests timing out
// Solution: Increase timeout or fix async code
export default {
  testTimeout: 30000 // 30 seconds
};

// Or in individual tests
it('should complete async operation', async () => {
  // Test implementation
}, 10000); // 10 second timeout
```

#### 4. Mock Not Working

```javascript
// Problem: Mock not being applied
// Solution: Ensure proper mock setup

// Move jest.mock() to top of file
jest.mock('../src/service.js');

// Or use manual mocks
const mockService = jest.fn();
jest.doMock('../src/service.js', () => mockService);
```

#### 5. Coverage Issues

```javascript
// Problem: Coverage not collecting
// Solution: Check collectCoverageFrom patterns
export default {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/**/node_modules/**'
  ]
};
```

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Or with specific test
npm test -- --testNamePattern="specific test" --verbose
```

### Performance Issues

```javascript
// Run tests in parallel
export default {
  maxWorkers: '50%'
};

// Or run sequentially for debugging
export default {
  maxWorkers: 1
};
```

---

## 📚 Additional Resources

### Official Documentation

- [Jest Getting Started](https://jestjs.io/docs/getting-started)
- [Jest API Reference](https://jestjs.io/docs/api)
- [Jest Configuration](https://jestjs.io/docs/configuration)

### Project-Specific Resources

- Current Jest config: `jest.config.js`
- Test setup: `tests/setup.js`
- Test examples: `tests/` directory

### Useful Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/core-functionality.test.js

# Run tests matching pattern
npm test -- --testNamePattern="WebSocket"

# Run tests in specific directory
npm test tests/unit/

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🎉 Conclusion

Jest is a powerful testing framework that provides everything you need to test your JavaScript applications. With proper configuration and following best practices, you can create comprehensive test suites that ensure your code quality and reliability.

For the JARVIS-WEB project, Jest is already configured and ready to use. The existing test structure provides a solid foundation for expanding test coverage and ensuring the reliability of your voice AI system.

Remember:

- Write tests that are easy to understand and maintain
- Use descriptive test names and organize tests logically
- Mock external dependencies appropriately
- Aim for good test coverage but focus on quality over quantity
- Keep tests fast and isolated
- Use the right testing patterns for different scenarios

Happy testing! 🚀
