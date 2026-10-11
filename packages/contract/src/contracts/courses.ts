import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  courseCategories,
  courseEnquirySchema,
  courseEnquiryStatuses,
  courseLevels,
  courseSchema,
  createCourseEnquirySchema,
} from "../schemas/course";
import {
  createdSchema,
  errorSchema,
  paginated,
  paginationQuerySchema,
} from "../schemas/common";

const c = initContract();

/**
 * Courses (CR-1). A catalogue plus an enquiry form — no checkout, no lessons,
 * no student accounts (docs/PLAN.md §3.1).
 */
export const coursesContract = c.router({
  list: {
    method: "GET",
    path: "/courses",
    query: paginationQuerySchema.extend({
      category: z.enum(courseCategories).optional(),
      level: z.enum(courseLevels).optional(),
      featured: z.stringbool().optional(),
    }),
    responses: {
      200: paginated(courseSchema),
    },
    summary: "List published courses.",
  },
  getBySlug: {
    method: "GET",
    path: "/courses/:slug",
    pathParams: z.object({ slug: z.string() }),
    responses: {
      200: courseSchema,
      404: errorSchema,
    },
    summary: "Fetch one published course by slug.",
  },
  createEnquiry: {
    method: "POST",
    path: "/course-enquiries",
    body: createCourseEnquirySchema,
    responses: {
      201: createdSchema,
      404: errorSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Submit an enquiry about a course.",
  },
  listEnquiries: {
    method: "GET",
    path: "/course-enquiries",
    query: paginationQuerySchema.extend({
      status: z.enum(courseEnquiryStatuses).optional(),
    }),
    responses: {
      200: paginated(courseEnquirySchema),
    },
    summary: "List course enquiries (admin).",
  },
});
