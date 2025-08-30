/**
 * Centralized State Management for memorAIzation stAItion
 * Following John Carmack's principles: explicit state, minimal overhead, clear data flow
 */

class MemoryState {
  constructor() {
    // Core application state
    this.state = {
      // PAO system state
      pao: {
        currentNumber: null,
        selectedCard: null,
        practiceMode: false,
        difficulty: 'normal',
        data: null,
        lookup: null,
        initialized: false,
        statistics: { totalPractices: 0, correctRecalls: 0 },
      },

      // Dice practice state
      dice: {
        session: [],
        currentRoll: null,
        statistics: {
          totalRolls: 0,
          correctRecalls: 0,
          averageResponseTime: 0,
        },
      },

      // AI configuration
      ai: {
        provider: 'hf',
        model: 'stabilityai/stable-diffusion-2',
        token: null,
        imageCache: new Map(),
        generationQueue: [],
        queueLength: 0,
        currentGeneration: null,
        cacheStats: { hits: 0, misses: 0, total: 0 },
        providerStats: {},
        performanceMetrics: {},
      },

      // UI state
      ui: {
        theme: 'default',
        cardLayout: 'grid',
        animations: true,
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          fontSize: 'medium',
        },
      },

      // Performance metrics
      performance: {
        lastRenderTime: 0,
        memoryUsage: 0,
        interactionLatency: [],
      },

      // Image manifest
      imageManifest: {},

      // Current active system
      activeSystem: 'pao',
    };

    // Subscribers for reactive updates
    this.subscribers = new Map();

    // Performance monitoring
    this.performanceObserver = null;
    this.initPerformanceMonitoring();

    // Load persisted state from localStorage
    this.loadPersistedState();
  }

  // Load persisted state from localStorage
  loadPersistedState() {
    try {
      // Load AI configuration
      const aiProvider = localStorage.getItem('ai-provider');
      const aiModel = localStorage.getItem('ai-model');
      if (aiProvider) this.state.ai.provider = aiProvider;
      if (aiModel) this.state.ai.model = aiModel;

      // Load UI preferences
      const theme = localStorage.getItem('theme');
      if (theme) this.state.ui.theme = theme;

      // Load dice session
      const diceSession = localStorage.getItem('dice-session');
      if (diceSession) {
        try {
          this.state.dice.session = JSON.parse(diceSession);
        } catch {
          console.warn('Failed to parse dice session from localStorage');
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  // Save state to localStorage
  saveToLocalStorage(path, value) {
    try {
      const key = `state_${path.replace(/\./g, '_')}`;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Get state with path support (e.g., 'pao.currentNumber')
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  // Set state with path support and notify subscribers
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], this.state);

    if (target && Object.prototype.hasOwnProperty.call(target, lastKey)) {
      const oldValue = target[lastKey];
      target[lastKey] = value;

      // Persist to localStorage for important state
      if (this.shouldPersist(path)) {
        this.saveToLocalStorage(path, value);
      }

      // Notify subscribers of change
      this.notifySubscribers(path, value, oldValue);

      // Performance tracking
      this.trackPerformanceChange(path);

      return true;
    }
    return false;
  }

  // Check if a path should be persisted to localStorage
  shouldPersist(path) {
    const persistPaths = [
      'ai.provider',
      'ai.model',
      'ui.theme',
      'ui.cardLayout',
      'ui.accessibility.highContrast',
      'ui.accessibility.reducedMotion',
      'ui.accessibility.fontSize',
    ];
    return persistPaths.includes(path);
  }

  // Subscribe to state changes
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  // Notify all subscribers for a path
  notifySubscribers(path, newValue, oldValue) {
    const callbacks = this.subscribers.get(path);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error(`Error in state subscriber for ${path}:`, error);
        }
      });
    }
  }

  // Batch multiple state updates
  batch(updates) {
    const oldValues = new Map();

    // Collect old values
    updates.forEach(([path]) => {
      oldValues.set(path, this.get(path));
    });

    // Apply updates
    updates.forEach(([path, value]) => {
      this.set(path, value);
    });

    // Notify batch completion
    this.notifySubscribers('batch', updates, oldValues);
  }

  // Performance monitoring
  initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.state.performance.interactionLatency.push(entry.duration);

            // Keep only last 100 measurements
            if (this.state.performance.interactionLatency.length > 100) {
              this.state.performance.interactionLatency.shift();
            }

            // Update average
            const sum = this.state.performance.interactionLatency.reduce(
              (a, b) => a + b,
              0
            );
            this.state.performance.averageResponseTime =
              sum / this.state.performance.interactionLatency.length;
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  // Track performance changes
  trackPerformanceChange(path) {
    const start = performance.now();

    // Measure render time for UI changes
    if (path.startsWith('ui.')) {
      requestAnimationFrame(() => {
        const end = performance.now();
        this.state.performance.lastRenderTime = end - start;

        if (performance.mark) {
          performance.mark(`state-change-${path}`);
          performance.measure(`render-${path}`, `state-change-${path}`);
        }
      });
    }
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if ('memory' in performance) {
      this.state.performance.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  // Export state for debugging/analysis
  export() {
    return {
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(this.state)),
      performance: {
        averageResponseTime: this.state.performance.averageResponseTime,
        lastRenderTime: this.state.performance.lastRenderTime,
        memoryUsage: this.state.performance.memoryUsage,
      },
    };
  }

  // Reset state to initial values
  reset() {
    this.state = {
      pao: {
        currentNumber: null,
        selectedCard: null,
        practiceMode: false,
        difficulty: 'normal',
        data: null,
        lookup: null,
        initialized: false,
        statistics: { totalPractices: 0, correctRecalls: 0 },
      },
      dice: {
        session: [],
        currentRoll: null,
        statistics: {
          totalRolls: 0,
          correctRecalls: 0,
          averageResponseTime: 0,
        },
      },
      ai: {
        provider: 'hf',
        model: 'stabilityai/stable-diffusion-2',
        token: null,
        imageCache: new Map(),
        generationQueue: [],
        queueLength: 0,
        currentGeneration: null,
        cacheStats: { hits: 0, misses: 0, total: 0 },
        providerStats: {},
        performanceMetrics: {},
      },
      ui: {
        theme: 'default',
        cardLayout: 'grid',
        animations: true,
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          fontSize: 'medium',
        },
      },
      performance: {
        lastRenderTime: 0,
        memoryUsage: 0,
        interactionLatency: [],
      },
      imageManifest: {},
      activeSystem: 'pao',
    };

    // Notify all subscribers of reset
    this.notifySubscribers('reset', this.state, null);
  }

  // Cleanup
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.subscribers.clear();
  }
}

// Singleton instance
const memoryState = new MemoryState();

// Export both the class and instance
export { MemoryState, memoryState };

// Default export for convenience
export default memoryState;
