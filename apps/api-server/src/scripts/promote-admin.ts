/**
 * Promote an existing account to moderator (admin).
 *   pnpm --filter @99acres/api-server admin:promote someone@example.com
 * Admins can publish listings and grant the verified seal from /dashboard/moderation.
 */
import { db, users } from "@99acres/db";
import { eq } from "drizzle-orm";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: admin:promote <email>");
  process.exit(1);
}

const [updated] = await db
  .update(users)
  .set({ role: "admin" })
  .where(eq(users.email, email))
  .returning({ id: users.id, email: users.email });

if (!updated) {
  console.error(`No account with email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}

console.log(`${updated.email} is now an admin. Sign out and back in to pick up the new role.`);
process.exit(0);
