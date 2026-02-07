/**
 * UI Patterns & Microinteractions Module
 * Implements patterns from "bOoKs On Ui.md" reference document
 * 
 * Features:
 * - Progress indicators
 * - Smart defaults and autocomplete
 * - Input hints and validation
 * - Notification patterns
 * - Context keeping
 */

/**
 * Browser API safety check (SSR compatibility)
 */
export const isBrowser = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

/**
 * Professional easing functions (from reference document)
 */
export const EASING = {
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  materialStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  deceleration: 'cubic-bezier(0, 0, 0.2, 1)',
  acceleration: 'cubic-bezier(0.4, 0, 1, 1)',
};

/**
 * Timing guidelines (from reference document)
 */
export const TIMING = {
  instant: 100,    // Button press feedback
  quick: 200,      // Toggle switches, checkboxes
  fast: 300,       // Panel open/close, dropdowns
  normal: 500,     // Modal dialogs, page elements
  slow: 800,       // Page transitions
  dramatic: 1200,  // Hero animations
  ambient: 2000,   // Background effects, pulsing
  continuous: 20000, // Continuous rotation/scrolling
};

/**
 * Progress Indicator Component
 * Shows progress for async operations (downloads, uploads, processing)
 */
export class ProgressIndicator {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showPercentage: options.showPercentage ?? true,
      showSpinner: options.showSpinner ?? true,
      color: options.color || 'var(--gold)',
      height: options.height || '4px',
      ...options,
    };
    this.progress = 0;
    this.element = null;
  }

  create() {
    if (!isBrowser || !this.container) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-indicator-wrapper';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: ${this.options.height};
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin: 0.5rem 0;
    `;

    const bar = document.createElement('div');
    bar.className = 'progress-indicator-bar';
    bar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: ${this.options.color};
      transition: width ${TIMING.fast}ms ${EASING.easeOut};
      box-shadow: 0 0 10px ${this.options.color};
    `;

    if (this.options.showSpinner) {
      const spinner = document.createElement('div');
      spinner.className = 'progress-spinner';
      spinner.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border: 2px solid ${this.options.color};
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin ${TIMING.continuous}ms linear infinite;
      `;
      wrapper.appendChild(spinner);
    }

    wrapper.appendChild(bar);
    this.element = wrapper;
    this.bar = bar;
    return wrapper;
  }

  show() {
    if (!this.element && this.container) {
      const el = this.create();
      if (el) this.container.appendChild(el);
    }
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  setProgress(percentage) {
    this.progress = Math.max(0, Math.min(100, percentage));
    if (this.bar) {
      this.bar.style.width = `${this.progress}%`;
    }
  }

  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.bar = null;
  }
}

/**
 * Notification System
 * Implements notification patterns with visual feedback
 */
export class NotificationSystem {
  constructor(container) {
    this.container = container || (isBrowser ? document.body : null);
    this.notifications = [];
  }

  show(message, type = 'info', duration = 3000) {
    if (!isBrowser || !this.container) return null;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    // Apply styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: rgba(15, 15, 21, 0.95);
      border: 2px solid;
      border-radius: 12px;
      color: var(--text);
      font-size: 0.9375rem;
      z-index: 10000;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      transform: translateX(400px);
      opacity: 0;
      transition: transform ${TIMING.fast}ms ${EASING.easeOut}, opacity ${TIMING.fast}ms ${EASING.easeOut};
      max-width: 400px;
      word-wrap: break-word;
    `;

    // Type-specific styling
    const colors = {
      info: { border: 'var(--gold)', bg: 'rgba(255, 184, 0, 0.1)' },
      success: { border: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' },
      warning: { border: 'var(--gold-dim)', bg: 'rgba(255, 140, 0, 0.1)' },
      error: { border: 'var(--iron-red-bright)', bg: 'rgba(196, 30, 58, 0.1)' },
    };
    const style = colors[type] || colors.info;
    notification.style.borderColor = style.border;
    notification.style.background = style.bg;

    notification.textContent = message;
    this.container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      });
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification);
      }, duration);
    }

    this.notifications.push(notification);
    return notification;
  }

  dismiss(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.style.transform = 'translateX(400px)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, TIMING.fast);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration || 5000);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

/**
 * Smart Input Hints
 * Provides contextual hints that disappear after input
 */
export class InputHints {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      showOnFocus: options.showOnFocus ?? true,
      hideOnInput: options.hideOnInput ?? true,
      hintClass: options.hintClass || 'input-hint',
      ...options,
    };
    this.hintElement = null;
  }

  setHint(text, format = null) {
    if (!isBrowser || !this.input) return;
    
    // Remove existing hint
    this.removeHint();
    
    if (!text && !format) return;
    
    const hint = document.createElement('div');
    hint.className = this.options.hintClass;
    hint.style.cssText = `
      position: absolute;
      bottom: -24px;
      left: 0;
      font-size: 0.75rem;
      color: var(--text-muted);
      opacity: 0;
      transition: opacity ${TIMING.quick}ms ${EASING.easeOut};
      pointer-events: none;
    `;
    
    if (format) {
      hint.textContent = `Format: ${format}`;
    } else {
      hint.textContent = text;
    }
    
    const wrapper = this.input.closest('.input-wrap');
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(hint);
      this.hintElement = hint;
      
      // Show hint
      requestAnimationFrame(() => {
        if (this.hintElement) {
          this.hintElement.style.opacity = '0.7';
        }
      });
      
      // Auto-hide on input
      if (this.options.hideOnInput) {
        const hideHandler = () => {
          this.removeHint();
          this.input.removeEventListener('input', hideHandler);
        };
        this.input.addEventListener('input', hideHandler, { once: true });
      }
    }
  }

  removeHint() {
    if (this.hintElement && this.hintElement.parentNode) {
      this.hintElement.style.opacity = '0';
      setTimeout(() => {
        if (this.hintElement && this.hintElement.parentNode) {
          this.hintElement.parentNode.removeChild(this.hintElement);
        }
        this.hintElement = null;
      }, TIMING.quick);
    }
  }
}

/**
 * Autocomplete System
 * Provides word suggestions while typing
 */
export class AutocompleteSystem {
  constructor(inputElement, suggestions = [], options = {}) {
    this.input = inputElement;
    this.suggestions = suggestions;
    this.options = {
      minChars: options.minChars ?? 2,
      maxSuggestions: options.maxSuggestions ?? 5,
      debounceMs: options.debounceMs ?? 300,
      ...options,
    };
    this.dropdown = null;
    this.currentSuggestions = [];
    this.selectedIndex = -1;
    this.debounceTimer = null;
  }

  init() {
    if (!isBrowser || !this.input) return;
    
    this.input.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleInput();
      }, this.options.debounceMs);
    });
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrevious();
      } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
        e.preventDefault();
        this.applySuggestion(this.currentSuggestions[this.selectedIndex]);
      } else if (e.key === 'Escape') {
        this.hide();
      }
    });
    
    // Hide on blur (with delay to allow click)
    this.input.addEventListener('blur', () => {
      setTimeout(() => this.hide(), 200);
    });
  }

  handleInput() {
    const value = this.input.value.trim();
    if (value.length < this.options.minChars) {
      this.hide();
      return;
    }
    
    const matches = this.suggestions
      .filter(s => s.toLowerCase().includes(value.toLowerCase()))
      .slice(0, this.options.maxSuggestions);
    
    if (matches.length > 0) {
      this.show(matches);
    } else {
      this.hide();
    }
  }

  show(suggestions) {
    this.currentSuggestions = suggestions;
    this.selectedIndex = -1;
    
    if (!this.dropdown) {
      this.createDropdown();
    }
    
    this.updateDropdown();
    this.positionDropdown();
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'autocomplete-dropdown';
    this.dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: rgba(15, 15, 21, 0.98);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-top: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      transform: translateY(-10px);
      opacity: 0;
      transition: transform ${TIMING.quick}ms ${EASING.easeOut}, opacity ${TIMING.quick}ms ${EASING.easeOut};
    `;
    
    const wrapper = this.input.closest('.input-wrap');
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(this.dropdown);
      
      requestAnimationFrame(() => {
        if (this.dropdown) {
          this.dropdown.style.transform = 'translateY(0)';
          this.dropdown.style.opacity = '1';
        }
      });
    }
  }

  updateDropdown() {
    if (!this.dropdown) return;
    
    this.dropdown.innerHTML = '';
    this.currentSuggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.style.cssText = `
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background ${TIMING.instant}ms ${EASING.easeOut};
      `;
      item.textContent = suggestion;
      
      if (index === this.selectedIndex) {
        item.style.background = 'rgba(255, 184, 0, 0.2)';
      }
      
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateDropdown();
      });
      
      item.addEventListener('click', () => {
        this.applySuggestion(suggestion);
      });
      
      this.dropdown.appendChild(item);
    });
  }

  positionDropdown() {
    // Dropdown is already positioned via CSS
  }

  selectNext() {
    if (this.currentSuggestions.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.currentSuggestions.length;
    this.updateDropdown();
  }

  selectPrevious() {
    if (this.currentSuggestions.length === 0) return;
    this.selectedIndex = this.selectedIndex <= 0 
      ? this.currentSuggestions.length - 1 
      : this.selectedIndex - 1;
    this.updateDropdown();
  }

  applySuggestion(suggestion) {
    if (!this.input) return;
    this.input.value = suggestion;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.hide();
  }

  hide() {
    if (this.dropdown) {
      this.dropdown.style.transform = 'translateY(-10px)';
      this.dropdown.style.opacity = '0';
      setTimeout(() => {
        if (this.dropdown && this.dropdown.parentNode) {
          this.dropdown.parentNode.removeChild(this.dropdown);
        }
        this.dropdown = null;
      }, TIMING.quick);
    }
    this.selectedIndex = -1;
    this.currentSuggestions = [];
  }

  setSuggestions(suggestions) {
    this.suggestions = suggestions;
  }
}

/**
 * Smart Defaults Manager
 * Stores and retrieves user preferences and recent actions
 */
export class SmartDefaults {
  constructor(storageKey = 'jarvis_smart_defaults') {
    this.storageKey = storageKey;
    this.defaults = this.load();
  }

  load() {
    if (!isBrowser) return {};
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  save() {
    if (!isBrowser) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.defaults));
    } catch (err) {
      console.warn('[SmartDefaults] Failed to save:', err);
    }
  }

  get(key, defaultValue = null) {
    return this.defaults[key] ?? defaultValue;
  }

  set(key, value) {
    this.defaults[key] = value;
    this.save();
  }

  getRecentItems(category, maxItems = 5) {
    const items = this.defaults[`recent_${category}`] || [];
    return items.slice(0, maxItems);
  }

  addRecentItem(category, item) {
    const key = `recent_${category}`;
    const items = this.defaults[key] || [];
    // Remove if already exists
    const index = items.indexOf(item);
    if (index > -1) {
      items.splice(index, 1);
    }
    // Add to front
    items.unshift(item);
    // Keep only max items
    this.defaults[key] = items.slice(0, 10);
    this.save();
  }
}

/**
 * Context Keeper
 * Maintains context through transitions and state changes
 */
export class ContextKeeper {
  constructor() {
    this.context = new Map();
  }

  set(key, value) {
    this.context.set(key, value);
  }

  get(key, defaultValue = null) {
    return this.context.get(key) ?? defaultValue;
  }

  clear(key) {
    if (key) {
      this.context.delete(key);
    } else {
      this.context.clear();
    }
  }

  // Animate context transition
  transition(fromElement, toElement, options = {}) {
    if (!isBrowser || !fromElement || !toElement) return;
    
    const duration = options.duration || TIMING.normal;
    const easing = options.easing || EASING.easeInOut;
    
    // Simple fade transition
    fromElement.style.transition = `opacity ${duration}ms ${easing}`;
    fromElement.style.opacity = '0';
    
    toElement.style.opacity = '0';
    toElement.style.transition = `opacity ${duration}ms ${easing}`;
    
    requestAnimationFrame(() => {
      toElement.style.opacity = '1';
    });
    
    setTimeout(() => {
      fromElement.style.opacity = '1';
    }, duration);
  }
}

// Add CSS animation for spinner
if (isBrowser) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
