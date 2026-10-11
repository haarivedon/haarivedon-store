import {
  contract,
  productAttributesSchema,
  type Product,
} from "@repo/contract";
import { prisma, type Product as ProductRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";

/**
 * Prisma record -> wire shape. `attributes` is loose JSON in Mongo, so it is
 * parsed against the family's schema here and dropped if it does not match —
 * a half-filled attribute set must not break the page that renders it.
 */
const serialize = (record: ProductRecord): Product => {
  const attributes = productAttributesSchema.safeParse(record.attributes);

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    family: record.family as Product["family"],
    category: record.category,
    summary: record.summary,
    description: record.description,
    price: record.price,
    currency: record.currency,
    images: record.images,
    attributes: attributes.success ? attributes.data : null,
    inStock: record.inStock,
    featured: record.featured,
    order: record.order,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

export const productsRouter = tsr.router(contract.products, {
  list: async ({ query }) => {
    const where = {
      published: true,
      ...(query.family ? { family: query.family } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.featured === undefined ? {} : { featured: query.featured }),
      ...(query.inStock === undefined ? {} : { inStock: query.inStock }),
    };

    const [records, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ order: "asc" }, { name: "asc" }],
        ...toPrismaPage(query),
      }),
      prisma.product.count({ where }),
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
    const record = await prisma.product.findFirst({
      where: { published: true, slug: params.slug },
    });
    if (!record) {
      return { status: 404 as const, body: { error: "Product not found." } };
    }

    return { status: 200 as const, body: serialize(record) };
  },
});
