import { memoryState } from '../core/state.js';

// A pure logic class for a die, with no DOM interaction.
class Die {
  constructor(sides) {
    this.sides = sides;
    this.value = 1;
  }
  roll() {
    this.value = Math.floor(Math.random() * this.sides);
    return this.value;
  }
}

function renderSession(session) {
  const modalList = document.getElementById('session-list');
  if (!modalList || !session) return;

  modalList.innerHTML = '';
  session
    .slice(-20) // show last 20 rolls
    .reverse()
    .forEach((item) => {
      const li = document.createElement('li');
      li.className = 'text-sm p-1';
      li.textContent = `${new Date(
        item.timestamp
      ).toLocaleTimeString()} – ${String(item.twoDigit).padStart(
        2,
        '0'
      )} (${item.rolls.join(',')})`;
      modalList.appendChild(li);
    });
}

export function initDicePracticeComponent() {
  const sec = document.getElementById('dice-section');
  if (!sec) return;

  const container = document.getElementById('dice-container');
  const rollBtn = document.getElementById('roll-btn');
  const resultEl = document.getElementById('roll-result');
  const historyBtn = document.getElementById('history-btn');
  const modal = document.getElementById('session-modal');
  const closeBtn = document.getElementById('close-modal');

  // If the elements don't exist, we can't initialize the component.
  if (
    !container ||
    !rollBtn ||
    !resultEl ||
    !historyBtn ||
    !modal ||
    !closeBtn
  ) {
    return;
  }

  const dice = [new Die(6), new Die(6), new Die(10), new Die(10)];
  const dieElements = [];

  // Create DOM elements for the dice
  container.innerHTML = ''; // Clear any existing dice
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className =
      'die w-16 h-16 bg-zinc-200 text-zinc-800 rounded flex items-center justify-center text-2xl font-bold shadow-inner';
    el.setAttribute('aria-label', i < 2 ? `d6-${i + 1}` : `d10-${i - 1}`);
    container.appendChild(el);
    dieElements.push(el);
  }

  const renderDice = () => {
    dice.forEach((d, i) => {
      dieElements[i].textContent = d.value;
    });
  };

  renderDice(); // Initial render

  // Event Listeners
  rollBtn.addEventListener('click', () => {
    const timestamp = Date.now();
    const rolls = dice.map((d, i) => {
      const val = d.roll();
      dieElements[i].classList.add('shake');
      setTimeout(() => dieElements[i].classList.remove('shake'), 600);
      return val;
    });

    renderDice();

    const twoDigit = rolls[2] * 10 + rolls[3];
    resultEl.textContent = `PAO Number: ${String(twoDigit).padStart(2, '0')}`;

    // Update state instead of localStorage directly
    const currentSession = memoryState.get('dice.session') || [];
    const newSession = [...currentSession, { rolls, twoDigit, timestamp }];
    memoryState.set('dice.session', newSession);
  });

  historyBtn.addEventListener('click', () => {
    renderSession(memoryState.get('dice.session'));
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Subscribe to state changes to keep localStorage in sync
  memoryState.subscribe('dice.session', (session) => {
    // If the modal is open, re-render it
    if (modal && !modal.classList.contains('hidden')) {
      renderSession(session);
    }
    // Persist to localStorage
    try {
      localStorage.setItem('dice-session', JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save dice session to localStorage', e);
    }
  });
}
