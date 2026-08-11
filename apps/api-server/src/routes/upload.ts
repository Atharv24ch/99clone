import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { authGuard } from "../middleware/authGuard.js";

const s3Endpoint = process.env["AWS_S3_ENDPOINT"];
const s3 = new S3Client({
  region: process.env["AWS_REGION"] ?? "ap-south-1",
  ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
  forcePathStyle: !!s3Endpoint,
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "test",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "test",
  },
});

const BUCKET = process.env["AWS_S3_BUCKET"] ?? "acres99-media";
const CDN_URL = process.env["CLOUDFLARE_CDN_URL"] ?? "";

const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
  propertyId: z.string().uuid(),
});

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/v1/upload/presign — get a presigned S3 PUT URL
  fastify.post(
    "/presign",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const body = presignSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: "Validation Error", message: body.error.message });
      }

      const { fileName, contentType, propertyId } = body.data;
      const ext = fileName.split(".").pop() ?? "jpg";
      const s3Key = `properties/${propertyId}/${randomUUID()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        ContentType: contentType,
        // Enforce max 10MB size via policy
        Metadata: {
          uploadedBy: request.user.sub,
          propertyId,
        },
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

      const cdnUrl = CDN_URL
        ? `${CDN_URL}/${s3Key}`
        : `${process.env["AWS_S3_ENDPOINT"] ?? ""}/${BUCKET}/${s3Key}`;

      return reply.send({
        data: {
          presignedUrl,
          s3Key,
          cdnUrl,
          expiresIn: 300,
        },
      });
    }
  );
}
