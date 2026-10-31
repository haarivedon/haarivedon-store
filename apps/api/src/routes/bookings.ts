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
   * Hold a booking and open a Razorpay order for the admin-set session fee. The
   * fee is read here, never sent by the browser. The Kundali is NOT queued yet
   * — it starts only once the fee is paid (verifyReserve).
   */
  reserve: async ({ body }, { request }) => {
    if (!isStoreEnabled()) {
      return {
        status: 409 as const,
        body: { error: "Online payment is not available right now." },
      };
    }

    const limit = rateLimit(`book-reserve:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const fee = await sessionFee();
    if (fee <= 0) {
      return {
        status: 409 as const,
        body: { error: "Online booking is not available right now." },
      };
    }

    const reference = generateReference();
    const rzpOrder = await createRazorpayOrder({
      amountPaise: fee * 100,
      currency: "INR",
      receipt: reference,
      notes: { reference, kind: "booking" },
    });

    const booking = await prisma.booking.create({
      data: {
        ...body,
        kundaliToken: newKundaliToken(),
        reference,
        amount: fee,
        paymentStatus: "pending",
        razorpayOrderId: rzpOrder.id,
      },
    });

    logger.info("booking reserve started", { reference, fee });

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

  /**
   * Confirm the fee payment, mark the booking paid and start the Kundali. The
   * webhook does the same authoritatively; whichever arrives first wins.
   */
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
      // Start the chart only once the fee is paid.
      void queueKundali(booking.id);
      logger.info("booking paid (client verify)", { reference: booking.reference });
    }

    return {
      status: 200 as const,
      body: {
        id: booking.id,
        kundaliToken: booking.kundaliToken,
        message:
          "Payment received and your session is booked. We'll reach out shortly to confirm, and your Kundali will follow once it is ready.",
      },
    };
  },

  /** The booker's confirmation view. A wrong token reads like a missing booking. */
  get: async ({ params, query }) => {
    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking || booking.kundaliToken !== query.token) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }
    return {
      status: 200 as const,
      body: {
        id: booking.id,
        reference: booking.reference,
        name: booking.name,
        service: booking.service,
        sessionType: booking.sessionType as PublicBooking["sessionType"],
        paymentStatus: booking.paymentStatus as PublicBooking["paymentStatus"],
        kundaliStatus: booking.kundaliStatus as PublicBooking["kundaliStatus"],
        hasKundali: booking.kundaliKey !== "",
        createdAt: booking.createdAt.toISOString(),
      },
    };
  },
});
