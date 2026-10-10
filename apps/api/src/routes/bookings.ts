import { contract, type Booking } from "@repo/contract";
import { prisma, type Booking as BookingRecord } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { assertAdmin } from "../lib/auth";
import { toPaginationMeta, toPrismaPage } from "../lib/pagination";

/** Prisma record -> wire shape (dates become ISO strings). */
const serialize = (booking: BookingRecord): Booking => ({
  id: booking.id,
  name: booking.name,
  email: booking.email,
  phone: booking.phone,
  sessionType: booking.sessionType as Booking["sessionType"],
  preferredDate: booking.preferredDate.toISOString(),
  preferredTime: booking.preferredTime,
  message: booking.message,
  status: booking.status as Booking["status"],
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
});

export const bookingsRouter = tsr.router(contract.bookings, {
  create: async ({ body }) => {
    const booking = await prisma.booking.create({ data: body });

    return {
      status: 201 as const,
      body: {
        id: booking.id,
        message:
          "Your session request has been received. We'll reach out shortly to confirm.",
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
