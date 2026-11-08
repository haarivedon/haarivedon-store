import { contract, type Course } from "@repo/contract";
import { prisma, type Course as CourseRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (record: CourseRecord): Course => ({
  id: record.id,
  title: record.title,
  slug: record.slug,
  category: record.category as Course["category"],
  level: record.level as Course["level"],
  format: record.format as Course["format"],
  summary: record.summary,
  description: record.description,
  outline: record.outline,
  duration: record.duration,
  language: record.language,
  price: record.price,
  currency: record.currency,
  image: record.image,
  udemyUrl: record.udemyUrl ?? "",
  udemyId: record.udemyId ?? null,
  source: record.source ?? "manual",
  relatedSlugs: record.relatedSlugs,
  certificate: record.certificate,
  featured: record.featured,
  order: record.order,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const coursesRouter = tsr.router(contract.courses, {
  list: async ({ query }) => {
    const where = {
      published: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.featured === undefined ? {} : { featured: query.featured }),
    };

    const [records, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [{ order: "asc" }, { title: "asc" }],
        ...toPrismaPage(query),
      }),
      prisma.course.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: {
        data: records.map(serialize),
        meta: toPaginationMeta(query, total),
      },
    };
  },

  getBySlug: async ({ params }) => {
    const record = await prisma.course.findFirst({
      where: { published: true, slug: params.slug },
    });
    if (!record) {
      return { status: 404 as const, body: { error: "Course not found." } };
    }

    return { status: 200 as const, body: serialize(record) };
  },

});
