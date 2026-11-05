import { contract } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { toUtc } from "../lib/kundali/queue";
import { chartProvider, signName } from "../lib/kundali/providers";
import type { BirthInput } from "../lib/kundali/types";
import { logger } from "../lib/logger";
import { clientIp, rateLimit } from "../lib/rate-limit";

/**
 * Status polling for the Kundali PDF (CR-2). The actual download is a raw
 * Hono route in app.ts — ts-rest handlers return JSON, not file streams.
 */
export const kundaliRouter = tsr.router(contract.kundali, {
  // Free instant summary for the public "Get a Free Kundli" flow. Synchronous,
  // never persisted, and rate-limited since it hits the chart provider.
  preview: async ({ body }, { request }) => {
    const limit = rateLimit(`kundali-preview:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const input: BirthInput = {
      name: body.name,
      bornAt: toUtc(body.dateOfBirth, body.timeOfBirth, body.birthTz),
      localDate: body.dateOfBirth.toISOString().slice(0, 10),
      localTime: body.timeOfBirth,
      place: body.placeOfBirth,
      lat: body.birthLat,
      lng: body.birthLng,
      tz: body.birthTz,
    };

    try {
      const chart = await chartProvider().getChart(input);

      const now = Date.now();
      const current =
        chart.mahadashas.find(
          (d) => Date.parse(d.start) <= now && now < Date.parse(d.end),
        ) ?? null;
      const doshas = chart.flags.filter((f) => f.present).map((f) => f.label);

      const highlights = [
        `Your Lagna (ascendant) is ${signName(chart.ascendantSign)}.`,
        `Your Moon sign (Rashi) is ${signName(chart.moonSign)}.`,
        `Your birth star (Nakshatra) is ${chart.nakshatra}.`,
        current
          ? `You are currently in your ${current.lord} Mahadasha, running until ${current.end.slice(0, 4)}.`
          : null,
        doshas.length
          ? `Traditional factors worth reviewing: ${doshas.join(", ")}.`
          : "No major traditional doshas show up in your core placements.",
      ].filter((line): line is string => Boolean(line));

      return {
        status: 200 as const,
        body: {
          sample: chart.sample,
          source: chart.source,
          ascendant: {
            sign: chart.ascendantSign,
            name: signName(chart.ascendantSign),
          },
          moon: { sign: chart.moonSign, name: signName(chart.moonSign) },
          sun: { sign: chart.sunSign, name: signName(chart.sunSign) },
          nakshatra: chart.nakshatra,
          panchang: chart.panchang,
          currentDasha: current,
          flags: chart.flags,
          highlights,
        },
      };
    } catch (error) {
      logger.warn("kundali preview failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return {
        status: 503 as const,
        body: {
          error:
            "We couldn't cast your chart just now. Please try again in a moment.",
        },
      };
    }
  },

  status: async ({ params, query }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { kundaliStatus: true, kundaliKey: true, kundaliToken: true },
    });

    // A wrong token is indistinguishable from a missing booking on purpose.
    if (!booking || !booking.kundaliToken || booking.kundaliToken !== query.token) {
      return { status: 404 as const, body: { error: "Not found." } };
    }

    return {
      status: 200 as const,
      body: {
        status: booking.kundaliStatus as "pending" | "ready" | "failed",
        downloadPath:
          booking.kundaliStatus === "ready" && booking.kundaliKey
            ? `/api/kundali/${params.id}/download?token=${encodeURIComponent(query.token)}`
            : null,
      },
    };
  },
});
