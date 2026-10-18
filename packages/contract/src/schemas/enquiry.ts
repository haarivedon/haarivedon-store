import { z } from "zod";
import { phoneSchema } from "./booking";

/**
 * Enquiries about a specific catalogue item.
 *
 * Courses and products have no store — browsing is the catalogue, and the
 * action a detail page offers is to enquire. An enquiry is either a free
 * "ask about this" or a Razorpay-paid "reserve this"; both land in the same
 * admin inbox, which is why there is one shape rather than one per kind.
 */
export const enquiryKinds = ["course", "product"] as const;
export type EnquiryKind = (typeof enquiryKinds)[number];

export const enquiryStatuses = [
  "pending",
  "contacted",
  "enrolled",
  "closed",
] as const;

/** Payment state of an enquiry. `none` = a free ask; the rest = a paid reserve. */
export const enquiryPaymentStatuses = [
  "none",
  "pending",
  "paid",
  "failed",
] as const;
export type EnquiryPaymentStatus = (typeof enquiryPaymentStatuses)[number];

/** Client -> server payload for a free "ask about this", shared by form + API. */
export const createEnquirySchema = z.object({
  kind: z.enum(enquiryKinds),
  itemSlug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: phoneSchema,
  message: z.string().trim().max(1000).optional().default(""),
});
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

/**
 * Client -> server payload for a paid "reserve this". The browser sends only
 * the item slug and quantity — never a price — so the amount charged is always
 * re-priced server-side from the published item.
 */
export const reserveEnquirySchema = z.object({
  kind: z.enum(enquiryKinds),
  itemSlug: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: phoneSchema,
  message: z.string().trim().max(1000).optional().default(""),
});
export type ReserveEnquiryInput = z.infer<typeof reserveEnquirySchema>;

/**
 * What the server hands back so the browser can open Razorpay Checkout.
 * `amount` is in paise (Razorpay's unit); `keyId` is the publishable key.
 */
export const reserveSessionSchema = z.object({
  enquiryId: z.string(),
  reference: z.string(),
  razorpayOrderId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  keyId: z.string(),
  itemTitle: z.string(),
  /** Echoed back so the modal can prefill the buyer's details. */
  name: z.string(),
  email: z.string(),
  phone: z.string(),
});
export type ReserveSession = z.infer<typeof reserveSessionSchema>;

/** Razorpay Checkout success payload, posted back for verification. */
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/** Server -> client representation. Dates are ISO strings over the wire. */
export const enquirySchema = z.object({
  id: z.string(),
  kind: z.enum(enquiryKinds),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  itemSlug: z.string(),
  itemTitle: z.string(),
  message: z.string(),
  status: z.enum(enquiryStatuses),
  reference: z.string(),
  quantity: z.number().int(),
  amount: z.number().int(),
  paymentStatus: z.enum(enquiryPaymentStatuses),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  internalNote: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Enquiry = z.infer<typeof enquirySchema>;
