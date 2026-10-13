import { db, properties } from "@99acres/db";
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
 * Geo-spatial search using the Haversine formula over the lat/lng decimal
 * columns. Works on standard Postgres (Neon free tier) with no extensions.
 */
class GeoSearchService {
  async findNearby(options: NearbyOptions): Promise<NearbyResult[]> {
    const { lat, lng, radiusKm, limit, listingType } = options;

    const haversineKm = sql<number>`
      (6371 * acos(
        LEAST(1.0,
          cos(radians(${lat})) *
          cos(radians(latitude::float)) *
          cos(radians(longitude::float) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(latitude::float))
        )
      ))
    `;

    const conditions = [
      isNull(properties.deletedAt),
      eq(properties.status, "active"),
      sql`latitude IS NOT NULL AND longitude IS NOT NULL`,
      sql`latitude  BETWEEN ${lat - radiusKm / 111.0} AND ${lat + radiusKm / 111.0}`,
      sql`longitude BETWEEN ${lng - radiusKm / 111.0} AND ${lng + radiusKm / 111.0}`,
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
        distanceKm: sql<number>`ROUND(${haversineKm}::numeric, 2)`,
      })
      .from(properties)
      .where(and(...conditions))
      .orderBy(haversineKm)
      .limit(limit);

    return rows as NearbyResult[];
  }

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
          sql`latitude  BETWEEN ${swLat} AND ${neLat}`,
          sql`longitude BETWEEN ${swLng} AND ${neLng}`
        )
      )
      .groupBy(properties.locality)
      .orderBy(sql`count(*) DESC`)
      .limit(200) as Promise<Array<{ locality: string; count: number; lat: string; lng: string }>>;
  }
}

export const geoSearchService = new GeoSearchService();
