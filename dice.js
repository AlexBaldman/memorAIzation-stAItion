// Dice component – enhanced with new architecture integration
import memoryState from './src/core/state.js';

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

  // two D10 for PAO two-digit number
  const dice = [
    new Die(10, container, 'd10-1'), 
    new Die(10, container, 'd10-2')
  ];

  // Load session from state management
  function loadSession() {
    return memoryState.get('dice.session') || [];
  }
  
  function saveSession(arr) {
    memoryState.set('dice.session', arr);
    // Also save to localStorage for backward compatibility
    localStorage.setItem('dice-session', JSON.stringify(arr));
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
    const startTime = performance.now();
    
    const timestamp = Date.now();
    const rolls = dice.map(d => {
      const val = d.roll();
      d.el.classList.add('shake');
      setTimeout(() => d.el.classList.remove('shake'), 600);
      return val;
    });
    
    const twoDigit = rolls[0] * 10 + rolls[1];
    resultEl.textContent = `PAO Number: ${String(twoDigit).padStart(2, '0')}`;
    
    const session = loadSession();
    const newRoll = { rolls, twoDigit, timestamp };
    session.push(newRoll);
    saveSession(session);
    
    // Update state management
    memoryState.set('dice.currentRoll', newRoll);
    
    // Update statistics
    const stats = memoryState.get('dice.statistics') || { totalRolls: 0, correctRecalls: 0, averageResponseTime: 0 };
    stats.totalRolls++;
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Calculate new average response time
    if (stats.averageResponseTime === 0) {
      stats.averageResponseTime = responseTime;
    } else {
      stats.averageResponseTime = (stats.averageResponseTime + responseTime) / 2;
    }
    
    memoryState.set('dice.statistics', stats);
    
    // Log performance
    console.log(`🎲 Dice roll: ${twoDigit} (${rolls.join(',')}) - Response time: ${responseTime.toFixed(2)}ms`);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDicePractice);
