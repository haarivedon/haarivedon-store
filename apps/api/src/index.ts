import { serve } from "@hono/node-server";
import { prisma } from "@repo/db";
import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./lib/logger";

const app = createApp();

// Render (and most managed hosts) inject the port to bind on as `PORT`.
// Locally we keep `API_PORT` — `next dev` also reads `PORT` and the two apps
// share the root .env, so the convention only bends for the isolated prod host.
const port = Number(process.env.PORT) || env.API_PORT;

const server = serve(
  { fetch: app.fetch, port, hostname: env.HOST },
  (info) => {
    logger.info(`API ready on http://${env.HOST}:${info.port}/api`);
  },
);

const shutdown = (signal: NodeJS.Signals) => {
  logger.info(`${signal} received — shutting down.`);

  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
