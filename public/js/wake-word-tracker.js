/**
 * Wake Word Tracker - UI Component for Tracking Wake Word Detection
 * Displays real-time detection events, metrics, and status for testing
 */
import { DEBUG, escapeHtml } from './debug.js';

export class WakeWordTracker {
  constructor() {
    this.trackerEl = document.getElementById('wakeWordTracker');
    this.statusEl = document.getElementById('trackerStatus');
    this.statusIndicatorEl = document.getElementById('trackerStatusIndicator');
    this.statusTextEl = document.getElementById('trackerStatusText');
    this.detectionsEl = document.getElementById('metricDetections');
    this.latencyEl = document.getElementById('metricLatency');
    this.uptimeEl = document.getElementById('metricUptime');
    this.eventsListEl = document.getElementById('trackerEventsList');
    this.btnClearEl = document.getElementById('btnClearEvents');
    
    this.events = [];
    this.maxEvents = 20;
    this.startTime = Date.now();
    this.updateInterval = null;
    
    DEBUG.trace('WakeWordTracker constructor', {
      hasTrackerEl: !!this.trackerEl,
      hasStatusIndicator: !!this.statusIndicatorEl,
      hasStatusText: !!this.statusTextEl
    });
    
    // If DOM elements aren't ready, retry after a short delay
    if (!this.trackerEl || !this.statusIndicatorEl || !this.statusTextEl) {
      DEBUG.trace('WakeWordTracker: DOM elements not ready, retrying...');
      setTimeout(() => {
        this._retryInitialize();
      }, 100);
    } else {
      this._initializeUI();
    }
  }
  
  _retryInitialize() {
    // Re-fetch DOM elements
    this.trackerEl = document.getElementById('wakeWordTracker');
    this.statusIndicatorEl = document.getElementById('trackerStatusIndicator');
    this.statusTextEl = document.getElementById('trackerStatusText');
    this.detectionsEl = document.getElementById('metricDetections');
    this.latencyEl = document.getElementById('metricLatency');
    this.uptimeEl = document.getElementById('metricUptime');
    this.eventsListEl = document.getElementById('trackerEventsList');
    this.btnClearEl = document.getElementById('btnClearEvents');
    
    if (this.trackerEl && this.statusIndicatorEl && this.statusTextEl) {
      DEBUG.trace('WakeWordTracker: DOM elements found on retry');
      this._initializeUI();
    } else {
      DEBUG.error('WakeWordTracker: DOM elements still not found after retry');
    }
  }

  _initializeUI() {
    if (!this.trackerEl) {
      DEBUG.error('WakeWordTracker: Required DOM elements not found');
      return;
    }

    // Clear events
    if (this.btnClearEl) {
      this.btnClearEl.addEventListener('click', () => {
        this.clearEvents();
      });
    }

    // Start uptime update interval
    this.updateInterval = setInterval(() => {
      this._updateUptime();
    }, 1000);

    // Keep "Initializing..." status until wake word initialization completes
    // Status will be updated by app.js after initWakeWord() completes
  }


  /**
   * Set tracker status
   * @param {string} status - 'active', 'waiting', 'error', 'disabled'
   * @param {string} text - Status text to display
   */
  setStatus(status, text) {
    // Always try direct DOM update first as fallback
    try {
      const directTextEl = document.getElementById('trackerStatusText');
      if (directTextEl && text) {
        directTextEl.textContent = text;
      }
    } catch {
      // Ignore errors in fallback
    }
    
    DEBUG.trace('WakeWordTracker.setStatus called', { 
      status, 
      text,
      hasIndicator: !!this.statusIndicatorEl,
      hasText: !!this.statusTextEl 
    });
    
    // If elements not found, try to re-fetch them
    if (!this.statusIndicatorEl || !this.statusTextEl) {
      DEBUG.trace('WakeWordTracker: Re-fetching status elements');
      this.statusIndicatorEl = document.getElementById('trackerStatusIndicator');
      this.statusTextEl = document.getElementById('trackerStatusText');
    }
    
    if (!this.statusIndicatorEl || !this.statusTextEl) {
      DEBUG.error('WakeWordTracker: Status elements not found after retry', {
        statusIndicatorEl: !!this.statusIndicatorEl,
        statusTextEl: !!this.statusTextEl
      });
      // Direct update already done above, just return
      return;
    }
    
    if (!this.statusIndicatorEl.classList) {
      DEBUG.error('WakeWordTracker: statusIndicatorEl.classList not available');
      // Still try to update text
    }

    // Remove all status classes
    if (this.statusIndicatorEl && this.statusIndicatorEl.classList) {
      try {
        this.statusIndicatorEl.classList.remove('active', 'waiting', 'error');
        
        // Add appropriate class
        if (status === 'active') {
          this.statusIndicatorEl.classList.add('active');
        } else if (status === 'waiting') {
          this.statusIndicatorEl.classList.add('waiting');
        } else if (status === 'error') {
          this.statusIndicatorEl.classList.add('error');
        }
        DEBUG.trace('WakeWordTracker: Status classes updated', { status });
      } catch (err) {
        DEBUG.error('WakeWordTracker: Error updating status classes', err);
      }
    }

    try {
      if (this.statusTextEl && this.statusTextEl.textContent !== undefined) {
        this.statusTextEl.textContent = text || 'Unknown';
        DEBUG.trace('WakeWordTracker: Status text updated', { text, elementId: this.statusTextEl.id });
      } else {
        DEBUG.error('WakeWordTracker: statusTextEl is invalid', {
          exists: !!this.statusTextEl,
          hasTextContent: this.statusTextEl?.textContent !== undefined
        });
      }
    } catch (err) {
      DEBUG.error('WakeWordTracker: Error updating status text', err);
      // Try to update directly via innerHTML as fallback
      try {
        if (this.statusTextEl) {
          this.statusTextEl.innerHTML = (text || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
      } catch (fallbackErr) {
        DEBUG.error('WakeWordTracker: Fallback text update also failed', fallbackErr);
      }
    }
  }

  /**
   * Record a wake word detection event
   * @param {Object} event - Detection event data
   * @param {number} event.keywordIndex - Index of detected keyword
   * @param {number} event.latency - Detection latency in ms
   * @param {string} event.keywordName - Optional keyword name
   */
  recordDetection(event) {
    const detectionEvent = {
      timestamp: Date.now(),
      keywordIndex: event.keywordIndex ?? -1,
      keywordName: event.keywordName || `Keyword ${event.keywordIndex ?? 0}`,
      latency: event.latency ?? 0,
    };

    this.events.unshift(detectionEvent);
    
    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this._renderEvents();
    this._updateMetrics();
    this.setStatus('active', 'Wake word active');
    
    // Reset to waiting after 2 seconds
    setTimeout(() => {
      this.setStatus('waiting', 'Wake word active');
    }, 2000);
  }

  /**
   * Update metrics from bridge
   * @param {Object} metrics - Metrics from WakeWordManager.getMetrics()
   */
  updateMetrics(metrics) {
    if (!metrics) return;

    // Use bridge metrics for detection count (more accurate than local events)
    if (this.detectionsEl && typeof metrics.detectionCount === 'number') {
      this.detectionsEl.textContent = metrics.detectionCount;
    }

    // Use bridge metrics for latency if available, otherwise use local events average
    if (this.latencyEl) {
      if (typeof metrics.avgDetectionLatency === 'number' && metrics.avgDetectionLatency > 0) {
        const latency = Math.round(metrics.avgDetectionLatency);
        this.latencyEl.textContent = `${latency}ms`;
      } else if (this.events.length > 0) {
        // Fallback to local events average
        const avgLatency = this.events.reduce((sum, e) => sum + (e.latency || 0), 0) / this.events.length;
        this.latencyEl.textContent = `${Math.round(avgLatency)}ms`;
      } else {
        this.latencyEl.textContent = '0ms';
      }
    }

    // Update uptime from bridge metrics if available
    if (metrics.uptimeMs) {
      this._updateUptime(metrics.uptimeMs);
    }
  }

  /**
   * Update uptime display
   * @param {number} uptimeMs - Optional uptime in milliseconds
   */
  _updateUptime(uptimeMs) {
    if (!this.uptimeEl) return;

    const uptime = uptimeMs ?? (Date.now() - this.startTime);
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    let display;
    if (hours > 0) {
      display = `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      display = `${minutes}m ${seconds % 60}s`;
    } else {
      display = `${seconds}s`;
    }

    this.uptimeEl.textContent = display;
  }

  /**
   * Render events list
   */
  _renderEvents() {
    if (!this.eventsListEl) return;

    if (this.events.length === 0) {
      this.eventsListEl.innerHTML = '<div class="tracker-empty">No detections yet</div>';
      return;
    }

    const html = this.events.map(event => {
      const time = new Date(event.timestamp);
      // Use fallback for fractional seconds (fractionalSecondDigits not supported in all browsers)
      let timeStr;
      try {
        timeStr = time.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          fractionalSecondDigits: 3
        });
      } catch {
        // Fallback: manually add milliseconds
        const ms = time.getMilliseconds().toString().padStart(3, '0');
        timeStr = time.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit'
        }) + `.${ms}`;
      }

      return `
        <div class="tracker-event">
          <div class="tracker-event-time">${escapeHtml(timeStr)}</div>
          <div class="tracker-event-details">
            <span class="tracker-event-keyword">${escapeHtml(event.keywordName)}</span>
            ${event.latency > 0 ? `<span class="tracker-event-latency">${Math.round(event.latency)}ms</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.eventsListEl.innerHTML = html;
  }

  /**
   * Update metrics display from local events (used when bridge metrics not available)
   */
  _updateMetrics() {
    // Only update if bridge hasn't provided metrics yet
    // This is a fallback - bridge metrics should be the source of truth
    if (this.events.length > 0 && this.latencyEl) {
      const avgLatency = this.events.reduce((sum, e) => sum + (e.latency || 0), 0) / this.events.length;
      // Only update if latency is 0 (meaning bridge metrics haven't been set yet)
      if (this.latencyEl.textContent === '0ms' || !this.latencyEl.textContent) {
        this.latencyEl.textContent = `${Math.round(avgLatency)}ms`;
      }
    }
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
    this._renderEvents();
    this._updateMetrics();
  }

  /**
   * Cleanup and destroy tracker
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
