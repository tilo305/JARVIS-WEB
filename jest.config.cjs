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
    '<rootDir>/debug/live/**/*.test.js',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.js',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/examples/**',
    'public/js/audio-utils.js',
    'public/js/vad-config.js',
    '!**/*.test.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  testTimeout: 30000,

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
    // Resolve .js imports to .ts for Jest (TypeScript ESM uses .js in imports)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
};
