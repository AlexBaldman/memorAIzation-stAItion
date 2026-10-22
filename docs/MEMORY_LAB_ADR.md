# ADR-MEMORY-0001 (proposed): Source-aware Memory Core and a complete practice slice

**Status:** Candidate / proving implementation. **Date:** 2026-10-22. **Reviewer:** Alex.

## Decision and scope

1. `00` to `99` are permanent slot addresses, not identities for real people or game characters.
2. Each imported person/action/object proposal has a source-specific binding ID and is append-only within that source ID. Import under a new ID to represent a revision.
3. Learner's active binding selection is local to their profile; explicit promotion to universe-wide canon is **not** implemented. No imported roster is authoritative merely because it is newer.
4. RollKit emits preselected digit events with preserved leading zeros. The optional Three.js adapter renders the preselected result and may never replace RNG truth with simulated physics.
5. Recall events link slot and *binding* identifiers so scheduling survives roster revisions; SM-2 schedule is derived from the immutable event ledger.
6. Browser-local persistence and JSON/CSV exports are sufficient for this initial offline-first proving ground. Identity sync and secure server-side AI generation are out of scope.

## What ships

- `lab.html`: first end-to-end practice loop and roster selection workbench
- `src/core/rollkit.js`: unbiased, crypto-backed independent d10s, public event contract
- `src/core/roster-core.js`: 100-slot registry, immutable-by-ID binding import, conflict classification
- `src/core/review-core.js`: event grading, proper lapse/reset and due schedule
- `src/lab/dice-three.js`: on-demand, correctly face-labelled ten-sided solid visualization; no physics claim
- `src/lab/main.js`: accessible DOM implementation, four skins, history, import/export and reduced-motion path
- `test/core.node.mjs`: pure Node regression tests independent of browser and build dependencies

## Source integrity / privacy

The public repository retains its current published legacy roster. Current Notion data is private and **is not checked in**. A user may import their Notion export locally in the browser; imported source data remains in localStorage until exported or cleared. The prior repo's `animus/firstHundred.ts` pull request has a more expressive domain design and should be considered for convergence after its tests and review.

The legacy Rails repository still needs sensitive-secret remediation before deployment. Do not revive its runtime as part of this PR.

## Verified vs outstanding

- Verified: deterministic core unit tests; type/parse checks; browser integration still needs a manual bundled build and interaction test on a real browser.
- Outstanding: current Notion roster importer-specific tests, semantic conflict classification, historical source coverage, Playwright E2E, 3D GPU/screenreader checks, production deploy, synced profiles, physics verification, native Swift/watchOS apps, real Bambu print.

## Promotion gates

- Promote stable slot and binding provenance contracts after full test coverage and independent review.
- Promote RollKit's result event contract after a second working consumer implements it.
- Promote Three.js/physics only after mesh face orientation and performance are measured on phone GPU.
- Promote no person's association or Animus assignment without an explicit roster review receipt.

## References

- [Original First Hundred/Animus PR](https://github.com/AlexBaldman/memorizationCreationStation/pull/1)
- [Source archaeology](https://github.com/AlexBaldman/memorizationCreationStation/blob/feature/animus-foundation/animus/MEMORY_SOURCE_AUDIT.md)
- [uINVERSE surface canon](https://github.com/AlexBaldman/uinverse-dashboard/blob/main/docs/canon/SEED-000002-powers-of-ten-semantic-surfaces.md)