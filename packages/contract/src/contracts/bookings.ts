import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  bookingCreatedSchema,
  bookingSchema,
  bookingStatuses,
  createBookingSchema,
  updateBookingStatusSchema,
} from "../schemas/booking";
import {
  errorSchema,
  paginated,
  paginationQuerySchema,
} from "../schemas/common";

const c = initContract();

export const bookingsContract = c.router({
  create: {
    method: "POST",
    path: "/bookings",
    body: createBookingSchema,
    responses: {
      201: bookingCreatedSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Submit a session booking request.",
  },
  list: {
    method: "GET",
    path: "/bookings",
    query: paginationQuerySchema.extend({
      status: z.enum(bookingStatuses).optional(),
    }),
    responses: {
      200: paginated(bookingSchema),
    },
    summary: "List booking requests (admin).",
  },
  getById: {
    method: "GET",
    path: "/bookings/:id",
    pathParams: z.object({ id: z.string() }),
    responses: {
      200: bookingSchema,
      404: errorSchema,
    },
    summary: "Fetch one booking request (admin).",
  },
  updateStatus: {
    method: "PATCH",
    path: "/bookings/:id/status",
    pathParams: z.object({ id: z.string() }),
    body: updateBookingStatusSchema,
    responses: {
      200: bookingSchema,
      404: errorSchema,
      422: errorSchema,
    },
    summary: "Move a booking through its lifecycle (admin).",
  },
});
