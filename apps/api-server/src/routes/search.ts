import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { opensearch, PROPERTY_INDEX } from "../config/opensearch.js";

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
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) {
      return reply.send({ data: [] });
    }

    const response = await opensearch.search({
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
