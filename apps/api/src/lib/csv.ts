import { prisma } from "@repo/db";

/**
 * CSV export for the submission inboxes.
 *
 * Exports carry birth details and contact numbers, so the route that uses
 * this is session-guarded and logs who exported what.
 */
type Row = Record<string, string | number | null | undefined>;

/**
 * Quotes every field rather than only the ones that need it.
 *
 * A leading =, +, - or @ makes a spreadsheet treat the cell as a formula,
 * and these rows contain strings people typed — so those are prefixed with
 * an apostrophe. Without it, a name beginning "=" executes on open.
 */
function cell(value: Row[string]): string {
  if (value === null || value === undefined) return '""';

  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.map(cell).join(","),
    ...rows.map((row) => headers.map((header) => cell(row[header])).join(",")),
  ];

  // CRLF and a BOM: Excel misreads UTF-8 without them, and these rows carry
  // Indian place names.
  return `﻿${lines.join("\r\n")}\r\n`;
}

const date = (value: Date) => value.toISOString().slice(0, 10);

export async function exportRows(kind: string): Promise<Row[] | null> {
  if (kind === "bookings") {
    const records = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      Received: date(r.createdAt),
      Name: r.name,
      Mobile: r.phone,
      Email: r.email ?? "",
      "Date of birth": date(r.dateOfBirth),
      "Time of birth": r.timeOfBirth,
      "Place of birth": r.birthPlace,
      Latitude: r.birthLat,
      Longitude: r.birthLng,
      Timezone: r.birthTz,
      "Session type": r.sessionType,
      Message: r.message,
      Status: r.status,
      Kundali: r.kundaliStatus,
      Note: r.internalNote,
    }));
  }

  if (kind === "predictions") {
    const records = await prisma.predictionRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      Received: date(r.createdAt),
      Name: r.name,
      Mobile: r.phone,
      Email: r.email,
      "Date of birth": date(r.dateOfBirth),
      "Time of birth": r.timeOfBirth,
      "Place of birth": r.placeOfBirth,
      Focus: r.focusArea,
      Question: r.question,
      Status: r.status,
      Note: r.internalNote,
    }));
  }

  if (kind === "enquiries") {
    const records = await prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      Received: date(r.createdAt),
      Name: r.name,
      Mobile: r.phone,
      Email: r.email,
      About: r.itemTitle || r.itemSlug,
      Kind: r.kind,
      Reference: r.reference,
      Quantity: r.quantity,
      Amount: r.amount ? `₹${r.amount}` : "",
      Payment: r.paymentStatus === "none" ? "" : r.paymentStatus,
      Message: r.message,
      Status: r.status,
      Note: r.internalNote,
    }));
  }

  return null;
}
