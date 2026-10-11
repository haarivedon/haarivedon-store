import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  adminCourseSchema,
  adminProductSchema,
  adminServiceSchema,
  adminTestimonialSchema,
  adminUserSchema,
  changePasswordSchema,
  conflictSchema,
  courseWriteSchema,
  expectedUpdatedAtSchema,
  loginSchema,
  mediaSchema,
  productWriteSchema,
  publishBlockedSchema,
  serviceWriteSchema,
  testimonialWriteSchema,
} from "../schemas/admin";
import { bookingSchema } from "../schemas/booking";
import { courseEnquirySchema, courseEnquiryStatuses } from "../schemas/course";
import { predictionSchema, predictionStatuses } from "../schemas/prediction";
import { bookingStatuses } from "../schemas/booking";
import { siteContentKeySchema } from "../schemas/site-content";
import {
  errorSchema,
  paginated,
  paginationQuerySchema,
} from "../schemas/common";

const c = initContract();

/**
 * Builds the CRUD routes for one collection. Every admin collection has the
 * same shape, so declaring it once keeps them from drifting (PLAN.md §3.3).
 */
const collection = <
  Entity extends z.ZodType,
  Write extends z.ZodObject<z.ZodRawShape>,
>(
  path: string,
  entity: Entity,
  write: Write,
) =>
  c.router({
    list: {
      method: "GET",
      path: `/admin/${path}`,
      query: paginationQuerySchema.extend({
        search: z.string().optional(),
        published: z.stringbool().optional(),
      }),
      responses: { 200: paginated(entity), 401: errorSchema },
      summary: `List ${path}, including drafts.`,
    },
    getById: {
      method: "GET",
      path: `/admin/${path}/:id`,
      pathParams: z.object({ id: z.string() }),
      responses: { 200: entity, 401: errorSchema, 404: errorSchema },
      summary: `Fetch one ${path} record.`,
    },
    create: {
      method: "POST",
      path: `/admin/${path}`,
      body: write,
      responses: {
        201: entity,
        401: errorSchema,
        409: errorSchema,
        422: publishBlockedSchema.or(errorSchema),
      },
      summary: `Create a ${path} record.`,
    },
    update: {
      method: "PATCH",
      path: `/admin/${path}/:id`,
      pathParams: z.object({ id: z.string() }),
      body: z.intersection(write.partial(), expectedUpdatedAtSchema),
      responses: {
        200: entity,
        401: errorSchema,
        404: errorSchema,
        409: conflictSchema,
        422: publishBlockedSchema.or(errorSchema),
      },
      summary: `Update a ${path} record.`,
    },
    remove: {
      method: "DELETE",
      path: `/admin/${path}/:id`,
      pathParams: z.object({ id: z.string() }),
      responses: {
        200: z.object({ id: z.string() }),
        401: errorSchema,
        404: errorSchema,
      },
      summary: `Delete a ${path} record.`,
    },
    reorder: {
      method: "POST",
      path: `/admin/${path}/reorder`,
      body: z.object({ ids: z.array(z.string()).max(500) }),
      responses: { 200: z.object({ updated: z.number().int() }), 401: errorSchema },
      summary: `Persist a new display order for ${path}.`,
    },
  });

export const adminContract = c.router({
  // ── Session ─────────────────────────────────────────────────────────────
  login: {
    method: "POST",
    path: "/admin/auth/login",
    body: loginSchema,
    responses: {
      200: z.object({ user: adminUserSchema }),
      401: errorSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Sign in to the admin.",
  },
  logout: {
    method: "POST",
    path: "/admin/auth/logout",
    body: z.object({}),
    responses: { 200: z.object({ ok: z.boolean() }) },
    summary: "Sign out of this session.",
  },
  session: {
    method: "GET",
    path: "/admin/auth/session",
    responses: {
      200: z.object({ user: adminUserSchema }),
      401: errorSchema,
    },
    summary: "Who is signed in.",
  },
  changePassword: {
    method: "POST",
    path: "/admin/auth/password",
    body: changePasswordSchema,
    responses: {
      200: z.object({ ok: z.boolean() }),
      401: errorSchema,
      422: errorSchema,
    },
    summary: "Change your password; signs out every other session.",
  },

  // ── Collections ─────────────────────────────────────────────────────────
  courses: collection("courses", adminCourseSchema, courseWriteSchema),
  products: collection("products", adminProductSchema, productWriteSchema),
  services: collection("services", adminServiceSchema, serviceWriteSchema),
  testimonials: collection(
    "testimonials",
    adminTestimonialSchema,
    testimonialWriteSchema,
  ),

  // ── Page copy ───────────────────────────────────────────────────────────
  getSiteContent: {
    method: "GET",
    path: "/admin/site-content/:key",
    pathParams: z.object({ key: siteContentKeySchema }),
    responses: {
      200: z.object({ key: siteContentKeySchema, data: z.unknown() }),
      401: errorSchema,
    },
    summary: "Read one page-copy key.",
  },
  putSiteContent: {
    method: "PUT",
    path: "/admin/site-content/:key",
    pathParams: z.object({ key: siteContentKeySchema }),
    body: z.object({ data: z.unknown() }),
    responses: {
      200: z.object({ key: siteContentKeySchema, data: z.unknown() }),
      401: errorSchema,
      422: errorSchema,
    },
    summary: "Save one page-copy key.",
  },

  // ── Media ───────────────────────────────────────────────────────────────
  listMedia: {
    method: "GET",
    path: "/admin/media",
    query: paginationQuerySchema,
    responses: { 200: paginated(mediaSchema), 401: errorSchema },
    summary: "List uploaded images, newest first.",
  },
  updateMedia: {
    method: "PATCH",
    path: "/admin/media/:id",
    pathParams: z.object({ id: z.string() }),
    body: z.object({ alt: z.string().trim().max(300) }),
    responses: { 200: mediaSchema, 401: errorSchema, 404: errorSchema },
    summary: "Edit an image's alt text.",
  },
  removeMedia: {
    method: "DELETE",
    path: "/admin/media/:id",
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: z.object({ id: z.string() }),
      401: errorSchema,
      404: errorSchema,
    },
    summary: "Delete an image.",
  },

  // ── Submissions inbox ───────────────────────────────────────────────────
  bookings: {
    method: "GET",
    path: "/admin/bookings",
    query: paginationQuerySchema.extend({
      status: z.enum(bookingStatuses).optional(),
      search: z.string().optional(),
    }),
    responses: { 200: paginated(bookingSchema), 401: errorSchema },
    summary: "Booking inbox.",
  },
  updateBooking: {
    method: "PATCH",
    path: "/admin/bookings/:id",
    pathParams: z.object({ id: z.string() }),
    body: z.object({
      status: z.enum(bookingStatuses).optional(),
      internalNote: z.string().trim().max(2000).optional(),
    }),
    responses: { 200: bookingSchema, 401: errorSchema, 404: errorSchema },
    summary: "Set a booking's status or internal note.",
  },
  regenerateKundali: {
    method: "POST",
    path: "/admin/bookings/:id/kundali",
    pathParams: z.object({ id: z.string() }),
    body: z.object({}),
    responses: {
      200: z.object({ status: z.string() }),
      401: errorSchema,
      404: errorSchema,
    },
    summary: "Re-run Kundali generation for a booking.",
  },
  predictions: {
    method: "GET",
    path: "/admin/predictions",
    query: paginationQuerySchema.extend({
      status: z.enum(predictionStatuses).optional(),
      search: z.string().optional(),
    }),
    responses: { 200: paginated(predictionSchema), 401: errorSchema },
    summary: "Prediction request inbox.",
  },
  updatePrediction: {
    method: "PATCH",
    path: "/admin/predictions/:id",
    pathParams: z.object({ id: z.string() }),
    body: z.object({
      status: z.enum(predictionStatuses).optional(),
      internalNote: z.string().trim().max(2000).optional(),
    }),
    responses: { 200: predictionSchema, 401: errorSchema, 404: errorSchema },
    summary: "Set a prediction request's status or internal note.",
  },
  enquiries: {
    method: "GET",
    path: "/admin/course-enquiries",
    query: paginationQuerySchema.extend({
      status: z.enum(courseEnquiryStatuses).optional(),
      search: z.string().optional(),
    }),
    responses: { 200: paginated(courseEnquirySchema), 401: errorSchema },
    summary: "Course enquiry inbox.",
  },
  updateEnquiry: {
    method: "PATCH",
    path: "/admin/course-enquiries/:id",
    pathParams: z.object({ id: z.string() }),
    body: z.object({
      status: z.enum(courseEnquiryStatuses).optional(),
      internalNote: z.string().trim().max(2000).optional(),
    }),
    responses: { 200: courseEnquirySchema, 401: errorSchema, 404: errorSchema },
    summary: "Set an enquiry's status or internal note.",
  },
});
