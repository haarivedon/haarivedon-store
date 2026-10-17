import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { clientIp, rateLimit } from "../lib/rate-limit";
import { logger } from "../lib/logger";
import {
  generateAccessToken,
  generateOrderNumber,
  serializeOrder,
  toPublicOrder,
} from "../lib/order";
import {
  createRazorpayOrder,
  isStoreEnabled,
  razorpayKeyId,
  verifyPaymentSignature,
} from "../lib/razorpay";

/** Shipping is free until rates are decided (store CR). */
const SHIPPING_FEE = 0;

export const checkoutRouter = tsr.router(contract.checkout, {
  /**
   * Re-price the cart server-side and open a Razorpay order. The browser sends
   * only `{ slug, quantity }` per line — never a price — so the amount charged
   * is always computed here from the published product, not trusted.
   */
  createOrder: async ({ body }, { request }) => {
    if (!isStoreEnabled()) {
      return {
        status: 409 as const,
        body: { error: "The store is not accepting orders right now." },
      };
    }

    const limit = rateLimit(`checkout:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    // One query for every slug in the cart, then re-price from the records.
    const slugs = body.items.map((item) => item.slug);
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs }, published: true },
    });
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const items = [];
    for (const line of body.items) {
      const product = bySlug.get(line.slug);
      if (!product) {
        return {
          status: 409 as const,
          body: { error: `"${line.slug}" is no longer available.` },
        };
      }
      if (product.price === null) {
        return {
          status: 409 as const,
          body: { error: `${product.name} is enquiry-only and cannot be bought here.` },
        };
      }
      if (!product.inStock) {
        return {
          status: 409 as const,
          body: { error: `${product.name} is out of stock.` },
        };
      }

      items.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        unitPrice: product.price,
        quantity: line.quantity,
        lineTotal: product.price * line.quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal + SHIPPING_FEE;
    const currency = "INR";
    const orderNumber = generateOrderNumber();

    const rzpOrder = await createRazorpayOrder({
      amountPaise: total * 100,
      currency,
      receipt: orderNumber,
      notes: { orderNumber },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber,
        items,
        name: body.name,
        email: body.email,
        phone: body.phone,
        shippingAddress: body.shippingAddress,
        subtotal,
        shippingFee: SHIPPING_FEE,
        total,
        currency,
        razorpayOrderId: rzpOrder.id,
        accessToken: generateAccessToken(),
      },
    });

    logger.info("checkout started", { orderNumber, total, items: items.length });

    return {
      status: 200 as const,
      body: {
        orderId: order.id,
        orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: razorpayKeyId(),
        name: order.name,
        email: order.email,
        phone: order.phone,
      },
    };
  },

  /**
   * Confirm the signature Razorpay Checkout hands the browser, then mark the
   * order paid. The webhook does the same thing authoritatively; whichever
   * arrives first wins and the other is a no-op.
   */
  verifyPayment: async ({ body }) => {
    if (!verifyPaymentSignature(body)) {
      return {
        status: 422 as const,
        body: { error: "Payment could not be verified." },
      };
    }

    const order = await prisma.order.findUnique({
      where: { razorpayOrderId: body.razorpayOrderId },
    });
    if (!order) return { status: 404 as const, body: { error: "Order not found." } };

    // Only promote a still-pending order; never overwrite a refund.
    if (order.paymentStatus === "pending") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "paid",
          razorpayPaymentId: body.razorpayPaymentId,
        },
      });
      logger.info("order paid (client verify)", { orderNumber: order.orderNumber });
    }

    return {
      status: 200 as const,
      body: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
      },
    };
  },

  /** The buyer's tracking view. A wrong token is answered like a missing order. */
  getOrder: async ({ params, query }) => {
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order || order.accessToken !== query.token) {
      return { status: 404 as const, body: { error: "Order not found." } };
    }
    return { status: 200 as const, body: toPublicOrder(serializeOrder(order)) };
  },
});
