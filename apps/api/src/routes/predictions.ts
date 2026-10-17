import { randomBytes } from "node:crypto";
import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { queuePredictionKundali } from "../lib/kundali/queue";
import { clientIp, rateLimit } from "../lib/rate-limit";

export const predictionsRouter = tsr.router(contract.predictions, {
  create: async ({ body }, { request }) => {
    const limit = rateLimit(`predictions:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const record = await prisma.predictionRequest.create({
      data: { ...body, kundaliToken: randomBytes(24).toString("base64url") },
    });

    // Fire-and-forget: a slow or failing chart provider must never cost us the
    // request, so the PDF is generated after the response (PLAN.md §13).
    void queuePredictionKundali(record.id);

    return {
      status: 201 as const,
      body: {
        id: record.id,
        kundaliToken: record.kundaliToken,
        message:
          "Your prediction request has been received. We'll be in touch soon, and your chart will be ready to download in a moment.",
      },
    };
  },

  status: async ({ params, query }) => {
    const record = await prisma.predictionRequest.findUnique({
      where: { id: params.id },
      select: { kundaliStatus: true, kundaliKey: true, kundaliToken: true },
    });

    // A wrong token is indistinguishable from a missing record on purpose.
    if (!record || !record.kundaliToken || record.kundaliToken !== query.token) {
      return { status: 404 as const, body: { error: "Not found." } };
    }

    return {
      status: 200 as const,
      body: {
        status: record.kundaliStatus as "pending" | "ready" | "failed",
        downloadPath:
          record.kundaliStatus === "ready" && record.kundaliKey
            ? `/api/predictions/${params.id}/download?token=${encodeURIComponent(query.token)}`
            : null,
      },
    };
  },
});
