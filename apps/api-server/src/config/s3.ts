import { S3Client } from "@aws-sdk/client-s3";

const s3Endpoint = process.env["AWS_S3_ENDPOINT"];

// ─── Shared S3 client (LocalStack in dev when AWS_S3_ENDPOINT is set) ─────────

export const s3 = new S3Client({
  region: process.env["AWS_REGION"] ?? "ap-south-1",
  ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
  forcePathStyle: !!s3Endpoint,
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "test",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "test",
  },
});

export const S3_BUCKET = process.env["AWS_S3_BUCKET"] ?? "acres99-media";

/** Public base URL that serves objects from the bucket (CDN in production). */
export function publicMediaBase(): string {
  return process.env["CLOUDFLARE_CDN_URL"] || `${s3Endpoint ?? ""}/${S3_BUCKET}`;
}
