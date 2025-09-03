import { memoryState } from '../core/state.js';

// Theme Builder Component (alpha)

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function makeDraggable(el) {
  let startX = 0,
    startY = 0,
    origX = 0,
    origY = 0;
  function onDown(e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    origX = el.offsetLeft;
    origY = el.offsetTop;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  function onMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${origX + dx}px`;
    el.style.top = `${origY + dy}px`;
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  el.addEventListener('mousedown', onDown);
}

function applyStyle(el, style) {
  if (!style) return;
  Object.entries(style).forEach(([k, v]) => {
    el.style[k] = v;
  });
}

function createComponentNode(comp) {
  const node = document.createElement('div');
  node.className = 'absolute select-none';
  node.dataset.compId = comp.id;
  node.style.position = 'absolute';
  node.style.left = `${comp.bounds?.x || 0}px`;
  node.style.top = `${comp.bounds?.y || 0}px`;
  node.style.width = `${comp.bounds?.w || 200}px`;
  node.style.height = `${comp.bounds?.h || 100}px`;
  applyStyle(node, comp.style);

  if (comp.type === 'title') {
    node.textContent = comp.label || 'Title';
    node.style.display = 'flex';
    node.style.alignItems = 'center';
    node.style.justifyContent = 'flex-start';
  } else if (comp.type === 'footer') {
    node.textContent = comp.label || 'Footer';
  } else if (comp.type === 'art') {
    node.style.background = node.style.background || '#000';
  }

  makeDraggable(node);
  return node;
}

function serializeLayout(canvas) {
  const out = [];
  canvas.querySelectorAll('[data-comp-id]').forEach((el) => {
    out.push({
      id: el.dataset.compId,
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
      style: el.getAttribute('style'),
    });
  });
  return out;
}

function restoreLayout(canvas, theme, saved) {
  if (!Array.isArray(saved)) return;
  const byId = Object.fromEntries(
    (theme.components || []).map((c) => [c.id, c])
  );
  saved.forEach((item) => {
    const base = byId[item.id];
    if (!base) return;
    const node = createComponentNode(base);
    node.style.left = `${item.x}px`;
    node.style.top = `${item.y}px`;
    node.style.width = `${item.w}px`;
    node.style.height = `${item.h}px`;
    canvas.appendChild(node);
  });
}

export async function initThemeBuilderComponent() {
  const select = document.getElementById('theme-select');
  const list = document.getElementById('component-list');
  const canvas = document.getElementById('builder-canvas');
  const saveBtn = document.getElementById('save-theme-layout');
  const clearBtn = document.getElementById('clear-theme-layout');
  if (!select || !list || !canvas) return;

  async function loadTheme(url) {
    list.innerHTML = '';
    canvas.innerHTML = '';
    const theme = await loadJSON(url);
    memoryState.set('themeBuilder.activeTheme', theme);

    (theme.components || []).forEach((comp) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className =
        'w-full px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-left';
      btn.textContent = comp.label || comp.id;
      btn.addEventListener('click', () => {
        const node = createComponentNode(comp);
        canvas.appendChild(node);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    const layouts = memoryState.get('themeBuilder.layouts');
    const savedLayout = layouts[url];
    if (savedLayout) {
      restoreLayout(canvas, theme, savedLayout);
    }

    saveBtn?.addEventListener('click', () => {
      const currentLayouts = memoryState.get('themeBuilder.layouts') || {};
      const newLayouts = {
        ...currentLayouts,
        [url]: serializeLayout(canvas),
      };
      memoryState.set('themeBuilder.layouts', newLayouts);

      saveBtn.textContent = 'Saved';
      setTimeout(() => (saveBtn.textContent = 'Save Layout'), 800);
    });

    clearBtn?.addEventListener('click', () => {
      const currentLayouts = memoryState.get('themeBuilder.layouts') || {};
      const newLayouts = { ...currentLayouts };
      delete newLayouts[url];
      memoryState.set('themeBuilder.layouts', newLayouts);
      canvas.innerHTML = '';
    });
  }

  // Persist layouts to localStorage when they change in the state
  if (typeof localStorage !== 'undefined') {
    memoryState.subscribe('themeBuilder.layouts', (layouts) => {
      try {
        localStorage.setItem('theme-layouts', JSON.stringify(layouts));
      } catch (e) {
        console.warn('Failed to save theme layouts to localStorage', e);
      }
    });

    // Load persisted layouts on init
    try {
      const persistedLayouts = JSON.parse(
        localStorage.getItem('theme-layouts') || '{}'
      );
      memoryState.set('themeBuilder.layouts', persistedLayouts);
    } catch (e) {
      console.warn('Failed to load theme layouts from localStorage', e);
    }
  }

  await loadTheme(select.value);
  select.addEventListener('change', () => loadTheme(select.value));
}
