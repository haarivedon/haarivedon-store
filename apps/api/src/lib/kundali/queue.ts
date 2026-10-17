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

/** The birth fields a chart needs, however the source record names them. */
type KundaliRecord = {
  name: string;
  dateOfBirth: Date;
  timeOfBirth: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthTz: string;
};
type KundaliResult = {
  kundaliStatus: string;
  kundaliKey?: string;
  kundaliError: string;
};

/**
 * Generates a Kundali for any record that carries birth details. The source
 * (a Booking or a PredictionRequest) is abstracted behind `load`/`save`, so the
 * provider, retry and storage logic is written once.
 */
async function generate(
  entity: string,
  id: string,
  load: () => Promise<KundaliRecord | null>,
  save: (data: KundaliResult) => Promise<void>,
): Promise<boolean> {
  const record = await load();
  if (!record) return false;

  const input: BirthInput = {
    name: record.name,
    bornAt: toUtc(record.dateOfBirth, record.timeOfBirth, record.birthTz),
    localDate: record.dateOfBirth.toISOString().slice(0, 10),
    localTime: record.timeOfBirth,
    place: record.birthPlace,
    lat: record.birthLat,
    lng: record.birthLng,
    tz: record.birthTz,
  };

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (BACKOFF_MS[attempt]) {
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt]));
    }

    try {
      const chart = await chartProvider().getChart(input);
      const pdf = await renderKundaliPdf(input, chart);
      const key = `kundali/${entity}/${id}/${randomBytes(6).toString("hex")}.pdf`;
      await putObject(key, pdf, "application/pdf");

      await save({ kundaliKey: key, kundaliStatus: "ready", kundaliError: "" });

      logger.info("kundali generated", {
        entity,
        id,
        bytes: pdf.byteLength,
        sample: chart.sample,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("kundali generation failed", {
        entity,
        id,
        attempt: attempt + 1,
        message,
      });

      if (attempt === ATTEMPTS - 1) {
        await save({ kundaliStatus: "failed", kundaliError: message.slice(0, 300) });
      }
    }
  }

  return false;
}

export function generateKundali(bookingId: string): Promise<boolean> {
  return generate(
    "booking",
    bookingId,
    () => prisma.booking.findUnique({ where: { id: bookingId } }),
    async (data) => {
      await prisma.booking.update({ where: { id: bookingId }, data });
    },
  );
}

export function generatePredictionKundali(id: string): Promise<boolean> {
  return generate(
    "prediction",
    id,
    async () => {
      const p = await prisma.predictionRequest.findUnique({ where: { id } });
      // PredictionRequest names the place column `placeOfBirth`; map it across.
      return p ? { ...p, birthPlace: p.placeOfBirth } : null;
    },
    async (data) => {
      await prisma.predictionRequest.update({ where: { id }, data });
    },
  );
}

/** Fire-and-forget wrapper: never let a generation error reject a request. */
export function queueKundali(bookingId: string): void {
  void generateKundali(bookingId).catch((error) => {
    logger.error("kundali queue crashed", { entity: "booking", id: bookingId, error });
  });
}

export function queuePredictionKundali(id: string): void {
  void generatePredictionKundali(id).catch((error) => {
    logger.error("kundali queue crashed", { entity: "prediction", id, error });
  });
}
