import { initContract } from "@ts-rest/core";
import {
  bookingCreatedSchema,
  bookingReserveSessionSchema,
  createBookingSchema,
} from "../schemas/booking";
import { verifyPaymentSchema } from "../schemas/enquiry";
import { errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Public intake only.
 *
 * Reading and triaging bookings lives under /api/admin, behind a real session.
 *
 * A session is paid-for: `reserve` re-reads the admin-set fee, opens a Razorpay
 * order and records a pending booking; `verifyReserve` confirms the signature,
 * marks it paid and kicks off the Kundali. `create` remains for a free booking
 * (admin / fallback), but the public page uses the paid flow.
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
    summary: "Submit a session booking request (no payment).",
  },
  reserve: {
    method: "POST",
    path: "/bookings/reserve",
    body: createBookingSchema,
    responses: {
      200: bookingReserveSessionSchema,
      409: errorSchema, // online payment unavailable
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Open a Razorpay order for the session fee and hold the booking.",
  },
  verifyReserve: {
    method: "POST",
    path: "/bookings/reserve/verify",
    body: verifyPaymentSchema,
    responses: {
      200: bookingCreatedSchema,
      404: errorSchema,
      422: errorSchema,
    },
    summary: "Verify the fee payment, confirm the booking and start the Kundali.",
  },
});
