import { randomBytes } from "node:crypto";
import { contract, parseSiteContent, type PublicBooking } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { queueKundali } from "../lib/kundali/queue";
import { clientIp, rateLimit } from "../lib/rate-limit";
import { logger } from "../lib/logger";
import {
  createRazorpayOrder,
  isStoreEnabled,
  razorpayKeyId,
  verifyPaymentSignature,
} from "../lib/razorpay";

const generateReference = () =>
  "HV-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
const newKundaliToken = () => randomBytes(24).toString("base64url");

/** The admin-set session fee (whole rupees) from the Book-a-Session page copy. */
async function sessionFee(): Promise<number> {
  const row = await prisma.siteContent.findUnique({
    where: { key: "book.page" },
  });
  return parseSiteContent("book.page", row?.data).fee;
}

const publicView = (b: {
  id: string;
  reference: string;
  name: string;
  service: string;
  sessionType: string;
  amount: number;
  paymentStatus: string;
  calendlyEventUri: string;
  kundaliStatus: string;
  kundaliKey: string;
  createdAt: Date;
}): PublicBooking => ({
  id: b.id,
  reference: b.reference,
  name: b.name,
  service: b.service,
  sessionType: b.sessionType as PublicBooking["sessionType"],
  amount: b.amount,
  paymentStatus: b.paymentStatus as PublicBooking["paymentStatus"],
  scheduled: b.calendlyEventUri !== "",
  kundaliStatus: b.kundaliStatus as PublicBooking["kundaliStatus"],
  hasKundali: b.kundaliKey !== "",
  createdAt: b.createdAt.toISOString(),
});

export const bookingsRouter = tsr.router(contract.bookings, {
  create: async ({ body }, { request }) => {
    const limit = rateLimit(`bookings:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const booking = await prisma.booking.create({
      data: { ...body, kundaliToken: newKundaliToken() },
    });
    void queueKundali(booking.id);

    return {
      status: 201 as const,
      body: {
        id: booking.id,
        kundaliToken: booking.kundaliToken,
        message:
          "Your session request has been received. We'll reach out shortly to confirm, and your Kundali will follow once it is ready.",
      },
    };
  },

  /**
   * Save the wizard's details as a draft (payment not yet taken, Kundali not
   * yet queued). The returned token gates every later step and the view.
   */
  draft: async ({ body }, { request }) => {
    const limit = rateLimit(`book-draft:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const token = newKundaliToken();
    const booking = await prisma.booking.create({
      data: { ...body, kundaliToken: token },
    });

    logger.info("booking draft created", { id: booking.id });
    return { status: 200 as const, body: { id: booking.id, token } };
  },

  /** Record the Calendly slot the booker picked. Token-gated. */
  schedule: async ({ params, body }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!booking || booking.kundaliToken !== body.token) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        calendlyEventUri: body.calendlyEventUri,
        calendlyInviteeUri: body.calendlyInviteeUri,
      },
    });
    logger.info("booking scheduled", { id: booking.id });
    return { status: 200 as const, body: { ok: true } };
  },

  /**
   * Open a Razorpay order for the session fee of an existing draft. The fee is
   * read server-side, never sent by the browser.
   */
  pay: async ({ params, body }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!booking || booking.kundaliToken !== body.token) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }
    if (booking.paymentStatus === "paid") {
      return { status: 409 as const, body: { error: "Already paid." } };
    }
    if (!isStoreEnabled()) {
      return {
        status: 409 as const,
        body: { error: "Online payment is not available right now." },
      };
    }

    const fee = await sessionFee();
    if (fee <= 0) {
      return {
        status: 409 as const,
        body: { error: "Online booking is not available right now." },
      };
    }

    const reference = booking.reference || generateReference();
    const rzpOrder = await createRazorpayOrder({
      amountPaise: fee * 100,
      currency: "INR",
      receipt: reference,
      notes: { reference, kind: "booking" },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        reference,
        amount: fee,
        paymentStatus: "pending",
        razorpayOrderId: rzpOrder.id,
      },
    });

    logger.info("booking pay opened", { reference, fee });
    return {
      status: 200 as const,
      body: {
        bookingId: booking.id,
        reference,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: razorpayKeyId(),
        name: booking.name,
        email: booking.email ?? "",
        phone: booking.phone,
      },
    };
  },

  /** Confirm the fee payment, mark paid and start the Kundali. */
  verifyReserve: async ({ body }) => {
    if (!verifyPaymentSignature(body)) {
      return {
        status: 422 as const,
        body: { error: "Payment could not be verified." },
      };
    }

    const booking = await prisma.booking.findFirst({
      where: { razorpayOrderId: body.razorpayOrderId },
    });
    if (!booking) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }

    if (booking.paymentStatus === "pending") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "paid",
          razorpayPaymentId: body.razorpayPaymentId,
        },
      });
      void queueKundali(booking.id);
      logger.info("booking paid (client verify)", { reference: booking.reference });
    }

    return {
      status: 200 as const,
      body: {
        id: booking.id,
        kundaliToken: booking.kundaliToken,
        message:
          "Payment received and your session is booked. Your Kundali will follow once it is ready.",
      },
    };
  },

  /** The booker's view. A wrong token reads like a missing booking. */
  get: async ({ params, query }) => {
    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking || booking.kundaliToken !== query.token) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }
    return { status: 200 as const, body: publicView(booking) };
  },
});
