# Local Image Workflow

## Goals
- Use images in `data/images/decks/PAO/` to override default card art.
- Support multiple options per card and let users cycle selections in the UI.
- Keep a persistent choice per card (via `localStorage`).
- Provide a repeatable build step to discover files automatically.

## How it works
- Run `npm run gen:images` to scan `data/images/decks/PAO/` and write `data/images/manifest.json`.
- The app loads `manifest.json` at startup in `main.js` and, for each card number, prefers local images over remote URLs.
- If multiple images exist for a number, clicking the card image cycles options and persists the selected index.

## Suggested filename format
Use consistent, easy-to-parse names. Suggested pattern:

```
<number> - <initials> - <person> - <action(optional)> - v<variant>.<ext>
```

Examples:
- `07 - CD - Charlie Day - janitor - v1.jpg`
- `12 - AB - Annie Baker - v2.webp`

Notes:
- Prefer hyphens for separators. Avoid spaces where possible (they are URL-encoded by the browser). If you already have spaces, the manifest will still work because we resolve relative paths explicitly.
- Always include the leading number (padded to 2 digits) so discovery is deterministic.
- Use `v1`, `v2`, ... for variants (or trailing digits). The generator sorts ascending and the UI picks the first by default.

## Advanced metadata (optional)
Filenames are convenient but limited. Consider adding a sidecar metadata file in the future:
- `data/images/decks/PAO/meta.json` mapping `number`→`{ artist, license, prompt, notes }`
- or per-image sidecars like `filename.json` with detailed fields.
This enables richer attribution, prompts for AI editing, and filtering.

## Commands
- Generate manifest: `npm run gen:images`
- Dev server: `npm run dev`

## Troubleshooting
- If newly added files don’t show up, re-run `npm run gen:images` and refresh.
- Ensure extensions are one of: `.png, .jpg, .jpeg, .webp, .gif`.
- Check `data/images/manifest.json` was updated and numbers match your deck `number` fields (00–99).
