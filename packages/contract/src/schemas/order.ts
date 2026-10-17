import { z } from "zod";
import { phoneSchema } from "./booking";

/**
 * Store orders (store CR).
 *
 * Self-serve checkout: the browser sends a cart of `{ slug, quantity }` plus
 * contact and shipping details — never a price or a total. The server re-reads
 * each product, recomputes the amount, and only then talks to Razorpay. Money
 * is therefore never trusted from the client.
 */

export const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const fulfillmentStatuses = [
  "pending",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type FulfillmentStatus = (typeof fulfillmentStatuses)[number];

// ── Checkout input (client -> server) ──────────────────────────────────────

/** One cart line as the browser sends it: just what and how many. */
export const cartItemInputSchema = z.object({
  slug: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
});
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const shippingAddressInputSchema = z.object({
  line1: z.string().trim().min(3, "Please enter your address.").max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2, "Please enter your city.").max(100),
  state: z.string().trim().min(2, "Please enter your state.").max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a 6-digit PIN code."),
  country: z.string().trim().max(100).optional().default("India"),
});
export type ShippingAddressInput = z.infer<typeof shippingAddressInputSchema>;

export const checkoutInputSchema = z.object({
  items: z.array(cartItemInputSchema).min(1, "Your cart is empty.").max(50),
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: phoneSchema,
  shippingAddress: shippingAddressInputSchema,
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

/**
 * What the server hands back so the browser can open Razorpay Checkout.
 * `amount` is in paise (Razorpay's unit); `keyId` is the publishable test/live
 * key, safe to expose.
 */
export const checkoutSessionSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  razorpayOrderId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  keyId: z.string(),
  /** Echoed back so the modal can prefill the buyer's details. */
  name: z.string(),
  email: z.string(),
  phone: z.string(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

/** Razorpay Checkout success payload, posted back for verification. */
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// ── Wire shapes (server -> client) ─────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  unitPrice: z.number().int(),
  quantity: z.number().int(),
  lineTotal: z.number().int(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const shippingAddressSchema = z.object({
  line1: z.string(),
  line2: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string(),
});

/**
 * The buyer's view of an order, gated by the access token. No email, phone or
 * internal note — only what the person who placed it needs to track it.
 */
export const publicOrderSchema = z.object({
  orderNumber: z.string(),
  name: z.string(),
  items: z.array(orderItemSchema),
  shippingAddress: shippingAddressSchema,
  subtotal: z.number().int(),
  shippingFee: z.number().int(),
  total: z.number().int(),
  currency: z.string(),
  paymentStatus: z.enum(paymentStatuses),
  fulfillmentStatus: z.enum(fulfillmentStatuses),
  courier: z.string(),
  trackingNumber: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type PublicOrder = z.infer<typeof publicOrderSchema>;

/** The admin's view: everything, including contact details and notes. */
export const orderSchema = publicOrderSchema.extend({
  id: z.string(),
  email: z.string(),
  phone: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  internalNote: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

/** Admin-editable fields on an order: fulfillment only — money is immutable. */
export const orderUpdateSchema = z.object({
  fulfillmentStatus: z.enum(fulfillmentStatuses).optional(),
  courier: z.string().trim().max(100).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
