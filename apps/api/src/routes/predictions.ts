import { contract, type PredictionRequest } from "@repo/contract";
import { prisma, type PredictionRequest as PredictionRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { assertAdmin } from "../lib/auth";
import { clientIp, rateLimit } from "../lib/rate-limit";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (record: PredictionRecord): PredictionRequest => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phone,
  dateOfBirth: record.dateOfBirth.toISOString(),
  timeOfBirth: record.timeOfBirth,
  placeOfBirth: record.placeOfBirth,
  focusArea: record.focusArea as PredictionRequest["focusArea"],
  question: record.question,
  internalNote: record.internalNote,
  status: record.status as PredictionRequest["status"],
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

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

  list: async ({ query }, { request }) => {
    assertAdmin(request.headers);

    const where = query.status ? { status: query.status } : {};
    const [records, total] = await Promise.all([
      prisma.predictionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.predictionRequest.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: {
        data: records.map(serialize),
        meta: toPaginationMeta(query, total),
      },
    };
  },

  getById: async ({ params }, { request }) => {
    assertAdmin(request.headers);

    const record = await prisma.predictionRequest.findUnique({
      where: { id: params.id },
    });
    if (!record) {
      return {
        status: 404 as const,
        body: { error: "Prediction request not found." },
      };
    }

    return { status: 200 as const, body: serialize(record) };
  },
});
