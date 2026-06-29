import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error("S3 storage is not configured. Set AWS_S3_BUCKET and AWS_REGION.");
  return { bucket, region };
}

export async function uploadGeneratedImage(input: {
  bytes: Uint8Array;
  campaignId: string;
  contentType?: string;
}) {
  return uploadGeneratedAsset({
    ...input,
    fallbackExtension: "png",
  });
}

export async function uploadGeneratedVideo(input: {
  bytes: Uint8Array;
  campaignId: string;
  contentType?: string;
}) {
  return uploadGeneratedAsset({
    ...input,
    fallbackExtension: "mp4",
  });
}

function extensionFromContentType(contentType?: string, fallback = "bin") {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "video/mp4") return "mp4";
  if (normalized === "video/webm") return "webm";
  if (normalized === "video/quicktime") return "mov";
  return fallback;
}

async function uploadGeneratedAsset(input: {
  bytes: Uint8Array;
  campaignId: string;
  contentType?: string;
  fallbackExtension: string;
}) {
  const { bucket, region } = getS3Config();
  const prefix = (process.env.AWS_S3_PREFIX || "marketingos").replace(/^\/+|\/+$/g, "");
  const extension = extensionFromContentType(input.contentType, input.fallbackExtension);
  const key = `${prefix}/campaigns/${input.campaignId}/${crypto.randomUUID()}.${extension}`;
  const client = new S3Client({ region });
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: input.bytes,
    ContentType: input.contentType || (input.fallbackExtension === "mp4" ? "video/mp4" : "image/png"),
  }));

  const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("AWS_S3_PUBLIC_BASE_URL is required for image previews. Use a CloudFront distribution or a public S3 URL.");
  }
  return { key, url: `${baseUrl}/${key}` };
}
