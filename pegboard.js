// Pegboard module
async function loadPegs() {
  const res = await fetch('data/pegs.json');
  return res.json();
}

function createPegNode(peg) {
  const node = document.createElement('div');
  node.className = 'peg w-20 h-24 bg-zinc-200/80 hover:bg-zinc-100 text-center rounded flex flex-col items-center justify-center cursor-pointer select-none';
  node.innerHTML = `<span class="text-3xl mb-1">${peg.emoji}</span><span class="text-sm text-zinc-800">${peg.number}</span>`;
  node.title = peg.name;
  // placeholder click
  node.addEventListener('click', () => alert(`${peg.number}: ${peg.name}`));
  return node;
}

export async function initPegBoard() {
  const board = document.getElementById('pegboard');
  if (!board) return;
  const data = await loadPegs();
  data.forEach(p => board.appendChild(createPegNode(p)));
}

document.addEventListener('DOMContentLoaded', initPegBoard);
