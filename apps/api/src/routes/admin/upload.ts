import { createHash } from "node:crypto";
import { prisma } from "@repo/db";
import sharp from "sharp";
import { env } from "../../env";
import { putObject } from "../../lib/storage";
import { readSessionCookie, sessionFromToken } from "./session";

/**
 * Image upload (CR-3, docs/PLAN.md §3.3).
 *
 * Uploads go through the API rather than a presigned PUT straight to storage.
 * The point is not throughput: a non-technical client uploads 8 MB phone
 * photos, so the server checks the real type from the file header, strips
 * EXIF (GPS included — a home address must not ship inside a product photo),
 * auto-orients, and re-encodes to one 1600px webp. next/image handles the
 * responsive sizes from there, so we do not store four variants ourselves.
 */
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1600;

/** Magic bytes, because a declared MIME type is just a claim. */
function sniff(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export type UploadResult =
  | { ok: true; status: 201; media: Record<string, unknown> }
  | { ok: false; status: 401 | 413 | 415 | 422 | 503; error: string };

export async function handleUpload(request: Request): Promise<UploadResult> {
  const user = await sessionFromToken(readSessionCookie(request.headers));
  if (!user) return { ok: false, status: 401, error: "Please sign in again." };

  // Reject on the declared length before buffering anything.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `That file is ${(declared / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`,
    };
  }

  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "").slice(0, 300);

  if (!(file instanceof File)) {
    return { ok: false, status: 422, error: "No file was attached." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`,
    };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const kind = sniff(input);
  if (!kind) {
    // HEIC from an iPhone lands here, and so does a PDF renamed .jpg.
    return {
      ok: false,
      status: 415,
      error:
        "That is not a JPEG, PNG or WebP image. If it came from an iPhone, save it as JPEG first.",
    };
  }

  try {
    const processed = await sharp(input)
      .rotate() // applies the EXIF orientation, then drops the tag
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    // Content hash as the key: re-uploading the same file reuses the record.
    const hash = createHash("sha256")
      .update(processed.data)
      .digest("hex")
      .slice(0, 24);
    const key = `media/${hash}.webp`;

    const existing = await prisma.media.findUnique({ where: { key } });
    if (existing) {
      return { ok: true, status: 201, media: existing as never };
    }

    await putObject(key, processed.data, "image/webp", {
      bucket: env.R2_MEDIA_BUCKET,
    });

    const media = await prisma.media.create({
      data: {
        key,
        url: env.R2_PUBLIC_URL
          ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
          : `/api/media/${hash}.webp`,
        alt,
        width: processed.info.width,
        height: processed.info.height,
        bytes: processed.data.byteLength,
        mimeType: "image/webp",
      },
    });

    return { ok: true, status: 201, media: media as never };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "We couldn't process that image. Please try again.",
    };
  }
}
