import { PrismaClient } from "@prisma/client";

/**
 * Cached PrismaClient.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a new
 * client (and connection pool) on every reload. We cache it on the global object
 * so it survives reloads. In production a single instance is created per lambda.
 */

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const prisma =
  global._prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}
