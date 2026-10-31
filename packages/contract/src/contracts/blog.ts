import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { blogPostSchema } from "../schemas/blog";
import {
  errorSchema,
  paginated,
  paginationQuerySchema,
} from "../schemas/common";

const c = initContract();

/** Public blog / journal — a list and per-article pages. */
export const blogContract = c.router({
  list: {
    method: "GET",
    path: "/blog",
    query: paginationQuerySchema.extend({
      tag: z.string().optional(),
    }),
    responses: {
      200: paginated(blogPostSchema),
    },
    summary: "List published blog posts, newest first.",
  },
  getBySlug: {
    method: "GET",
    path: "/blog/:slug",
    pathParams: z.object({ slug: z.string() }),
    responses: {
      200: blogPostSchema,
      404: errorSchema,
    },
    summary: "Fetch one published blog post by slug.",
  },
});
