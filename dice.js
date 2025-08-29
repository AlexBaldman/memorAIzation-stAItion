// Dice component – vanilla JS
class Die {
  constructor(sides, container, label) {
    this.sides = sides;
    this.value = 1;
    this.el = document.createElement('div');
    this.el.className = 'die w-16 h-16 bg-zinc-200 text-zinc-800 rounded flex items-center justify-center text-2xl font-bold shadow-inner';
    this.el.setAttribute('aria-label', label);
    container.appendChild(this.el);
    this.render();
  }
  roll() {
    this.value = Math.floor(Math.random() * this.sides);
    this.render();
    return this.value;
  }
  render() {
    this.el.textContent = this.value;
  }
}

export function initDicePractice() {
  const sec = document.getElementById('dice-section');
  if (!sec) return;
  const container = document.getElementById('dice-container');
  const rollBtn = document.getElementById('roll-btn');
  const resultEl = document.getElementById('roll-result');

  // two D6 standard + two D10 for PAO
  const dice = [new Die(6, container, 'd6-1'), new Die(6, container, 'd6-2'), new Die(10, container, 'd10-1'), new Die(10, container, 'd10-2')];

  const sessionKey = 'dice-session';
  function loadSession() {
    return JSON.parse(localStorage.getItem(sessionKey) || '[]');
  }
  function saveSession(arr) {
    localStorage.setItem(sessionKey, JSON.stringify(arr));
  }

  // session modal
  const historyBtn = document.getElementById('history-btn');
  const modal = document.getElementById('session-modal');
  const modalList = document.getElementById('session-list');
  const closeBtn = document.getElementById('close-modal');

  function renderSession() {
    modalList.innerHTML = '';
    loadSession().forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${new Date(item.timestamp).toLocaleTimeString()} – ${String(item.twoDigit).padStart(2,'0')} (${item.rolls.join(',')})`;
      modalList.appendChild(li);
    });
  }
  historyBtn.addEventListener('click', () => {
    renderSession();
    modal.classList.remove('hidden');
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  rollBtn.addEventListener('click', () => {
    const timestamp = Date.now();
    const rolls = dice.map(d => {
      const val = d.roll();
      d.el.classList.add('shake');
      setTimeout(()=>d.el.classList.remove('shake'),600);
      return val;
    });
    const twoDigit = rolls[2] * 10 + rolls[3];
    resultEl.textContent = `PAO Number: ${String(twoDigit).padStart(2, '0')}`;
    const session = loadSession();
    session.push({ rolls, twoDigit, timestamp });
    saveSession(session);
  });
}

document.addEventListener('DOMContentLoaded', initDicePractice);
