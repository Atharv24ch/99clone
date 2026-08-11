import { Worker } from "bullmq";
import sharp from "sharp";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { db, propertyImages } from "@99acres/db";
import { eq } from "drizzle-orm";
import { Readable } from "stream";

import { createWorkerRedis } from "../config/redis.js";

const redis = createWorkerRedis();
const BUCKET = process.env["AWS_S3_BUCKET"] ?? "acres99-media";
const WATERMARK_TEXT = "99acres.com";

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

interface ImageJobData {
  imageId: string;
  s3Key: string;
  propertyId: string;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

/**
 * BullMQ worker for image processing:
 * 1. Downloads the original image from S3
 * 2. Adds a semi-transparent watermark using sharp
 * 3. Creates a thumbnail (400x300)
 * 4. Uploads processed versions back to S3
 * 5. Updates the DB record with thumbnail URL and watermark status
 */
const imageWorker = new Worker<ImageJobData>(
  "image-processing",
  async (job) => {
    const { imageId, s3Key, propertyId } = job.data;

    console.log(`🖼️  Processing image ${imageId} for property ${propertyId}`);

    // 1. Download from S3
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    const s3Response = await s3.send(getCmd);
    const originalBuffer = await streamToBuffer(s3Response.Body as Readable);

    // 2. Create SVG watermark overlay
    const watermarkSvg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="40">
        <text
          x="50%" y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="18"
          fill="white"
          fill-opacity="0.6"
          stroke="black"
          stroke-width="0.5"
          stroke-opacity="0.3"
        >${WATERMARK_TEXT}</text>
      </svg>
    `);

    // 3. Apply watermark + optimize
    const watermarkedBuffer = await sharp(originalBuffer)
      .resize({ width: 1200, height: 900, fit: "inside", withoutEnlargement: true })
      .composite([{ input: watermarkSvg, gravity: "southeast" }])
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // 4. Create thumbnail
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize({ width: 400, height: 300, fit: "cover" })
      .jpeg({ quality: 75 })
      .toBuffer();

    // 5. Upload watermarked + thumbnail
    const watermarkedKey = s3Key.replace(/(\.[^.]+)$/, "_wm$1");
    const thumbnailKey = s3Key.replace(/(\.[^.]+)$/, "_thumb$1");

    await Promise.all([
      s3.send(new PutObjectCommand({
        Bucket: BUCKET, Key: watermarkedKey,
        Body: watermarkedBuffer, ContentType: "image/jpeg",
      })),
      s3.send(new PutObjectCommand({
        Bucket: BUCKET, Key: thumbnailKey,
        Body: thumbnailBuffer, ContentType: "image/jpeg",
      })),
    ]);

    const cdnBase = process.env["CLOUDFLARE_CDN_URL"]
      ?? `${process.env["AWS_S3_ENDPOINT"] ?? ""}/${BUCKET}`;

    // 6. Update DB
    await db
      .update(propertyImages)
      .set({
        isWatermarked: true,
        thumbnailUrl: `${cdnBase}/${thumbnailKey}`,
        cdnUrl: `${cdnBase}/${watermarkedKey}`,
      })
      .where(eq(propertyImages.id, imageId));

    console.log(`✅ Image ${imageId} processed successfully`);
    return { imageId, watermarkedKey, thumbnailKey };
  },
  {
    connection: redis,
    concurrency: 5, // process 5 images in parallel
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  }
);

imageWorker.on("failed", (job, err) => {
  console.error(`❌ Image job ${job?.id ?? "unknown"} failed:`, err.message);
});

imageWorker.on("completed", (job) => {
  console.log(`✅ Image job ${job.id} completed`);
});

console.log("🖼️  Image processing worker started");
