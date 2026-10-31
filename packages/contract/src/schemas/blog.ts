import { z } from "zod";

/** Server -> client representation. Dates are ISO strings over the wire. */
export const blogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type BlogPost = z.infer<typeof blogPostSchema>;
