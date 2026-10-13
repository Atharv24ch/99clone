import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { properties } from "./properties.js";
import { users } from "./users.js";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "visited",
  "negotiating",
  "converted",
  "lost",
  "spam",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "property_page",
  "search_results",
  "map_view",
  "featured_ad",
  "organic",
  "whatsapp",
  "phone",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    // The buyer who submitted the enquiry (null if anonymous)
    buyerId: uuid("buyer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Agent/seller who owns this listing (denormalised for fast routing)
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Buyer contact info (captured even for anonymous)
    name: varchar("name", { length: 256 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 256 }),
    message: text("message"),

    status: leadStatusEnum("status").notNull().default("new"),
    source: leadSourceEnum("source").notNull().default("property_page"),

    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    firstContactAt: timestamp("first_contact_at", { withTimezone: true }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("leads_property_idx").on(t.propertyId),
    index("leads_owner_idx").on(t.ownerId),
    index("leads_buyer_idx").on(t.buyerId),
    index("leads_status_idx").on(t.status),
    index("leads_created_at_idx").on(t.createdAt),
  ]
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
