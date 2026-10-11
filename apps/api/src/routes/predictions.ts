import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
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

    const record = await prisma.predictionRequest.create({ data: body });

    return {
      status: 201 as const,
      body: {
        id: record.id,
        message:
          "Your prediction request has been received. We'll be in touch soon.",
      },
    };
  },

});
