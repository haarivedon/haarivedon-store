import { randomBytes } from "node:crypto";
import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { queueKundali } from "../lib/kundali/queue";
import { clientIp, rateLimit } from "../lib/rate-limit";

export const bookingsRouter = tsr.router(contract.bookings, {
  create: async ({ body }, { request }) => {
    const limit = rateLimit(`bookings:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const booking = await prisma.booking.create({
      data: { ...body, kundaliToken: randomBytes(24).toString("base64url") },
    });

    // Fire-and-forget: a slow or failing chart provider must never cost us
    // the enquiry, so the PDF is generated after the response (PLAN.md §13).
    void queueKundali(booking.id);

    return {
      status: 201 as const,
      body: {
        id: booking.id,
        kundaliToken: booking.kundaliToken,
        message:
          "Your session request has been received. We'll reach out shortly to confirm, and your Kundali will follow once it is ready.",
      },
    };
  },

});
