import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { env } from "../../env";

/**
 * Object storage with two implementations behind one interface.
 *
 * Cloudflare R2 when credentials are present; the local filesystem otherwise,
 * which is enough for development but **not** for a host with an ephemeral
 * disk — set the R2 vars before deploying (docs/PLAN.md §6).
 */
export type StoredObject = { key: string; bytes: number };

const useR2 = Boolean(
  env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_PRIVATE_BUCKET,
);

const localPath = (key: string) => resolve(join(env.STORAGE_DIR, key));

/** Lazily constructed so the SDK is never loaded in a local-only setup. */
async function s3() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
  { bucket = env.R2_PRIVATE_BUCKET }: { bucket?: string } = {},
): Promise<StoredObject> {
  if (useR2) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } else {
    const path = localPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  return { key, bytes: body.byteLength };
}

export async function getObject(
  key: string,
  { bucket = env.R2_PRIVATE_BUCKET }: { bucket?: string } = {},
): Promise<Buffer | null> {
  try {
    if (useR2) {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await s3();
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    }

    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteObject(
  key: string,
  { bucket = env.R2_PRIVATE_BUCKET }: { bucket?: string } = {},
): Promise<void> {
  try {
    if (useR2) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await s3();
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
      return;
    }
    await unlink(localPath(key));
  } catch {
    // Already gone is the desired end state either way.
  }
}
