# JavaScript Best Practices Guide for JARVIS-WEB

**Based on "The Ultimate JavaScript Handbook"**  
**Project:** JARVIS-WEB  
**Date:** 2025-02-06

---

## Table of Contents

1. [Code Organization](#code-organization)
2. [Error Handling](#error-handling)
3. [Performance Optimization](#performance-optimization)
4. [Async Programming](#async-programming)
5. [Debugging](#debugging)
6. [Memory Management](#memory-management)
7. [Code Examples](#code-examples)

---

## Code Organization

### Module Structure

✅ **DO:**

- Use ES6 modules (`import`/`export`)
- Keep modules focused on a single responsibility
- Export only what's needed

```javascript
// ✅ Good
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad
export default {
  calculateTotal,
  calculateTax,
  calculateShipping,
  // ... too many responsibilities
};
```

### Naming Conventions

✅ **DO:**

- Use `camelCase` for variables and functions
- Use `PascalCase` for classes
- Use `SCREAMING_SNAKE_CASE` for constants
- Use descriptive names

```javascript
// ✅ Good
const userName = 'john_doe';
const MAX_RETRY_ATTEMPTS = 3;
class UserManager { }

// ❌ Bad
const un = 'john_doe';
const maxRetries = 3; // Should be constant
class um { }
```

---

## Error Handling

### Use Result Pattern

✅ **DO:** Use the Result pattern for explicit error handling

```javascript
import { Result, asyncHandler } from './utils/error-handling.js';

// ✅ Good - Explicit error handling
async function fetchUser(id) {
  try {
    const user = await api.getUser(id);
    return Result.success(user);
  } catch (error) {
    return Result.error(error);
  }
}

// Usage
const result = await fetchUser(123);
if (result.isSuccess()) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Use Custom Error Classes

✅ **DO:** Create specific error types for better error handling

```javascript
import { ValidationError, NetworkError, TimeoutError } from './utils/error-handling.js';

// ✅ Good
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', 'email');
}

try {
  await fetch('/api/data');
} catch (error) {
  if (error.name === 'AbortError') {
    throw new TimeoutError('Request timed out', 30000);
  }
  throw new NetworkError('Failed to fetch data', error);
}
```

### Async Error Wrapper

✅ **DO:** Use `asyncHandler` for automatic error handling

```javascript
import { asyncHandler } from './utils/error-handling.js';

// ✅ Good - Automatic Result wrapping
const safeFetch = asyncHandler(async (url) => {
  const response = await fetch(url);
  return response.json();
});

// Always returns Result
const result = await safeFetch('/api/data');
```

---

## Performance Optimization

### Debouncing

✅ **DO:** Debounce frequent events (search, resize, scroll)

```javascript
import { debounce } from './utils/performance.js';

// ✅ Good - Debounce search input
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Throttling

✅ **DO:** Throttle frequent updates (scroll, resize, status updates)

```javascript
import { throttle } from './utils/performance.js';

// ✅ Good - Throttle scroll handler
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### Memoization

✅ **DO:** Memoize expensive computations

```javascript
import { memoize } from './utils/performance.js';

// ✅ Good - Memoize expensive calculation
const expensiveCalculation = memoize((n) => {
  // Expensive computation
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.sqrt(i);
  }
  return result;
});

// First call computes, subsequent calls use cache
const result1 = expensiveCalculation(1000000);
const result2 = expensiveCalculation(1000000); // Uses cache
```

### Lazy Loading

✅ **DO:** Lazy load heavy modules

```javascript
import { lazyLoader } from './utils/performance.js';

// ✅ Good - Lazy load heavy module
const heavyModule = lazyLoader(() => import('./heavy-module.js'));

// Load only when needed
const module = await heavyModule.load();
```

---

## Async Programming

### Use Async/Await

✅ **DO:** Prefer async/await over Promise chains

```javascript
// ✅ Good
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// ❌ Bad
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Fetch failed:', error);
      throw error;
    });
}
```

### Parallel Operations

✅ **DO:** Use `Promise.all` for parallel operations

```javascript
// ✅ Good - Parallel execution
const [user, posts, comments] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchComments(userId),
]);
```

### Error Handling

✅ **DO:** Always handle errors in async functions

```javascript
// ✅ Good
async function processData() {
  try {
    const data = await fetchData();
    return Result.success(data);
  } catch (error) {
    return Result.error(error);
  }
}
```

---

## Debugging

### Use Debug Console

✅ **DO:** Use grouped logging for related information

```javascript
import { DebugConsole } from './utils/debug.js';

// ✅ Good - Grouped logging
DebugConsole.group('User Details', () => {
  console.log('Name:', user.name);
  console.log('Age:', user.age);
  console.log('Email:', user.email);
});
```

### Performance Monitoring

✅ **DO:** Use performance API for timing

```javascript
import { PerformanceMonitor } from './utils/debug.js';

// ✅ Good - Measure performance
const { result, duration } = await PerformanceMonitor.measureAsync(
  'API Call',
  async () => await fetch('/api/data')
);

console.log(`API call took ${duration}ms`);
```

### Conditional Debugging

✅ **DO:** Use debug flags for conditional logging

```javascript
import { Debug } from './utils/debug.js';

// ✅ Good - Only logs in debug mode
Debug.log('Processing user data:', userData);
Debug.error('Failed to process:', error);
```

---

## Memory Management

### Clean Up Event Listeners

✅ **DO:** Remove event listeners when done

```javascript
// ✅ Good
function createHandler() {
  const element = document.getElementById('button');
  const handler = () => console.log('Clicked');
  
  element.addEventListener('click', handler);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('click', handler);
  };
}

const cleanup = createHandler();
// Later...
cleanup();
```

### Clear Timers

✅ **DO:** Always clear timers and intervals

```javascript
// ✅ Good
let timeoutId = setTimeout(() => {
  // Do something
}, 1000);

// Cleanup
clearTimeout(timeoutId);
```

### Avoid Memory Leaks

✅ **DO:** Use WeakMap/WeakSet for garbage collection

```javascript
// ✅ Good - WeakMap allows garbage collection
const weakMap = new WeakMap();
const obj = {};
weakMap.set(obj, 'data');
// obj can be garbage collected, weakMap entry is automatically removed
```

---

## Code Examples

### Complete Example: API Call with Error Handling

```javascript
import { Result, NetworkError, TimeoutError, asyncHandler } from './utils/error-handling.js';
import { PerformanceMonitor } from './utils/debug.js';

// ✅ Good - Complete example
async function fetchUserData(userId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const { result, duration } = await PerformanceMonitor.measureAsync(
      'Fetch User Data',
      async () => {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      }
    );
    
    clearTimeout(timeoutId);
    console.log(`Fetch completed in ${duration}ms`);
    return Result.success(result);
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return Result.error(new TimeoutError('Request timed out', 30000));
    }
    
    return Result.error(new NetworkError('Failed to fetch user data', error));
  }
}

// Usage
const result = await fetchUserData(123);
if (result.isSuccess()) {
  console.log('User data:', result.data);
} else {
  console.error('Error:', result.error.message);
}
```

### Complete Example: Debounced Search

```javascript
import { debounce } from './utils/performance.js';
import { Result, NetworkError } from './utils/error-handling.js';

// ✅ Good - Debounced search with error handling
async function performSearch(query) {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new NetworkError(`Search failed: ${response.statusText}`);
    }
    const results = await response.json();
    displayResults(results);
  } catch (error) {
    displayError(error.message);
  }
}

const debouncedSearch = debounce(performSearch, 300);

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) {
    debouncedSearch(query);
  }
});
```

### Complete Example: Memoized Calculation

```javascript
import { memoize } from './utils/performance.js';

// ✅ Good - Memoized expensive calculation
const calculateComplexValue = memoize((input) => {
  console.log('Computing...'); // Only logs on first call
  // Expensive computation
  let result = 0;
  for (let i = 0; i < input * 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
});

// First call computes
const result1 = calculateComplexValue(10); // Logs "Computing..."

// Subsequent calls use cache
const result2 = calculateComplexValue(10); // No log, uses cache
const result3 = calculateComplexValue(10); // No log, uses cache
```

---

## Quick Reference

### Import Statements

```javascript
// Performance utilities
import { debounce, throttle, memoize, lazyLoader } from './utils/performance.js';

// Error handling
import { Result, AppError, asyncHandler, tryCatchAsync } from './utils/error-handling.js';

// Debugging
import { DebugConsole, PerformanceMonitor, Debug } from './utils/debug.js';

// All utilities
import * as Utils from './utils/index.js';
```

### Common Patterns

```javascript
// Debounce user input
const debounced = debounce(handler, 300);

// Throttle frequent updates
const throttled = throttle(handler, 100);

// Memoize expensive operations
const memoized = memoize(expensiveFunction);

// Result pattern for error handling
const result = await asyncHandler(asyncFunction)();
if (result.isSuccess()) {
  // Handle success
} else {
  // Handle error
}

// Performance monitoring
const { result, duration } = await PerformanceMonitor.measureAsync('Operation', async () => {
  // Your code
});
```

---

## Summary

1. **Use ES6 modules** for code organization
2. **Use Result pattern** for explicit error handling
3. **Use custom error classes** for better error categorization
4. **Debounce/throttle** frequent events
5. **Memoize** expensive computations
6. **Use async/await** with proper error handling
7. **Monitor performance** with Performance API
8. **Clean up resources** (listeners, timers, etc.)
9. **Use debug utilities** for conditional logging
10. **Follow naming conventions** consistently

---

*This guide is based on "The Ultimate JavaScript Handbook" and adapted for the JARVIS-WEB project.*
