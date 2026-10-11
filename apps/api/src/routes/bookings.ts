import { randomBytes } from "node:crypto";
import { contract, type Booking } from "@repo/contract";
import { prisma, type Booking as BookingRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { assertAdmin } from "../lib/auth";
import { queueKundali } from "../lib/kundali/queue";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";
import { clientIp, rateLimit } from "../lib/rate-limit";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (booking: BookingRecord): Booking => ({
  id: booking.id,
  name: booking.name,
  phone: booking.phone,
  email: booking.email,
  sessionType: booking.sessionType as Booking["sessionType"],
  dateOfBirth: booking.dateOfBirth.toISOString(),
  timeOfBirth: booking.timeOfBirth,
  birthPlace: booking.birthPlace,
  birthLat: booking.birthLat,
  birthLng: booking.birthLng,
  birthTz: booking.birthTz,
  message: booking.message,
  status: booking.status as Booking["status"],
  kundaliStatus: booking.kundaliStatus as Booking["kundaliStatus"],
  hasKundali: booking.kundaliKey !== "",
  internalNote: booking.internalNote,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
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
      data: { ...body, kundaliToken: randomBytes(24).toString("base64url") },
    });

    // Fire-and-forget: a slow or failing chart provider must never cost us
    // the enquiry, so the PDF is generated after the response (PLAN.md §13).
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

  list: async ({ query }, { request }) => {
    assertAdmin(request.headers);

    const where = query.status ? { status: query.status } : {};
    const [records, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toPrismaPage(query),
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      status: 200 as const,
      body: {
        data: records.map(serialize),
        meta: toPaginationMeta(query, total),
      },
    };
  },

  getById: async ({ params }, { request }) => {
    assertAdmin(request.headers);

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!booking) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }

    return { status: 200 as const, body: serialize(booking) };
  },

  updateStatus: async ({ params, body }, { request }) => {
    assertAdmin(request.headers);

    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return { status: 404 as const, body: { error: "Booking not found." } };
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    return { status: 200 as const, body: serialize(booking) };
  },
});
