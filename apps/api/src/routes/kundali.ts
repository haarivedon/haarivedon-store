import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";

/**
 * Status polling for the Kundali PDF (CR-2). The actual download is a raw
 * Hono route in app.ts — ts-rest handlers return JSON, not file streams.
 */
export const kundaliRouter = tsr.router(contract.kundali, {
  status: async ({ params, query }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { kundaliStatus: true, kundaliKey: true, kundaliToken: true },
    });

    // A wrong token is indistinguishable from a missing booking on purpose.
    if (!booking || !booking.kundaliToken || booking.kundaliToken !== query.token) {
      return { status: 404 as const, body: { error: "Not found." } };
    }

    return {
      status: 200 as const,
      body: {
        status: booking.kundaliStatus as "pending" | "ready" | "failed",
        downloadPath:
          booking.kundaliStatus === "ready" && booking.kundaliKey
            ? `/api/kundali/${params.id}/download?token=${encodeURIComponent(query.token)}`
            : null,
      },
    };
  },
});
