import { PrismaClient } from "@prisma/client";

/**
 * Cached PrismaClient.
 *
 * Dev servers hot-reload modules, which would otherwise create a new client
 * (and connection pool) on every reload. We cache it on the global object so it
 * survives reloads. In production a single instance is created per process.
 */

const globalForPrisma = globalThis as unknown as {
  _prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma._prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = prisma;
}
