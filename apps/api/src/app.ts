import { contract } from "@repo/contract";
import {
  createFetchHandler,
  TsRestHttpError,
  TsRestResponse,
} from "@ts-rest/serverless/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prisma } from "@repo/db";
import { env, isProduction } from "./env";
import { getObject } from "./lib/storage";
import { handleUpload } from "./routes/admin/upload";
import { readSessionCookie, sessionFromToken } from "./routes/admin/session";
import { exportRows, toCsv } from "./lib/csv";
import { logger } from "./lib/logger";
import { router } from "./router";

type SchemaFailure = { issues?: readonly unknown[] } | null | undefined;

/**
 * ts-rest throws `TsRestRequestValidationError` on a failed request schema, but
 * does not export the class — match on its shape instead.
 */
type RequestValidationFailure = TsRestHttpError & {
  pathParamsError: SchemaFailure;
  headersError: SchemaFailure;
  queryError: SchemaFailure;
  bodyError: SchemaFailure;
};

const isRequestValidationError = (
  error: unknown,
): error is RequestValidationFailure =>
  error instanceof TsRestHttpError &&
  error.statusCode === 400 &&
  "bodyError" in error;

const collectIssues = (error: RequestValidationFailure) => [
  ...(error.pathParamsError?.issues ?? []),
  ...(error.headersError?.issues ?? []),
  ...(error.queryError?.issues ?? []),
  ...(error.bodyError?.issues ?? []),
];

/**
 * The ts-rest handler owns every route declared in the contract. Hono wraps it
 * so cross-cutting concerns (CORS, logging, non-contract endpoints such as
 * webhooks or file uploads) have an obvious home.
 */
const tsRestHandler = createFetchHandler(contract, router, {
  responseValidation: !isProduction,
  errorHandler: (error) => {
    // ts-rest answers validation failures with 400 and its own envelope; the
    // contract promises 422 + `{ error, issues }`, so translate it here.
    if (isRequestValidationError(error)) {
      return TsRestResponse.fromJson(
        { error: "Validation failed.", issues: collectIssues(error) },
        { status: 422 },
      );
    }

    if (error instanceof TsRestHttpError) return;

    logger.error("Unhandled API error", error);
  },
});

export const createApp = () => {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGIN,
      allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );

  app.use("*", async (c, next) => {
    const start = performance.now();
    await next();
    logger.debug(
      `${c.req.method} ${c.req.path} -> ${c.res.status} (${Math.round(
        performance.now() - start,
      )}ms)`,
    );
  });

  // Non-contract routes must be registered before the contract catch-all.
  //
  // CSV export of an inbox. Outside ts-rest because the response is a file,
  // and session-guarded like everything else under /api/admin.
  app.get("/api/admin/export/:kind", async (c) => {
    const user = await sessionFromToken(readSessionCookie(c.req.raw.headers));
    if (!user) return c.json({ error: "Please sign in again." }, 401);

    const kind = c.req.param("kind");
    const rows = await exportRows(kind);
    if (!rows) return c.json({ error: "Not found." }, 404);

    logger.info("inbox exported", { kind, by: user.email, rows: rows.length });

    const today = new Date().toISOString().slice(0, 10);
    return c.body(toCsv(rows), 200, {
      "content-type": "text/csv; charset=utf-8",
      // No personal data in the filename — it ends up in download folders,
      // chat attachments and screen shares.
      "content-disposition": `attachment; filename="haarivedon-${kind}-${today}.csv"`,
      "cache-control": "private, no-store",
    });
  });

  //
  // Multipart upload: ts-rest handlers take JSON bodies, so the image
  // pipeline sits outside the contract (docs/PLAN.md §3.3).
  app.post("/api/admin/media/upload", async (c) => {
    const result = await handleUpload(c.req.raw as Request);
    return result.ok
      ? c.json(result.media, 201)
      : c.json({ error: result.error }, result.status);
  });

  // Media served from disk when no R2 bucket is configured (local dev only).
  app.get("/api/media/:file", async (c) => {
    const file = c.req.param("file");
    if (!/^[a-f0-9]{24}\.webp$/.test(file)) {
      return c.json({ error: "Not found." }, 404);
    }

    const bytes = await getObject(`media/${file}`, { bucket: env.R2_MEDIA_BUCKET });
    if (!bytes) return c.json({ error: "Not found." }, 404);

    return c.body(new Uint8Array(bytes), 200, {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
    });
  });

  //
  // The Kundali PDF is a file stream, not JSON, so it lives outside ts-rest.
  // It is gated on the one-time token issued with the booking: birth details
  // must never sit behind a guessable URL (docs/PLAN.md §3.2).
  app.get("/api/kundali/:id/download", async (c) => {
    const token = c.req.query("token");
    if (!token) return c.json({ error: "Not found." }, 404);

    const booking = await prisma.booking.findUnique({
      where: { id: c.req.param("id") },
      select: { name: true, kundaliKey: true, kundaliToken: true },
    });

    // A wrong token is answered exactly like a missing booking.
    if (!booking?.kundaliKey || booking.kundaliToken !== token) {
      return c.json({ error: "Not found." }, 404);
    }

    const file = await getObject(booking.kundaliKey);
    if (!file) return c.json({ error: "Not found." }, 404);

    const filename = `Kundali-${booking.name.replace(/[^\w]+/g, "-")}.pdf`;
    return c.body(new Uint8Array(file), 200, {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    });
  });

  // Everything declared in @repo/contract.
  //
  // @hono/node-server hands over a lightweight Request shim; ts-rest subclasses
  // the real `Request`, which rejects the shim. Rebuild a genuine one first.
  app.all("/api/*", (c) => {
    const raw = c.req.raw;
    const request = new Request(raw.url, {
      method: raw.method,
      headers: raw.headers,
      body: raw.body,
      ...(raw.body ? { duplex: "half" } : {}),
    } as RequestInit);

    return tsRestHandler(request);
  });

  app.notFound((c) => c.json({ error: "Not found." }, 404));

  app.onError((error, c) => {
    logger.error("Unhandled server error", error);
    return c.json({ error: "Internal server error." }, 500);
  });

  return app;
};

export type App = ReturnType<typeof createApp>;
