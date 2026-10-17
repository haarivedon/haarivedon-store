/** The chart data a Kundali PDF needs, independent of where it came from. */
export type BirthInput = {
  name: string;
  /** UTC instant of birth, derived from the local date/time plus `tz`. */
  bornAt: Date;
  localDate: string;
  localTime: string;
  place: string;
  lat: number;
  lng: number;
  tz: string;
};

export type PlanetPosition = {
  /** Sun, Moon, Mars, … Rahu, Ketu, plus Ascendant. */
  body: string;
  /** 1–12, the sign it occupies. */
  sign: number;
  /** Degrees within the sign, 0–30. */
  degree: number;
  /** 1–12, the house it occupies relative to the ascendant. */
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
};

export type DashaPeriod = {
  lord: string;
  start: string;
  end: string;
};

export type ChartData = {
  /** Which implementation produced this — printed on the PDF. */
  source: string;
  /** True for the built-in placeholder; the PDF is watermarked when set. */
  sample: boolean;
  ascendantSign: number;
  moonSign: number;
  sunSign: number;
  nakshatra: string;
  planets: PlanetPosition[];
  /** Navamsa (D9) placements, same shape as the main chart. */
  navamsa: PlanetPosition[];
  mahadashas: DashaPeriod[];
  panchang: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
    weekday: string;
  };
  /** Flags the client's reading starts from — never presented as outcomes. */
  flags: { label: string; present: boolean; note: string }[];
  /**
   * Rendered chart SVGs, when the provider supplies them (VedAstro does). The
   * PDF embeds these as images; absent, it falls back to drawing the grid
   * itself. `rasi` is the D1, `navamsa` the D9.
   */
  charts?: {
    rasi?: string;
    navamsa?: string;
  };
};

export interface ChartProvider {
  readonly name: string;
  getChart(input: BirthInput): Promise<ChartData>;
}

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

/** Vimshottari dasha order and period lengths, in years. */
export const DASHA_YEARS: [string, number][] = [
  ["Ketu", 7],
  ["Venus", 20],
  ["Sun", 6],
  ["Moon", 10],
  ["Mars", 7],
  ["Rahu", 18],
  ["Jupiter", 16],
  ["Saturn", 19],
  ["Mercury", 17],
];
