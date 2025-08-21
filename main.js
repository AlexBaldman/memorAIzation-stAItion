const container = document.getElementById('card-container');
const tpl = document.getElementById('card-template');
let IMAGE_MANIFEST = {};

// ---------------- Image Generation Config ----------------
// Config is user-selectable via UI and persisted in localStorage
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const DEFAULT_PROVIDER = import.meta.env.VITE_IMAGE_PROVIDER || (HF_TOKEN ? 'hf' : 'qwen');
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-2';

function getAIConfig() {
  const provider = localStorage.getItem('ai-provider') || DEFAULT_PROVIDER;
  const model = localStorage.getItem('ai-model') || DEFAULT_MODEL;
  return { provider, model };
}

function getHFModelUrl(model) {
  return `https://api-inference.huggingface.co/models/${model}`;
}

async function generateImage(prompt) {
  const { provider, model } = getAIConfig();
  if (provider === 'hf' && HF_TOKEN) {
    const res = await fetch(getHFModelUrl(model), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });
    if (!res.ok) throw new Error('HF request failed');
    return res.blob();
  }

  // fallback to Qwen demo endpoint (no auth required at time of writing)
  const res = await fetch('https://api-inference.huggingface.co/models/qwen/Qwen-72B-Image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt })
  });
  if (!res.ok) throw new Error('Qwen request failed');
  return res.blob();
}
// ---------------------------------------------------------

async function loadData() {
  const [peopleRes, manifestRes] = await Promise.all([
    fetch('data/memory-people.json'),
    fetch('data/images/manifest.json').catch(() => null)
  ]);
  if (manifestRes && manifestRes.ok) {
    try { IMAGE_MANIFEST = await manifestRes.json(); } catch (_) { IMAGE_MANIFEST = {}; }
  }
  return peopleRes.json();
}

function createCard(entry) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  const numPadded = entry.number.padStart(2, '0');
  node.querySelector('.card-number').textContent = numPadded;
  node.querySelector('.card-initials').textContent = entry.initials;
  const img = node.querySelector('img');
  // Choose initial image: prefer local manifest if present, else fallback to entry.imageUrl
  const localList = IMAGE_MANIFEST[numPadded] || [];
  const choiceKey = `imgChoice-${numPadded}`;
  let choiceIdx = 0;
  if (localList.length) {
    const saved = localStorage.getItem(choiceKey);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < localList.length) choiceIdx = idx;
    }
    img.src = localList[choiceIdx];
  } else {
    img.src = entry.imageUrl;
  }
  img.alt = `${entry.name} portrait photograph`;
  node.querySelector('.card-name').textContent = entry.name;
  node.querySelector('.card-description').innerHTML = `${entry.number} = ${entry.initials} = ${entry.name}`;

  // flip on hover handled via CSS; ensure inner rotates on click for touch devices
  node.addEventListener('click', () => {
    node.querySelector('.card-inner').classList.toggle('flip');
  });

  // Click image to cycle through local options if available
  if (localList.length > 1) {
    img.style.cursor = 'pointer';
    img.title = 'Click to cycle local images';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      choiceIdx = (choiceIdx + 1) % localList.length;
      localStorage.setItem(choiceKey, String(choiceIdx));
      img.src = localList[choiceIdx];
    });
  }

  // AI image generation button
  node.querySelector('.generate-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Generating…';

    const cacheKey = `img-${entry.number}`;
    if (localStorage.getItem(cacheKey)) {
      img.src = localStorage.getItem(cacheKey);
      btn.disabled = false;
      btn.textContent = 'Generate new image';
      return;
    }
    try {
      const prompt = `High-resolution portrait photo of ${entry.name} ${entry.emoji || ''}`;
      const blob = await generateImage(prompt);
      if (blob) {
        const url = URL.createObjectURL(blob);
        localStorage.setItem(cacheKey, url);
        img.src = url;
        // When AI image is used, clear local choice index so next load uses cached AI
        localStorage.removeItem(choiceKey);
      }
    } catch (_) {
      // fail silently
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate new image';
    }
  });

  // AI edit button (prompt-based stub)
  const editBtn = node.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const promptInput = window.prompt('Describe your edit (e.g., make pixel-art style, increase contrast):');
      if (!promptInput) return;
      const prev = editBtn.textContent;
      editBtn.disabled = true;
      editBtn.textContent = 'Editing…';
      try {
        const prompt = `${promptInput} — subject: ${entry.name} ${entry.emoji || ''}`;
        const blob = await generateImage(prompt);
        if (blob) {
          const url = URL.createObjectURL(blob);
          localStorage.setItem(`img-edit-${entry.number}`, url);
          img.src = url;
          localStorage.removeItem(choiceKey);
        }
      } catch (_) {
        // no-op
      } finally {
        editBtn.disabled = false;
        editBtn.textContent = prev;
      }
    });
  }
  return node;
}

// Initialize AI config UI controls
function initAIControls() {
  const sel = document.getElementById('ai-provider');
  const inp = document.getElementById('ai-model');
  const btn = document.getElementById('save-ai-config');
  if (!sel || !inp || !btn) return;
  const { provider, model } = getAIConfig();
  sel.value = provider;
  inp.value = model;
  btn.addEventListener('click', () => {
    localStorage.setItem('ai-provider', sel.value);
    localStorage.setItem('ai-model', inp.value.trim() || DEFAULT_MODEL);
    btn.textContent = 'Saved';
    setTimeout(() => (btn.textContent = 'Save'), 1000);
  });
}

loadData().then(data => {
  initAIControls();
  Object.values(data).forEach(entry => {
    container.appendChild(createCard(entry));
  });
});
