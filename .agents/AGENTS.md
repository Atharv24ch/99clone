# Workspace AI Rules — 99acres Clone
# Loaded automatically by Antigravity IDE from .agents/AGENTS.md

## UI Styling
Always use global CSS utility classes (`.glass-card`, `.glass-nav`, `.glass-input`, `.glass-button`, `.glass-card-hover`) when styling UI components. Never generate long inline Tailwind class strings when a token exists. All tokens are defined in `apps/web/src/app/globals.css`.

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
`.glass-nav` = sticky headers | `.glass-card` = static cards | `.glass-card-hover` = clickable cards | `.glass-input` = form inputs on dark bg | `.glass-button` = CTA on dark bg | `.btn-brand` = CTA on light bg | `.container-app` = page width wrapper

See `.antigravityrules` for full reference table and port map.
