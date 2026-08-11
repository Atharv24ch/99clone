import { Client } from "@opensearch-project/opensearch";

const openSearchUrl =
  process.env["OPENSEARCH_URL"] ?? "http://localhost:9200";

// ─── OpenSearch singleton client ──────────────────────────────────────────────

export const opensearch = new Client({
  node: openSearchUrl,
  // For production with security plugin enabled:
  // auth: { username: process.env.OPENSEARCH_USER, password: process.env.OPENSEARCH_PASSWORD },
  // ssl: { rejectUnauthorized: false },
});

export const PROPERTY_INDEX = process.env["OPENSEARCH_INDEX_PROPERTIES"] ?? "properties";

// ─── Index mapping for properties ─────────────────────────────────────────────

export const propertyIndexMapping = {
  mappings: {
    properties: {
      id: { type: "keyword" },
      slug: { type: "keyword" },
      title: {
        type: "text",
        analyzer: "standard",
        fields: { keyword: { type: "keyword", ignore_above: 512 } },
      },
      description: { type: "text", analyzer: "standard" },
      listingType: { type: "keyword" },
      propertyType: { type: "keyword" },
      city: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      locality: {
        type: "text",
        fields: { keyword: { type: "keyword" } },
      },
      bedrooms: { type: "integer" },
      bathrooms: { type: "integer" },
      price: { type: "double" },
      builtUpArea: { type: "double" },
      furnishingStatus: { type: "keyword" },
      possessionStatus: { type: "keyword" },
      status: { type: "keyword" },
      isVerified: { type: "boolean" },
      isFeatured: { type: "boolean" },
      // Geo point for distance queries
      location: { type: "geo_point" },
      coverImageUrl: { type: "keyword", index: false },
      listedAt: { type: "date" },
      createdAt: { type: "date" },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0, // increase for production
    analysis: {
      analyzer: {
        locality_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
};

/**
 * Creates the properties index if it doesn't already exist.
 */
export async function ensurePropertyIndex(): Promise<void> {
  try {
    const exists = await opensearch.indices.exists({ index: PROPERTY_INDEX });
    if (!exists.body) {
      await opensearch.indices.create({
        index: PROPERTY_INDEX,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: propertyIndexMapping as any,
      });
      console.log(`✅ OpenSearch index '${PROPERTY_INDEX}' created`);
    } else {
      console.log(`✅ OpenSearch index '${PROPERTY_INDEX}' already exists`);
    }
  } catch (err) {
    console.error("❌ OpenSearch index setup failed:", err);
    throw err;
  }
}
