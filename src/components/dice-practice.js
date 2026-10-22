import { memoryState } from '../core/state.js';
import { rollPercentile } from '../core/rollkit.js';

// View models display the results from headless RollKit, never roll independently.
class Die {
  constructor() { this.value = 0; }
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
  const sec = document.getElementById('view-dice-practice') || document.getElementById('dice-section');
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

  const dice = [new Die(), new Die()]; // Tens and ones, driven by RollKit.
  const dieElements = [];

  // Create DOM elements for the dice
  container.innerHTML = ''; // Clear any existing dice
  for (let i = 0; i < 2; i++) {
    const el = document.createElement('div');
    // We will style this more appropriately later
    el.className =
      'die w-24 h-24 bg-white text-gray-800 rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg';
    el.setAttribute('aria-label', `d10-${i + 1}`);
    container.appendChild(el);
    dieElements.push(el);
  }

  const createDieFace = (value) => {
    // For a d10 (0-9), we'll just show the number for simplicity,
    // but with a more "designed" look. Dot patterns for 0-9 are not standard.
    // A future enhancement could be a visual representation.
    const face = document.createElement('div');
    face.className = 'die-face';
    face.textContent = value;
    return face.outerHTML;
  };

  const renderDice = () => {
    dice.forEach((d, i) => {
      dieElements[i].innerHTML = createDieFace(d.value);
    });
  };

  renderDice(); // Initial render

  // Event Listeners
  rollBtn.addEventListener('click', () => {
    const timestamp = Date.now();
    const event = rollPercentile();
    const rolls = [event.tens, event.ones];
    dice.forEach((d, i) => {
      d.value = rolls[i];
      dieElements[i].classList.add('shake');
      setTimeout(() => dieElements[i].classList.remove('shake'), 600);
    });
    // Shared capability event for other applications and view adapters.
    document.dispatchEvent(new window.CustomEvent('rollkit:result', { detail: event }));

    renderDice();

    const twoDigit = event.value;
    resultEl.textContent = `PAO Number: ${event.display}`;

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
