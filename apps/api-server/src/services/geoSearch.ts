import { db, properties, propertyImages } from "@99acres/db";
import { sql, and, isNull, eq } from "drizzle-orm";

interface NearbyOptions {
  lat: number;
  lng: number;
  radiusKm: number;
  limit: number;
  listingType?: string;
}

interface NearbyResult {
  id: string;
  slug: string;
  title: string;
  listingType: string;
  propertyType: string;
  price: string;
  bedrooms: number | null;
  locality: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  distanceKm: number;
  isVerified: boolean;
  isFeatured: boolean;
}

/**
 * Geo-spatial search service using PostGIS ST_DWithin for efficient
 * radius-based property discovery. Uses the GIST-indexed geometry column.
 */
class GeoSearchService {
  /**
   * Find properties within `radiusKm` of a given coordinate using PostGIS.
   *
   * ST_DWithin operates on the GIST-indexed `location` geometry column,
   * giving sub-millisecond lookups even with millions of rows.
   *
   * ST_Distance returns the distance in metres (geography type).
   */
  async findNearby(options: NearbyOptions): Promise<NearbyResult[]> {
    const { lat, lng, radiusKm, limit, listingType } = options;

    // ST_MakePoint(lng, lat) — note PostGIS convention: X=longitude, Y=latitude
    const pointWkt = `POINT(${lng} ${lat})`;
    const radiusMetres = radiusKm * 1000;

    const conditions = [
      isNull(properties.deletedAt),
      eq(properties.status, "active"),
      sql`ST_DWithin(
        location::geography,
        ST_GeomFromText(${pointWkt}, 4326)::geography,
        ${radiusMetres}
      )`,
    ];

    if (listingType) {
      conditions.push(eq(properties.listingType, listingType as "buy" | "rent"));
    }

    const rows = await db
      .select({
        id: properties.id,
        slug: properties.slug,
        title: properties.title,
        listingType: properties.listingType,
        propertyType: properties.propertyType,
        price: properties.price,
        bedrooms: properties.bedrooms,
        locality: properties.locality,
        city: properties.city,
        latitude: properties.latitude,
        longitude: properties.longitude,
        isVerified: properties.isVerified,
        isFeatured: properties.isFeatured,
        // Distance in km via PostGIS geography ST_Distance
        distanceKm: sql<number>`
          ROUND(
            (ST_Distance(
              location::geography,
              ST_GeomFromText(${pointWkt}, 4326)::geography
            ) / 1000.0)::numeric,
            2
          )
        `,
      })
      .from(properties)
      .where(and(...conditions))
      .orderBy(
        sql`ST_Distance(
          location::geography,
          ST_GeomFromText(${pointWkt}, 4326)::geography
        ) ASC`
      )
      .limit(limit);

    return rows as NearbyResult[];
  }

  /**
   * Get properties grouped by locality within a bounding box.
   * Used for map cluster data.
   */
  async getClusterData(
    swLat: number, swLng: number,
    neLat: number, neLng: number
  ): Promise<Array<{ locality: string; count: number; lat: string; lng: string }>> {
    return db
      .select({
        locality: properties.locality,
        count: sql<number>`count(*)`,
        lat: sql<string>`AVG(latitude)::text`,
        lng: sql<string>`AVG(longitude)::text`,
      })
      .from(properties)
      .where(
        and(
          isNull(properties.deletedAt),
          eq(properties.status, "active"),
          sql`latitude BETWEEN ${swLat} AND ${neLat}`,
          sql`longitude BETWEEN ${swLng} AND ${neLng}`
        )
      )
      .groupBy(properties.locality)
      .orderBy(sql`count(*) DESC`)
      .limit(200) as Promise<Array<{ locality: string; count: number; lat: string; lng: string }>>;
  }
}

export const geoSearchService = new GeoSearchService();
