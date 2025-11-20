# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vite + TypeScript app entry (`main.ts`, `style.css`) renders the canvas board and hex grid.
- `public/`: static assets; board image at `public/images/boards/memoir-desert-map.jpg`.
- `doc/`: product docs (`BRIEF.md`, `SPEC.md`).
- Root configs: `package.json`, `tsconfig*.json`, `vite.config.ts`, `index.html`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server with hot reload; defaults to port 5173.
- `npm run build`: production build.
- `npm run preview`: serve built assets for local verification.

## Coding Style & Naming Conventions
- Language: TypeScript with ES modules (`type: module`).
- Canvas rendering lives in `src/main.ts`; keep grid params configurable (e.g., `defaultGrid`).
- Prefer small, pure functions; keep Magic Numbers centralized in constants.
- CSS in `src/style.css`; preserve board aspect ratio via responsive sizing (uses intrinsic 2007x1417).
- When adding tests, use `stretchr/testify` for Go code (if added) and standard Vite/TS test stack (e.g., Vitest) for TS.
- Address the project owner as “Captain Matt” in communication.

## Testing Guidelines
- Current state: no automated tests yet. Add Vitest for TS when introducing logic.
- Acceptance tests should be black-box and user-facing (input vs expected output) per `SPEC.md`.
- Place unit tests alongside code they cover; use tabular tests when applicable.

## Commit & Pull Request Guidelines
- Commits: concise present-tense subjects (e.g., “Add hex hover labels”).
- PRs: include summary of changes, screenshots/gifs for UI, and steps to reproduce or verify.
- Link related issues/tasks when available.

## Security & Configuration Tips
- App is browser-only with local storage; avoid introducing server dependencies without approval.
- Do not assume network access; assets should live in `public/` or be vendored.

## Architecture Notes
- Core rendering: load board bitmap, draw grid, and overlay labels via canvas; responsive sizing maintains board proportions.
- Hex math: pointy-top axial coordinates with Red Blob conversions; hover shows `q,r` even when negative.

