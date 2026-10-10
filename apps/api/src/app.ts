import { contract } from "@repo/contract";
import {
  createFetchHandler,
  TsRestHttpError,
  TsRestResponse,
} from "@ts-rest/serverless/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env, isProduction } from "./env";
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
