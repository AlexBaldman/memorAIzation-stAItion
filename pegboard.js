// Pegboard module - enhanced with new architecture integration
import memoryState from './src/core/state.js';
import memoryEngine from './src/core/memory-engine.js';

async function loadPegs() {
  // Try to get from state first, fallback to fetch
  let data = memoryState.get('peg.data');
  
  if (!data) {
    try {
      const res = await fetch('data/pegs.json');
      data = await res.json();
      // Store in state for future use
      memoryState.set('peg.data', data);
    } catch (error) {
      console.error('Failed to load pegs:', error);
      return [];
    }
  }
  
  return data;
}

function createPegNode(peg) {
  const node = document.createElement('div');
  node.className = 'peg w-20 h-24 bg-zinc-200/80 hover:bg-zinc-100 text-center rounded flex flex-col items-center justify-center cursor-pointer select-none';
  node.innerHTML = `<span class="text-3xl mb-1">${peg.emoji}</span><span class="text-sm text-zinc-800">${peg.number}</span>`;
  node.title = `${peg.number}: ${peg.name}`;
  
  // Enhanced click handler with practice functionality
  node.addEventListener('click', () => {
    // Practice the peg system
    const result = memoryEngine.practicePeg(peg.number);
    
    if (result.success) {
      // Show enhanced information
      showPegInfo(peg, result);
    } else {
      console.error('Peg practice failed:', result.error);
    }
  });
  
  return node;
}

// Show enhanced peg information
function showPegInfo(peg, practiceResult) {
  // Create or update info display
  let infoDisplay = document.getElementById('peg-info-display');
  
  if (!infoDisplay) {
    infoDisplay = document.createElement('div');
    infoDisplay.id = 'peg-info-display';
    infoDisplay.className = 'fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50';
    document.body.appendChild(infoDisplay);
  }
  
  infoDisplay.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-lg font-semibold">Peg ${peg.number}</h3>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">×</button>
    </div>
    <div class="text-center mb-3">
      <span class="text-4xl">${peg.emoji}</span>
    </div>
    <div class="space-y-2">
      <p><strong>Name:</strong> ${peg.name}</p>
      <p><strong>Number:</strong> ${peg.number}</p>
      <p><strong>Practice Status:</strong> <span class="text-green-600">✓ Active</span></p>
    </div>
    <div class="mt-3 text-sm text-gray-600">
      <p>Click any peg to practice the system!</p>
    </div>
  `;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (infoDisplay.parentNode) {
      infoDisplay.remove();
    }
  }, 5000);
}

export async function initPegBoard() {
  const board = document.getElementById('pegboard');
  if (!board) return;
  
  try {
    const data = await loadPegs();
    
    // Clear existing content
    board.innerHTML = '';
    
    // Create peg nodes
    data.forEach(p => {
      const pegNode = createPegNode(p);
      board.appendChild(pegNode);
    });
    
    // Update state
    memoryState.set('peg.initialized', true);
    
    console.log(`✅ Peg system initialized with ${data.length} pegs`);
    
  } catch (error) {
    console.error('Failed to initialize peg board:', error);
    
    // Show error state
    board.innerHTML = `
      <div class="text-center text-red-600 p-4">
        <p>Failed to load peg system</p>
        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Retry
        </button>
      </div>
    `;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPegBoard);
