/**
 * Main Application - memorAIzation stAItion
 * Integrates all memory systems with the new architecture
 */

import memoryState from './core/state.js';
import memoryEngine from './core/memory-engine.js';
import aiService from './services/ai-service.js';
import MemoryCard from './components/memory-card.js';
import performanceMonitor from './utils/performance-monitor.js';

class MemorAIzationApp {
  constructor() {
    this.cards = new Map();
    this.isInitialized = false;
    this.performanceMetrics = new Map();
    
    // Initialize the application
    this.init();
  }
  
  // Initialize the application
  async init() {
    const startTime = performance.now();
    
    try {
      console.log('🚀 Initializing memorAIzation stAItion...');
      
      // Initialize memory systems
      await this.initializeMemorySystems();
      
      // Set up UI event listeners
      this.setupUI();
      
      // Load initial data
      await this.loadInitialData();
      
      // Render the application
      this.render();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      // Mark as initialized
      this.isInitialized = true;
      
      const endTime = performance.now();
      console.log(`✅ Initialization complete in ${(endTime - startTime).toFixed(2)}ms`);
      
      // Record performance
      this.recordPerformance('app.init', endTime - startTime);
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleError(error);
    }
  }
  
  // Initialize memory systems
  async initializeMemorySystems() {
    console.log('🧠 Initializing memory systems...');
    
    // Initialize PAO system
    const paoResult = await memoryEngine.initPAOSystem();
    if (paoResult.success) {
      console.log(`✅ PAO system initialized with ${paoResult.count} entries`);
    } else {
      console.warn('⚠️ PAO system initialization failed:', paoResult.error);
    }
    
    // Initialize Peg system
    const pegResult = await memoryEngine.initPegSystem();
    if (pegResult.success) {
      console.log(`✅ Peg system initialized with ${pegResult.count} entries`);
    } else {
      console.warn('⚠️ Peg system initialization failed:', pegResult.error);
    }
    
    // Initialize Major system
    const majorResult = memoryEngine.initMajorSystem();
    if (majorResult.success) {
      console.log('✅ Major system initialized');
    } else {
      console.warn('⚠️ Major system initialization failed:', majorResult.error);
    }
    
    // Set PAO as active system
    memoryEngine.setActiveSystem('pao');
  }
  
  // Set up UI event listeners
  setupUI() {
    // AI configuration controls
    this.setupAIControls();
    
    // Theme and accessibility controls
    this.setupThemeControls();
    
    // Performance monitoring
    this.setupPerformanceMonitoring();
    
    // Dice statistics
    this.setupDiceStatistics();
  }
  
  // Set up AI controls
  setupAIControls() {
    const providerSelect = document.getElementById('ai-provider');
    const modelInput = document.getElementById('ai-model');
    const saveBtn = document.getElementById('save-ai-config');
    
    if (providerSelect && modelInput && saveBtn) {
      // Set current values
      providerSelect.value = memoryState.get('ai.provider');
      modelInput.value = memoryState.get('ai.model');
      
      // Handle provider change
      providerSelect.addEventListener('change', (e) => {
        memoryState.set('ai.provider', e.target.value);
      });
      
      // Handle save
      saveBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const model = modelInput.value.trim() || 'stabilityai/stable-diffusion-2';
        
        memoryState.batch([
          ['ai.provider', provider],
          ['ai.model', model]
        ]);
        
        // Show feedback
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save';
        }, 1000);
      });
    }
  }
  
  // Set up theme controls
  setupThemeControls() {
    // Monitor theme changes
    memoryState.subscribe('ui.theme', (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    });
    
    // Monitor accessibility changes
    memoryState.subscribe('ui.accessibility', (settings) => {
      this.updateAccessibilityStyles(settings);
    });
    
    // Monitor animation settings
    memoryState.subscribe('ui.animations', (enabled) => {
      this.updateAnimationState(enabled);
    });
  }
  
  // Set up dice statistics
  setupDiceStatistics() {
    // Monitor dice statistics
    memoryState.subscribe('dice.statistics', (stats) => {
      this.updateDiceStatistics(stats);
    });
    
    // Monitor dice session
    memoryState.subscribe('dice.session', (session) => {
      this.updateDiceSession(session);
    });
  }
  
  // Update dice statistics display
  updateDiceStatistics(stats) {
    const diceStatsEl = document.getElementById('dice-stats');
    if (!diceStatsEl || !stats) return;
    
    let html = '';
    
    if (stats.totalRolls > 0) {
      html += `<div>Total Rolls: ${stats.totalRolls}</div>`;
      html += `<div>Average Response: ${stats.averageResponseTime.toFixed(2)}ms</div>`;
      
      if (stats.correctRecalls > 0) {
        const accuracy = ((stats.correctRecalls / stats.totalRolls) * 100).toFixed(1);
        html += `<div>Accuracy: ${accuracy}%</div>`;
      }
    }
    
    diceStatsEl.innerHTML = html;
  }
  
  // Update dice session display
  updateDiceSession(session) {
    if (!session || session.length === 0) return;
    
    // Update session modal if it's open
    const modalList = document.getElementById('session-list');
    if (modalList && !modalList.parentElement.classList.contains('hidden')) {
      this.renderDiceSession(session);
    }
  }
  
  // Render dice session in modal
  renderDiceSession(session) {
    const modalList = document.getElementById('session-list');
    if (!modalList) return;
    
    modalList.innerHTML = '';
    session.slice(-20).reverse().forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${new Date(item.timestamp).toLocaleTimeString()} – ${String(item.twoDigit).padStart(2,'0')} (${item.rolls.join(',')})`;
      modalList.appendChild(li);
    });
  }
  
  // Update accessibility styles
  updateAccessibilityStyles(settings) {
    const { highContrast, reducedMotion, fontSize } = settings;
    
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    if (reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    
    if (fontSize) {
      document.documentElement.style.setProperty('--base-font-size', fontSize);
    }
  }
  
  // Update animation state
  updateAnimationState(enabled) {
    if (enabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
  }
  
  // Set up performance monitoring
  setupPerformanceMonitoring() {
    // Monitor performance metrics
    memoryState.subscribe('performance.analysis', (analysis) => {
      this.updatePerformanceDisplay(analysis);
    });
    
    // Monitor AI service stats
    memoryState.subscribe('ai.cacheStats', (stats) => {
      this.updateAIDisplay(stats);
    });
  }
  
  // Update performance display
  updatePerformanceDisplay(analysis) {
    // This would update a performance dashboard if we had one
    if (analysis && Object.keys(analysis).length > 0) {
      console.log('📊 Performance Analysis:', analysis);
    }
  }
  
  // Update AI display
  updateAIDisplay(stats) {
    if (stats && stats.total > 0) {
      const hitRate = ((stats.hits / stats.total) * 100).toFixed(1);
      console.log(`🤖 AI Cache Hit Rate: ${hitRate}% (${stats.hits}/${stats.total})`);
    }
  }
  
  // Load initial data
  async loadInitialData() {
    console.log('📁 Loading initial data...');
    
    try {
      // Load image manifest
      const manifestResponse = await fetch('data/images/manifest.json').catch(() => null);
      if (manifestResponse && manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        memoryState.set('imageManifest', manifest);
        console.log(`✅ Image manifest loaded with ${Object.keys(manifest).length} entries`);
      }
      
      // Load dice session from localStorage
      const diceSession = localStorage.getItem('dice-session');
      if (diceSession) {
        try {
          const session = JSON.parse(diceSession);
          memoryState.set('dice.session', session);
          console.log(`✅ Dice session loaded with ${session.length} entries`);
        } catch (e) {
          console.warn('⚠️ Failed to parse dice session from localStorage');
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to load some initial data:', error);
    }
  }
  
  // Render the application
  render() {
    console.log('🎨 Rendering application...');
    
    try {
      // Get PAO data
      const paoData = memoryState.get('pao.data');
      if (!paoData) {
        console.warn('⚠️ No PAO data available for rendering');
        return;
      }
      
      // Clear existing cards
      this.clearCards();
      
      // Create and render cards
      Object.values(paoData).forEach(entry => {
        const card = new MemoryCard(entry, {
          enableAnimations: memoryState.get('ui.animations'),
          enableAI: true,
          enableAccessibility: true
        });
        
        this.cards.set(entry.number, card);
        
        // Add to DOM
        const container = document.getElementById('card-container');
        if (container) {
          container.appendChild(card.getElement());
        }
      });
      
      console.log(`✅ Rendered ${this.cards.size} memory cards`);
      
    } catch (error) {
      console.error('❌ Failed to render application:', error);
      this.handleError(error);
    }
  }
  
  // Clear all cards
  clearCards() {
    this.cards.forEach(card => card.destroy());
    this.cards.clear();
    
    const container = document.getElementById('card-container');
    if (container) {
      container.innerHTML = '';
    }
  }
  
  // Handle errors gracefully
  handleError(error) {
    console.error('Application error:', error);
    
    // Show error message to user
    this.showErrorMessage('An error occurred while loading the application. Please refresh the page.');
    
    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  // Show error message to user
  showErrorMessage(message) {
    // Create error banner
    const errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Add to page
    document.body.insertBefore(errorBanner, document.body.firstChild);
  }
  
  // Record performance metrics
  recordPerformance(operation, duration) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation);
    metrics.push(duration);
    
    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.shift();
    }
  }
  
  // Get application statistics
  getStats() {
    return {
      isInitialized: this.isInitialized,
      cardCount: this.cards.size,
      memorySystems: memoryEngine.getAvailableSystems(),
      aiStats: aiService.getStats(),
      performance: this.performanceMetrics ? Object.fromEntries(this.performanceMetrics) : {}
    };
  }
  
  // Refresh the application
  async refresh() {
    console.log('🔄 Refreshing application...');
    
    try {
      // Clear current state
      this.clearCards();
      
      // Reload data
      await this.loadInitialData();
      
      // Re-render
      this.render();
      
      console.log('✅ Application refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh application:', error);
      this.handleError(error);
    }
  }
  
  // Cleanup
  destroy() {
    // Clear cards
    this.clearCards();
    
    // Clear performance metrics
    this.performanceMetrics.clear();
    
    // Mark as not initialized
    this.isInitialized = false;
    
    console.log('🧹 Application cleaned up');
  }
}

// Create and export the application instance
const app = new MemorAIzationApp();

// Export for use in other modules
export default app;

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.memorAIzationApp = app;
}