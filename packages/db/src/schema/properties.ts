import {
  boolean,
  customType,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "./users";

// ─── PostGIS custom type ──────────────────────────────────────────────────────

/**
 * Drizzle doesn't ship a PostGIS geometry type, so we declare it as a
 * customType. Values are read back as WKT strings from PostGIS and written
 * using ST_GeomFromText.
 */
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  fromDriver(val) {
    return val as string;
  },
  toDriver(val) {
    // val expected as "POINT(lng lat)"
    return sql`ST_GeomFromText(${val}, 4326)` as unknown as string;
  },
});

// ─── Enums ────────────────────────────────────────────────────────────────────

export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "independent_house",
  "villa",
  "plot",
  "commercial_office",
  "commercial_shop",
  "warehouse",
  "pg_hostel",
  "farmhouse",
]);

export const listingTypeEnum = pgEnum("listing_type", [
  "buy",
  "rent",
  "pg",
  "commercial_buy",
  "commercial_rent",
  "plot_buy",
  "plot_rent",
  "new_project",
]);

export const furnishingStatusEnum = pgEnum("furnishing_status", [
  "unfurnished",
  "semi_furnished",
  "fully_furnished",
]);

export const possessionStatusEnum = pgEnum("possession_status", [
  "ready_to_move",
  "under_construction",
  "new_launch",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "draft",
  "active",
  "pending_approval",
  "rejected",
  "sold",
  "rented",
  "archived",
]);

export const facingEnum = pgEnum("facing", [
  "north",
  "south",
  "east",
  "west",
  "north_east",
  "north_west",
  "south_east",
  "south_west",
]);

// ─── Properties table ─────────────────────────────────────────────────────────

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 512 }).notNull().unique(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),

    // Listing type & property type
    listingType: listingTypeEnum("listing_type").notNull(),
    propertyType: propertyTypeEnum("property_type").notNull(),

    // Owner / Agent
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    projectId: uuid("project_id"), // nullable, for project-linked listings

    // Pricing
    price: decimal("price", { precision: 16, scale: 2 }).notNull(),
    pricePerSqFt: decimal("price_per_sq_ft", { precision: 12, scale: 2 }),
    isNegotiable: boolean("is_negotiable").notNull().default(false),

    // Area
    builtUpArea: decimal("built_up_area", { precision: 10, scale: 2 }), // sq ft
    carpetArea: decimal("carpet_area", { precision: 10, scale: 2 }),
    plotArea: decimal("plot_area", { precision: 10, scale: 2 }),

    // Configuration
    bedrooms: smallint("bedrooms"),
    bathrooms: smallint("bathrooms"),
    balconies: smallint("balconies"),
    floorNumber: smallint("floor_number"),
    totalFloors: smallint("total_floors"),
    parkingCovered: smallint("parking_covered").default(0),
    parkingOpen: smallint("parking_open").default(0),

    // Status
    status: propertyStatusEnum("status").notNull().default("draft"),
    furnishingStatus: furnishingStatusEnum("furnishing_status"),
    possessionStatus: possessionStatusEnum("possession_status"),
    possessionDate: timestamp("possession_date", { withTimezone: true }),
    facing: facingEnum("facing"),
    ageOfProperty: smallint("age_of_property"), // in years

    // Location
    address: text("address").notNull(),
    locality: varchar("locality", { length: 256 }).notNull(),
    city: varchar("city", { length: 128 }).notNull(),
    state: varchar("state", { length: 128 }).notNull(),
    pincode: varchar("pincode", { length: 10 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    // PostGIS spatial column — queried with ST_DWithin / ST_Distance
    location: geometry("location"),

    // Metadata
    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    leadCount: integer("lead_count").notNull().default(0),

    // Extra JSON — flexible fields (e.g., GST number for commercial)
    meta: jsonb("meta").$type<Record<string, unknown>>(),

    // Timestamps
    listedAt: timestamp("listed_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // Standard indexes
    index("properties_owner_idx").on(t.ownerId),
    index("properties_listing_type_idx").on(t.listingType),
    index("properties_property_type_idx").on(t.propertyType),
    index("properties_city_idx").on(t.city),
    index("properties_locality_idx").on(t.locality),
    index("properties_status_idx").on(t.status),
    index("properties_price_idx").on(t.price),
    index("properties_bedrooms_idx").on(t.bedrooms),
    index("properties_featured_idx").on(t.isFeatured),
    index("properties_slug_idx").on(t.slug),
    // PostGIS GIST spatial index — critical for ST_DWithin radius queries
    index("properties_location_gist_idx").using(
      "gist",
      sql`location`
    ),
    // Trigram index for full-text locality / title search
    index("properties_locality_trgm_idx").using(
      "gin",
      sql`locality gin_trgm_ops`
    ),
    index("properties_title_trgm_idx").using(
      "gin",
      sql`title gin_trgm_ops`
    ),
  ]
);

// ─── Property Images ──────────────────────────────────────────────────────────

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    s3Key: varchar("s3_key", { length: 1024 }).notNull(),
    cdnUrl: text("cdn_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    mimeType: varchar("mime_type", { length: 64 }),
    isWatermarked: boolean("is_watermarked").notNull().default(false),
    isCoverImage: boolean("is_cover_image").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("property_images_property_idx").on(t.propertyId),
    index("property_images_cover_idx").on(t.propertyId, t.isCoverImage),
  ]
);

// ─── Amenities master ─────────────────────────────────────────────────────────

export const amenities = pgTable("amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  category: varchar("category", { length: 64 }), // e.g. "security", "recreation"
  icon: varchar("icon", { length: 64 }),
});

// ─── Property <> Amenity M2M ──────────────────────────────────────────────────

export const propertyAmenities = pgTable(
  "property_amenities",
  {
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    amenityId: uuid("amenity_id")
      .notNull()
      .references(() => amenities.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("property_amenities_property_idx").on(t.propertyId),
  ]
);

// ─── Saved Properties ─────────────────────────────────────────────────────────

export const savedProperties = pgTable(
  "saved_properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("saved_properties_user_idx").on(t.userId),
    index("saved_properties_property_idx").on(t.propertyId),
  ]
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;
export type Amenity = typeof amenities.$inferSelect;
