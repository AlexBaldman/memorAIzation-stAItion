# memorAIzation-stAItion Roadmap

## 1. Core Deck (Celebrity PAO)

- [x] Vite app scaffold
- [x] Tailwind styling & flip cards
- [x] Load `memory-people.json`
- [x] AI image generation (HF/Qwen choice) with local caching
- [x] Local image overrides + cycling (manifest-driven)
- [ ] Card search / filters
- [ ] Offline/PWA support

## 2. Peg System Module

- [x] Pegboard UI (grid/board background)
- [ ] Import sources: CSV, table paste, Anki `.txt`, voice-to-text prompt
- [ ] Emoji + fallback images per peg (0-9)

## 3. Dice Practice Module

- [x] Dice2D component (2×d6, 2×d10)
- [x] Roll history modal (session list)
- [x] Basic shake animation on roll
- [ ] Animation themes (2D sprite, 3D CSS, custom faces)
- [ ] Practice session tracking (times, accuracy)
- [ ] Spaced-Repetition scheduling

## 4. Card Theme / Component System

- [ ] Theme library (MTG card, Illuminati, minimalist, etc.)
- [x] Theme drawer UI scaffold
- [ ] Modular card components (title bar, art frame, footer text) drag-and-drop builder
- [ ] Remix editor with resize, align, style controls
- [ ] AI-assisted template creation from sketch / prompt
- [x] Theme schema (JSON) for reusable components and layout

## 5. Security & DevOps

- [x] `.gitignore` for secrets & Node artifacts
- [ ] Secret scanning pre-commit hook

## 6. AI Provider Selection

- [x] Provider dropdown (HF / Qwen) with persisted config
- [x] Custom HF model input
- [ ] Add more providers (e.g., OpenAI, Stability REST) behind a common interface

## 7. Misc Features

- [ ] LocalStorage / IndexedDB persistence layer
- [ ] Stats dashboard
- [ ] Accessibility & keyboard support

## 8. Image Editing (AI)

- [ ] Edit selected image (img2img) for current card
- [ ] Prompt UI and presets (e.g., pixel-art, contrast, colorways)
- [ ] Save edited outputs (cache and optional export folder)
- [ ] Optional metadata sidecars (`meta.json`) with prompt/credits/licensing
- [ ] Reference: see `.docs/image_workflow.md` for filename guidance and manifest flow

## 9. Automation Plan (Docs & Tasks)

- [ ] Pre-commit script to sync TODOs → `roadmap.md` sections
- [ ] Script to append session changes into `docs/CHANGELOG.md`
- [ ] Optional Git hook to run `npm run gen:images` if image directory changed

---

_This file is generated automatically; edit or add new docs in `.docs/` as ideas evolve._
