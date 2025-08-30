import { expect, test, describe, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { initDicePracticeComponent } from './dice-practice.js';
import { memoryState } from '../core/state.js';

// Mock the memoryState module to be stateful
vi.mock('../core/state.js', () => {
  let state = {
    'dice.session': [],
  };
  return {
    memoryState: {
      get: vi.fn((key) => state[key]),
      set: vi.fn((key, value) => {
        state[key] = value;
      }),
      subscribe: vi.fn(),
      // Add a reset for our tests
      __reset: () => {
        state = { 'dice.session': [] };
      }
    },
  };
});

// Setting up a basic DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <section id="dice-section">
        <div id="dice-container"></div>
        <button id="roll-btn"></button>
        <div id="roll-result"></div>
        <button id="history-btn"></button>
        <div id="session-modal" class="hidden">
          <ul id="session-list"></ul>
          <button id="close-modal"></button>
        </div>
      </section>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;

describe('Dice Practice Component', () => {
  beforeEach(() => {
    // Reset the DOM and mocks before each test
    document.body.innerHTML = dom.window.document.body.innerHTML;
    vi.clearAllMocks();
    memoryState.__reset(); // Reset our mock state
  });

  test('should initialize without errors', () => {
    expect(() => initDicePracticeComponent()).not.toThrow();
  });

  test('clicking roll button should update the memoryState', () => {
    // Initialize the component, which sets up the event listener
    initDicePracticeComponent();

    const rollBtn = document.getElementById('roll-btn');
    rollBtn.click();

    // Check that memoryState.set was called once
    expect(memoryState.set).toHaveBeenCalledTimes(1);

    // Check that it was called with the correct path
    expect(memoryState.set).toHaveBeenCalledWith('dice.session', expect.any(Array));

    // Check that the new session has one entry
    const callArgs = vi.mocked(memoryState.set).mock.calls[0];
    const newSession = callArgs[1];
    expect(newSession).toHaveLength(1);
    expect(newSession[0]).toHaveProperty('rolls');
    expect(newSession[0]).toHaveProperty('twoDigit');
    expect(newSession[0]).toHaveProperty('timestamp');
  });

  test('clicking roll button twice should add two entries to the state', () => {
    initDicePracticeComponent();
    const rollBtn = document.getElementById('roll-btn');

    rollBtn.click();
    rollBtn.click();

    // We expect two calls from the two clicks
    expect(memoryState.set).toHaveBeenCalledTimes(2);

    // Check the final state
    const lastCallArgs = vi.mocked(memoryState.set).mock.calls[1];
    const finalSession = lastCallArgs[1];
    expect(finalSession).toHaveLength(2);
  });

  test('clicking history button should show the modal and render from state', () => {
    // Setup initial state
    const mockSession = [{ rolls: [1,2,3,4], twoDigit: 34, timestamp: Date.now() }];
    // Manually set the state in our mock for this test
    memoryState.get.mockReturnValue(mockSession);

    initDicePracticeComponent();
    const historyBtn = document.getElementById('history-btn');
    const modal = document.getElementById('session-modal');

    expect(modal.classList.contains('hidden')).toBe(true);
    historyBtn.click();
    expect(modal.classList.contains('hidden')).toBe(false);

    // Check that the list was rendered
    const listItems = modal.querySelectorAll('li');
    expect(listItems).toHaveLength(1);
    expect(listItems[0].textContent).toContain('34');
  });
});
