/**
 * Utility Functions Index
 * Central export point for all utility functions
 * 
 * Based on "The Ultimate JavaScript Handbook" best practices
 */

// Performance utilities
export {
  debounce,
  throttle,
  memoize,
  memoizeWithKey,
  clearMemoCache,
  LazyLoader,
  lazyLoader,
} from './performance.js';

// Error handling utilities
export {
  Result,
  AppError,
  ValidationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
  ConfigurationError,
  asyncHandler,
  tryCatch,
  tryCatchAsync,
  errorHandler,
} from './error-handling.js';

// Debugging utilities
export {
  DebugConsole,
  PerformanceMonitor,
  DebugConfig,
  Debug,
} from './debug.js';
