/**
 * Performance Optimization Utilities
 * Based on "The Ultimate JavaScript Handbook" - Performance Optimization section
 * 
 * Provides debouncing, throttling, and memoization utilities for optimizing
 * frequent operations in the JARVIS-WEB application.
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * since the last invocation.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce(searchFunction, 300);
 * input.addEventListener('input', debouncedSearch);
 */
export function debounce(func, delay) {
  let timeoutId;
  return function debounced(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Throttle function - limits execution to at most once per limit period.
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit) {
  let inThrottle;
  return function throttled(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoization function - caches function results based on arguments.
 * 
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 * 
 * @example
 * const memoizedFibonacci = memoize(function(n) {
 *   if (n < 2) return n;
 *   return memoizedFibonacci(n - 1) + memoizedFibonacci(n - 2);
 * });
 */
export function memoize(fn) {
  const cache = new Map();
  return function memoized(...args) {
    // Create cache key from arguments
    const key = JSON.stringify(args);
    
    // Check cache
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    // Compute and cache result
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoization with custom key generator
 * 
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key from arguments
 * @returns {Function} Memoized function
 * 
 * @example
 * const memoized = memoizeWithKey(
 *   (obj) => expensiveOperation(obj),
 *   (obj) => obj.id // Use object ID as cache key
 * );
 */
export function memoizeWithKey(fn, keyGenerator) {
  const cache = new Map();
  return function memoized(...args) {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Clear memoization cache
 * 
 * @param {Function} memoizedFn - Memoized function (must have been created with memoize)
 */
export function clearMemoCache(memoizedFn) {
  if (memoizedFn._cache) {
    memoizedFn._cache.clear();
  }
}

/**
 * Lazy loader - loads resource only when needed, caches result
 * 
 * @param {Function} loadFn - Async function that loads the resource
 * @returns {Object} Lazy loader with load() method
 * 
 * @example
 * const lazyModule = lazyLoader(() => import('./heavy-module.js'));
 * const module = await lazyModule.load();
 */
export class LazyLoader {
  constructor(loadFn) {
    this.loadFn = loadFn;
    this.loaded = false;
    this.promise = null;
    this.result = null;
  }
  
  async load() {
    if (this.loaded) {
      return this.result;
    }
    
    if (this.promise) {
      return this.promise;
    }
    
    this.promise = this.loadFn().then((result) => {
      this.loaded = true;
      this.result = result;
      return result;
    });
    
    return this.promise;
  }
  
  isLoaded() {
    return this.loaded;
  }
}

/**
 * Create a lazy loader instance
 * 
 * @param {Function} loadFn - Async function that loads the resource
 * @returns {LazyLoader} Lazy loader instance
 */
export function lazyLoader(loadFn) {
  return new LazyLoader(loadFn);
}
