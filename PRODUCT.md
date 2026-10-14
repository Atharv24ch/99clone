# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two balanced sides of an Indian residential and commercial property marketplace (confirmed 2026-10-14):
- **Seekers** — households and individuals searching to buy or rent apartments, houses, plots, PG and commercial space, comparing price, configuration and locality.
- **Listers** — owners, agents/brokers and builders who post listings and work the enquiries (leads) those listings generate.

## Product Purpose
Let seekers find and contact listings by locality, budget and configuration (list + map), and let listers post properties and manage the leads they receive. Success is a submitted enquiry that reaches the right lister.

## Positioning
Undecided. Repository evidence: verified-listing flag, geo (radius/map) search, direct owner/agent contact with lead routing.

## Operating Context
- Prices in INR, formatted in lakh (L) / crore (Cr); areas in sq.ft.
- Listing types: buy, rent, PG, commercial buy/rent, plot buy/rent, new project.
- Listings go through `pending_approval` before going live.
- Leads move through new → contacted → visited → negotiating → converted / lost / spam.

## Capabilities and Constraints
- Next.js 15 web app (`apps/web`), Fastify API (`apps/api-server`), Postgres via Drizzle, Redis/BullMQ, OpenSearch, S3 uploads.
- Deploy targets: web on Vercel, API on Railway.

## Brand Commitments
- Working name **Aangan** (neutral placeholder chosen 2026-10-14 to replace "99acres Clone"; swap freely). Must not imitate 99acres branding.

## Evidence on Hand
- Homepage audience stats (12L+ properties, 4.5L+ owners, 100+ cities, 50L+ families) and city counts are **placeholders kept at the user's request**, not real data.
- No testimonials, press, or partner logos exist. Do not fabricate.
- Hero footage: `apps/web/public/assets/hero-bg.mp4` (aerial drone footage).

## Product Principles
1. The listing is the hero: price, configuration and locality must be scannable in one glance.
2. Every lead counts: contact paths are always one step away and never fail silently.
3. Trust is earned with facts (verification state, listing date, real counts), not adjectives.
