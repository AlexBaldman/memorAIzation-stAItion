import { expect, test, describe, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { initThemeBuilderComponent } from './theme-builder.js';
import { memoryState } from '../core/state.js';

// Mock the memoryState module
vi.mock('../core/state.js', () => {
  let state = {
    'themeBuilder.layouts': {},
  };
  return {
    memoryState: {
      get: vi.fn((key) => state[key]),
      set: vi.fn((key, value) => {
        state[key] = value;
      }),
      subscribe: vi.fn(),
      __reset: () => {
        state = { 'themeBuilder.layouts': {} };
      }
    },
  };
});

// Mock fetch for loading theme JSON
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      components: [
        { id: 'title', label: 'Title', type: 'title' },
        { id: 'art', label: 'Art', type: 'art' },
      ],
    }),
  })
);

// Setting up a basic DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <section id="theme-builder">
        <select id="theme-select">
          <option value="data/themes/default.json">Default</option>
        </select>
        <ul id="component-list"></ul>
        <div id="builder-canvas"></div>
        <button id="save-theme-layout"></button>
        <button id="clear-theme-layout"></button>
      </section>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;


describe('Theme Builder Component', async () => {
  beforeEach(() => {
    document.body.innerHTML = dom.window.document.body.innerHTML;
    vi.clearAllMocks();
    memoryState.__reset();

    // Mock localStorage
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => {
                store[key] = value.toString();
            },
            clear: () => {
                store = {};
            },
        };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  test('should initialize and load a theme', async () => {
    await initThemeBuilderComponent();
    expect(fetch).toHaveBeenCalledWith('data/themes/default.json');
    const componentList = document.getElementById('component-list');
    expect(componentList.children.length).toBe(2);
  });

  test('should save layout to memoryState when save button is clicked', async () => {
    await initThemeBuilderComponent();

    // Simulate adding a component to the canvas
    const canvas = document.getElementById('builder-canvas');
    const compNode = document.createElement('div');
    compNode.dataset.compId = 'title';
    canvas.appendChild(compNode);

    const saveBtn = document.getElementById('save-theme-layout');
    saveBtn.click();

    expect(memoryState.set).toHaveBeenCalledWith('themeBuilder.layouts', expect.any(Object));
    const lastCallArgs = vi.mocked(memoryState.set).mock.calls.find(c => c[0] === 'themeBuilder.layouts');
    const savedLayouts = lastCallArgs[1];
    expect(savedLayouts['data/themes/default.json']).toHaveLength(1);
    expect(savedLayouts['data/themes/default.json'][0].id).toBe('title');
  });

  test('should clear layout from memoryState when clear button is clicked', async () => {
    // Set initial state
    const initialLayouts = { 'data/themes/default.json': [{ id: 'title' }] };
    memoryState.get.mockReturnValue(initialLayouts);

    await initThemeBuilderComponent();

    const clearBtn = document.getElementById('clear-theme-layout');
    clearBtn.click();

    expect(memoryState.set).toHaveBeenCalledWith('themeBuilder.layouts', {});
  });
});
