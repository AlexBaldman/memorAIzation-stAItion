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
        difficulty: 'normal'
      },
      
      // Dice practice state
      dice: {
        session: [],
        currentRoll: null,
        statistics: {
          totalRolls: 0,
          correctRecalls: 0,
          averageResponseTime: 0
        }
      },
      
      // AI configuration
      ai: {
        provider: 'hf',
        model: 'stabilityai/stable-diffusion-2',
        token: null,
        imageCache: new Map(),
        generationQueue: []
      },
      
      // UI state
      ui: {
        theme: 'default',
        cardLayout: 'grid',
        animations: true,
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          fontSize: 'medium'
        }
      },
      
      // Performance metrics
      performance: {
        lastRenderTime: 0,
        memoryUsage: 0,
        interactionLatency: []
      }
    };
    
    // Subscribers for reactive updates
    this.subscribers = new Map();
    
    // Performance monitoring
    this.performanceObserver = null;
    this.initPerformanceMonitoring();
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
    
    if (target && target.hasOwnProperty(lastKey)) {
      const oldValue = target[lastKey];
      target[lastKey] = value;
      
      // Notify subscribers of change
      this.notifySubscribers(path, value, oldValue);
      
      // Performance tracking
      this.trackPerformanceChange(path, value, oldValue);
      
      return true;
    }
    return false;
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
      callbacks.forEach(callback => {
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
    updates.forEach(([path, value]) => {
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
            const sum = this.state.performance.interactionLatency.reduce((a, b) => a + b, 0);
            this.state.performance.averageResponseTime = sum / this.state.performance.interactionLatency.length;
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }
  
  // Track performance changes
  trackPerformanceChange(path, newValue, oldValue) {
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
        memoryUsage: this.state.performance.memoryUsage
      }
    };
  }
  
  // Reset state to initial values
  reset() {
    this.state = {
      pao: { currentNumber: null, selectedCard: null, practiceMode: false, difficulty: 'normal' },
      dice: { session: [], currentRoll: null, statistics: { totalRolls: 0, correctRecalls: 0, averageResponseTime: 0 } },
      ai: { provider: 'hf', model: 'stabilityai/stable-diffusion-2', token: null, imageCache: new Map(), generationQueue: [] },
      ui: { theme: 'default', cardLayout: 'grid', animations: true, accessibility: { highContrast: false, reducedMotion: false, fontSize: 'medium' } },
      performance: { lastRenderTime: 0, memoryUsage: 0, interactionLatency: [] }
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