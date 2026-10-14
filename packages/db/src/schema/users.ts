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
    email: varchar("email", { length: 256 }).unique(),
    phone: varchar("phone", { length: 20 }).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    // scrypt hash ("salt:hash", hex). Null for accounts without a password.
    passwordHash: text("password_hash"),
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
    index("users_role_idx").on(t.role),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Password reset tokens ────────────────────────────────────────────────────
// Only a SHA-256 hash of the emailed token is stored.

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("password_reset_tokens_user_idx").on(t.userId)]
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
