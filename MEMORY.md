# MEMORY.md — 99acres Clone Project State
# Updated: 2026-08-11

## Project Overview
Full-stack real estate marketplace (99acres clone) built as a Turborepo monorepo.

## Tech Stack
- **Frontend:** Next.js 15 (App Router, SSR), TypeScript, Tailwind CSS
- **Backend:** Fastify + Drizzle ORM (PostGIS), TypeScript
- **DB:** PostgreSQL (Docker), Redis (BullMQ), OpenSearch
- **Monorepo:** pnpm workspaces + Turborepo
- **Auth:** Firebase Auth + JWT (`@fastify/jwt`)
- **Storage:** LocalStack (dev) / AWS S3 (prod)

## Running Services
| Service              | Port  | Status          |
|----------------------|-------|-----------------|
| Next.js (web)        | 3001  | ✅ Running      |
| Fastify (api-server) | 3002  | ✅ Running      |
| PostgreSQL            | 5432  | ✅ Docker       |
| Redis                | 6379  | ✅ Docker       |
| OpenSearch           | 9200  | ⚠️ Docker (non-fatal if down) |
| LocalStack (S3)      | 4566  | ✅ Docker       |

**Start command:** `docker-compose up -d && npx pnpm dev`

## Current UI Architecture
- **Background:** `BackgroundMedia.tsx` — fixed `z-(-10)` ambient gradient layer, rendered in root `layout.tsx`
- **Navbar:** `Navbar.tsx` wrapped in `<header className="glass-nav sticky top-0 z-50">` in `layout.tsx`
- **Page body:** All sections use glass tokens (`.glass-card`, `.glass-card-hover`, etc.)

## Resolved Issues
1. ✅ `FST_ERR_HOOK_INVALID_HANDLER` — `auth.ts` route was using `fastify.authenticate` (plugin-scoped decoration). Fixed by importing and using standalone `authGuard` function.
2. ✅ `EADDRINUSE :3000` — Docker Desktop holds port 3000. Moved Next.js → 3001, API → 3002.
3. ✅ No Tailwind CSS — `postcss.config.js` was missing from `apps/web`. Created it.
4. ✅ `Can't resolve './components/Skeleton.js'` — `packages/ui/src/index.ts` used `.js` extensions which break webpack bundler mode. Removed all extensions.
5. ✅ `shadow-glass class does not exist` — `shadow-glass` was used in `@apply` but not defined in `tailwind.config.ts`. Added to `boxShadow` extension.
6. ✅ `hover:shadow-brand-500/30` invalid — Tailwind doesn't auto-generate opacity modifiers on custom shadows. Replaced with `hover:shadow-xl`.

## Key File Map
| Purpose | Path |
|---|---|
| Global CSS tokens | `apps/web/src/app/globals.css` |
| Tailwind config | `apps/web/tailwind.config.ts` |
| PostCSS config | `apps/web/postcss.config.js` |
| Root layout | `apps/web/src/app/layout.tsx` |
| Homepage | `apps/web/src/app/page.tsx` |
| Background layer | `apps/web/src/components/common/BackgroundMedia.tsx` |
| UI package exports | `packages/ui/src/index.ts` (extensionless) |
| API auth guard | `apps/api-server/src/middleware/authGuard.ts` |
| DB schema | `packages/db/src/schema/index.ts` |
| Docker services | `docker-compose.yml` |
| Workspace rules | `.agents/AGENTS.md` + `.antigravityrules` |

## Active Tasks / Next Steps
- [ ] Firebase Auth OTP flow implementation
- [ ] Real-time lead routing (WebSocket/PubSub)
- [ ] OpenSearch index optimization
- [ ] AWS S3 production configuration
- [ ] Cypress E2E test suite setup
- [ ] Property detail page (`/property/[slug]`) — full UI polish
- [ ] Search page (`/search`) — map + list split view, filter panel

## Important Conventions
- All imports in `apps/web`: **extensionless** (webpack bundler)
- All imports in `apps/api-server`: **`.js` extension** (Node ESM)
- Auth in routes: use `authGuard` from `middleware/authGuard.ts`, never `fastify.authenticate`
- UI on dark bg: use `.glass-*` tokens from globals.css
- UI on light bg: use `.card`, `.btn-brand`, `.input-base` tokens
