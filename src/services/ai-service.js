/**
 * Advanced AI Service for memorAIzation stAItion
 * Implements intelligent caching, queue management, and fallback strategies
 * Now driven by external configuration for maximum flexibility.
 */

import memoryState from '../core/state.js';
import providerConfig from '../../config/ai-providers.json';

class AIService {
  constructor() {
    this.providers = new Map();
    this.imageCache = new Map();
    this.generationQueue = [];
    this.isProcessing = false;
    this.retryAttempts = new Map();
    this.maxRetries = 3;

    this._loadProviders();
    this.processQueue();
    this.startPerformanceMonitoring();
  }

  // Load providers from the external configuration file
  _loadProviders() {
    providerConfig.providers.forEach(provider => {
      if (provider.enabled) {
        this.providers.set(provider.id, {
          ...provider,
          generate: (prompt, options = {}) => this._generateFromProvider(prompt, provider, options),
          lastRequest: 0,
        });
      }
    });
  }

  // Get API token from various sources
  _getToken(provider) {
    const tokenVar = provider.api?.token_env_var;
    if (!tokenVar) return null;

    // 1. Check memory state (e.g., set via UI)
    const stateToken = memoryState.get(`ai.tokens.${provider.id}`);
    if (stateToken) return stateToken;

    // 2. Check localStorage
    if (typeof localStorage !== 'undefined') {
        const localToken = localStorage.getItem(`ai-token-${provider.id}`);
        if (localToken) return localToken;
    }

    // 3. Check environment variables (Vite-style)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        const envToken = import.meta.env[tokenVar];
        if (envToken) return envToken;
    }

    return null;
  }

  // Generic image generation function based on provider config
  async _generateFromProvider(prompt, provider, options = {}) {
    const token = this._getToken(provider);
    if (provider.api.token_env_var && !token) {
        throw new Error(`API token for ${provider.name} not configured. Please set ${provider.api.token_env_var}.`);
    }

    const model = options.model || memoryState.get('ai.model') || provider.api.defaultModel;
    let url = provider.api.url.replace('{model}', model).replace('{prompt}', encodeURIComponent(prompt));

    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const body = provider.api.body || { inputs: prompt };
    if(options.parameters) {
        body.parameters = options.parameters;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`${provider.name} request failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return { success: true, image: blob, provider: provider.id, model };
  }

  // Generate image with intelligent provider selection
  async generateImage(prompt, options = {}) {
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(prompt, options);
      const cached = this.imageCache.get(cacheKey);

      if (cached && !options.forceRefresh) {
        // Update cache hit statistics
        this.updateCacheStats(cacheKey, true);
        return {
          success: true,
          image: cached,
          source: 'cache',
          responseTime: 0,
        };
      }

      // Add to generation queue
      const queueItem = {
        id: this.generateQueueId(),
        prompt,
        options,
        timestamp: Date.now(),
        priority: options.priority || 'normal',
        retries: 0,
      };

      this.addToQueue(queueItem);

      // Wait for generation to complete
      const result = await this.waitForGeneration(queueItem.id);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Update performance metrics
      this.recordPerformance('generate', responseTime);

      return { ...result, responseTime };
    } catch (error) {
      console.error('Image generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Add item to generation queue
  addToQueue(item) {
    if (item.priority === 'high') {
      this.generationQueue.unshift(item);
    } else {
      this.generationQueue.push(item);
    }
    memoryState.set('ai.queueLength', this.generationQueue.length);
  }

  // Process generation queue
  async processQueue() {
    if (this.isProcessing || this.generationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.generationQueue.length > 0) {
      const item = this.generationQueue.shift();

      try {
        memoryState.set('ai.currentGeneration', item);
        memoryState.set('ai.queueLength', this.generationQueue.length);

        const result = await this.processGenerationItem(item);

        this.storeGenerationResult(item.id, result);

        if (result.success) {
          const cacheKey = this.generateCacheKey(item.prompt, item.options);
          this.imageCache.set(cacheKey, result.image);
          this.updateCacheStats(cacheKey, false);
        }
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);

        if (item.retries < this.maxRetries) {
          item.retries++;
          item.timestamp = Date.now();
          this.addToQueue(item);
        } else {
          this.storeGenerationResult(item.id, {
            success: false,
            error: 'Max retries exceeded',
          });
        }
      }
    }

    this.isProcessing = false;
    memoryState.set('ai.currentGeneration', null);
  }

  // Process individual generation item
  async processGenerationItem(item) {
    const { prompt, options } = item;

    let provider = this.selectProvider(options);

    if (!provider) {
      throw new Error('No available AI providers');
    }

    if (!this.checkRateLimit(provider)) {
      const altProvider = this.selectProvider(options, provider.id);
      if (altProvider && this.checkRateLimit(altProvider)) {
        provider = altProvider;
      } else {
        throw new Error('All providers rate limited');
      }
    }

    const result = await provider.generate(prompt, options);
    this.updateProviderStats(provider.name, result.success);
    return result;
  }

  // Select best available provider
  selectProvider(options, excludeId = null) {
    const now = Date.now();
    const isAvailable = (p) =>
      now - p.lastRequest >= p.rateLimit && p.id !== excludeId;

    const preferredKey = memoryState.get('ai.provider') || 'hf';
    const preferred = this.providers.get(preferredKey);
    if (preferred && isAvailable(preferred)) {
      return preferred;
    }

    const available = Array.from(this.providers.values())
      .filter(isAvailable)
      .sort((a, b) => a.priority - b.priority);

    return available[0] || null;
  }

  // Check provider rate limiting
  checkRateLimit(provider) {
    const now = Date.now();
    const timeSinceLast = now - provider.lastRequest;

    if (timeSinceLast >= provider.rateLimit) {
      provider.lastRequest = now;
      return true;
    }

    return false;
  }

  // Wait for generation to complete
  waitForGeneration(id, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkResult = () => {
        const result = this.getGenerationResult(id);
        if (result) {
          resolve(result);
          return;
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error('Generation timeout'));
          return;
        }
        setTimeout(checkResult, 100);
      };
      checkResult();
    });
  }

  // Store generation result
  storeGenerationResult(id, result) {
    if (!this.generationResults) {
      this.generationResults = new Map();
    }
    this.generationResults.set(id, result);

    if (this.generationResults.size > 100) {
      const oldestKey = this.generationResults.keys().next().value;
      this.generationResults.delete(oldestKey);
    }
  }

  // Get generation result
  getGenerationResult(id) {
    return this.generationResults?.get(id) || null;
  }

  // Generate cache key
  generateCacheKey(prompt, options) {
    const key = `${prompt}_${JSON.stringify(options)}`;
    const bytes = new TextEncoder().encode(key);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).slice(0, 32);
  }

  // Generate queue ID
  generateQueueId() {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update cache statistics
  updateCacheStats(key, isHit) {
    if (!this.cacheStats) {
      this.cacheStats = { hits: 0, misses: 0, total: 0 };
    }
    this.cacheStats.total++;
    if (isHit) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
    memoryState.set('ai.cacheStats', this.cacheStats);
  }

  // Update provider statistics
  updateProviderStats(providerName, success) {
    if (!this.providerStats) {
      this.providerStats = new Map();
    }
    if (!this.providerStats.has(providerName)) {
      this.providerStats.set(providerName, {
        requests: 0,
        successes: 0,
        failures: 0,
      });
    }
    const stats = this.providerStats.get(providerName);
    stats.requests++;
    if (success) {
      stats.successes++;
    } else {
      stats.failures++;
    }
    memoryState.set('ai.providerStats', Object.fromEntries(this.providerStats));
  }

  // Record performance metrics
  recordPerformance(operation, duration) {
    if (!this.performanceMetrics) {
      this.performanceMetrics = new Map();
    }
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    const metrics = this.performanceMetrics.get(operation);
    metrics.push(duration);
    if (metrics.length > 100) {
      metrics.shift();
    }
    memoryState.set('ai.performanceMetrics', Object.fromEntries(this.performanceMetrics));
  }

  // Start performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      this.processQueue();
    }, 1000);
    setInterval(() => {
      this.analyzeCachePerformance();
    }, 30000);
  }

  // Analyze cache performance
  analyzeCachePerformance() {
    if (this.cacheStats && this.cacheStats.total > 0) {
      const hitRate = this.cacheStats.hits / this.cacheStats.total;
      memoryState.set('ai.cacheHitRate', hitRate);

      if (hitRate < 0.3 && this.imageCache.size > 50) {
        const entries = Array.from(this.imageCache.entries());
        const toRemove = Math.floor(entries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
          this.imageCache.delete(entries[i][0]);
        }
      }
    }
  }

  // Get service statistics
  getStats() {
    return {
      queueLength: this.generationQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: this.imageCache.size,
      cacheStats: this.cacheStats,
      providerStats: this.providerStats ? Object.fromEntries(this.providerStats) : {},
      performanceMetrics: this.performanceMetrics ? Object.fromEntries(this.performanceMetrics) : {},
    };
  }

  // Clear cache
  clearCache() {
    this.imageCache.clear();
    this.cacheStats = { hits: 0, misses: 0, total: 0 };
    memoryState.set('ai.cacheStats', this.cacheStats);
  }

  // Cleanup
  destroy() {
    this.imageCache.clear();
    this.generationQueue = [];
    this.generationResults?.clear();
    this.providerStats?.clear();
    this.performanceMetrics?.clear();
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;
