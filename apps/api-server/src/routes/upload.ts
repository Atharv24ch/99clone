import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { db, properties } from "@99acres/db";
import { eq } from "drizzle-orm";

import { authGuard } from "../middleware/authGuard.js";
import { s3, S3_BUCKET, publicMediaBase } from "../config/s3.js";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const presignSchema = z.object({
  fileName: z.string().min(1).max(256),
  contentType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
  propertyId: z.string().uuid(),
});

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/upload/presign — get a presigned S3 PUT URL for a listing photo
  fastify.post(
    "/presign",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const body = presignSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.issues[0]?.message ?? "Invalid input" });
      }

      const { contentType, propertyId } = body.data;

      const [property] = await db
        .select({ ownerId: properties.ownerId })
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!property) return reply.status(404).send({ error: "Not Found", message: "Property not found" });
      if (property.ownerId !== request.user.sub && request.user.role !== "admin") {
        return reply.status(403).send({ error: "Forbidden", message: "You don't own this listing" });
      }

      // Extension comes from the validated content type, never from the client file name
      const s3Key = `properties/${propertyId}/${randomUUID()}.${EXTENSIONS[contentType] ?? "jpg"}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: contentType,
        Metadata: {
          uploadedBy: request.user.sub,
          propertyId,
        },
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

      return reply.send({
        data: {
          presignedUrl,
          s3Key,
          cdnUrl: `${publicMediaBase()}/${s3Key}`,
          expiresIn: 300,
        },
      });
    }
  );
}
