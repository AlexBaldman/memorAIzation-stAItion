// Main entry point for memorAIzation stAItion
// Now uses the new modular architecture

import app from './src/app.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM ready, starting memorAIzation stAItion...');
  
  // The app will automatically initialize
  // We can access it globally for debugging
  window.app = app;
  
  // Legacy compatibility - keep some global functions
  window.refreshApp = () => app.refresh();
  window.getAppStats = () => app.getStats();
});

// Export for module usage
export default app;
