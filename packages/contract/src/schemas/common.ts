import { z } from "zod";

/** Shape returned by every non-2xx response in the API. */
export const errorSchema = z.object({
  error: z.string(),
  /** Field-level issues, present on 422 responses (`z.treeifyError` output). */
  issues: z.unknown().optional(),
});
export type ApiError = z.infer<typeof errorSchema>;

/** Mongo ObjectId as a hex string. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

/** Query params shared by every list endpoint. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  perPage: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

/** Wraps a list payload with pagination metadata. */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });

/** Acknowledgement returned by the public intake endpoints. */
export const createdSchema = z.object({
  id: z.string(),
  message: z.string(),
});
