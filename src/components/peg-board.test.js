import { expect, test, describe, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { initPegBoardComponent } from './peg-board.js';
import { memoryState } from '../core/state.js';

// Mock the memoryState module
vi.mock('../core/state.js', () => {
  return {
    memoryState: {
      get: vi.fn(),
      set: vi.fn(),
      subscribe: vi.fn(),
    },
  };
});

// Mock the memoryEngine module
vi.mock('../core/memory-engine.js', () => {
    return {
      default: {
        practicePeg: vi.fn().mockReturnValue({ success: true, result: { number: '1', name: 'One' } }),
      }
    };
});

// Setting up a basic DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <section id="peg-section">
        <div id="pegboard"></div>
      </section>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;

describe('Pegboard Component', () => {
  beforeEach(() => {
    // Reset the DOM and mocks before each test
    document.body.innerHTML = dom.window.document.body.innerHTML;
    vi.clearAllMocks();
  });

  test('should initialize without errors', () => {
    memoryState.get.mockReturnValue([]); // Initial state is empty
    expect(() => initPegBoardComponent()).not.toThrow();
  });

  test('should render pegs based on initial state', () => {
    const mockPegs = [
      { number: '0', name: 'Zero', emoji: '0️⃣' },
      { number: '1', name: 'One', emoji: '1️⃣' },
    ];
    memoryState.get.mockReturnValue(mockPegs);

    initPegBoardComponent();

    const board = document.getElementById('pegboard');
    const pegElements = board.querySelectorAll('.peg');
    expect(pegElements).toHaveLength(2);
  });

  test('should render pegs when state is updated via subscription', () => {
    const mockPegs = [
      { number: '0', name: 'Zero', emoji: '0️⃣' },
      { number: '1', name: 'One', emoji: '1️⃣' },
      { number: '2', name: 'Two', emoji: '2️⃣' },
    ];

    // 1. Initial state is empty
    memoryState.get.mockReturnValue([]);
    initPegBoardComponent();

    // 2. Find the callback that was passed to subscribe
    const subscribeCallback = vi.mocked(memoryState.subscribe).mock.calls[0][1];

    // 3. Manually call the callback with new data, simulating a state update
    subscribeCallback(mockPegs);

    const board = document.getElementById('pegboard');
    const pegElements = board.querySelectorAll('.peg');
    expect(pegElements).toHaveLength(3);
    expect(pegElements[2].title).toBe('Two');
  });

  test('should render nothing if peg data is null or empty', () => {
    memoryState.get.mockReturnValue(null);
    initPegBoardComponent();
    const board = document.getElementById('pegboard');
    let pegElements = board.querySelectorAll('.peg');
    expect(pegElements).toHaveLength(0);

    // Test with empty array
    const subscribeCallback = vi.mocked(memoryState.subscribe).mock.calls[0][1];
    subscribeCallback([]);
    pegElements = board.querySelectorAll('.peg');
    expect(pegElements).toHaveLength(0);
  });
});
