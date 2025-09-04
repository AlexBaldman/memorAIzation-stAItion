# 🗺️ Project Roadmap: memorAIzation stAItion 🧠✨

This document outlines the development roadmap for the memorAIzation stAItion. Our vision is to build a powerful, science-based memory training platform. However, our immediate priority is to strengthen the project's foundations to ensure it is stable, configurable, and easy to use.

Long-term, aspirational goals such as 3D memory palaces and advanced cognitive monitoring are on the horizon, but they will only be tackled after the core application is rock-solid.

---

## Phase 1: Strengthening the Foundation

This is the current focus. The goal of this phase is to improve the core architecture, user configuration, and documentation.

### 1. AI Provider Architecture
*   **[In Progress]** **Externalize Provider Configuration**: Move AI provider definitions (endpoints, models, keys) from source code to an external `config/ai-providers.json` file. This allows users to easily add, remove, or modify providers without changing the code.
*   **[In Progress]** **Create Clear Setup Guide**: Write a step-by-step `AI_PROVIDER_SETUP.md` document explaining how to get API keys and configure the different services, with a focus on free-tier options first.
*   **[To Do]** **Add more providers**: Support for additional services like OpenAI's DALL-E, Stability AI, etc., implemented via the new configuration system.
*   **[To Do]** **Implement Local Model Support**: Provide a real, working integration with a local Stable Diffusion instance for users who want full privacy and control.

### 2. Core Application & UX
*   **[To Do]** **Offline/PWA Support**: Ensure the application is fully functional without an internet connection (after initial setup).
*   **[To Do]** **Card Search & Filtering**: Allow users to quickly find specific cards in their decks.
*   **[To Do]** **Comprehensive Testing**: Build out a robust testing suite (unit, integration) to ensure stability and prevent regressions.
*   **[To Do]** **Accessibility Improvements**: Ensure the application is fully usable via keyboard and accessible to users with disabilities (WCAG 2.1 AA).

### 3. Documentation & Project Health
*   **[In Progress]** **Consolidate Planning Documents**: Maintain this `ROADMAP.md` as the single source of truth for project planning.
*   **[To Do]** **Automate Changelog**: Create a script to generate a `CHANGELOG.md` from commit history.
*   **[To Do]** **Improve Developer Docs**: Enhance inline code comments and architectural diagrams.

---

## Phase 2: Expanding Memory Systems

Once the foundation is solid, we will focus on expanding the range of memory techniques available.

*   **[Future]** **Playing Card System**: Add a system for memorizing a deck of 52 playing cards.
*   **[Future]** **Major System**: Implement the Major system for converting numbers into words.
*   **[Future]** **Spaced-Repetition Algorithm**: Integrate a more advanced algorithm (e.g., SuperMemo-2) for scheduling practice sessions.
*   **[Future]** **Data Import/Export**: Allow users to import and export their memory data from/to other formats like Anki.

---

## Phase 3: The Far Future (The "Spatial Revolution")

These are the highly ambitious, long-term goals that we will explore after the core product is mature and stable.

*   **[Future]** **3D Memory Palaces**: A WebGL-based system for creating and navigating virtual memory palaces.
*   **[Future]** **Advanced AI Integration**: Features like AI-powered difficulty adjustment, personalized training plans, and natural language interaction.
*   **[Future]** **Community & Social Features**: Leaderboards, shared decks, and collaborative training.

---
*This roadmap is a living document and will be updated as the project evolves.*
