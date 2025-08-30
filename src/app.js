/**
 * Main Application - memorAIzation stAItion
 * Integrates all memory systems with the new architecture
 */

import memoryState from './core/state.js';
import memoryEngine from './core/memory-engine.js';
import aiService from './services/ai-service.js';
import MemoryCard from './components/memory-card.js';
import { initDicePracticeComponent } from './components/dice-practice.js';
import { initPegBoardComponent } from './components/peg-board.js';
import { initThemeBuilderComponent } from './components/theme-builder.js';

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
      console.log(
        `✅ Initialization complete in ${(endTime - startTime).toFixed(2)}ms`
      );

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
    // Initialize UI components
    initDicePracticeComponent();
    initPegBoardComponent();
    initThemeBuilderComponent();

    // AI configuration controls
    this.setupAIControls();

    // Theme and accessibility controls
    this.setupThemeControls();

    // Performance monitoring
    this.setupPerformanceMonitoring();

    // Dice statistics
    this.setupDiceStatistics();

    // Toggle practice mode
    const toggleBtn = document.getElementById('toggle-practice-mode-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const currentMode = memoryState.get('pao.practiceMode');
        const newMode = currentMode === 'normal' ? 'reverse' : 'normal';
        memoryState.set('pao.practiceMode', newMode);
        toggleBtn.textContent =
          newMode === 'normal' ? 'Reverse Mode' : 'Normal Mode';
      });
    }

    // Start challenge
    const startChallengeBtn = document.getElementById('start-challenge-btn');
    if (startChallengeBtn) {
      startChallengeBtn.addEventListener('click', () => {
        this.startChallenge();
      });
    }

    // Performance toggle
    const performanceToggle = document.getElementById('performance-toggle');
    const performanceDashboard = document.getElementById(
      'performance-dashboard'
    );
    if (performanceToggle && performanceDashboard) {
      performanceToggle.addEventListener('click', () => {
        performanceDashboard.classList.toggle('hidden');
        performanceToggle.textContent = performanceDashboard.classList.contains(
          'hidden'
        )
          ? 'Show Performance'
          : 'Hide Performance';
      });
    }

    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const isOpen = !mobileMenu.classList.contains('hidden');
        hamburgerBtn.setAttribute('aria-expanded', isOpen);
      });
    }
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
        try {
          localStorage.setItem('ai-provider', e.target.value);
        } catch (error) {
          console.warn('Failed to save AI provider to localStorage', error);
        }
      });

      // Handle save
      saveBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const model =
          modelInput.value.trim() || 'stabilityai/stable-diffusion-2';

        memoryState.batch([
          ['ai.provider', provider],
          ['ai.model', model],
        ]);
        try {
          localStorage.setItem('ai-provider', provider);
          localStorage.setItem('ai-model', model);
        } catch (error) {
          console.warn('Failed to save AI config to localStorage', error);
        }

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
        const accuracy = (
          (stats.correctRecalls / stats.totalRolls) *
          100
        ).toFixed(1);
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
    session
      .slice(-20)
      .reverse()
      .forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${new Date(item.timestamp).toLocaleTimeString()} – ${String(item.twoDigit).padStart(2, '0')} (${item.rolls.join(',')})`;
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
      console.log(
        `🤖 AI Cache Hit Rate: ${hitRate}% (${stats.hits}/${stats.total})`
      );
    }
  }

  // Load initial data
  async loadInitialData() {
    console.log('📁 Loading initial data...');

    try {
      // Load image manifest
      const manifestResponse = await fetch('data/images/manifest.json').catch(
        () => null
      );
      if (manifestResponse && manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        memoryState.set('imageManifest', manifest);
        console.log(
          `✅ Image manifest loaded with ${Object.keys(manifest).length} entries`
        );
      }

      // Load dice session from localStorage
      const diceSession = localStorage.getItem('dice-session');
      if (diceSession) {
        try {
          const session = JSON.parse(diceSession);
          memoryState.set('dice.session', session);
          console.log(`✅ Dice session loaded with ${session.length} entries`);
        } catch {
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
      Object.values(paoData).forEach((entry) => {
        const card = new MemoryCard(entry, {
          enableAnimations: memoryState.get('ui.animations'),
          enableAI: true,
          enableAccessibility: true,
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
    this.cards.forEach((card) => card.destroy());
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
    this.showErrorMessage(
      'An error occurred while loading the application. Please refresh the page.'
    );

    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
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
      performance: this.performanceMetrics
        ? Object.fromEntries(this.performanceMetrics)
        : {},
    };
  }

  // Update AI configuration (from UI)
  updateAIConfig({ provider, model, token } = {}) {
    const updates = [];
    if (provider) updates.push(['ai.provider', provider]);
    if (model) updates.push(['ai.model', model]);
    if (token) updates.push(['ai.token', token]);
    if (updates.length > 0) {
      memoryState.batch(updates);
    }
  }

  // Generate images for cards without images/cached entries
  async generateMissingImages() {
    const paoData = memoryState.get('pao.data');
    if (!paoData) return;
    const manifest = memoryState.get('imageManifest') || {};

    const entries = Object.values(paoData);
    for (const entry of entries) {
      const hasManifest =
        manifest[entry.number] && manifest[entry.number].length > 0;
      const card = this.cards.get(entry.number);
      const hasCached = card
        ?.getElement()
        ?.querySelector('[data-card-image]')?.src;
      if (hasManifest || hasCached) continue;

      const parts = [];
      if (entry.name) parts.push(entry.name);
      if (entry.emoji) parts.push(entry.emoji);
      if (entry.action) parts.push(`doing ${entry.action}`);
      if (entry.object) parts.push(`with ${entry.object}`);
      const prompt =
        `High-resolution portrait photo of ${parts.join(' ')}`.trim();
      try {
        const provider = memoryState.get('ai.provider');
        const options = { priority: 'normal' };
        if (provider === 'qwen') {
          options.parameters = { num_inference_steps: 8 };
        }
        const res = await aiService.generateImage(prompt, options);

        if (res.success && card) {
          const imgEl = card.getElement().querySelector('[data-card-image]');
          if (imgEl) {
            const url = URL.createObjectURL(res.image);
            imgEl.src = url;
          }
        }
      } catch (e) {
        console.warn(`Batch generation failed for ${entry.number}:`, e);
      }
    }
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

  startChallenge() {
    let timeLeft = 60;
    let score = 0;
    const timerEl = document.getElementById('timer');
    const rollBtn = document.getElementById('roll-btn');
    const resultEl = document.getElementById('roll-result');

    const timerInterval = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (timeLeft % 60).toString().padStart(2, '0');
      timerEl.textContent = `${minutes}:${seconds}`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert(`Challenge finished! Your score is ${score}`);
        rollBtn.disabled = false;
      }
    }, 1000);

    rollBtn.disabled = true;

    const challengeRollBtn = document.createElement('button');
    challengeRollBtn.textContent = 'Roll';
    challengeRollBtn.className =
      'px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded';
    resultEl.appendChild(challengeRollBtn);

    challengeRollBtn.addEventListener('click', () => {
      const rolls = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ];
      const twoDigit = rolls[0] * 10 + rolls[1];
      const result = memoryEngine.practicePAO(twoDigit.toString());

      const answer = prompt(`What is the person for ${twoDigit}?`);
      if (answer && answer.toLowerCase() === result.result.name.toLowerCase()) {
        score++;
        resultEl.textContent = `Correct! Score: ${score}`;
      } else {
        resultEl.textContent = `Wrong! The correct answer is ${result.result.name}. Score: ${score}`;
      }
    });
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
