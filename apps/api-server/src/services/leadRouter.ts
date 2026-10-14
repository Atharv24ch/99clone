import type { Lead } from "@99acres/db";
import { db, users, properties } from "@99acres/db";
import { eq, sql } from "drizzle-orm";
import { Queue } from "bullmq";

import { redis } from "../config/redis.js";

const notificationQueue = new Queue("notifications", { connection: redis });

/**
 * Lead Router Service
 *
 * Responsible for:
 * 1. Finding the best agent/owner to assign a lead to
 * 2. Sending instant notification to the agent (SMS/WhatsApp via queue)
 * 3. Updating lead assignment in DB
 * 4. Incrementing lead_count on the property
 */
class LeadRouterService {
  async routeLead(lead: Lead): Promise<void> {
    // 1. Get owner/agent details
    const [owner] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        email: users.email,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, lead.ownerId))
      .limit(1);

    if (!owner) {
      console.warn(`Lead ${lead.id}: owner ${lead.ownerId} not found`);
      return;
    }

    // 2. Update property lead count
    await db
      .update(properties)
      .set({ leadCount: sql`${properties.leadCount} + 1` })
      .where(eq(properties.id, lead.propertyId));

    // 3. Queue notification to agent
    await notificationQueue.add(
      "lead-notification",
      {
        type: "new_lead",
        leadId: lead.id,
        agentId: owner.id,
        agentPhone: owner.phone,
        agentEmail: owner.email,
        buyerName: lead.name,
        buyerPhone: lead.phone,
        propertyId: lead.propertyId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    console.log(
      `✅ Lead ${lead.id} routed to agent ${owner.id} (${owner.email ?? owner.phone})`
    );
  }
}

export const leadRouterService = new LeadRouterService();
