import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  createEnquirySchema,
  reserveEnquirySchema,
  reserveSessionSchema,
  verifyPaymentSchema,
} from "../schemas/enquiry";
import { createdSchema, errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Public intake for a course or product.
 *
 * `create` is a free "ask about this". `reserve` is a paid "reserve this": the
 * server re-prices the item, opens a Razorpay order and records a pending
 * enquiry; `verifyReserve` confirms the signature Razorpay Checkout returns and
 * flips the enquiry to paid. The Razorpay webhook is deliberately NOT here — it
 * needs the raw request body for HMAC, so it lives as a plain route (app.ts).
 */
export const enquiriesContract = c.router({
  create: {
    method: "POST",
    path: "/enquiries",
    body: createEnquirySchema,
    responses: {
      201: createdSchema,
      404: errorSchema,
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Ask about a specific course or product.",
  },
  reserve: {
    method: "POST",
    path: "/enquiries/reserve",
    body: reserveEnquirySchema,
    responses: {
      200: reserveSessionSchema,
      409: errorSchema, // item unavailable / enquiry-only / out of stock
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Re-price an item and open a Razorpay order to reserve it.",
  },
  verifyReserve: {
    method: "POST",
    path: "/enquiries/reserve/verify",
    body: verifyPaymentSchema,
    responses: {
      200: z.object({
        enquiryId: z.string(),
        reference: z.string(),
        itemTitle: z.string(),
      }),
      404: errorSchema,
      422: errorSchema,
    },
    summary: "Verify the Razorpay signature and mark the reserve paid.",
  },
});
