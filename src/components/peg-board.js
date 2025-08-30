import { memoryState } from '../core/state.js';
import memoryEngine from '../core/memory-engine.js';

function createPegNode(peg) {
  const node = document.createElement('div');
  node.className =
    'peg w-20 h-24 bg-zinc-200/80 hover:bg-zinc-100 text-center rounded flex flex-col items-center justify-center cursor-pointer select-none';
  node.innerHTML = `<span class="text-3xl mb-1">${peg.emoji}</span><span class="text-sm text-zinc-800">${peg.number}</span>`;
  node.title = peg.name;

  node.addEventListener('click', () => {
    const practiceResult = memoryEngine.practicePeg(peg.number);
    if (practiceResult.success) {
      alert(`${practiceResult.result.number}: ${practiceResult.result.name}`);
    }
  });
  return node;
}

function renderPegBoard(pegs) {
  const board = document.getElementById('pegboard');
  if (!board) return;

  board.innerHTML = '';
  if (pegs && pegs.length > 0) {
    pegs.forEach((peg) => {
      board.appendChild(createPegNode(peg));
    });
  }
}

export function initPegBoardComponent() {
  const board = document.getElementById('pegboard');
  if (!board) return;

  // Subscribe to changes in the peg data
  memoryState.subscribe('peg.data', (pegs) => {
    renderPegBoard(pegs);
  });

  // Initial render if data is already available
  const initialPegs = memoryState.get('peg.data');
  if (initialPegs && initialPegs.length > 0) {
    renderPegBoard(initialPegs);
  } else {
    // If no data, maybe it's still loading. Render an empty state.
    renderPegBoard([]);
  }
}
