import { initContract } from "@ts-rest/core";
import {
  bookingCreatedSchema,
  createBookingSchema,
} from "../schemas/booking";
import { errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Public intake only.
 *
 * Reading and triaging bookings lives under /api/admin, behind a real
 * session. These used to be duplicated here behind the shared ADMIN_API_KEY,
 * which meant two doors to the same personal data and one of them guarded by
 * a static string.
 */
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
});
