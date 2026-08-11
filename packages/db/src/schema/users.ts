import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "buyer",
  "seller",
  "agent",
  "builder",
  "admin",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
  "pending_verification",
]);

// ─── Table ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firebaseUid: varchar("firebase_uid", { length: 128 }).unique(),
    email: varchar("email", { length: 256 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("buyer"),
    status: userStatusEnum("status").notNull().default("active"),
    isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    reraNumber: varchar("rera_number", { length: 64 }), // for agents/builders
    agencyName: varchar("agency_name", { length: 256 }),
    bio: text("bio"),
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
    index("users_email_idx").on(t.email),
    index("users_phone_idx").on(t.phone),
    index("users_firebase_uid_idx").on(t.firebaseUid),
    index("users_role_idx").on(t.role),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
