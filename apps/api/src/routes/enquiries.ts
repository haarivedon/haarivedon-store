import { randomBytes } from "node:crypto";
import { contract, type EnquiryKind } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { clientIp, rateLimit } from "../lib/rate-limit";
import { logger } from "../lib/logger";
import {
  createRazorpayOrder,
  isStoreEnabled,
  razorpayKeyId,
  verifyPaymentSignature,
} from "../lib/razorpay";

/**
 * Enquiries — the only action a catalogue item offers (there is no store).
 *
 * `create` is a free "ask about this". `reserve` is a paid "reserve this":
 * re-price server-side, open a Razorpay order and record a pending enquiry;
 * `verifyReserve` confirms the signature and marks it paid. Neelam then
 * fulfils the reserved item by hand from the admin inbox.
 */

/** Human-readable reservation number, e.g. HV-7F3K9Q — short, not sequential. */
const generateReference = () =>
  "HV-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);

/** Resolve a published item to its title + unit price (in whole rupees). */
async function priceItem(kind: EnquiryKind, slug: string) {
  if (kind === "course") {
    const course = await prisma.course.findFirst({
      where: { published: true, slug },
      select: { title: true, price: true },
    });
    if (!course) return null;
    return { title: course.title, price: course.price, inStock: true };
  }

  const product = await prisma.product.findFirst({
    where: { published: true, slug },
    select: { name: true, price: true, inStock: true },
  });
  if (!product) return null;
  return { title: product.name, price: product.price, inStock: product.inStock };
}

export const enquiriesRouter = tsr.router(contract.enquiries, {
  create: async ({ body }, { request }) => {
    const limit = rateLimit(`enquiries:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const item = await priceItem(body.kind, body.itemSlug);
    if (!item) {
      return { status: 404 as const, body: { error: "Not found." } };
    }

    const record = await prisma.enquiry.create({
      data: { ...body, itemTitle: item.title },
    });

    return {
      status: 201 as const,
      body: {
        id: record.id,
        message: `Thank you — we've noted your interest in ${item.title} and will be in touch.`,
      },
    };
  },

  /**
   * Re-price the item server-side and open a Razorpay order. The browser sends
   * only slug + quantity — never a price — so the amount is always computed
   * here from the published item, then recorded as a pending enquiry.
   */
  reserve: async ({ body }, { request }) => {
    if (!isStoreEnabled()) {
      return {
        status: 409 as const,
        body: { error: "Online payment is not available right now." },
      };
    }

    const limit = rateLimit(`reserve:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const item = await priceItem(body.kind, body.itemSlug);
    if (!item) {
      return {
        status: 409 as const,
        body: { error: `"${body.itemSlug}" is no longer available.` },
      };
    }
    if (item.price === null || item.price <= 0) {
      return {
        status: 409 as const,
        body: { error: `${item.title} is enquiry-only — please send a question instead.` },
      };
    }
    if (!item.inStock) {
      return {
        status: 409 as const,
        body: { error: `${item.title} is out of stock.` },
      };
    }

    const amount = item.price * body.quantity;
    const currency = "INR";
    const reference = generateReference();

    const rzpOrder = await createRazorpayOrder({
      amountPaise: amount * 100,
      currency,
      receipt: reference,
      notes: { reference, itemSlug: body.itemSlug },
    });

    const record = await prisma.enquiry.create({
      data: {
        kind: body.kind,
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
        itemSlug: body.itemSlug,
        itemTitle: item.title,
        reference,
        quantity: body.quantity,
        amount,
        paymentStatus: "pending",
        razorpayOrderId: rzpOrder.id,
      },
    });

    logger.info("reserve started", { reference, amount, item: item.title });

    return {
      status: 200 as const,
      body: {
        enquiryId: record.id,
        reference,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: razorpayKeyId(),
        itemTitle: item.title,
        name: record.name,
        email: record.email,
        phone: record.phone,
      },
    };
  },

  /**
   * Confirm the signature Razorpay Checkout hands the browser, then mark the
   * reserve paid. The webhook does the same authoritatively; whichever arrives
   * first wins and the other is a no-op.
   */
  verifyReserve: async ({ body }) => {
    if (!verifyPaymentSignature(body)) {
      return {
        status: 422 as const,
        body: { error: "Payment could not be verified." },
      };
    }

    const record = await prisma.enquiry.findFirst({
      where: { razorpayOrderId: body.razorpayOrderId },
    });
    if (!record) {
      return { status: 404 as const, body: { error: "Reservation not found." } };
    }

    if (record.paymentStatus === "pending") {
      await prisma.enquiry.update({
        where: { id: record.id },
        data: {
          paymentStatus: "paid",
          razorpayPaymentId: body.razorpayPaymentId,
        },
      });
      logger.info("reserve paid (client verify)", { reference: record.reference });
    }

    return {
      status: 200 as const,
      body: {
        enquiryId: record.id,
        reference: record.reference,
        itemTitle: record.itemTitle,
      },
    };
  },
});
