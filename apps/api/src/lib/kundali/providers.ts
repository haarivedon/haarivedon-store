import { env } from "../../env";
import { logger } from "../logger";
import {
  DASHA_YEARS,
  NAKSHATRAS,
  SIGNS,
  type BirthInput,
  type ChartData,
  type ChartProvider,
  type DashaPeriod,
  type PlanetPosition,
} from "./types";

const BODIES = [
  "Ascendant",
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
];

/**
 * Deterministic placeholder provider.
 *
 * It is NOT astronomy: positions are derived from the birth instant by a
 * stable hash so the same birth details always produce the same chart, which
 * is enough to build and demo the whole pipeline. Everything it returns is
 * marked `sample: true`, and the PDF renders a watermark on that basis, so a
 * placeholder chart can never be mistaken for a real one.
 *
 * Replacing it is one env var (`KUNDALI_API_URL`) — see `HttpChartProvider`.
 */
export class SampleChartProvider implements ChartProvider {
  readonly name = "built-in sample (not astronomical)";

  async getChart(input: BirthInput): Promise<ChartData> {
    const seed = input.bornAt.getTime() / 60000 + input.lat + input.lng;
    const at = (offset: number) => Math.abs(Math.floor(seed / 7 + offset * 31));

    const ascendantSign = (at(1) % 12) + 1;

    const place = (body: string, index: number): PlanetPosition => {
      const sign = (at(index + 2) % 12) + 1;
      return {
        body,
        sign,
        degree: Number(((at(index + 3) % 2999) / 100).toFixed(2)),
        house: ((sign - ascendantSign + 12) % 12) + 1,
        nakshatra: NAKSHATRAS[at(index + 4) % NAKSHATRAS.length]!,
        pada: (at(index + 5) % 4) + 1,
        retrograde: index > 2 && at(index + 6) % 5 === 0,
      };
    };

    const planets = BODIES.map((body, index) =>
      body === "Ascendant"
        ? { ...place(body, 0), sign: ascendantSign, house: 1 }
        : place(body, index),
    );

    // Navamsa is a ninth-harmonic divisional chart; the sample just rotates.
    const navamsa = planets.map((planet) => ({
      ...planet,
      sign: ((planet.sign + 8) % 12) + 1,
    }));

    const start = new Date(input.bornAt);
    const mahadashas = DASHA_YEARS.map(([lord, years]) => {
      const from = new Date(start);
      start.setFullYear(start.getFullYear() + years);
      return {
        lord,
        start: from.toISOString().slice(0, 10),
        end: new Date(start).toISOString().slice(0, 10),
      };
    });

    const moon = planets.find((p) => p.body === "Moon")!;
    const sun = planets.find((p) => p.body === "Sun")!;

    return {
      source: this.name,
      sample: true,
      ascendantSign,
      moonSign: moon.sign,
      sunSign: sun.sign,
      nakshatra: moon.nakshatra,
      planets,
      navamsa,
      mahadashas,
      panchang: {
        tithi: `Tithi ${(at(11) % 30) + 1}`,
        nakshatra: moon.nakshatra,
        yoga: `Yoga ${(at(12) % 27) + 1}`,
        karana: `Karana ${(at(13) % 11) + 1}`,
        weekday: input.bornAt.toLocaleDateString("en-IN", { weekday: "long" }),
      },
      flags: [
        {
          label: "Mangal Dosha",
          present: [1, 4, 7, 8, 12].includes(
            planets.find((p) => p.body === "Mars")!.house,
          ),
          note: "Traditionally assessed from the placement of Mars.",
        },
        {
          label: "Kaal Sarp",
          present: at(14) % 6 === 0,
          note: "Traditionally assessed from the Rahu–Ketu axis.",
        },
        {
          label: "Pitra Dosha",
          present: at(15) % 5 === 0,
          note: "Traditionally assessed from the ninth house and the Sun.",
        },
      ],
    };
  }
}

/**
 * Chart data from a licensed astrology API — the recommended production
 * source (docs/PLAN.md §3.2). The response shape varies by vendor, so the
 * mapping lives here and nothing downstream knows which vendor is in use.
 */
export class HttpChartProvider implements ChartProvider {
  readonly name: string;

  constructor(
    private readonly url: string,
    private readonly apiKey: string | undefined,
  ) {
    this.name = new URL(url).host;
  }

  async getChart(input: BirthInput): Promise<ChartData> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        name: input.name,
        date: input.localDate,
        time: input.localTime,
        latitude: input.lat,
        longitude: input.lng,
        timezone: input.tz,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(
        `Chart provider responded ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as Partial<ChartData>;

    // Fail loudly rather than render a half-empty chart: a wrong Kundali is
    // worse than a missing one (docs/PLAN.md §3.2).
    if (!payload.planets?.length || !payload.ascendantSign) {
      throw new Error("Chart provider returned an unusable payload.");
    }

    return {
      ...(payload as ChartData),
      source: this.name,
      sample: false,
    };
  }
}

/**
 * VedAstro (https://vedastro.org) — real Swiss-Ephemeris Vedic astronomy over
 * a path-style HTTP API. A single Kundali is assembled from ~9 calls (there is
 * no one-shot "whole chart" method), so three things matter and all live here:
 *
 *  - Throttling. The free tier is ~5 requests/minute GLOBALLY (shared across
 *    every VedAstro user, not per key), and one chart alone exceeds that. A
 *    module-level queue (`throttle`) spaces every outgoing request ≥13s apart,
 *    across concurrent chart builds, so a single chart never 429s itself.
 *  - Caching. A chart is deterministic for a given instant/place/ayanamsa, so
 *    results are memoised; a re-generate or a repeat birth costs zero calls.
 *    In-memory only (prototype) — a persistent cache is the go-live upgrade.
 *  - SVG charts. VedAstro renders the D1 and D9 as `image/svg+xml`; those are
 *    carried on `ChartData.charts` and the PDF embeds them (pdf.ts).
 *
 * Switch to the paid tier (unlimited) or self-host by changing the URL/key
 * only — nothing here changes.
 */
const GRAHAS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;

/** ≥13s between any two VedAstro requests, serialised across all callers. */
const MIN_INTERVAL_MS = 13_000;
let requestChain: Promise<unknown> = Promise.resolve();
function throttle<T>(task: () => Promise<T>): Promise<T> {
  const run = requestChain.then(
    () =>
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(task()), MIN_INTERVAL_MS);
      }),
  );
  // Keep the chain alive regardless of this task's outcome.
  requestChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

const chartCache = new Map<string, ChartData>();
const CACHE_MAX = 200;

const signNumber = (name: string) =>
  SIGNS.findIndex((s) => s.toLowerCase() === name.trim().toLowerCase()) + 1;

/** "yyyy-mm-dd" from VedAstro's "HH:mm dd/MM/yyyy +zz:zz" time string. */
function vedDateToIso(value: string): string {
  const m = value.match(/(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[5]}-${m[4]}-${m[3]}` : value;
}
/** Sortable integer for a VedAstro time string (yyyyMMdd). */
const vedDateKey = (value: string) => Number(vedDateToIso(value).replace(/-/g, ""));

/**
 * Navamsa (D9) sign of a graha from its D1 sign + degree. Standard rule:
 * movable signs start their navamsa from themselves, fixed signs from the 9th,
 * dual signs from the 5th; each navamsa spans 3°20'. Used only for the PDF's
 * fallback D9 grid — the embedded D9 SVG is the primary artifact.
 */
function navamsaSign(sign: number, degree: number): number {
  const mod = (sign - 1) % 3; // 0 movable, 1 fixed, 2 dual
  const start = mod === 0 ? sign : mod === 1 ? ((sign + 7 - 1) % 12) + 1 : ((sign + 3 - 1) % 12) + 1;
  const step = Math.min(8, Math.floor(degree / (30 / 9)));
  return ((start - 1 + step) % 12) + 1;
}

type VedEnvelope = { Status?: string; Payload?: unknown };

export class VedAstroChartProvider implements ChartProvider {
  readonly name: string;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
    private readonly ayanamsa: string,
    private readonly style: "north" | "south",
  ) {
    this.name = `VedAstro (${new URL(baseUrl).host})`;
  }

  async getChart(input: BirthInput): Promise<ChartData> {
    const key = [
      input.bornAt.toISOString(),
      input.lat,
      input.lng,
      this.ayanamsa,
      this.style,
    ].join("|");
    const cached = chartCache.get(key);
    if (cached) return cached;

    const chart = await this.build(input);

    if (chartCache.size >= CACHE_MAX) {
      chartCache.delete(chartCache.keys().next().value as string);
    }
    chartCache.set(key, chart);
    return chart;
  }

  private async build(input: BirthInput): Promise<ChartData> {
    const loc = `${input.lat},${input.lng}`;
    const [year, month, day] = input.localDate.split("-");
    const time = `${input.localTime}/${day}/${month}/${year}/${offsetFor(
      input.bornAt,
      input.tz,
    )}`;
    const chartMethod =
      this.style === "south" ? "SouthIndianChart" : "NorthIndianChart";

    // Sequential by nature — the throttle serialises these anyway. Order is
    // cheapest-signal-first so a bad birth fails before the SVG downloads.
    const lagna = await this.json("LagnaSignName", loc, time);
    const ascendantSign =
      signNumber(String((lagna as Record<string, unknown>).LagnaSignName ?? "")) ||
      1;

    const rasi = (await this.json("AllPlanetRasiSigns", loc, time)) as {
      AllPlanetRasiSigns?: { Planet: string; AllPlanetRasiSigns: string }[];
    };
    const constellation = (await this.json(
      "AllPlanetConstellation",
      loc,
      time,
    )) as {
      AllPlanetConstellation?: { Planet: string; AllPlanetConstellation: string }[];
    };

    const signByPlanet = new Map(
      (rasi.AllPlanetRasiSigns ?? []).map((row) => [
        row.Planet,
        parseRasiSign(row.AllPlanetRasiSigns),
      ]),
    );
    const starByPlanet = new Map(
      (constellation.AllPlanetConstellation ?? []).map((row) => [
        row.Planet,
        parseConstellation(row.AllPlanetConstellation),
      ]),
    );

    const planets: PlanetPosition[] = GRAHAS.map((body) => {
      const sign = signByPlanet.get(body)?.sign ?? 1;
      const star = starByPlanet.get(body);
      return {
        body,
        sign,
        degree: signByPlanet.get(body)?.degree ?? 0,
        house: ((sign - ascendantSign + 12) % 12) + 1,
        nakshatra: star?.nakshatra ?? "",
        pada: star?.pada ?? 0,
        // Free tier omits per-planet retrograde (would be 9 extra calls); the
        // two nodes are always retrograde, which is correct to state outright.
        retrograde: body === "Rahu" || body === "Ketu",
      };
    });

    const navAsc = navamsaSign(ascendantSign, 0);
    const navamsa: PlanetPosition[] = planets.map((planet) => {
      const sign = navamsaSign(planet.sign, planet.degree);
      return { ...planet, sign, house: ((sign - navAsc + 12) % 12) + 1 };
    });

    const moon = planets.find((p) => p.body === "Moon")!;
    const sun = planets.find((p) => p.body === "Sun")!;

    const dasa = (await this.json("DasaForLife", loc, time, [
      "Levels",
      "1",
      "PrecisionHours",
      "24",
      "ScanYears",
      "120",
    ])) as { DasaForLife?: Record<string, { Lord: string; Start: string; End: string }> };
    const mahadashas: DashaPeriod[] = Object.values(dasa.DasaForLife ?? {})
      .sort((a, b) => vedDateKey(a.Start) - vedDateKey(b.Start))
      .map((period) => ({
        lord: period.Lord,
        start: vedDateToIso(period.Start),
        end: vedDateToIso(period.End),
      }));

    const panchangaRaw = (await this.json("PanchangaTable", loc, time)) as {
      PanchangaTable?: {
        Tithi?: { Name?: string };
        Nakshatra?: string;
        Yoga?: { Name?: string };
        Karana?: string;
        Vara?: string;
      };
    };
    const pt = panchangaRaw.PanchangaTable ?? {};

    const kuja = (await this.json("KujaDosaScore", loc, time)) as {
      KujaDosaScore?: string;
    };
    const kalaSarpa = (await this.json("KalaSarpaYoga", loc, time)) as {
      KalaSarpaYoga?: { IsOccuring?: boolean };
    };

    const rasiSvg = await this.svg(chartMethod, loc, time, ["ChartType", "RasiD1"]);
    const navamsaSvg = await this.svg(chartMethod, loc, time, [
      "ChartType",
      "NavamshaD9",
    ]);

    return {
      source: this.name,
      sample: false,
      ascendantSign,
      moonSign: moon.sign,
      sunSign: sun.sign,
      nakshatra: moon.nakshatra,
      planets,
      navamsa,
      mahadashas,
      panchang: {
        tithi: pt.Tithi?.Name ?? "—",
        nakshatra: pt.Nakshatra ?? moon.nakshatra,
        yoga: pt.Yoga?.Name ?? "—",
        karana: pt.Karana ?? "—",
        weekday: pt.Vara ?? input.bornAt.toLocaleDateString("en-IN", { weekday: "long" }),
      },
      flags: [
        {
          label: "Mangal Dosha",
          present: Number(kuja.KujaDosaScore ?? 0) > 0,
          note: "Kuja (Mangal) dosha score from the placement of Mars.",
        },
        {
          label: "Kaal Sarp",
          present: kalaSarpa.KalaSarpaYoga?.IsOccuring === true,
          note: "Assessed from the Rahu–Ketu axis.",
        },
      ],
      charts: { rasi: rasiSvg, navamsa: navamsaSvg },
    };
  }

  private url(method: string, loc: string, time: string, extra: string[] = []) {
    const tail = extra.length ? `${extra.join("/")}/` : "";
    return `${this.baseUrl}/Calculate/${method}/Location/${loc}/Time/${time}/${tail}Ayanamsa/${this.ayanamsa}`;
  }

  private async json(
    method: string,
    loc: string,
    time: string,
    extra: string[] = [],
  ): Promise<Record<string, unknown>> {
    const res = await this.request(this.url(method, loc, time, extra));
    const body = (await res.json()) as VedEnvelope;
    if (body.Status !== "Pass") {
      throw new Error(
        `VedAstro ${method} returned ${body.Status ?? "no status"}: ${JSON.stringify(
          body.Payload,
        ).slice(0, 160)}`,
      );
    }
    return (body.Payload ?? {}) as Record<string, unknown>;
  }

  private async svg(
    method: string,
    loc: string,
    time: string,
    extra: string[],
  ): Promise<string | undefined> {
    try {
      const res = await this.request(this.url(method, loc, time, extra));
      const text = await res.text();
      return text.includes("<svg") ? text : undefined;
    } catch (error) {
      // A missing chart image is not worth failing the whole Kundali over —
      // the PDF falls back to drawing the grid itself.
      logger.warn("vedastro chart svg failed", {
        method,
        extra: extra.join("/"),
        message: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  private request(url: string): Promise<Response> {
    return throttle(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const res = await fetch(url, {
          headers: this.apiKey ? { "x-api-key": this.apiKey } : {},
          signal: AbortSignal.timeout(20_000),
        });
        // 429 should be rare given the throttle, but back off and retry if the
        // shared global limit was hit by someone else.
        if (res.status === 429 && attempt < 2) {
          await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS));
          continue;
        }
        if (!res.ok) {
          throw new Error(`VedAstro responded ${res.status} ${res.statusText}`);
        }
        return res;
      }
      throw new Error("VedAstro rate limit: exhausted retries on 429");
    });
  }
}

/** "Libra : 8° 26' 31" -> { sign, degree } (degree within the sign). */
function parseRasiSign(value: string): { sign: number; degree: number } {
  const [name, rest = ""] = value.split(":");
  const m = rest.match(/(\d+)[°\s]+(\d+)['\s]+(\d+)?/);
  const degree = m
    ? Number(m[1]) + Number(m[2]) / 60 + Number(m[3] ?? 0) / 3600
    : 0;
  return { sign: signNumber(name ?? "") || 1, degree: Number(degree.toFixed(2)) };
}

/** "Swathi - 1" -> { nakshatra, pada }. */
function parseConstellation(value: string): { nakshatra: string; pada: number } {
  const [nakshatra, pada] = value.split(" - ");
  return { nakshatra: (nakshatra ?? "").trim(), pada: Number(pada) || 0 };
}

/** UTC offset of `tz` at `date` as "+05:30", via Intl's longOffset part. */
function offsetFor(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const m = name.match(/([+-]\d{2}:\d{2})/);
  return m ? m[1]! : "+00:00";
}

export function chartProvider(): ChartProvider {
  if (env.KUNDALI_PROVIDER === "vedastro") {
    const base = env.KUNDALI_API_URL || "https://vedastro.zaishi.net/api";
    return new VedAstroChartProvider(
      base,
      env.KUNDALI_API_KEY || "FreeAPIUser",
      env.KUNDALI_AYANAMSA,
      env.KUNDALI_CHART_STYLE,
    );
  }
  if (env.KUNDALI_API_URL) {
    return new HttpChartProvider(env.KUNDALI_API_URL, env.KUNDALI_API_KEY);
  }
  return new SampleChartProvider();
}

export const signName = (sign: number) => SIGNS[(sign - 1 + 12) % 12]!;
