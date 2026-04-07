# Repository Guidelines

## Project Structure & Module Organization
- `AIChatWidget.svelte` is the root Svelte component for the widget.
- `components/` contains UI subcomponents (PascalCase files like `ChatButton.svelte`).
- `utils/` holds shared stores and helpers (e.g., `stores.js`, `url.js`).
- `locales/` and `i18n.js` define translations and locale registration.
- `examples/` includes sample integration pages (see `examples/landing.html`).
- `embed.js` is the production entry used by Rollup; `main.js` + `index.html` power local dev.
- `dist/` is generated build output; do not edit by hand.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server (defaults to `http://localhost:5173`) and serves `index.html`.
- `npm run build` bundles the widget via Rollup into `dist/chat-widget.min.js`.
- `npm test` currently exits with an error (no automated tests configured).
- `npm run release` runs `release-it` for versioning and changelog updates.

## Coding Style & Naming Conventions
- Use ES modules (`type: "module"` in `package.json`).
- Keep indentation consistent within each file (most Svelte/JS files use 2 spaces; `index.html` uses 4).
- Svelte components use PascalCase filenames; JS variables and props use `camelCase`.
- `data-*` attributes in the embed script remain kebab-case (e.g., `data-api-url`).
- There is no formatter or linter configured; match the existing style in the file you touch.

## Testing Guidelines
- No formal test suite exists. Validate changes by:
  - Running `npm run dev` and exercising the widget UI.
  - Running `npm run build` to ensure the Rollup bundle succeeds.
- When touching locales, verify the affected language files in `locales/` render correctly.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat:`, `fix:`, `chore:` (optionally add scope).
- PRs should include: a brief summary, testing performed (commands + results), and screenshots for UI changes.
- Note any breaking changes that affect `embed.js` attributes or the public widget API, and update `README.md` when needed.

## Configuration & Release Notes
- `embed.js` reads `data-*` attributes and merges API config; preserve backward compatibility.
- Release metadata is tracked in `CHANGELOG.md`; use `npm run release` for version bumps.
