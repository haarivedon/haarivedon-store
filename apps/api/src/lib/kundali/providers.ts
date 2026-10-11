import { env } from "../../env";
import {
  DASHA_YEARS,
  NAKSHATRAS,
  SIGNS,
  type BirthInput,
  type ChartData,
  type ChartProvider,
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

export function chartProvider(): ChartProvider {
  if (env.KUNDALI_API_URL) {
    return new HttpChartProvider(env.KUNDALI_API_URL, env.KUNDALI_API_KEY);
  }
  return new SampleChartProvider();
}

export const signName = (sign: number) => SIGNS[(sign - 1 + 12) % 12]!;
