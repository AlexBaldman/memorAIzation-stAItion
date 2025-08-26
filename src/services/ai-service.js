/**
 * Advanced AI Service for memorAIzation stAItion
 * Implements intelligent caching, queue management, and fallback strategies
 * Following John Carmack's principles of robust error handling and performance
 */

import memoryState from '../core/state.js';

class AIService {
  constructor() {
    this.providers = new Map();
    this.imageCache = new Map();
    this.generationQueue = [];
    this.isProcessing = false;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    // Initialize providers
    this.initProviders();
    
    // Start queue processor
    this.processQueue();
    
    // Performance monitoring
    this.startPerformanceMonitoring();
  }
  
  // Initialize AI providers
  initProviders() {
    // Hugging Face provider
    this.providers.set('hf', {
      name: 'Hugging Face',
      generate: (prompt, options = {}) => this.generateHF(
        prompt,
        options.model || memoryState.get('ai.model') || 'stabilityai/stable-diffusion-2'
      ),
      priority: 1,
      cost: 'low',
      rateLimit: 1000, // ms between requests
      lastRequest: 0
    });
    
    // Qwen demo provider (on HF)
    this.providers.set('qwen', {
      name: 'Qwen Demo',
      generate: (prompt, options = {}) => this.generateQwen(prompt, options),
      priority: 2,
      cost: 'free',
      rateLimit: 2000,
      lastRequest: 0
    });
    
    // Pollinations (no token) fallback
    this.providers.set('pollinations', {
      name: 'Pollinations',
      generate: (prompt) => this.generatePollinations(prompt),
      priority: 9,
      cost: 'free',
      rateLimit: 500,
      lastRequest: 0
    });
    
    // Local provider (placeholder for future)
    this.providers.set('local', {
      name: 'Local Model',
      generate: (prompt) => this.generateLocal(prompt),
      priority: 10,
      cost: 'none',
      rateLimit: 0,
      lastRequest: 0
    });
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
        return { success: true, image: cached, source: 'cache', responseTime: 0 };
      }
      
      // Add to generation queue
      const queueItem = {
        id: this.generateQueueId(),
        prompt,
        options,
        timestamp: Date.now(),
        priority: options.priority || 'normal',
        retries: 0
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
    // Insert based on priority
    if (item.priority === 'high') {
      this.generationQueue.unshift(item);
    } else {
      this.generationQueue.push(item);
    }
    
    // Update state
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
        // Update state
        memoryState.set('ai.currentGeneration', item);
        memoryState.set('ai.queueLength', this.generationQueue.length);
        
        // Generate image
        const result = await this.processGenerationItem(item);
        
        // Store result
        this.storeGenerationResult(item.id, result);
        
        // Update cache if successful
        if (result.success) {
          const cacheKey = this.generateCacheKey(item.prompt, item.options);
          this.imageCache.set(cacheKey, result.image);
          this.updateCacheStats(cacheKey, false);
        }
        
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        
        // Retry logic
        if (item.retries < this.maxRetries) {
          item.retries++;
          item.timestamp = Date.now();
          this.addToQueue(item);
        } else {
          // Mark as failed
          this.storeGenerationResult(item.id, { success: false, error: 'Max retries exceeded' });
        }
      }
    }
    
    this.isProcessing = false;
    memoryState.set('ai.currentGeneration', null);
  }
  
  // Process individual generation item
  async processGenerationItem(item) {
    const { prompt, options } = item;
    
    // Select best available provider
    let provider = this.selectProvider(options);
    
    if (!provider) {
      throw new Error('No available AI providers');
    }
    
    // Check rate limiting and try alternate if needed
    if (!this.checkRateLimit(provider)) {
      const altProvider = this.selectProvider(options, provider.name);
      if (altProvider && this.checkRateLimit(altProvider)) {
        provider = altProvider;
      } else {
        throw new Error('All providers rate limited');
      }
    }
    
    // Generate image
    const result = await provider.generate(prompt, options);
    
    // Update provider stats
    this.updateProviderStats(provider.name, result.success);
    
    return result;
  }
  
  // Select best available provider
  selectProvider(options, excludeName = null) {
    const now = Date.now();
    const isAvailable = (p) => (now - p.lastRequest) >= p.rateLimit && p.name !== excludeName;
    
    // Prefer explicitly selected provider when available
    const preferredKey = memoryState.get('ai.provider') || 'hf';
    const preferred = this.providers.get(preferredKey);
    if (preferred && isAvailable(preferred)) {
      return preferred;
    }
    
    // Fallback: choose next by priority
    const available = Array.from(this.providers.values())
      .filter(isAvailable)
      .sort((a, b) => a.priority - b.priority
    
    if (options && options.allowFallback) {
      const available = Array.from(this.providers.values())
        .filter(p => p.name !== excludeName)
        .sort((a, b) => a.priority - b.priority);
      return available[0] || null;
    }
    
    return null;
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
  
  // Hugging Face generation
  async generateHF(prompt, model = 'stabilityai/stable-diffusion-2') {
    const token = memoryState.get('ai.token')
      || (typeof localStorage !== 'undefined' ? localStorage.getItem('ai-token') : null)
      || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_HF_TOKEN : null);
    
    if (!token) {
      throw new Error('Hugging Face token not configured');
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });
    
    if (!response.ok) {
      throw new Error(`HF request failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    return { success: true, image: blob, provider: 'hf', model };
  }
  
  // Qwen demo generation
  async generateQwen(prompt, options = {}) {
    const token = memoryState.get('ai.token')
      || (typeof localStorage !== 'undefined' ? localStorage.getItem('ai-token') : null)
      || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_HF_TOKEN : null);
    
    if (!token) {
      throw new Error('Hugging Face token not configured for Qwen');
    }
    
    const body = {
      inputs: prompt,
      ...(options.parameters ? { parameters: options.parameters } : {})
    };
    
    const response = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen-Image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Qwen request failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    return { success: true, image: blob, provider: 'qwen' };
  }
  
  // Pollinations image generation (no token)
  async generatePollinations(prompt) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Pollinations request failed: ${response.status}`);
    }
    const blob = await response.blob();
    return { success: true, image: blob, provider: 'pollinations' };
  }
  
  // Local generation (placeholder)
  async generateLocal(prompt) {
    // This would integrate with local models like Stable Diffusion
    throw new Error('Local generation not yet implemented');
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
    
    // Clean up old results
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
    // Unicode-safe base64 encoding
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
    
    // Update state
    memoryState.set('ai.cacheStats', this.cacheStats);
  }
  
  // Update provider statistics
  updateProviderStats(providerName, success) {
    if (!this.providerStats) {
      this.providerStats = new Map();
    }
    
    if (!this.providerStats.has(providerName)) {
      this.providerStats.set(providerName, { requests: 0, successes: 0, failures: 0 });
    }
    
    const stats = this.providerStats.get(providerName);
    stats.requests++;
    
    if (success) {
      stats.successes++;
    } else {
      stats.failures++;
    }
    
    // Update state
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
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    // Update state
    memoryState.set('ai.performanceMetrics', Object.fromEntries(this.performanceMetrics));
  }
  
  // Start performance monitoring
  startPerformanceMonitoring() {
    // Monitor queue processing
    setInterval(() => {
      this.processQueue();
    }, 1000);
    
    // Monitor cache performance
    setInterval(() => {
      this.analyzeCachePerformance();
    }, 30000);
  }
  
  // Analyze cache performance
  analyzeCachePerformance() {
    if (this.cacheStats && this.cacheStats.total > 0) {
      const hitRate = this.cacheStats.hits / this.cacheStats.total;
      memoryState.set('ai.cacheHitRate', hitRate);
      
      // Adjust cache size based on performance
      if (hitRate < 0.3 && this.imageCache.size > 50) {
        // Reduce cache size if hit rate is low
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
      providerStats: this.providerStats,
      performanceMetrics: this.performanceMetrics
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
