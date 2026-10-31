import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  bookingCreatedSchema,
  bookingDraftSchema,
  bookingReserveSessionSchema,
  createBookingSchema,
  payBookingSchema,
  publicBookingSchema,
  scheduleBookingSchema,
} from "../schemas/booking";
import { verifyPaymentSchema } from "../schemas/enquiry";
import { errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Public intake only. Reading/triaging bookings lives under /api/admin.
 *
 * The flow is a wizard: `draft` saves the details and returns a token-gated id;
 * `schedule` records the Calendly slot the booker picks; `pay` opens a Razorpay
 * order for the session fee; `verifyReserve` confirms payment, marks the
 * booking paid and starts the Kundali. `get` is the token-gated view used by
 * every step after the draft. `create` remains for a free booking (admin).
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
  draft: {
    method: "POST",
    path: "/bookings/draft",
    body: createBookingSchema,
    responses: {
      200: bookingDraftSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Save booking details and start a draft (step 1-3 of the wizard).",
  },
  schedule: {
    method: "POST",
    path: "/bookings/:id/schedule",
    pathParams: z.object({ id: z.string() }),
    body: scheduleBookingSchema,
    responses: {
      200: z.object({ ok: z.boolean() }),
      404: errorSchema,
      422: errorSchema,
    },
    summary: "Record the Calendly slot the booker picked.",
  },
  pay: {
    method: "POST",
    path: "/bookings/:id/pay",
    pathParams: z.object({ id: z.string() }),
    body: payBookingSchema,
    responses: {
      200: bookingReserveSessionSchema,
      404: errorSchema,
      409: errorSchema, // payment unavailable / already paid
    },
    summary: "Open a Razorpay order for the session fee of a draft booking.",
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
  get: {
    method: "GET",
    path: "/bookings/:id",
    pathParams: z.object({ id: z.string() }),
    query: z.object({ token: z.string() }),
    responses: {
      200: publicBookingSchema,
      404: errorSchema,
    },
    summary: "The booker's view of one booking, gated by the one-time token.",
  },
});
