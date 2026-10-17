import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { errorSchema } from "../schemas/common";
import {
  checkoutInputSchema,
  checkoutSessionSchema,
  publicOrderSchema,
  verifyPaymentSchema,
} from "../schemas/order";

const c = initContract();

/**
 * Self-serve store checkout (store CR).
 *
 * `createOrder` re-prices the cart on the server and opens a Razorpay order;
 * `verifyPayment` confirms the signature Razorpay Checkout returns and flips
 * the order to paid; `getOrder` is the buyer's token-gated tracking view. The
 * Razorpay webhook is deliberately NOT here — it needs the raw request body
 * for HMAC, so it lives as a plain route in apps/api (see app.ts).
 */
export const checkoutContract = c.router({
  createOrder: {
    method: "POST",
    path: "/checkout",
    body: checkoutInputSchema,
    responses: {
      200: checkoutSessionSchema,
      409: errorSchema, // an item is unavailable / out of stock
      422: errorSchema,
      429: errorSchema,
    },
    summary: "Re-price the cart and open a Razorpay order.",
  },
  verifyPayment: {
    method: "POST",
    path: "/checkout/verify",
    body: verifyPaymentSchema,
    responses: {
      200: z.object({
        orderId: z.string(),
        orderNumber: z.string(),
        accessToken: z.string(),
      }),
      404: errorSchema,
      422: errorSchema,
    },
    summary: "Verify the Razorpay signature and confirm the order.",
  },
  getOrder: {
    method: "GET",
    path: "/orders/:id",
    pathParams: z.object({ id: z.string() }),
    query: z.object({ token: z.string() }),
    responses: {
      200: publicOrderSchema,
      404: errorSchema,
    },
    summary: "A buyer's tracking view of one order, gated by access token.",
  },
});
