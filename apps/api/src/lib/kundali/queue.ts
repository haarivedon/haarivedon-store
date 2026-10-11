import { randomBytes } from "node:crypto";
import { prisma } from "@repo/db";
import { logger } from "../logger";
import { putObject } from "../storage";
import { renderKundaliPdf } from "./pdf";
import { chartProvider } from "./providers";
import type { BirthInput } from "./types";

/**
 * Generates the Kundali PDF after a booking is saved.
 *
 * Deliberately not a job queue: this is a few bookings a day, so three
 * in-process attempts with backoff is the proportionate answer (docs/PLAN.md
 * §3.4). The booking is already committed before this runs, so a provider
 * outage costs a PDF, never an enquiry — the admin gets a `failed` row with a
 * Re-generate action (§13).
 */
const ATTEMPTS = 3;
const BACKOFF_MS = [0, 2_000, 10_000];

/** Local wall-clock birth time -> UTC instant. */
function toUtc(date: Date, time: string, tz: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const local = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours ?? 0,
      minutes ?? 0,
    ),
  );

  // Offset of the birth zone at that moment, via the formatted parts trick.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(local).map((part) => [part.type, part.value]),
  );
  const asZoned = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
  );

  return new Date(local.getTime() + (local.getTime() - asZoned));
}

export async function generateKundali(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return false;

  const input: BirthInput = {
    name: booking.name,
    bornAt: toUtc(booking.dateOfBirth, booking.timeOfBirth, booking.birthTz),
    localDate: booking.dateOfBirth.toISOString().slice(0, 10),
    localTime: booking.timeOfBirth,
    place: booking.birthPlace,
    lat: booking.birthLat,
    lng: booking.birthLng,
    tz: booking.birthTz,
  };

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (BACKOFF_MS[attempt]) {
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt]));
    }

    try {
      const chart = await chartProvider().getChart(input);
      const pdf = await renderKundaliPdf(input, chart);
      const key = `kundali/${booking.id}/${randomBytes(6).toString("hex")}.pdf`;
      await putObject(key, pdf, "application/pdf");

      await prisma.booking.update({
        where: { id: booking.id },
        data: { kundaliKey: key, kundaliStatus: "ready", kundaliError: "" },
      });

      logger.info("kundali generated", {
        bookingId: booking.id,
        bytes: pdf.byteLength,
        sample: chart.sample,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("kundali generation failed", {
        bookingId: booking.id,
        attempt: attempt + 1,
        message,
      });

      if (attempt === ATTEMPTS - 1) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { kundaliStatus: "failed", kundaliError: message.slice(0, 300) },
        });
      }
    }
  }

  return false;
}

/** Fire-and-forget wrapper: never let a generation error reject a request. */
export function queueKundali(bookingId: string): void {
  void generateKundali(bookingId).catch((error) => {
    logger.error("kundali queue crashed", { bookingId, error });
  });
}
