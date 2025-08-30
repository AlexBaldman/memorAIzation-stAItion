/**
 * High-Performance Memory Card Component
 * Implements virtual scrolling, efficient rendering, and accessibility
 * Following John Carmack's principles of minimal overhead and clear data flow
 */

import memoryState from '../core/state.js';
import aiService from '../services/ai-service.js';
import memoryEngine from '../core/memory-engine.js';

class MemoryCard {
  constructor(data, options = {}) {
    this.data = data;
    this.options = {
      enableAnimations: true,
      enableAI: true,
      enableAccessibility: true,
      ...options,
    };

    this.element = null;
    this.isFlipped = false;
    this.isLoading = false;
    this.imageCache = new Map();
    this.observers = new Map();

    // Performance tracking
    this.renderTime = 0;
    this.interactionCount = 0;

    // Initialize component
    this.init();
  }

  // Initialize the card component
  init() {
    const startTime = performance.now();

    try {
      // Create DOM element
      this.element = this.createElement();

      // Set up event listeners
      this.setupEventListeners();

      // Set up accessibility
      if (this.options.enableAccessibility) {
        this.setupAccessibility();
      }

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Initial render
      this.render();

      const endTime = performance.now();
      this.renderTime = endTime - startTime;

      // Record performance
      this.recordPerformance('init', this.renderTime);
    } catch (error) {
      console.error('Failed to initialize MemoryCard:', error);
      this.handleError(error);
    }
  }

  // Create the card DOM element
  createElement() {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.setAttribute('data-card-id', this.data.number);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    // Set up card structure
    card.innerHTML = `
      <div class="card-inner" data-card-inner>
        <div class="card-face card-front" data-card-front>
          <div class="card-header">
            <span class="card-number" data-card-number></span>
            <span class="card-initials" data-card-initials></span>
          </div>
          <div class="card-image-container" data-card-image-container>
            <img class="card-image" data-card-image alt="" loading="lazy" />
            <div class="card-image-overlay" data-card-image-overlay>
              <div class="loading-spinner hidden" data-loading-spinner></div>
            </div>
          </div>
          <div class="card-name" data-card-name></div>
          <div class="card-due-date" data-due-date></div>
        </div>
        
        <div class="card-face card-back" data-card-back>
          <div class="card-description" data-card-description></div>
          <div class="card-actions" data-card-actions>
            <button class="btn btn-primary generate-btn" data-generate-btn>
              <span class="btn-text">Generate Image</span>
              <span class="btn-loading hidden">Generating...</span>
            </button>
            <button class="btn btn-secondary edit-btn" data-edit-btn>
              <span class="btn-text">Edit Image</span>
              <span class="btn-loading hidden">Editing...</span>
            </button>
            <button class="btn btn-secondary practice-btn" data-practice-btn>
              <span class="btn-text">Practice</span>
            </button>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // Set up event listeners
  setupEventListeners() {
    // Card flip on click/enter
    this.element.addEventListener('click', (e) => this.handleClick(e));
    this.element.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Image generation
    const generateBtn = this.element.querySelector('[data-generate-btn]');
    if (generateBtn && this.options.enableAI) {
      generateBtn.addEventListener('click', (e) => this.handleGenerateImage(e));
    }

    // Image editing
    const editBtn = this.element.querySelector('[data-edit-btn]');
    if (editBtn && this.options.enableAI) {
      editBtn.addEventListener('click', (e) => this.handleEditImage(e));
    }

    // Image cycling (if multiple images available)
    const imageContainer = this.element.querySelector(
      '[data-card-image-container]'
    );
    if (imageContainer) {
      imageContainer.addEventListener('click', (e) => this.handleImageCycle(e));
    }

    // Practice button
    const practiceBtn = this.element.querySelector('[data-practice-btn]');
    if (practiceBtn) {
      practiceBtn.addEventListener('click', (e) => this.handlePractice(e));
    }

    // Intersection observer for lazy loading
    this.setupIntersectionObserver();
  }

  // Set up accessibility features
  setupAccessibility() {
    // ARIA labels
    this.element.setAttribute(
      'aria-label',
      `Memory card for ${this.data.name}`
    );
    this.element.setAttribute(
      'aria-describedby',
      `card-desc-${this.data.number}`
    );

    // Screen reader support
    const description = this.element.querySelector('[data-card-description]');
    if (description) {
      description.id = `card-desc-${this.data.number}`;
      description.setAttribute('aria-live', 'polite');
    }

    // High contrast support
    this.updateAccessibilityStyles();
  }

  // Set up performance monitoring
  setupPerformanceMonitoring() {
    // Monitor render performance
    this.observeState('ui.animations', (enabled) => {
      this.updateAnimationState(enabled);
    });

    // Monitor accessibility settings
    this.observeState('ui.accessibility', (settings) => {
      this.updateAccessibilityStyles(settings);
    });
  }

  // Set up intersection observer for lazy loading
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadImage();
              this.intersectionObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      this.intersectionObserver.observe(this.element);
    }
  }

  // Render the card content
  render() {
    try {
      // Update card content
      this.updateCardContent();

      // Update card state
      this.updateCardState();

      // Update accessibility
      if (this.options.enableAccessibility) {
        this.updateAccessibilityContent();
      }
    } catch (error) {
      console.error('Failed to render MemoryCard:', error);
      this.handleError(error);
    }
  }

  // Update card content
  updateCardContent() {
    // Update number and initials
    const numberEl = this.element.querySelector('[data-card-number]');
    const initialsEl = this.element.querySelector('[data-card-initials]');

    if (numberEl) numberEl.textContent = this.data.number.padStart(2, '0');
    if (initialsEl) initialsEl.textContent = this.data.initials;

    // Update name
    const nameEl = this.element.querySelector('[data-card-name]');
    if (nameEl) nameEl.textContent = this.data.name;

    // Update description
    const descEl = this.element.querySelector('[data-card-description]');
    if (descEl) {
      descEl.innerHTML = `
        <div class="card-number-display">${this.data.number} = ${this.data.initials}</div>
        <div class="card-person">${this.data.name}</div>
        <div class="card-action">${this.data.action || ''}</div>
        <div class="card-object">${this.data.object || ''}</div>
        ${this.data.emojiStory ? `<div class="card-emoji-story">${this.data.emojiStory}</div>` : ''}
      `;
    }

    // Update due date
    const dueDateEl = this.element.querySelector('[data-due-date]');
    if (dueDateEl) {
      const item = memoryState.get(`pao.data.${this.data.number}`);
      if (item && item.sr && item.sr.dueDate) {
        const dueDate = new Date(item.sr.dueDate);
        const now = new Date();
        if (dueDate <= now) {
          dueDateEl.textContent = `Due: ${dueDate.toLocaleDateString()}`;
          this.element.classList.add('due');
        } else {
          dueDateEl.textContent = `Due: ${dueDate.toLocaleDateString()}`;
          this.element.classList.remove('due');
        }
      } else {
        dueDateEl.textContent = '';
        this.element.classList.remove('due');
      }
    }
  }

  // Update card state
  updateCardState() {
    // Update flip state
    if (this.isFlipped) {
      this.element.classList.add('flipped');
    } else {
      this.element.classList.remove('flipped');
    }

    // Update loading state
    if (this.isLoading) {
      this.element.classList.add('loading');
    } else {
      this.element.classList.remove('loading');
    }
  }

  // Update accessibility content
  updateAccessibilityContent() {
    const front = this.element.querySelector('[data-card-front]');
    const back = this.element.querySelector('[data-card-back]');

    if (front) {
      front.setAttribute('aria-hidden', this.isFlipped);
    }

    if (back) {
      back.setAttribute('aria-hidden', !this.isFlipped);
    }

    // Update ARIA live region
    const description = this.element.querySelector('[data-card-description]');
    if (description) {
      description.setAttribute(
        'aria-label',
        `Card ${this.data.number}: ${this.data.name} ${this.data.action || ''} ${this.data.object || ''}`
      );
    }
  }

  // Load card image
  async loadImage() {
    try {
      const imgEl = this.element.querySelector('[data-card-image]');
      if (!imgEl) return;

      // Check if we have a cached image
      const cachedImage = this.getCachedImage();
      if (cachedImage) {
        imgEl.src = cachedImage;
        imgEl.alt = `${this.data.name} portrait`;
        return;
      }

      // Load from manifest or fallback
      const imageUrl = await this.resolveImageUrl();
      if (imageUrl) {
        imgEl.src = imageUrl;
        imgEl.alt = `${this.data.name} portrait`;

        // Cache the image
        this.cacheImage(imageUrl);
      }
    } catch (error) {
      console.error('Failed to load image:', error);
      this.handleImageError();
    }
  }

  // Resolve image URL from various sources
  async resolveImageUrl() {
    // Check local manifest first
    const manifest = memoryState.get('imageManifest');
    if (manifest && manifest[this.data.number]) {
      const images = manifest[this.data.number];
      if (images && images.length > 0) {
        return images[0]; // Return first image
      }
    }

    // Fallback to data imageUrl
    if (this.data.imageUrl) {
      return this.data.imageUrl;
    }

    return null;
  }

  // Get cached image
  getCachedImage() {
    return this.imageCache.get(this.data.number);
  }

  // Cache image
  cacheImage(url) {
    this.imageCache.set(this.data.number, url);

    // Limit cache size
    if (this.imageCache.size > 20) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
  }

  // Handle card click
  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // Don't flip if clicking on buttons
    if (e.target.closest('[data-card-actions]')) {
      return;
    }

    this.flip();
  }

  // Handle keyboard navigation
  handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.flip();
    }
  }

  // Flip the card
  flip() {
    const startTime = performance.now();

    this.isFlipped = !this.isFlipped;
    this.updateCardState();

    // Update accessibility
    if (this.options.enableAccessibility) {
      this.updateAccessibilityContent();
    }

    // Record interaction
    this.interactionCount++;
    this.recordPerformance('flip', performance.now() - startTime);

    // Notify state change
    memoryState.set(
      'pao.selectedCard',
      this.isFlipped ? this.data.number : null
    );
  }

  // Handle image generation
  async handleGenerateImage(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.isLoading) return;

    try {
      this.setLoading(true);

      const prompt = `High-resolution portrait photo of ${this.data.name} ${this.data.emoji || ''}`;
      const result = await aiService.generateImage(prompt, {
        priority: 'normal',
      });

      if (result.success) {
        // Update image
        const imgEl = this.element.querySelector('[data-card-image]');
        if (imgEl) {
          const url = URL.createObjectURL(result.image);
          imgEl.src = url;
          this.cacheImage(url);
        }

        // Show success feedback
        this.showFeedback('Image generated successfully', 'success');
      } else {
        this.showFeedback('Failed to generate image', 'error');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      this.showFeedback('Image generation failed', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  // Handle practice
  handlePractice(e) {
    e.preventDefault();
    e.stopPropagation();

    const quality = window.prompt('Enter quality score (0-5):');
    if (quality === null || quality === '') {
      return;
    }

    const qualityScore = parseInt(quality, 10);
    if (isNaN(qualityScore) || qualityScore < 0 || qualityScore > 5) {
      alert('Invalid quality score. Please enter a number between 0 and 5.');
      return;
    }

    const result = memoryEngine.practice(this.data.number, qualityScore);
    if (result.success) {
      this.showFeedback('Practice recorded successfully', 'success');
      this.render();
    } else {
      this.showFeedback('Failed to record practice', 'error');
    }
  }

  // Handle image editing
  async handleEditImage(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.isLoading) return;

    try {
      const promptInput = window.prompt(
        'Describe your edit (e.g., make pixel-art style, increase contrast):'
      );
      if (!promptInput) return;

      this.setLoading(true);

      const prompt = `${promptInput} — subject: ${this.data.name} ${this.data.emoji || ''}`;
      const result = await aiService.generateImage(prompt, {
        priority: 'high',
      });

      if (result.success) {
        // Update image
        const imgEl = this.element.querySelector('[data-card-image]');
        if (imgEl) {
          const url = URL.createObjectURL(result.image);
          imgEl.src = url;
          this.cacheImage(url);
        }

        this.showFeedback('Image edited successfully', 'success');
      } else {
        this.showFeedback('Failed to edit image', 'error');
      }
    } catch (error) {
      console.error('Image editing failed:', error);
      this.showFeedback('Image editing failed', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  // Handle image cycling
  handleImageCycle(e) {
    e.preventDefault();
    e.stopPropagation();

    const manifest = memoryState.get('imageManifest');
    if (
      !manifest ||
      !manifest[this.data.number] ||
      manifest[this.data.number].length <= 1
    ) {
      return;
    }

    const images = manifest[this.data.number];
    const currentIndex = this.getCurrentImageIndex(images);
    const nextIndex = (currentIndex + 1) % images.length;

    const imgEl = this.element.querySelector('[data-card-image]');
    if (imgEl) {
      imgEl.src = images[nextIndex];
      this.cacheImage(images[nextIndex]);
    }
  }

  // Get current image index
  getCurrentImageIndex(images) {
    const imgEl = this.element.querySelector('[data-card-image]');
    if (!imgEl || !imgEl.src) return 0;

    const currentSrc = imgEl.src;
    return images.findIndex(
      (img) => img === currentSrc || img.endsWith(currentSrc.split('/').pop())
    );
  }

  // Set loading state
  setLoading(loading) {
    this.isLoading = loading;
    this.updateCardState();

    // Update button states
    const generateBtn = this.element.querySelector('[data-generate-btn]');
    const editBtn = this.element.querySelector('[data-edit-btn]');

    if (generateBtn) {
      const text = generateBtn.querySelector('.btn-text');
      const spinner = generateBtn.querySelector('.btn-loading');
      generateBtn.disabled = loading;
      if (text) text.classList.toggle('hidden', loading);
      if (spinner) spinner.classList.toggle('hidden', !loading);
    }

    if (editBtn) {
      const text = editBtn.querySelector('.btn-text');
      const spinner = editBtn.querySelector('.btn-loading');
      editBtn.disabled = loading;
      if (text) text.classList.toggle('hidden', loading);
      if (spinner) spinner.classList.toggle('hidden', !loading);
    }
  }

  // Show feedback message
  showFeedback(message, type = 'info') {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `card-feedback card-feedback-${type}`;
    feedback.textContent = message;

    // Add to card
    this.element.appendChild(feedback);

    // Remove after delay
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  }

  // Update animation state
  updateAnimationState(enabled) {
    if (enabled) {
      this.element.classList.remove('no-animations');
    } else {
      this.element.classList.add('no-animations');
    }
  }

  // Update accessibility styles
  updateAccessibilityStyles(settings = {}) {
    const { highContrast, reducedMotion, fontSize } = settings;

    if (highContrast) {
      this.element.classList.add('high-contrast');
    } else {
      this.element.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      this.element.classList.add('reduced-motion');
    } else {
      this.element.classList.remove('reduced-motion');
    }

    if (fontSize) {
      this.element.style.setProperty('--card-font-size', fontSize);
    }
  }

  // Observe state changes
  observeState(path, callback) {
    const unsubscribe = memoryState.subscribe(path, callback);
    this.observers.set(path, unsubscribe);
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

    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.shift();
    }
  }

  // Handle errors gracefully
  handleError(error) {
    console.error('MemoryCard error:', error);

    // Show error state
    this.element.classList.add('error');

    // Create error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'card-error';
    errorMsg.textContent = 'Failed to load card';
    this.element.appendChild(errorMsg);
  }

  // Handle image loading errors
  handleImageError() {
    const imgEl = this.element.querySelector('[data-card-image]');
    if (imgEl) {
      imgEl.src =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
      imgEl.alt = 'Image not available';
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      renderTime: this.renderTime,
      interactionCount: this.interactionCount,
      metrics: this.performanceMetrics
        ? Object.fromEntries(this.performanceMetrics)
        : {},
    };
  }

  // Get DOM element
  getElement() {
    return this.element;
  }

  // Cleanup
  destroy() {
    // Remove event listeners
    if (this.element) {
      this.element.remove();
    }

    // Unsubscribe from state changes
    this.observers.forEach((unsubscribe) => unsubscribe());
    this.observers.clear();

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Clear caches
    this.imageCache.clear();
    this.performanceMetrics?.clear();
  }
}

export default MemoryCard;
