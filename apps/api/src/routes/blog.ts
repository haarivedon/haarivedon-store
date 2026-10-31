import { contract, type BlogPost } from "@repo/contract";
import { prisma, type BlogPost as BlogPostRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (record: BlogPostRecord): BlogPost => ({
  id: record.id,
  title: record.title,
  slug: record.slug,
  excerpt: record.excerpt,
  content: record.content,
  coverImage: record.coverImage,
  tags: record.tags,
  publishedAt: record.publishedAt.toISOString(),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export const blogRouter = tsr.router(contract.blog, {
  list: async ({ query }) => {
    const where = {
      published: true,
      ...(query.tag ? { tags: { has: query.tag } } : {}),
    };

    const [records, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }],
        ...toPrismaPage(query),
      }),
      prisma.blogPost.count({ where }),
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
    const record = await prisma.blogPost.findFirst({
      where: { published: true, slug: params.slug },
    });
    if (!record) {
      return { status: 404 as const, body: { error: "Post not found." } };
    }
    return { status: 200 as const, body: serialize(record) };
  },
});
