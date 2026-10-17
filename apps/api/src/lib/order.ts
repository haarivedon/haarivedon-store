import { randomBytes } from "node:crypto";
import type { Order as OrderRecord } from "@repo/db";
import type { Order, PublicOrder } from "@repo/contract";

/**
 * Human-readable order number, e.g. HV-7F3K9Q. What the buyer and admin quote
 * to each other — short, unambiguous, not sequential (so it leaks no volume).
 */
export const generateOrderNumber = () =>
  "HV-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);

/** Unguessable token that gates the buyer's tracking page — no account needed. */
export const generateAccessToken = () => randomBytes(24).toString("hex");

/** Prisma record -> admin wire shape (everything). */
export const serializeOrder = (r: OrderRecord): Order => ({
  id: r.id,
  orderNumber: r.orderNumber,
  name: r.name,
  email: r.email,
  phone: r.phone,
  items: r.items.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    image: item.image,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  })),
  shippingAddress: {
    line1: r.shippingAddress.line1,
    line2: r.shippingAddress.line2,
    city: r.shippingAddress.city,
    state: r.shippingAddress.state,
    pincode: r.shippingAddress.pincode,
    country: r.shippingAddress.country,
  },
  subtotal: r.subtotal,
  shippingFee: r.shippingFee,
  total: r.total,
  currency: r.currency,
  paymentStatus: r.paymentStatus as Order["paymentStatus"],
  fulfillmentStatus: r.fulfillmentStatus as Order["fulfillmentStatus"],
  courier: r.courier,
  trackingNumber: r.trackingNumber,
  razorpayOrderId: r.razorpayOrderId,
  razorpayPaymentId: r.razorpayPaymentId,
  internalNote: r.internalNote,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/**
 * The buyer's view: drops contact details, Razorpay ids and the internal note.
 * The tracking page is token-gated, but it still only needs what tracks the
 * parcel.
 */
export const toPublicOrder = (order: Order): PublicOrder => ({
  orderNumber: order.orderNumber,
  name: order.name,
  items: order.items,
  shippingAddress: order.shippingAddress,
  subtotal: order.subtotal,
  shippingFee: order.shippingFee,
  total: order.total,
  currency: order.currency,
  paymentStatus: order.paymentStatus,
  fulfillmentStatus: order.fulfillmentStatus,
  courier: order.courier,
  trackingNumber: order.trackingNumber,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});
