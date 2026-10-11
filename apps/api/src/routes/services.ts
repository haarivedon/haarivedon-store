import { contract, type Service } from "@repo/contract";
import { prisma, type Service as ServiceRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (record: ServiceRecord): Service => ({
  id: record.id,
  title: record.title,
  slug: record.slug,
  summary: record.summary,
  description: record.description,
  icon: record.icon,
  startingPrice: record.startingPrice,
  currency: record.currency,
  highlights: record.highlights,
  image: record.image,
  order: record.order,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

/** Public routes never return unpublished rows. */
const published = { published: true } as const;

export const servicesRouter = tsr.router(contract.services, {
  list: async () => {
    const records = await prisma.service.findMany({
      where: published,
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });

    return { status: 200 as const, body: { data: records.map(serialize) } };
  },

  getBySlug: async ({ params }) => {
    const record = await prisma.service.findFirst({
      where: { ...published, slug: params.slug },
    });
    if (!record) {
      return { status: 404 as const, body: { error: "Service not found." } };
    }

    return { status: 200 as const, body: serialize(record) };
  },
});
