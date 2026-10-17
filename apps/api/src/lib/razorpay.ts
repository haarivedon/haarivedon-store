import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env";
import { logger } from "./logger";

/**
 * Razorpay integration (store CR).
 *
 * Deliberately dependency-free: the REST API is a handful of calls, so we use
 * `fetch` with Basic auth and `node:crypto` for the HMAC checks rather than
 * pulling in the SDK. `key_secret` and the webhook secret never leave the
 * server; only `key_id` (publishable) is sent to the browser.
 */

const API = "https://api.razorpay.com/v1";

/** The store is live only when a key pair is configured. */
export const isStoreEnabled = () =>
  Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

export const razorpayKeyId = () => env.RAZORPAY_KEY_ID ?? "";

const authHeader = () =>
  "Basic " +
  Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
    "base64",
  );

type RazorpayOrder = { id: string; amount: number; currency: string };

/**
 * Create a Razorpay order for an amount in paise. `receipt` is our own order
 * number; `notes` carry our order id so a webhook can find the local record.
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("razorpay order create failed", { status: res.status, detail });
    throw new Error("Could not start the payment.");
  }

  return (await res.json()) as RazorpayOrder;
}

/** Refund a captured payment in full (amount omitted = full refund). */
export async function refundRazorpayPayment(paymentId: string): Promise<void> {
  const res = await fetch(`${API}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader(),
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("razorpay refund failed", { status: res.status, detail });
    throw new Error("Could not issue the refund.");
  }
}

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Verify the signature Razorpay Checkout returns to the browser:
 * HMAC_SHA256(order_id | payment_id, key_secret).
 */
export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  return safeEqual(expected, input.razorpaySignature);
}

/**
 * Verify a webhook payload: HMAC_SHA256(rawBody, webhook_secret). The raw body
 * string must be exactly what Razorpay sent — re-serialising JSON would change
 * the bytes and break the check.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}
