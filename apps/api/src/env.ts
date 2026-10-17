import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// src/env.ts in dev, dist/index.js in prod — both sit one level under the app root.
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// App-local .env wins; the repo root .env is the shared fallback (Prisma reads it too).
config({
  path: [resolve(appRoot, ".env"), resolve(appRoot, "../../.env")],
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Not `PORT`: `next dev` reads that too, and both apps share the root .env.
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  /** Comma-separated list of allowed browser origins. */
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Shared secret guarding the admin-only endpoints. */
  ADMIN_API_KEY: z.string().optional(),

  // ── Kundali (CR-2) ──────────────────────────────────────────────────────
  /**
   * Chart data provider. Unset means the built-in sample provider, which
   * produces a clearly-watermarked placeholder chart so the pipeline can be
   * developed and demoed without a paid key (docs/PLAN.md §3.2).
   */
  KUNDALI_API_URL: z.string().optional(),
  KUNDALI_API_KEY: z.string().optional(),
  /** North Indian (diamond) or South Indian (square) chart layout. */
  KUNDALI_CHART_STYLE: z.enum(["north", "south"]).default("north"),

  // ── Object storage ──────────────────────────────────────────────────────
  /**
   * Generated PDFs. With no R2 credentials they are written under this
   * directory instead — fine locally, not on a host with an ephemeral disk.
   */
  STORAGE_DIR: z.string().default(".data/storage"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  /** Private bucket: Kundali PDFs only, never public-read. */
  R2_PRIVATE_BUCKET: z.string().optional(),
  /** Public bucket + its CDN host: admin media uploads (CR-3). */
  R2_MEDIA_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // ── Admin platform (CR-3) ───────────────────────────────────────────────
  BETTER_AUTH_SECRET: z.string().optional(),
  /** The API's own public URL, e.g. https://api.haarivedon.com. */
  BETTER_AUTH_URL: z.string().default("http://localhost:4000"),
  /** Cookie domain shared by the web app and the API, e.g. .haarivedon.com. */
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  /** Seeded first admin account. */
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  /** Shared secret for the web app's on-publish revalidation hook. */
  REVALIDATE_SECRET: z.string().optional(),
  /** The web app's base URL, for revalidation callbacks. */
  WEB_URL: z.string().default("http://localhost:3000"),

  // ── Store / Razorpay (store CR) ─────────────────────────────────────────
  /**
   * Razorpay API credentials. With no key pair the store is disabled: Buy Now
   * is hidden and checkout refuses, so the catalogue still works without them.
   * `KEY_ID` is publishable; `KEY_SECRET` and `WEBHOOK_SECRET` stay server-side.
   */
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment:",
    z.flattenError(parsed.error).fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
export const isProduction = env.NODE_ENV === "production";
