import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const projectStatusEnum = pgEnum("project_status", [
  "pre_launch",
  "new_launch",
  "under_construction",
  "ready_to_move",
  "completed",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 512 }).notNull().unique(),
    name: varchar("name", { length: 512 }).notNull(),
    description: text("description"),

    builderId: uuid("builder_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    status: projectStatusEnum("status").notNull().default("new_launch"),

    // Location
    address: text("address").notNull(),
    locality: varchar("locality", { length: 256 }).notNull(),
    city: varchar("city", { length: 128 }).notNull(),
    state: varchar("state", { length: 128 }).notNull(),
    pincode: varchar("pincode", { length: 10 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),

    // Project details
    totalUnits: integer("total_units"),
    totalTowers: integer("total_towers"),
    minPrice: decimal("min_price", { precision: 16, scale: 2 }),
    maxPrice: decimal("max_price", { precision: 16, scale: 2 }),
    minArea: decimal("min_area", { precision: 10, scale: 2 }),
    maxArea: decimal("max_area", { precision: 10, scale: 2 }),
    launchDate: timestamp("launch_date", { withTimezone: true }),
    completionDate: timestamp("completion_date", { withTimezone: true }),

    reraNumber: varchar("rera_number", { length: 128 }),
    websiteUrl: text("website_url"),
    brochureUrl: text("brochure_url"),
    coverImageUrl: text("cover_image_url"),

    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),

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
    index("projects_builder_idx").on(t.builderId),
    index("projects_city_idx").on(t.city),
    index("projects_status_idx").on(t.status),
    index("projects_featured_idx").on(t.isFeatured),
    index("projects_slug_idx").on(t.slug),
  ]
);

// ─── Localities master ────────────────────────────────────────────────────────

export const localities = pgTable(
  "localities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull(),
    city: varchar("city", { length: 128 }).notNull(),
    state: varchar("state", { length: 128 }).notNull(),
    pincode: varchar("pincode", { length: 10 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    propertyCount: integer("property_count").notNull().default(0),
  },
  (t) => [
    index("localities_city_idx").on(t.city),
    index("localities_name_idx").on(t.name),
  ]
);

// ─── Saved Searches ───────────────────────────────────────────────────────────

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }),
    filters: text("filters").notNull(), // JSON string of filter state
    alertEnabled: boolean("alert_enabled").notNull().default(false),
    lastAlertAt: timestamp("last_alert_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("saved_searches_user_idx").on(t.userId)]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Locality = typeof localities.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
