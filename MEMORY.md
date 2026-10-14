# MEMORY.md — Aangan (99acres clone) Project State
# Updated: 2026-10-14

## Project Overview
Full-stack Indian real estate marketplace, Turborepo monorepo. Ships under the
working name **Aangan** (neutral placeholder replacing "99acres Clone").
Product truth: `PRODUCT.md`. Visual system: `DESIGN.md` + `.impeccable/design.json`.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, TanStack Query, Zustand
- **Backend:** Fastify 5 + Drizzle ORM (Postgres; Haversine geo, no PostGIS needed)
- **Infra:** Redis (BullMQ, rate limit), OpenSearch (optional; Postgres fallback for suggest), S3 / LocalStack
- **Auth:** email + password (scrypt hash) → JWT via `@fastify/jwt`
- **Deploy:** web → Vercel, API → Railway, DB → Neon, Redis → Upstash

## Ports (local)
| Service | Port |
|---|---|
| Next.js (web) | 3001 (`next dev -p 3001`; Docker holds 3000) |
| Fastify (API) | 3002 |
| Postgres / Redis / OpenSearch / LocalStack | 5432 / 6379 / 9200 / 4566 |

**Note:** the root `.env` points at Neon + Upstash. `pnpm dev` for the API does
not load `.env`; it falls back to the local Docker defaults. `seed:demo`
refuses non-local databases.

## Key Scripts (apps/api-server)
- `dev` / `dev:worker` — API server and BullMQ worker (image + notification queues)
- `admin:promote <email>` — make an account a moderator (needed to publish listings)
- `seed:demo` — local-only demo lister + 10 listings (needs `SEED_PASSWORD`)

## Listing lifecycle
create → `pending_approval` → admin publishes at `/dashboard/moderation`
(optionally grants the verified seal) → `active` + indexed → owner can mark
sold/rented or delete (soft).

## Resolved Issues (history)
1. `FST_ERR_HOOK_INVALID_HANDLER` — routes use standalone `authGuard`.
2. Plugins (`cors`, `auth`) must be wrapped with `fastify-plugin`, otherwise
   CORS headers and `jwtSign/jwtVerify` are scoped away from routes.
3. Login previously accepted any password; now scrypt-verified.
4. Zustand `persist` rehydrates synchronously during `create()`; the
   `hasHydrated` flag is set in a microtask.
5. Server components cannot call functions exported from `"use client"`
   modules — shared helpers live in `apps/web/src/lib/`.

## Open / Next Steps
- [ ] Run migration `0001_add_password_hash.sql` on Neon before deploying the API
- [ ] Production env: `ALLOWED_ORIGIN`, strong `JWT_SECRET` (Railway); `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (Vercel)
- [ ] Deploy the worker as a second Railway service (`node dist/worker.js`)
- [ ] Terms / Privacy pages (need real legal copy)
- [ ] Google sign-in (removed placeholder button)
- [ ] SMS provider for lead notifications

## Conventions
- `apps/web` imports: extensionless. `apps/api-server` imports: `.js` extensions.
- Protect routes with `authGuard` (+ `adminGuard` for moderators).
- UI: component classes from `globals.css` (`.sheet`, `.btn-seal`, `.chip`, `.input-line`…); see DESIGN.md.
