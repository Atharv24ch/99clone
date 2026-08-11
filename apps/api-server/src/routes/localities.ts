import type { FastifyInstance } from "fastify";
import { db, localities } from "@99acres/db";
import { ilike, eq, desc } from "drizzle-orm";

export async function localitiesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/localities?q=gurg&city=Gurugram
  fastify.get("/", async (request, reply) => {
    const { q, city, limit = "10" } = request.query as {
      q?: string;
      city?: string;
      limit?: string;
    };

    const limitNum = Math.min(20, parseInt(limit, 10));
    const conditions = [];

    if (q) conditions.push(ilike(localities.name, `%${q}%`));
    if (city) conditions.push(ilike(localities.city, `%${city}%`));

    const rows = await db
      .select({
        id: localities.id,
        name: localities.name,
        city: localities.city,
        state: localities.state,
        latitude: localities.latitude,
        longitude: localities.longitude,
        propertyCount: localities.propertyCount,
      })
      .from(localities)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(localities.propertyCount))
      .limit(limitNum);

    return reply.send({ data: rows });
  });
}
