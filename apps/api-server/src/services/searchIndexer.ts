import type { Property } from "@99acres/db";
import { db, properties, propertyImages } from "@99acres/db";
import { eq, isNull } from "drizzle-orm";

import { opensearch, PROPERTY_INDEX } from "../config/opensearch.js";

/**
 * OpenSearch Search Indexer Service
 *
 * Responsible for keeping the OpenSearch index in sync with PostgreSQL.
 * Called after property CRUD operations (create, update, delete).
 */
class SearchIndexer {
  /**
   * Index (or re-index) a single property.
   * Fetches the cover image and builds a flattened document.
   */
  async indexProperty(property: Property): Promise<void> {
    // Fetch cover image
    const [coverImage] = await db
      .select({ cdnUrl: propertyImages.cdnUrl })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, property.id))
      .orderBy(propertyImages.sortOrder)
      .limit(1);

    const doc = {
      id: property.id,
      slug: property.slug,
      title: property.title,
      description: property.description,
      listingType: property.listingType,
      propertyType: property.propertyType,
      city: property.city,
      locality: property.locality,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      price: Number(property.price),
      builtUpArea: property.builtUpArea !== null ? Number(property.builtUpArea) : null,
      furnishingStatus: property.furnishingStatus,
      possessionStatus: property.possessionStatus,
      status: property.status,
      isVerified: property.isVerified,
      isFeatured: property.isFeatured,
      coverImageUrl: coverImage?.cdnUrl ?? null,
      // OpenSearch geo_point format: { lat, lon }
      location:
        property.latitude && property.longitude
          ? { lat: Number(property.latitude), lon: Number(property.longitude) }
          : null,
      listedAt: property.listedAt?.toISOString() ?? null,
      createdAt: property.createdAt.toISOString(),
    };

    await opensearch.index({
      index: PROPERTY_INDEX,
      id: property.id,
      body: doc,
      refresh: "wait_for", // ensure immediate searchability in dev
    });

    console.log(`🔍 Indexed property ${property.id} (${property.slug})`);
  }

  /**
   * Update specific fields in an existing document (partial update).
   */
  async updateProperty(
    propertyId: string,
    partialDoc: Partial<{
      title: string;
      price: number;
      status: string;
      isVerified: boolean;
      isFeatured: boolean;
    }>
  ): Promise<void> {
    await opensearch.update({
      index: PROPERTY_INDEX,
      id: propertyId,
      body: { doc: partialDoc },
    });
  }

  /**
   * Remove a property from the search index (on soft-delete or archive).
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      await opensearch.delete({ index: PROPERTY_INDEX, id: propertyId });
      console.log(`🗑️  Removed property ${propertyId} from index`);
    } catch (err) {
      // Ignore 404 — might not have been indexed
      if ((err as { statusCode?: number }).statusCode !== 404) throw err;
    }
  }

  /**
   * Bulk re-index all active properties (for initial setup or re-indexing).
   */
  async bulkReindex(batchSize = 100): Promise<number> {
    let offset = 0;
    let indexed = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await db
        .select()
        .from(properties)
        .where(eq(properties.status, "active"))
        .limit(batchSize)
        .offset(offset);

      if (batch.length === 0) break;

      const operations = batch.flatMap((p) => [
        { index: { _index: PROPERTY_INDEX, _id: p.id } },
        {
          id: p.id,
          slug: p.slug,
          title: p.title,
          listingType: p.listingType,
          propertyType: p.propertyType,
          city: p.city,
          locality: p.locality,
          bedrooms: p.bedrooms,
          price: Number(p.price),
          status: p.status,
          isVerified: p.isVerified,
          isFeatured: p.isFeatured,
          location: p.latitude && p.longitude
            ? { lat: Number(p.latitude), lon: Number(p.longitude) }
            : null,
          listedAt: p.listedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        },
      ]);

      await opensearch.bulk({ body: operations, refresh: false });
      indexed += batch.length;
      offset += batchSize;

      console.log(`📦 Bulk indexed ${indexed} properties...`);
    }

    await opensearch.indices.refresh({ index: PROPERTY_INDEX });
    console.log(`✅ Bulk re-index complete: ${indexed} properties`);
    return indexed;
  }
}

export const searchIndexer = new SearchIndexer();
