/**
 * Memory Engine Core - Advanced memorization system implementation
 * Combines cognitive science with performance engineering
 */

import memoryState from './state.js';
import { sm2, createSpacedRepetitionItem } from './spaced-repetition.js';

class MemoryEngine {
  constructor() {
    this.systems = new Map();
    this.activeSystem = null;
    this.performanceMetrics = new Map();

    // Initialize core memory systems
    this.initSystems();

    // Performance monitoring
    this.startPerformanceMonitoring();
  }

  // Initialize all memory systems
  initSystems() {
    // PAO System (Person-Action-Object)
    this.systems.set('pao', {
      name: 'PAO System',
      description: 'Person-Action-Object mapping for 00-99',
      type: 'associative',
      difficulty: 'intermediate',
      init: () => this.initPAOSystem(),
      practice: (input) => this.practicePAO(input),
      validate: (input, expected) => this.validatePAO(input, expected),
    });

    // Peg System
    this.systems.set('peg', {
      name: 'Peg System',
      description: 'Visual anchors for digits 0-9',
      type: 'visual',
      difficulty: 'beginner',
      init: () => this.initPegSystem(),
      practice: (input) => this.practicePeg(input),
      validate: (input, expected) => this.validatePeg(input, expected),
    });

    // Major System
    this.systems.set('major', {
      name: 'Major System',
      description: 'Phonetic number-to-sound mapping',
      type: 'phonetic',
      difficulty: 'advanced',
      init: () => this.initMajorSystem(),
      practice: (input) => this.practiceMajor(input),
      validate: (input, expected) => this.validateMajor(input, expected),
    });

    // Dominic System
    this.systems.set('dominic', {
      name: 'Dominic System',
      description: 'Person-Action for 00-99',
      type: 'associative',
      difficulty: 'intermediate',
      init: () => this.initDominicSystem(),
      practice: (input) => this.practiceDominic(input),
      validate: (input, expected) => this.validateDominic(input, expected),
    });
  }

  // Initialize PAO System
  async initPAOSystem() {
    const startTime = performance.now();

    try {
      // Load PAO data
      const response = await fetch('data/memory-people.json');
      const data = await response.json();

      // Create optimized lookup structures
      const lookup = {
        byNumber: new Map(),
        byInitials: new Map(),
        byName: new Map(),
        byAction: new Map(),
        byObject: new Map(),
      };

      // Build indexes for fast retrieval
      Object.entries(data).forEach(([number, entry]) => {
        lookup.byNumber.set(number, entry);
        lookup.byInitials.set(entry.initials, entry);
        lookup.byName.set(entry.name.toLowerCase(), entry);
        if (entry.action)
          lookup.byAction.set(entry.action.toLowerCase(), entry);
        if (entry.object)
          lookup.byObject.set(entry.object.toLowerCase(), entry);
      });

      // Store in state
      memoryState.set('pao.data', data);
      memoryState.set('pao.lookup', lookup);
      memoryState.set('pao.initialized', true);
      memoryState.set('pao.practiceMode', 'normal');

      const endTime = performance.now();
      this.recordPerformance('pao.init', endTime - startTime);

      return { success: true, count: Object.keys(data).length };
    } catch (error) {
      console.error('Failed to initialize PAO system:', error);
      return { success: false, error: error.message };
    }
  }

  // Practice PAO system
  practicePAO(input) {
    const startTime = performance.now();

    try {
      const data = memoryState.get('pao.data');
      const lookup = memoryState.get('pao.lookup');
      const practiceMode = memoryState.get('pao.practiceMode');

      if (!data || !lookup) {
        throw new Error('PAO system not initialized');
      }

      let result = null;

      if (practiceMode === 'reverse') {
        // In reverse mode, the input is the name, and we expect the number.
        const searchTerm = input.toLowerCase();
        result = lookup.byName.get(searchTerm);
      } else {
        // In normal mode, the input is the number, and we expect the name.
        if (input.match(/^\d{1,2}$/)) {
          const padded = input.padStart(2, '0');
          result = lookup.byNumber.get(padded);
        } else if (input.match(/^[A-Z]{2}$/)) {
          result = lookup.byInitials.get(input);
        } else {
          const searchTerm = input.toLowerCase();
          result =
            lookup.byName.get(searchTerm) ||
            lookup.byAction.get(searchTerm) ||
            lookup.byObject.get(searchTerm);
        }
      }

      if (result) {
        const endTime = performance.now();
        this.recordPerformance('pao.practice', endTime - startTime);

        return {
          success: true,
          result,
          responseTime: endTime - startTime,
          difficulty: this.calculateDifficulty(input, result),
        };
      } else {
        return { success: false, error: 'No match found' };
      }
    } catch (error) {
      console.error('PAO practice error:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate practice difficulty based on input type and complexity
  calculateDifficulty(input, result) {
    let baseDifficulty = 1;

    // Input type affects difficulty
    if (input.match(/^\d{1,2}$/)) {
      baseDifficulty = 1; // Number is easiest
    } else if (input.match(/^[A-Z]{2}$/)) {
      baseDifficulty = 2; // Initials are medium
    } else {
      baseDifficulty = 3; // Text search is hardest
    }

    // Result complexity affects difficulty
    if (result.emojiStory && result.emojiStory.length > 5) {
      baseDifficulty += 1;
    }

    if (result.action && result.action.length > 20) {
      baseDifficulty += 1;
    }

    return Math.min(baseDifficulty, 5); // Cap at 5
  }

  // Initialize Peg System
  async initPegSystem() {
    if (memoryState.get('peg.initialized')) {
      return { success: true, fromCache: true };
    }
    try {
      const response = await fetch('data/pegs.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Create optimized lookup
      const lookup = new Map();
      data.forEach((peg) => {
        lookup.set(peg.number, peg);
      });

      // Use batch update for efficiency
      memoryState.batch([
        ['peg.data', data],
        ['peg.lookup', lookup],
        ['peg.initialized', true],
      ]);

      return { success: true, count: data.length };
    } catch (error) {
      console.error('Failed to initialize Peg system:', error);
      memoryState.set('peg.initialized', false);
      return { success: false, error: error.message };
    }
  }

  // Practice Peg System
  practicePeg(input) {
    try {
      const lookup = memoryState.get('peg.lookup');
      if (!lookup) {
        throw new Error('Peg system not initialized');
      }

      const number = parseInt(input);
      if (isNaN(number) || number < 0 || number > 9) {
        return { success: false, error: 'Invalid peg number (0-9)' };
      }

      const result = lookup.get(number);
      if (result) {
        return { success: true, result };
      } else {
        return { success: false, error: 'Peg not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Initialize Major System (phonetic)
  initMajorSystem() {
    // Major System: 0=s/z, 1=t/d, 2=n, 3=m, 4=r, 5=l, 6=j/ch/sh, 7=k/g, 8=f/v, 9=p/b
    const majorMap = {
      0: ['s', 'z'],
      1: ['t', 'd'],
      2: ['n'],
      3: ['m'],
      4: ['r'],
      5: ['l'],
      6: ['j', 'ch', 'sh'],
      7: ['k', 'g'],
      8: ['f', 'v'],
      9: ['p', 'b'],
    };

    memoryState.set('major.map', majorMap);
    memoryState.set('major.initialized', true);

    return { success: true };
  }

  // Practice Major System
  practiceMajor(input) {
    try {
      const map = memoryState.get('major.map');
      if (!map) {
        throw new Error('Major system not initialized');
      }

      if (!input.match(/^\d+$/)) {
        return { success: false, error: 'Input must be numeric' };
      }

      const digits = input.split('').map((d) => parseInt(d));
      const sounds = digits.map((d) => map[d] || []);

      return {
        success: true,
        input,
        sounds,
        word: this.generateMajorWord(sounds),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate a word from Major System sounds
  generateMajorWord(sounds) {
    // This is a simplified version - in practice, you'd have a dictionary
    // of words that match the sound patterns
    return sounds.map((soundGroup) => soundGroup[0] || '?').join('');
  }

  // Initialize Dominic System
  initDominicSystem() {
    // Dominic System is similar to PAO but with different associations
    // For now, we'll use a simplified version
    memoryState.set('dominic.initialized', true);
    return { success: true };
  }

  // Practice Dominic System
  practiceDominic() {
    // Placeholder for Dominic System practice
    return { success: false, error: 'Dominic System not yet implemented' };
  }

  // Practice an item with a quality score
  practice(itemId, quality) {
    const item = memoryState.get(`pao.data.${itemId}`);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    let srData = item.sr || createSpacedRepetitionItem();

    const { interval, repetitions, easiness } = sm2(
      quality,
      srData.repetitions,
      srData.easiness,
      srData.interval
    );

    const updatedSrData = {
      ...srData,
      interval,
      repetitions,
      easiness,
      dueDate: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
    };

    memoryState.set(`pao.data.${itemId}.sr`, updatedSrData);

    return { success: true, item, srData: updatedSrData };
  }

  // Get items that are due for repetition
  getDueItems() {
    const paoData = memoryState.get('pao.data');
    if (!paoData) {
      return [];
    }

    const now = new Date();
    const dueItems = [];

    for (const itemId in paoData) {
      const item = paoData[itemId];
      if (item.sr && item.sr.dueDate && new Date(item.sr.dueDate) <= now) {
        dueItems.push(item);
      }
    }

    return dueItems;
  }

  // Validation methods
  validatePAO(input, expected) {
    const result = this.practicePAO(input);
    if (result.success) {
      return result.result.number === expected;
    }
    return false;
  }

  validatePeg(input, expected) {
    const result = this.practicePeg(input);
    if (result.success) {
      return result.result.number === expected;
    }
    return false;
  }

  validateMajor(input, expected) {
    const result = this.practiceMajor(input);
    if (result.success) {
      return result.word === expected;
    }
    return false;
  }

  validateDominic(input, expected) {
    const result = this.practiceDominic(input);
    if (result.success) {
      return result.result.number === expected;
    }
    return false;
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      memoryState.trackMemoryUsage();
    }, 5000);

    // Monitor system performance
    setInterval(() => {
      this.analyzePerformance();
    }, 10000);
  }

  recordPerformance(operation, duration) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const metrics = this.performanceMetrics.get(operation);
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  analyzePerformance() {
    const analysis = {};

    for (const [operation, metrics] of this.performanceMetrics) {
      if (metrics.length > 0) {
        const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
        const min = Math.min(...metrics);
        const max = Math.max(...metrics);

        analysis[operation] = { avg, min, max, count: metrics.length };
      }
    }

    memoryState.set('performance.analysis', analysis);
  }

  // Get system information
  getSystemInfo(systemName) {
    const system = this.systems.get(systemName);
    if (system) {
      return {
        ...system,
        initialized: memoryState.get(`${systemName}.initialized`) || false,
        dataCount: this.getSystemDataCount(systemName),
      };
    }
    return null;
  }

  getSystemDataCount(systemName) {
    const data = memoryState.get(`${systemName}.data`);
    if (Array.isArray(data)) {
      return data.length;
    } else if (data && typeof data === 'object') {
      return Object.keys(data).length;
    }
    return 0;
  }

  // Get all available systems
  getAvailableSystems() {
    return Array.from(this.systems.keys()).map((name) =>
      this.getSystemInfo(name)
    );
  }

  // Switch active system
  setActiveSystem(systemName) {
    if (this.systems.has(systemName)) {
      this.activeSystem = systemName;
      memoryState.set('activeSystem', systemName);
      return { success: true, system: systemName };
    }
    return { success: false, error: 'System not found' };
  }

  // Cleanup
  destroy() {
    this.performanceMetrics.clear();
    this.systems.clear();
  }
}

// Export singleton instance
const memoryEngine = new MemoryEngine();
export default memoryEngine;
