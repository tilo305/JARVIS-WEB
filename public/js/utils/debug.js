/**
 * Enhanced Debugging Utilities
 * Based on "The Ultimate JavaScript Handbook" - Debugging Techniques section
 * 
 * Provides enhanced console methods, performance monitoring, and debugging tools
 * for the JARVIS-WEB application.
 */
/* eslint-disable no-console -- intentional: debug utilities output to console */

/**
 * Enhanced console with grouping and performance tracking
 */
export const DebugConsole = {
  /**
   * Grouped logging
   * 
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   * 
   * @example
   * DebugConsole.group('User Details', () => {
   *   console.log('Name:', name);
   *   console.log('Age:', age);
   * });
   */
  group(label, fn) {
    console.group(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },
  
  /**
   * Collapsed group (starts collapsed)
   * 
   * @param {string} label - Group label
   * @param {Function} fn - Function to execute within group
   */
  groupCollapsed(label, fn) {
    console.groupCollapsed(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },
  
  /**
   * Table display
   * 
   * @param {Array|Object} data - Data to display as table
   * @param {Array} columns - Optional column names
   */
  table(data, columns = null) {
    if (columns) {
      const filtered = Array.isArray(data)
        ? data.map(item => {
            const filteredItem = {};
            columns.forEach(col => {
              filteredItem[col] = item[col];
            });
            return filteredItem;
          })
        : data;
      console.table(filtered);
    } else {
      console.table(data);
    }
  },
  
  /**
   * Time measurement
   * 
   * @param {string} label - Measurement label
   * @param {Function} fn - Function to measure
   * @returns {Promise<number>} Execution time in milliseconds
   * 
   * @example
   * const duration = await DebugConsole.time('API Call', async () => {
   *   await fetch('/api/data');
   * });
   */
  async time(label, fn) {
    console.time(label);
    try {
      const result = await fn();
      return result;
    } finally {
      console.timeEnd(label);
    }
  },
  
  /**
   * Synchronous time measurement
   * 
   * @param {string} label - Measurement label
   * @param {Function} fn - Function to measure
   * @returns {*} Function result
   */
  timeSync(label, fn) {
    console.time(label);
    try {
      return fn();
    } finally {
      console.timeEnd(label);
    }
  },
  
  /**
   * Stack trace
   * 
   * @param {string} message - Optional message
   */
  trace(message = '') {
    console.trace(message);
  },
  
  /**
   * Conditional logging with assertion
   * 
   * @param {boolean} condition - Condition to check
   * @param {string} message - Error message if condition fails
   */
  assert(condition, message) {
    console.assert(condition, message);
  },
  
  /**
   * Styled console output
   * 
   * @param {string} message - Message to display
   * @param {string} styles - CSS styles
   */
  styled(message, styles) {
    console.log(`%c${message}`, styles);
  },
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Create a performance mark
   * 
   * @param {string} name - Mark name
   */
  mark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },
  
  /**
   * Measure performance between two marks
   * 
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }
  },
  
  /**
   * Get all performance measures
   * 
   * @returns {Array} Array of performance entries
   */
  getMeasures() {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      return performance.getEntriesByType('measure');
    }
    return [];
  },
  
  /**
   * Get measure by name
   * 
   * @param {string} name - Measure name
   * @returns {PerformanceEntry|undefined} Performance entry
   */
  getMeasure(name) {
    if (typeof performance !== 'undefined' && performance.getEntriesByName) {
      const entries = performance.getEntriesByName(name, 'measure');
      return entries[0];
    }
    return undefined;
  },
  
  /**
   * Clear all performance marks and measures
   */
  clear() {
    if (typeof performance !== 'undefined') {
      if (performance.clearMarks) {
        performance.clearMarks();
      }
      if (performance.clearMeasures) {
        performance.clearMeasures();
      }
    }
  },
  
  /**
   * Measure async function execution
   * 
   * @param {string} name - Measurement name
   * @param {Function} fn - Async function to measure
   * @returns {Promise<{result: *, duration: number}>} Result and duration
   * 
   * @example
   * const { result, duration } = await PerformanceMonitor.measureAsync(
   *   'API Call',
   *   async () => await fetch('/api/data')
   * );
   */
  async measureAsync(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    this.mark(startMark);
    const startTime = performance.now();
    
    try {
      const result = await fn();
      return { result, duration: performance.now() - startTime };
    } finally {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
    }
  },
};

/**
 * Debug configuration
 */
export const DebugConfig = {
  enabled: typeof window !== 'undefined' && (
    window.JARVIS_DEBUG === true ||
    (window.location && /[?&]debug=1/.test(window.location.search))
  ),
  
  /**
   * Check if debug mode is enabled
   * 
   * @returns {boolean} True if debug mode is enabled
   */
  isEnabled() {
    return this.enabled;
  },
  
  /**
   * Enable debug mode
   */
  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      window.JARVIS_DEBUG = true;
    }
  },
  
  /**
   * Disable debug mode
   */
  disable() {
    this.enabled = false;
    if (typeof window !== 'undefined') {
      window.JARVIS_DEBUG = false;
    }
  },
};

/**
 * Conditional debug logger
 * Only logs when debug mode is enabled
 */
export const Debug = {
  log(...args) {
    if (DebugConfig.isEnabled()) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  error(...args) {
    if (DebugConfig.isEnabled()) {
      console.error('[DEBUG ERROR]', ...args);
    }
  },
  
  warn(...args) {
    if (DebugConfig.isEnabled()) {
      console.warn('[DEBUG WARN]', ...args);
    }
  },
  
  trace(...args) {
    if (DebugConfig.isEnabled()) {
      console.trace('[DEBUG TRACE]', ...args);
    }
  },
  
  group(label, fn) {
    if (DebugConfig.isEnabled()) {
      DebugConsole.group(label, fn);
    }
  },
  
  table(data, columns = null) {
    if (DebugConfig.isEnabled()) {
      DebugConsole.table(data, columns);
    }
  },
};
