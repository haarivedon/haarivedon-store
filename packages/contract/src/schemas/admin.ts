import { z } from "zod";
import { courseCategories, courseFormats, courseLevels } from "./course";
import { productFamilies } from "./product";

/** The signed-in admin, as returned by the session endpoint. */
export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const loginSchema = z.object({
  email: z.email("Enter the email address on your account."),
  password: z.string().min(1, "Enter your password."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(200),
});

/**
 * Admin list rows carry the fields the public shapes hide — `published` and
 * `updatedAt` — because the list view needs to show drafts and detect stale
 * writes (docs/PLAN.md §3.3).
 */
const adminFields = {
  published: z.boolean(),
  updatedAt: z.iso.datetime(),
  updatedBy: z.string(),
};

export const adminCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.enum(courseCategories),
  level: z.enum(courseLevels),
  format: z.enum(courseFormats),
  summary: z.string(),
  description: z.string(),
  outline: z.array(z.string()),
  duration: z.string(),
  language: z.string(),
  price: z.number().int().nullable(),
  currency: z.string(),
  image: z.string(),
  relatedSlugs: z.array(z.string()),
  certificate: z.boolean(),
  featured: z.boolean(),
  order: z.number().int(),
  ...adminFields,
});
export type AdminCourse = z.infer<typeof adminCourseSchema>;

export const adminProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  family: z.enum(productFamilies),
  category: z.string(),
  summary: z.string(),
  description: z.string(),
  price: z.number().int().nullable(),
  currency: z.string(),
  images: z.array(z.string()),
  attributes: z.unknown().nullable(),
  inStock: z.boolean(),
  featured: z.boolean(),
  order: z.number().int(),
  ...adminFields,
});
export type AdminProduct = z.infer<typeof adminProductSchema>;

export const adminServiceSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  description: z.string(),
  icon: z.string(),
  startingPrice: z.number().int().nullable(),
  currency: z.string(),
  highlights: z.array(z.string()),
  image: z.string(),
  order: z.number().int(),
  ...adminFields,
});
export type AdminService = z.infer<typeof adminServiceSchema>;

export const adminTestimonialSchema = z.object({
  id: z.string(),
  name: z.string(),
  quote: z.string(),
  rating: z.number().int(),
  location: z.string(),
  order: z.number().int(),
  ...adminFields,
});
export type AdminTestimonial = z.infer<typeof adminTestimonialSchema>;

export const adminBlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.iso.datetime(),
  order: z.number().int(),
  ...adminFields,
});
export type AdminBlogPost = z.infer<typeof adminBlogPostSchema>;

/** Slug rules (docs/PLAN.md §13): lowercase, hyphenated, never reserved. */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "new",
  "edit",
  "_next",
  "book",
  "courses",
  "products",
  "services",
] as const;

export const slugSchema = z
  .string({ error: "Give this a web address." })
  .trim()
  .toLowerCase()
  .min(2, "A slug needs at least two characters.")
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens only.",
  )
  .refine(
    (value) => !RESERVED_SLUGS.includes(value as (typeof RESERVED_SLUGS)[number]),
    { message: `Reserved: ${RESERVED_SLUGS.join(", ")}.` },
  );

/**
 * Write payloads. Saving is permissive — a draft only needs a title and slug —
 * and the strict check happens at publish time (docs/PLAN.md §3.3).
 *
 * No `.default()` anywhere in these shapes, deliberately. A PATCH body is
 * `schema.partial()`, and zod still fills a defaulted field when the key is
 * absent — so defaults here would silently reset every field the editor did
 * not send. Prisma already declares a default for each of these columns, so
 * "absent" correctly means "leave it alone".
 */
export const courseWriteSchema = z.object({
  title: z
    .string({ error: "Give the course a title." })
    .trim()
    .min(2, "Give the course a title.")
    .max(140),
  slug: slugSchema,
  category: z.enum(courseCategories, { error: "Pick a subject." }),
  level: z.enum(courseLevels, { error: "Pick a level." }),
  format: z.enum(courseFormats, { error: "Pick a format." }),
  summary: z.string().trim().max(400).optional(),
  description: z.string().trim().max(8000).optional(),
  outline: z.array(z.string().trim().min(1).max(200)).max(60).optional(),
  duration: z.string().trim().max(80).optional(),
  language: z.string().trim().max(80).optional(),
  price: z.number().int().min(0).max(10_000_000).nullable().optional(),
  image: z.string().trim().max(500).optional(),
  relatedSlugs: z.array(z.string().trim()).max(10).optional(),
  certificate: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export const productWriteSchema = z.object({
  name: z
    .string({ error: "Give the product a name." })
    .trim()
    .min(2, "Give the product a name.")
    .max(140),
  slug: slugSchema,
  family: z.enum(productFamilies, { error: "Pick a family." }),
  category: z.string().trim().max(60).optional(),
  summary: z.string().trim().max(400).optional(),
  description: z.string().trim().max(8000).optional(),
  price: z.number().int().min(0).max(10_000_000).nullable().optional(),
  images: z.array(z.string().trim()).max(8).optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export const serviceWriteSchema = z.object({
  title: z
    .string({ error: "Give the service a title." })
    .trim()
    .min(2, "Give the service a title.")
    .max(140),
  slug: slugSchema,
  summary: z.string().trim().max(400).optional(),
  description: z.string().trim().max(8000).optional(),
  icon: z.string().trim().max(60).optional(),
  startingPrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  highlights: z.array(z.string().trim().min(1).max(200)).max(12).optional(),
  image: z.string().trim().max(500).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export const testimonialWriteSchema = z.object({
  name: z
    .string({ error: "Whose testimonial is this?" })
    .trim()
    .min(2, "Whose testimonial is this?")
    .max(100),
  quote: z
    .string({ error: "Add the testimonial itself." })
    .trim()
    .min(10, "Add the testimonial itself.")
    .max(1000),
  rating: z.number().int().min(1).max(5).optional(),
  location: z.string().trim().max(100).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export const blogPostWriteSchema = z.object({
  title: z
    .string({ error: "Give the post a title." })
    .trim()
    .min(2, "Give the post a title.")
    .max(160),
  slug: slugSchema,
  excerpt: z.string().trim().max(400).optional(),
  content: z.string().trim().max(50_000).optional(),
  coverImage: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  order: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

/**
 * Every update carries the `updatedAt` the editor loaded. A mismatch means
 * someone else (or another tab) saved in between, and the write is refused
 * with 409 rather than silently overwriting them (docs/PLAN.md §13).
 */
export const expectedUpdatedAtSchema = z.object({
  expectedUpdatedAt: z.iso.datetime(),
});

export const conflictSchema = z.object({
  error: z.string(),
  /** The values currently in the database, so the UI can show the diff. */
  current: z.unknown(),
});

/** What publish validation returns when a record is not ready to go live. */
export const publishBlockedSchema = z.object({
  error: z.string(),
  missing: z.array(z.object({ field: z.string(), message: z.string() })),
});

export const mediaSchema = z.object({
  id: z.string(),
  key: z.string(),
  url: z.string(),
  alt: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  bytes: z.number().int(),
  mimeType: z.string(),
  createdAt: z.iso.datetime(),
});
export type Media = z.infer<typeof mediaSchema>;
