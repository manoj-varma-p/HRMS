import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { ApiError } from "../errors/ApiError";
import { logger } from "../utils/logger";

let client: S3Client | null = null;

// Lazy — the app must still boot and serve every other feature if S3 isn't
// configured yet (see env.ts). Every function below throws a clear 503
// instead, at the moment something actually needs S3, rather than at boot.
function getClient(): S3Client {
  if (!env.awsRegion || !env.awsAccessKeyId || !env.awsSecretAccessKey) {
    throw new ApiError(
      503,
      "File storage is not configured — set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY"
    );
  }
  if (!client) {
    client = new S3Client({
      region: env.awsRegion,
      credentials: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey,
      },
    });
  }
  return client;
}

function getBucket(): string {
  if (!env.s3BucketName) {
    throw new ApiError(503, "File storage is not configured — set S3_BUCKET_NAME");
  }
  return env.s3BucketName;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // The bucket itself stays fully private (block-public-access ON) —
      // this is not a public-read grant, it's just S3's own per-object ACL
      // default being explicit. Every read goes through either a signed
      // URL (documents) or our own backend proxy (the company logo), never
      // a raw S3 URL.
      ACL: "private",
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
  } catch (err) {
    // Best-effort — a stray orphaned S3 object is a minor cleanup issue,
    // not a reason to fail the delete/replace operation the caller is
    // actually trying to complete.
    logger.error({ err, key }, "Failed to delete S3 object");
  }
}

/** Short-lived, single-purpose download link — never a permanent/public URL. */
export async function getSignedDownloadUrl(
  key: string,
  expirySeconds = 300
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expirySeconds });
}

/** Reads an object's bytes straight through this server — used only for the
 * company logo, which the app proxies rather than exposing any direct or
 * signed S3 URL for (see modules/public). */
export async function getObjectBuffer(
  key: string
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key })
    );
    const chunks: Uint8Array[] = [];
    // In the Node.js runtime (this app never runs in a browser/edge
    // environment) the SDK always returns a Node Readable here, even
    // though the SDK's own type is a broader browser/Node union.
    for await (const chunk of result.Body as NodeJS.ReadableStream) {
      chunks.push(chunk as Uint8Array);
    }
    return {
      body: Buffer.concat(chunks),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
