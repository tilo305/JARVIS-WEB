/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  moduleFileExtensions: ['js', 'json', 'ts'],

  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/debug/tests/**/*.test.ts',
    '<rootDir>/debug/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.js',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/examples/**',
    'public/js/agentic-patterns.js',
    'public/js/audio-utils.js',
    'public/js/vad-config.js',
    '!**/*.test.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 30,
      functions: 50,
      lines: 40,
      statements: 43,
    },
  },

  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  testTimeout: 30000,

  maxWorkers: '50%',

  verbose: true,

  clearMocks: true,
  restoreMocks: true,

  moduleDirectories: ['node_modules', 'src'],

  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/$1',
    '^@/utils/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    // Resolve .js imports to .ts for Jest (TypeScript ESM uses .js in imports)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/debug/live'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
};
