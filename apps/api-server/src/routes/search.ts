import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, localities, properties } from "@99acres/db";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";

import { opensearch, PROPERTY_INDEX } from "../config/opensearch.js";

/**
 * Postgres fallback for autocomplete when OpenSearch is unavailable.
 */
async function suggestFromDb(q: string) {
  const pattern = `${q}%`;
  const live = and(eq(properties.status, "active"), isNull(properties.deletedAt));
  const [locs, cities] = await Promise.all([
    db
      .select({ label: properties.locality, count: sql<number>`count(*)` })
      .from(properties)
      .where(and(ilike(properties.locality, pattern), live))
      .groupBy(properties.locality)
      .orderBy(desc(sql`count(*)`))
      .limit(8),
    db
      .select({ label: properties.city, count: sql<number>`count(*)` })
      .from(properties)
      .where(and(ilike(properties.city, pattern), live))
      .groupBy(properties.city)
      .orderBy(desc(sql`count(*)`))
      .limit(4),
  ]);

  // Fall back to the localities master when no live listings match yet
  const master = locs.length + cities.length > 0
    ? []
    : await db
        .select({ label: localities.name })
        .from(localities)
        .where(ilike(localities.name, pattern))
        .orderBy(desc(localities.propertyCount))
        .limit(8);

  return [
    ...locs.map((l) => ({ label: l.label, type: "locality" as const, count: Number(l.count) })),
    ...cities.map((c) => ({ label: c.label, type: "city" as const, count: Number(c.count) })),
    ...master.map((m) => ({ label: m.label, type: "locality" as const, count: 0 })),
  ];
}

// ─── Validation ───────────────────────────────────────────────────────────────

const searchSchema = z.object({
  q: z.string().min(1).max(256),
  city: z.string().optional(),
  listingType: z.string().optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  furnishingStatus: z.string().optional(),
  possessionStatus: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().default(10),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/search?q=3bhk+flat+in+gurgaon&city=Gurgaon
  fastify.get("/", async (request, reply) => {
    const query = searchSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: "Bad Request", message: query.error.message });
    }

    const {
      q, city, listingType, propertyType, minPrice, maxPrice,
      minBedrooms, furnishingStatus, possessionStatus,
      lat, lng, radiusKm, page, limit, sortBy,
    } = query.data;

    const from = (page - 1) * limit;

    // ── Build OpenSearch query ──────────────────────────────────────────────

    const must: unknown[] = [
      {
        multi_match: {
          query: q,
          fields: ["title^3", "description", "locality^2", "city"],
          fuzziness: "AUTO",
          type: "best_fields",
        },
      },
      { term: { status: "active" } },
    ];

    const filter: unknown[] = [];

    if (city) filter.push({ match: { "city.keyword": city } });
    if (listingType) filter.push({ term: { listingType } });
    if (propertyType) filter.push({ term: { propertyType } });
    if (furnishingStatus) filter.push({ term: { furnishingStatus } });
    if (possessionStatus) filter.push({ term: { possessionStatus } });
    if (minBedrooms) filter.push({ range: { bedrooms: { gte: minBedrooms } } });
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.push({
        range: {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        },
      });
    }

    // Geo distance filter
    if (lat !== undefined && lng !== undefined) {
      filter.push({
        geo_distance: {
          distance: `${radiusKm}km`,
          location: { lat, lon: lng },
        },
      });
    }

    // Sort
    let sort: unknown[] = ["_score"];
    if (sortBy === "price_asc") sort = [{ price: "asc" }];
    else if (sortBy === "price_desc") sort = [{ price: "desc" }];
    else if (sortBy === "newest") sort = [{ listedAt: "desc" }];

    const esQuery = {
      query: {
        bool: { must, filter },
      },
      sort,
      from,
      size: limit,
      highlight: {
        fields: {
          title: {},
          locality: {},
        },
      },
    };

    const response = await opensearch.search({
      index: PROPERTY_INDEX,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: esQuery as any,
    });

    const hits = response.body.hits;
    // Cast through unknown to avoid strict overlap check
    const typedHits = hits.hits as unknown as Array<{ _id: string; _source: Record<string, unknown>; _score: number; highlight?: unknown }>;
    const results = typedHits.map((hit) => ({
      ...hit._source,
      _score: hit._score,
      _highlight: hit.highlight,
    }));

    return reply.send({
      data: results,
      total: typeof hits.total === "object" ? hits.total.value : hits.total,
      page,
      limit,
      hasMore: from + results.length < (typeof hits.total === "object" ? hits.total.value : (hits.total ?? 0)),
    });
  });

  // GET /api/v1/search/suggest — locality / city autocomplete
  fastify.get("/suggest", async (request, reply) => {
    const raw = (request.query as { q?: string }).q;
    const q = typeof raw === "string" ? raw.trim().slice(0, 64) : "";
    if (q.length < 2) {
      return reply.send({ data: [] });
    }

    let response;
    try {
      response = await opensearch.search({
      index: PROPERTY_INDEX,
      body: {
        size: 0,
        query: {
          bool: {
            should: [
              { match_phrase_prefix: { "locality.keyword": { query: q, max_expansions: 10 } } },
              { match_phrase_prefix: { "city.keyword": { query: q, max_expansions: 10 } } },
            ],
          },
        },
        aggs: {
          localities: {
            terms: { field: "locality.keyword", size: 8 },
          },
          cities: {
            terms: { field: "city.keyword", size: 4 },
          },
        },
      },
    });
    } catch (err) {
      request.log.warn({ err }, "OpenSearch suggest failed; using Postgres fallback");
      return reply.send({ data: await suggestFromDb(q) });
    }

    const aggs = response.body.aggregations;
    type TermBucket = { key: string; doc_count: number };
    type TermAgg = { buckets: TermBucket[] };
    const localitiesBuckets = ((aggs?.["localities"] as TermAgg | undefined)?.buckets ?? []);
    const citiesBuckets = ((aggs?.["cities"] as TermAgg | undefined)?.buckets ?? []);
    const suggestions = [
      ...localitiesBuckets.map((b) => ({
        label: b.key,
        type: "locality" as const,
        count: b.doc_count,
      })),
      ...citiesBuckets.map((b) => ({
        label: b.key,
        type: "city" as const,
        count: b.doc_count,
      })),
    ];

    return reply.send({ data: suggestions });
  });
}
