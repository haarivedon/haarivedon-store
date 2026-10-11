import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { productFamilies, productSchema } from "../schemas/product";
import { errorSchema, paginated, paginationQuerySchema } from "../schemas/common";

const c = initContract();

/** Public, read-only. Writes arrive with the admin platform (PLAN.md §3.3). */
export const productsContract = c.router({
  list: {
    method: "GET",
    path: "/products",
    query: paginationQuerySchema.extend({
      family: z.enum(productFamilies).optional(),
      category: z.string().optional(),
      featured: z.stringbool().optional(),
      inStock: z.stringbool().optional(),
    }),
    responses: {
      200: paginated(productSchema),
    },
    summary: "List published products, filtered by family or category.",
  },
  getBySlug: {
    method: "GET",
    path: "/products/:slug",
    pathParams: z.object({ slug: z.string() }),
    responses: {
      200: productSchema,
      404: errorSchema,
    },
    summary: "Fetch one published product by slug.",
  },
});
