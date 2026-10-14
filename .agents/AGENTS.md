# Workspace AI Rules — 99acres Clone
# Loaded automatically by Antigravity IDE from .agents/AGENTS.md

## UI Styling
The visual system is "Stamp Paper & Registry" — see `DESIGN.md` (tokens, rules) and `PRODUCT.md` (product truth). Use the component classes in `apps/web/src/app/globals.css` (`.sheet`, `.btn-seal`, `.btn-ink`, `.btn-quiet`, `.chip`, `.input-line`, `.input-box`, `.field-label`, `.container-app`) and colour tokens (`paper`, `sheet`, `ink`, `stamp`, `seal`, `rule`). No emoji, icon tiles, glass, gradients or kickers above headings.

## Scope Discipline
Only edit or inspect files explicitly specified in the active prompt. Avoid performing full workspace scans unless asked. When fixing bugs, read only the error file and its direct imports.

## Cross-Session Memory
Read `MEMORY.md` at the start of each session to restore active context. Update `MEMORY.md` after completing major milestones.

## TypeScript & Next.js
- No `any` types — use `unknown` with type narrowing.
- Server Components by default — add `"use client"` only when needed.
- Every listing/search page must export `generateMetadata` for SEO.
- `apps/web` imports: extensionless (webpack bundler mode).
- `apps/api-server` imports: `.js` extensions (Node ESM mode).
- Route protection: always use `authGuard` from `src/middleware/authGuard.ts`, never `fastify.authenticate` in route files.

## CSS Token Reference
`.sheet` = document surface | `.btn-seal` = primary action (violet) | `.btn-ink` = secondary | `.chip` = toggle (aria-pressed) | `.input-line` = ruled text field | `.input-box` = boxed field | `.field-label` = form label | `.container-app` = page width wrapper

See `.antigravityrules` for the port map and `DESIGN.md` for the full system.
