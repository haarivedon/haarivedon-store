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
