import {
  contract,
  type Course,
  type CourseEnquiry,
} from "@repo/contract";
import {
  prisma,
  type Course as CourseRecord,
  type CourseEnquiry as EnquiryRecord,
} from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { assertAdmin } from "../lib/auth";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";
import { clientIp, rateLimit } from "../lib/rate-limit";

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
  relatedSlugs: record.relatedSlugs,
  certificate: record.certificate,
  featured: record.featured,
  order: record.order,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const serializeEnquiry = (record: EnquiryRecord): CourseEnquiry => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phone,
  courseSlug: record.courseSlug,
  courseTitle: record.courseTitle,
  message: record.message,
  status: record.status as CourseEnquiry["status"],
  internalNote: record.internalNote,
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

  createEnquiry: async ({ body }, { request }) => {
    const limit = rateLimit(`course-enquiries:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    // Enquiries are only accepted for a course that is actually live, so a
    // crafted payload cannot create a record pointing at nothing.
    const course = await prisma.course.findFirst({
      where: { published: true, slug: body.courseSlug },
      select: { title: true },
    });
    if (!course) {
      return { status: 404 as const, body: { error: "Course not found." } };
    }

    const record = await prisma.courseEnquiry.create({
      data: { ...body, courseTitle: course.title },
    });

    return {
      status: 201 as const,
      body: {
        id: record.id,
        message: `Thank you — we've noted your interest in ${course.title} and will be in touch with the details.`,
      },
    };
  },

  listEnquiries: async ({ query }, { request }) => {
    assertAdmin(request.headers);

    const where = query.status ? { status: query.status } : {};
    const [records, total] = await Promise.all([
      prisma.courseEnquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.courseEnquiry.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: {
        data: records.map(serializeEnquiry),
        meta: toPaginationMeta(query, total),
      },
    };
  },
});
