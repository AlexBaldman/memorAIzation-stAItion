/**
 * Performance Monitoring Utility
 * Updates the performance dashboard with real-time statistics
 */

import memoryState from '../core/state.js';
import memoryEngine from '../core/memory-engine.js';
import aiService from '../services/ai-service.js';

class PerformanceMonitor {
  constructor() {
    this.updateInterval = null;
    this.isMonitoring = false;
    
    // Start monitoring when initialized
    this.start();
  }
  
  // Start performance monitoring
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Update dashboard every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, 2000);
    
    console.log('📊 Performance monitoring started');
  }
  
  // Stop performance monitoring
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }
  
  // Update the performance dashboard
  updateDashboard() {
    try {
      this.updateMemoryStats();
      this.updateAIStats();
      this.updatePerformanceStats();
    } catch (error) {
      console.warn('Failed to update performance dashboard:', error);
    }
  }
  
  // Update memory system statistics
  updateMemoryStats() {
    const memoryStatsEl = document.getElementById('memory-stats');
    if (!memoryStatsEl) return;
    
    const systems = memoryEngine.getAvailableSystems();
    const activeSystem = memoryState.get('activeSystem');
    
    let html = '';
    
    systems.forEach(system => {
      const status = system.initialized ? '✅' : '❌';
      const active = system.name === activeSystem ? ' (Active)' : '';
      html += `<div>${status} ${system.name}${active}</div>`;
      
      if (system.dataCount) {
        html += `<div class="ml-4 text-xs opacity-75">${system.dataCount} entries</div>`;
      }
    });
    
    // Add PAO statistics if available
    const paoStats = memoryState.get('pao.statistics');
    if (paoStats) {
      html += `<div class="mt-2 pt-2 border-t border-zinc-600">`;
      html += `<div>Total Practices: ${paoStats.totalPractices}</div>`;
      html += `<div>Success Rate: ${paoStats.totalPractices > 0 ? ((paoStats.correctRecalls / paoStats.totalPractices) * 100).toFixed(1) : 0}%</div>`;
      html += `</div>`;
    }
    
    memoryStatsEl.innerHTML = html;
  }
  
  // Update AI service statistics
  updateAIStats() {
    const aiStatsEl = document.getElementById('ai-stats');
    if (!aiStatsEl) return;
    
    const stats = aiService.getStats();
    
    let html = '';
    
    if (stats.cacheStats) {
      const hitRate = stats.cacheStats.total > 0 ? 
        ((stats.cacheStats.hits / stats.cacheStats.total) * 100).toFixed(1) : 0;
      
      html += `<div>Cache Hit Rate: ${hitRate}%</div>`;
      html += `<div>Cache Size: ${stats.cacheSize}</div>`;
    }
    
    if (stats.queueLength > 0) {
      html += `<div>Queue Length: ${stats.queueLength}</div>`;
    }
    
    if (stats.isProcessing) {
      html += `<div class="text-yellow-400">🔄 Processing...</div>`;
    }
    
    if (stats.providerStats && Object.keys(stats.providerStats).length > 0) {
      html += `<div class="mt-2 pt-2 border-t border-zinc-600">`;
      Object.entries(stats.providerStats).forEach(([provider, providerStats]) => {
        const successRate = providerStats.requests > 0 ? 
          ((providerStats.successes / providerStats.requests) * 100).toFixed(1) : 0;
        html += `<div class="text-xs">${provider}: ${successRate}% (${providerStats.requests})</div>`;
      });
      html += `</div>`;
    }
    
    aiStatsEl.innerHTML = html;
  }
  
  // Update performance statistics
  updatePerformanceStats() {
    const perfStatsEl = document.getElementById('perf-stats');
    if (!perfStatsEl) return;
    
    const performance = memoryState.get('performance');
    const analysis = memoryState.get('performance.analysis');
    
    let html = '';
    
    if (performance.lastRenderTime > 0) {
      html += `<div>Last Render: ${performance.lastRenderTime.toFixed(2)}ms</div>`;
    }
    
    if (performance.averageResponseTime > 0) {
      html += `<div>Avg Response: ${performance.averageResponseTime.toFixed(2)}ms</div>`;
    }
    
    if (performance.memoryUsage > 0) {
      const mb = (performance.memoryUsage / 1024 / 1024).toFixed(1);
      html += `<div>Memory: ${mb}MB</div>`;
    }
    
    if (analysis && Object.keys(analysis).length > 0) {
      html += `<div class="mt-2 pt-2 border-t border-zinc-600">`;
      Object.entries(analysis).forEach(([operation, metrics]) => {
        if (metrics.count > 0) {
          html += `<div class="text-xs">${operation}: ${metrics.avg.toFixed(2)}ms (${metrics.count})</div>`;
        }
      });
      html += `</div>`;
    }
    
    perfStatsEl.innerHTML = html;
  }
  
  // Get current performance summary
  getPerformanceSummary() {
    const performance = memoryState.get('performance');
    const aiStats = aiService.getStats();
    const systems = memoryEngine.getAvailableSystems();
    
    return {
      timestamp: Date.now(),
      performance: {
        lastRenderTime: performance.lastRenderTime,
        averageResponseTime: performance.averageResponseTime,
        memoryUsage: performance.memoryUsage
      },
      ai: {
        cacheHitRate: aiStats.cacheStats ? 
          (aiStats.cacheStats.hits / aiStats.cacheStats.total * 100).toFixed(1) : 0,
        queueLength: aiStats.queueLength,
        isProcessing: aiStats.isProcessing
      },
      systems: systems.map(s => ({
        name: s.name,
        initialized: s.initialized,
        dataCount: s.dataCount
      }))
    };
  }
  
  // Export performance data
  exportPerformanceData() {
    const summary = this.getPerformanceSummary();
    const dataStr = JSON.stringify(summary, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Cleanup
  destroy() {
    this.stop();
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in other modules
export default performanceMonitor;

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}