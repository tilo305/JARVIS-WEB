/**
 * Error Handling Utilities
 * Based on "The Ultimate JavaScript Handbook" - Error Handling section
 * 
 * Provides Result pattern, custom error classes, and error handling utilities
 * for better error management in the JARVIS-WEB application.
 */

/**
 * Result Pattern - Explicit success/error handling
 * 
 * @example
 * async function fetchUser(id) {
 *   try {
 *     const user = await api.getUser(id);
 *     return Result.success(user);
 *   } catch (error) {
 *     return Result.error(error);
 *   }
 * }
 * 
 * const result = await fetchUser(123);
 * if (result.isSuccess()) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export class Result {
  constructor(success, data, error) {
    this.success = success;
    this.data = data;
    this.error = error;
  }
  
  static success(data) {
    return new Result(true, data, null);
  }
  
  static error(error) {
    return new Result(false, null, error);
  }
  
  isSuccess() {
    return this.success;
  }
  
  isError() {
    return !this.success;
  }
  
  /**
   * Map success value to a new Result
   * 
   * @param {Function} fn - Function to transform success data
   * @returns {Result} New Result with transformed data
   */
  map(fn) {
    if (this.isError()) {
      return this;
    }
    try {
      return Result.success(fn(this.data));
    } catch (error) {
      return Result.error(error);
    }
  }
  
  /**
   * Chain Results together
   * 
   * @param {Function} fn - Function that returns a Result
   * @returns {Result} Chained Result
   */
  flatMap(fn) {
    if (this.isError()) {
      return this;
    }
    return fn(this.data);
  }
  
  /**
   * Get value or throw error
   * 
   * @returns {*} Success data
   * @throws {Error} If Result is an error
   */
  unwrap() {
    if (this.isError()) {
      throw this.error;
    }
    return this.data;
  }
  
  /**
   * Get value or return default
   * 
   * @param {*} defaultValue - Default value if error
   * @returns {*} Success data or default
   */
  unwrapOr(defaultValue) {
    if (this.isError()) {
      return defaultValue;
    }
    return this.data;
  }
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error - for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * Network error - for network/API failures
 */
export class NetworkError extends AppError {
  constructor(message, originalError = null) {
    super(message, 0); // 0 indicates network error (no HTTP status)
    this.originalError = originalError;
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
    this.resource = resource;
  }
}

/**
 * Timeout error - for operation timeouts
 */
export class TimeoutError extends AppError {
  constructor(message = 'Operation timed out', timeoutMs = null) {
    super(message, 408);
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Configuration error - for configuration issues
 */
export class ConfigurationError extends AppError {
  constructor(message, configKey = null) {
    super(message, 500);
    this.configKey = configKey;
  }
}

/**
 * Async error handler wrapper
 * Wraps async functions to automatically catch and handle errors
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that returns Result
 * 
 * @example
 * const safeFetch = asyncHandler(async (url) => {
 *   const response = await fetch(url);
 *   return response.json();
 * });
 * 
 * const result = await safeFetch('/api/data');
 * if (result.isError()) {
 *   console.error(result.error);
 * }
 */
export function asyncHandler(fn) {
  return async function handled(...args) {
    try {
      const data = await fn.apply(this, args);
      return Result.success(data);
    } catch (error) {
      return Result.error(error);
    }
  };
}

/**
 * Try-catch wrapper that returns Result
 * 
 * @param {Function} fn - Function to execute
 * @returns {Result} Result of execution
 * 
 * @example
 * const result = tryCatch(() => JSON.parse(jsonString));
 * if (result.isError()) {
 *   console.error('Parse failed:', result.error);
 * }
 */
export function tryCatch(fn) {
  try {
    const data = fn();
    return Result.success(data);
  } catch (error) {
    return Result.error(error);
  }
}

/**
 * Try-catch wrapper for async functions
 * 
 * @param {Function} fn - Async function to execute
 * @returns {Promise<Result>} Promise that resolves to Result
 * 
 * @example
 * const result = await tryCatchAsync(async () => {
 *   return await fetch('/api/data');
 * });
 */
export async function tryCatchAsync(fn) {
  try {
    const data = await fn();
    return Result.success(data);
  } catch (error) {
    return Result.error(error);
  }
}

/**
 * Error handler middleware pattern
 * Centralizes error handling logic
 * 
 * @param {Error} error - Error to handle
 * @param {Object} context - Additional context
 * @returns {Object} Error response object
 */
export function errorHandler(error, context = {}) {
  // Log error with context
  // eslint-disable-next-line no-console -- intentional: error handler logs to console
  console.error('[Error Handler]', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Handle specific error types
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      status: error.statusCode,
      field: error.field,
    };
  }
  
  if (error instanceof NetworkError) {
    return {
      error: error.message || 'Network error occurred',
      status: 0,
      originalError: error.originalError?.message,
    };
  }
  
  if (error instanceof NotFoundError) {
    return {
      error: error.message,
      status: error.statusCode,
      resource: error.resource,
    };
  }
  
  if (error instanceof TimeoutError) {
    return {
      error: error.message,
      status: error.statusCode,
      timeoutMs: error.timeoutMs,
    };
  }
  
  if (error instanceof AppError) {
    return {
      error: error.message,
      status: error.statusCode,
    };
  }
  
  // Unknown error
  // Check for development mode (browser environment)
  const isDevelopment = typeof window !== 'undefined' && (
    window.location?.hostname === 'localhost' ||
    window.location?.hostname === '127.0.0.1' ||
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development')
  );
  
  return {
    error: 'An unexpected error occurred',
    status: 500,
    details: isDevelopment ? error.message : undefined,
  };
}
