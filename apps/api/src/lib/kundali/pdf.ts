import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { env } from "../../env";
import { signName } from "./providers";
import type { BirthInput, ChartData, PlanetPosition } from "./types";

/**
 * Renders the Kundali PDF with pdfkit, styled to the Haarivedon brand:
 * royal indigo as the dark anchor, sacred gold as the accent, cream/ivory
 * bands, and the brand faces (Schibsted Grotesk display, Be Vietnam Pro body,
 * Tangerine script) embedded from `assets/fonts`. Mirrors the tokens in
 * apps/web/app/globals.css.
 *
 * The birth charts are the provider's rendered SVGs, rasterised and embedded;
 * if a provider gives no SVG, pdfkit draws the grid itself as a fallback.
 */

// ── Palette (current theme — logo navy, see globals.css) ───────────────────
const INDIGO = "#000142";
const INDIGO_700 = "#00012e";
const INDIGO_600 = "#1a1c7a";
const GOLD = "#f7bf1e";
const GOLD_600 = "#e0a400";
const SAGE = "#dde8b8";
const VERMILION = "#da352f";
const CREAM = "#f5f1d8";
const IVORY = "#fffdf4";
const CHARCOAL = "#20261f";
const MUTED = "#6b7265";
const LINE = "#e6e0c8"; // hairline on light bands

// ── Fonts ───────────────────────────────────────────────────────────────────
const DISPLAY = "Display"; // Schibsted Grotesk
const BODY = "Body"; // Be Vietnam Pro
const BODY_MED = "BodyMed"; // Be Vietnam Pro SemiBold
const BODY_BOLD = "BodyBold"; // Be Vietnam Pro Bold
const SCRIPT = "Script"; // Tangerine

// ── Geometry (A4) ─────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;
const CW = PAGE_W - M * 2;

type Doc = typeof PDFDocument.prototype;

/** Walk up from this module to the app's `assets/` dir (works in src & dist). */
function assetsRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 7; i += 1) {
    if (existsSync(resolve(dir, "assets/fonts"))) return resolve(dir, "assets");
    dir = resolve(dir, "..");
  }
  throw new Error("Kundali assets directory not found.");
}
const asset = (rel: string) => resolve(assetsRoot(), rel);

function registerFonts(doc: Doc) {
  doc.registerFont(DISPLAY, asset("fonts/SchibstedGrotesk-VF.ttf"));
  doc.registerFont(BODY, asset("fonts/BeVietnamPro-Regular.ttf"));
  doc.registerFont(BODY_MED, asset("fonts/BeVietnamPro-SemiBold.ttf"));
  doc.registerFont(BODY_BOLD, asset("fonts/BeVietnamPro-Bold.ttf"));
  doc.registerFont(SCRIPT, asset("fonts/Tangerine-Bold.ttf"));
}

const RETROGRADE = " (R)";
const RANGE = " – ";

const SOUTH_CELLS: (number | null)[][] = [
  [12, 1, 2, 3],
  [11, null, null, 4],
  [10, null, null, 5],
  [9, 8, 7, 6],
];

export async function renderKundaliPdf(
  input: BirthInput,
  chart: ChartData,
): Promise<Buffer> {
  // pdfkit cannot place an SVG, so provider-supplied chart SVGs are rasterised
  // to PNG up front (sharp uses librsvg). Brand imagery is loaded here too.
  const rasiPng = await svgToPng(chart.charts?.rasi);
  const navamsaPng = await svgToPng(chart.charts?.navamsa);
  const logo = loadImage("brand/logo.png");
  const zodiac = await zodiacGhost();

  const doc = new PDFDocument({
    size: "A4",
    margin: M,
    info: { Title: `Kundali — ${input.name}`, Author: "Haarivedon" },
  });
  registerFonts(doc);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  coverPage(doc, input, chart, logo, zodiac);
  doc.addPage();
  chartsPage(doc, chart, rasiPng, navamsaPng);
  doc.addPage();
  positionsPage(doc, chart);
  doc.addPage();
  dashaPage(doc, chart);

  doc.end();
  return done;
}

// ── Asset helpers ───────────────────────────────────────────────────────────

function loadImage(rel: string): Buffer | null {
  try {
    return readFileSync(asset(rel));
  } catch {
    return null;
  }
}

/** The zodiac wheel as a faint gold ghost for the cover (webp → tinted png). */
async function zodiacGhost(): Promise<Buffer | null> {
  const src = loadImage("brand/zodiac-wheel.webp");
  if (!src) return null;
  try {
    return await sharp(src)
      .resize(520, 520, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .tint(GOLD)
      .ensureAlpha()
      .linear([1, 1, 1, 0.16], [0, 0, 0, 0])
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

/** Rasterise a chart SVG to a square PNG for embedding; null if unavailable. */
async function svgToPng(svg: string | undefined): Promise<Buffer | null> {
  if (!svg) return null;
  try {
    return await sharp(Buffer.from(svg), { density: 220 })
      .resize(760, 760, { fit: "contain", background: IVORY })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ── Text + shape primitives ─────────────────────────────────────────────────

type TextOpts = {
  width?: number;
  align?: "left" | "center" | "right";
  characterSpacing?: number;
  lineGap?: number;
};
function write(
  doc: Doc,
  str: string,
  x: number,
  y: number,
  font: string,
  size: number,
  color: string,
  opts: TextOpts = {},
) {
  doc.font(font).fontSize(size).fillColor(color).text(str, x, y, opts);
}

/** A small gold diamond — the recurring brand accent mark. */
function diamond(doc: Doc, cx: number, cy: number, r: number, color = GOLD) {
  doc
    .save()
    .moveTo(cx, cy - r)
    .lineTo(cx + r, cy)
    .lineTo(cx, cy + r)
    .lineTo(cx - r, cy)
    .closePath()
    .fill(color)
    .restore();
}

/** Eyebrow + display title block; returns the y below it. */
function sectionHead(doc: Doc, eyebrow: string, title: string, y: number): number {
  diamond(doc, M + 3, y + 4, 3);
  write(doc, eyebrow.toUpperCase(), M + 14, y, BODY_MED, 8.5, GOLD_600, {
    characterSpacing: 1.6,
  });
  write(doc, title, M, y + 14, DISPLAY, 21, INDIGO);
  const ry = y + 44;
  doc.save().lineWidth(2).strokeColor(GOLD).moveTo(M, ry).lineTo(M + 34, ry).stroke().restore();
  return ry + 14;
}

function pageBackground(doc: Doc) {
  doc.save().rect(0, 0, PAGE_W, PAGE_H).fill(IVORY).restore();
}

function watermark(doc: Doc) {
  doc
    .save()
    .rotate(-28, { origin: [PAGE_W / 2, 430] })
    .fillColor(VERMILION)
    .fillOpacity(0.08)
    .font(DISPLAY)
    .fontSize(62)
    .text("SAMPLE CHART", 40, 400, { align: "center", width: PAGE_W - 80 })
    .restore();
}

// ── Page 1: cover ────────────────────────────────────────────────────────────

function coverPage(
  doc: Doc,
  input: BirthInput,
  chart: ChartData,
  logo: Buffer | null,
  zodiac: Buffer | null,
) {
  pageBackground(doc);

  // Indigo header panel with a vertical gradient.
  const panelH = 250;
  const grad = doc.linearGradient(0, 0, PAGE_W, panelH);
  grad.stop(0, INDIGO).stop(1, INDIGO_700);
  doc.save().rect(0, 0, PAGE_W, panelH).fill(grad).restore();

  // Faint zodiac wheel bleeding off the right edge.
  if (zodiac) {
    doc.save();
    doc.image(zodiac, PAGE_W - 250, panelH - 300, { width: 300, height: 300 });
    doc.restore();
  }

  // Logo + wordmark.
  if (logo) doc.image(logo, M, 40, { width: 46, height: 46 });
  write(doc, "Haarivedon", M + 60, 44, DISPLAY, 24, IVORY);
  write(
    doc,
    "Wisdom · Guidance · Transformation",
    M + 62,
    76,
    SCRIPT,
    22,
    GOLD,
  );

  // Hero label.
  doc.save().lineWidth(2).strokeColor(GOLD).moveTo(M, 150).lineTo(M + 30, 150).stroke().restore();
  write(doc, "Vedic Kundali", M, 158, DISPLAY, 34, IVORY);
  write(
    doc,
    "Birth chart, planetary positions & Vimshottari periods",
    M,
    204,
    BODY,
    10.5,
    SAGE,
  );

  // Native's name.
  write(doc, input.name, M, 286, DISPLAY, 25, INDIGO);
  diamond(doc, M + 4, 326, 3);
  write(doc, "PREPARED FOR THIS BIRTH", M + 14, 322, BODY_MED, 8, GOLD_600, {
    characterSpacing: 1.4,
  });

  // Birth-details card.
  const cardY = 350;
  const cardH = 196;
  doc.save().roundedRect(M, cardY, CW, cardH, 14).fill(CREAM).restore();
  doc
    .save()
    .roundedRect(M, cardY, CW, cardH, 14)
    .lineWidth(0.8)
    .strokeColor(GOLD)
    .stroke()
    .restore();

  const rows: [string, string][] = [
    ["Date of birth", input.localDate],
    ["Time of birth", input.localTime],
    ["Place of birth", input.place],
    ["Coordinates", `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}`],
    ["Timezone", input.tz],
  ];
  let ry = cardY + 22;
  for (const [label, value] of rows) {
    write(doc, label, M + 24, ry, BODY, 9.5, MUTED);
    write(doc, value, M + 190, ry, BODY_MED, 10.5, CHARCOAL, {
      width: CW - 214,
    });
    ry += 20;
  }

  // Three summary chips (Lagna / Rashi / Nakshatra).
  const chipY = cardY + 128;
  const chipGap = 12;
  const chipW = (CW - 48 - chipGap * 2) / 3;
  const chips: [string, string][] = [
    ["Ascendant · Lagna", signName(chart.ascendantSign)],
    ["Moon sign · Rashi", signName(chart.moonSign)],
    ["Birth nakshatra", chart.nakshatra || "—"],
  ];
  chips.forEach(([label, value], i) => {
    const x = M + 24 + i * (chipW + chipGap);
    doc.save().roundedRect(x, chipY, chipW, 52, 10).fill(IVORY).restore();
    doc
      .save()
      .roundedRect(x, chipY, chipW, 52, 10)
      .lineWidth(0.8)
      .strokeColor(SAGE)
      .stroke()
      .restore();
    write(doc, label.toUpperCase(), x + 12, chipY + 11, BODY_MED, 7, GOLD_600, {
      characterSpacing: 0.8,
      width: chipW - 24,
    });
    write(doc, value, x + 12, chipY + 24, DISPLAY, 15, INDIGO, {
      width: chipW - 24,
    });
  });

  // Footer: provenance + disclaimer + signature.
  const footY = PAGE_H - 108;
  doc.save().lineWidth(0.6).strokeColor(LINE).moveTo(M, footY).lineTo(PAGE_W - M, footY).stroke().restore();
  write(
    doc,
    `Chart data: ${chart.source}. Prepared on ${new Date().toISOString().slice(0, 10)}.`,
    M,
    footY + 10,
    BODY,
    8,
    MUTED,
    { width: 360 },
  );
  write(
    doc,
    "This Kundali is prepared from the birth details supplied and carries traditional and spiritual significance. It is not a substitute for medical, legal or financial advice.",
    M,
    footY + 24,
    BODY,
    8,
    MUTED,
    { width: 360, lineGap: 1 },
  );
  write(doc, "Haarivedon", PAGE_W - M - 150, footY + 22, SCRIPT, 26, GOLD_600, {
    width: 150,
    align: "right",
  });

  if (chart.sample) watermark(doc);
}

// ── Page 2: charts + panchang ────────────────────────────────────────────────

function chartsPage(
  doc: Doc,
  chart: ChartData,
  rasiPng: Buffer | null,
  navamsaPng: Buffer | null,
) {
  pageBackground(doc);
  const style = env.KUNDALI_CHART_STYLE === "south" ? "South Indian" : "North Indian";
  let y = sectionHead(doc, "The charts", "Lagna & Navamsa", 56);
  write(
    doc,
    `${style} layout · Ascendant in ${signName(chart.ascendantSign)}`,
    M,
    y - 6,
    BODY,
    9.5,
    MUTED,
  );

  // Two framed chart cards.
  y += 20;
  const gap = 20;
  const cardW = (CW - gap) / 2;
  const cardH = cardW + 30;
  chartCard(doc, M, y, cardW, cardH, "Lagna · D1", rasiPng, chart.planets, false);
  chartCard(doc, M + cardW + gap, y, cardW, cardH, "Navamsa · D9", navamsaPng, chart.navamsa, env.KUNDALI_CHART_STYLE === "south");

  const legendY = y + cardH + 14;
  write(
    doc,
    "Su Sun · Mo Moon · Ma Mars · Me Mercury · Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu · (R) retrograde",
    M,
    legendY,
    BODY,
    7.5,
    MUTED,
    { width: CW },
  );

  // Panchang card.
  const pY = legendY + 28;
  panchangCard(doc, pY, chart);

  if (chart.sample) watermark(doc);
}

function chartCard(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  png: Buffer | null,
  planets: PlanetPosition[],
  south: boolean,
) {
  doc.save().roundedRect(x, y, w, h, 12).fill("#ffffff").restore();
  doc.save().roundedRect(x, y, w, h, 12).lineWidth(0.8).strokeColor(SAGE).stroke().restore();
  // Title bar.
  doc.save().roundedRect(x, y, w, 26, 12).fill(INDIGO).restore();
  doc.save().rect(x, y + 14, w, 12).fill(INDIGO).restore(); // square off the bottom of the bar
  write(doc, title, x, y + 8, BODY_MED, 9.5, IVORY, { width: w, align: "center" });

  const pad = 12;
  const inner = Math.min(w - pad * 2, h - 26 - pad * 2);
  const ix = x + (w - inner) / 2;
  const iy = y + 26 + (h - 26 - inner) / 2;
  if (png) {
    doc.image(png, ix, iy, { width: inner, height: inner });
  } else {
    const draw = south ? southChart : northChart;
    draw(doc, planets, ix, iy, inner);
  }
}

function panchangCard(doc: Doc, y: number, chart: ChartData) {
  const h = 150;
  doc.save().roundedRect(M, y, CW, h, 12).fill(CREAM).restore();
  doc.save().roundedRect(M, y, CW, 30, 12).fill(INDIGO).restore();
  doc.save().rect(M, y + 16, CW, 14).fill(INDIGO).restore();
  write(doc, "Panchang at birth", M + 16, y + 9, BODY_MED, 11, IVORY);

  const p = chart.panchang;
  const rows: [string, string][] = [
    ["Weekday", p.weekday],
    ["Tithi", p.tithi],
    ["Nakshatra", p.nakshatra],
    ["Yoga", p.yoga],
    ["Karana", p.karana],
  ];
  let ry = y + 40;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 1) {
      doc.save().rect(M + 1, ry - 3, CW - 2, 20).fill(IVORY).fillOpacity(0.6).restore();
    }
    write(doc, label, M + 16, ry, BODY, 9.5, MUTED);
    write(doc, value, M + 180, ry, BODY_MED, 10, CHARCOAL, { width: CW - 200 });
    ry += 21;
  });
}

// ── Page 3: positions + flags ────────────────────────────────────────────────

function positionsPage(doc: Doc, chart: ChartData) {
  pageBackground(doc);
  let y = sectionHead(doc, "The planets", "Planetary positions", 56);
  y += 6;

  const cols = [M + 14, M + 150, M + 232, M + 300, M + 350, M + 470];
  const headers = ["Body", "Sign", "Degree", "House", "Nakshatra", "Pada"];
  const rowH = 22;

  // Header band.
  doc.save().roundedRect(M, y, CW, 24, 6).fill(INDIGO).restore();
  headers.forEach((label, i) =>
    write(doc, label, cols[i]!, y + 7, BODY_MED, 8.5, IVORY, {
      characterSpacing: 0.4,
    }),
  );
  y += 24;

  chart.planets.forEach((planet, i) => {
    if (i % 2 === 0) {
      doc.save().rect(M, y, CW, rowH).fill(CREAM).fillOpacity(0.5).restore();
    }
    diamond(doc, M + 6, y + rowH / 2, 2, GOLD);
    const values = [
      planet.body + (planet.retrograde ? RETROGRADE : ""),
      signName(planet.sign),
      `${planet.degree.toFixed(2)}°`,
      String(planet.house),
      planet.nakshatra || "—",
      String(planet.pada || "—"),
    ];
    const ty = y + 7;
    write(doc, values[0]!, cols[0]!, ty, BODY_MED, 9, INDIGO);
    for (let c = 1; c < values.length; c += 1) {
      write(doc, values[c]!, cols[c]!, ty, BODY, 9, CHARCOAL);
    }
    y += rowH;
  });

  // Traditional flags.
  y += 24;
  y = sectionHead(doc, "Points of assessment", "Traditional flags", y);
  write(
    doc,
    "Starting points for a reading — never presented as outcomes.",
    M,
    y - 6,
    BODY,
    9,
    MUTED,
  );
  y += 18;

  for (const flag of chart.flags) {
    flagBadge(doc, M, y, flag.present);
    write(doc, flag.label, M + 108, y + 3, BODY_MED, 11, INDIGO);
    write(doc, flag.note, M + 108, y + 19, BODY, 8.5, MUTED, { width: CW - 108 });
    y += 46;
  }

  if (chart.sample) watermark(doc);
}

function flagBadge(doc: Doc, x: number, y: number, present: boolean) {
  const w = 92;
  const h = 24;
  const bg = present ? "#fbe3e1" : SAGE;
  const fg = present ? VERMILION : "#5a6b35";
  const label = present ? "Present" : "Not indicated";
  doc.save().roundedRect(x, y, w, h, 12).fill(bg).restore();
  diamond(doc, x + 14, y + h / 2, 2.5, fg);
  write(doc, label, x + 22, y + 7, BODY_MED, 8.5, fg, { width: w - 28 });
}

// ── Page 4: dasha ────────────────────────────────────────────────────────────

function dashaPage(doc: Doc, chart: ChartData) {
  pageBackground(doc);
  let y = sectionHead(doc, "The timeline", "Vimshottari Mahadasha", 56);
  write(
    doc,
    "The sequence of planetary periods from the moment of birth.",
    M,
    y - 6,
    BODY,
    9.5,
    MUTED,
  );
  y += 24;

  const now = new Date().toISOString().slice(0, 10);
  const lineX = M + 10;
  const first = y;
  const rowH = 40;

  chart.mahadashas.forEach((period) => {
    const current = period.start <= now && now <= period.end;
    if (current) {
      doc.save().roundedRect(M, y - 6, CW, rowH - 4, 10).fill("#fff7da").restore();
      doc
        .save()
        .roundedRect(M, y - 6, CW, rowH - 4, 10)
        .lineWidth(0.8)
        .strokeColor(GOLD)
        .stroke()
        .restore();
    }
    // Node on the timeline.
    doc.save().circle(lineX + 20, y + 10, current ? 5 : 3.5).fill(current ? GOLD : INDIGO_600).restore();
    write(doc, period.lord, lineX + 40, y + 2, BODY_MED, 12, INDIGO);
    write(doc, `${period.start}${RANGE}${period.end}`, lineX + 40, y + 20, BODY, 9, MUTED);
    if (current) {
      write(doc, "CURRENT", PAGE_W - M - 80, y + 7, BODY_MED, 8, GOLD_600, {
        characterSpacing: 1,
        width: 68,
        align: "right",
      });
    }
    y += rowH;
  });

  // Connecting line behind the nodes.
  doc
    .save()
    .lineWidth(1)
    .strokeColor(LINE)
    .moveTo(lineX + 20, first + 10)
    .lineTo(lineX + 20, y - rowH + 10)
    .stroke()
    .restore();

  // Footer band.
  const bandY = PAGE_H - 120;
  doc.save().roundedRect(M, bandY, CW, 72, 14).fill(INDIGO).restore();
  write(doc, "With care,", M + 24, bandY + 14, BODY, 9.5, SAGE);
  write(doc, "Haarivedon", M + 20, bandY + 24, SCRIPT, 30, GOLD);
  write(
    doc,
    "For a reading of this chart, book a session at haarivedon.com/book.",
    PAGE_W - M - 230,
    bandY + 30,
    BODY,
    9,
    IVORY,
    { width: 210, align: "right" },
  );

  if (chart.sample) watermark(doc);
}

// ── Fallback hand-drawn charts (used only when a provider gives no SVG) ───────

/** Diamond (North Indian) chart. */
function northChart(
  doc: Doc,
  planets: PlanetPosition[],
  x: number,
  y: number,
  size: number,
) {
  const m = size / 2;
  doc.save().lineWidth(0.8).strokeColor(INDIGO);
  doc.rect(x, y, size, size).stroke();
  doc.moveTo(x, y).lineTo(x + size, y + size).moveTo(x + size, y).lineTo(x, y + size).stroke();
  doc
    .moveTo(x + m, y)
    .lineTo(x, y + m)
    .lineTo(x + m, y + size)
    .lineTo(x + size, y + m)
    .lineTo(x + m, y)
    .stroke();
  doc.restore();

  const anchors: [number, number][] = [
    [size / 2, size / 4],
    [size / 4, size / 8],
    [size / 8, size / 4],
    [size / 4, size / 2],
    [size / 8, (size * 3) / 4],
    [size / 4, (size * 7) / 8],
    [size / 2, (size * 3) / 4],
    [(size * 3) / 4, (size * 7) / 8],
    [(size * 7) / 8, (size * 3) / 4],
    [(size * 3) / 4, size / 2],
    [(size * 7) / 8, size / 4],
    [(size * 3) / 4, size / 8],
  ];

  anchors.forEach(([ax, ay], index) => {
    const house = index + 1;
    const occupants = planets
      .filter((planet) => planet.house === house && planet.body !== "Ascendant")
      .map((planet) => abbreviate(planet.body) + (planet.retrograde ? "·R" : ""));
    write(doc, String(house), x + ax - 14, y + ay - 11, BODY, 6, MUTED, {
      width: 28,
      align: "center",
    });
    write(doc, occupants.join(" "), x + ax - 30, y + ay - 2, BODY_MED, 6.5, CHARCOAL, {
      width: 60,
      align: "center",
    });
  });
}

/** Square (South Indian) chart. */
function southChart(
  doc: Doc,
  planets: PlanetPosition[],
  x: number,
  y: number,
  size: number,
) {
  const cell = size / 4;
  doc.save().lineWidth(0.8).strokeColor(INDIGO).rect(x, y, size, size).stroke();
  SOUTH_CELLS.forEach((row, r) =>
    row.forEach((house, c) => {
      if (house === null) return;
      const cx = x + c * cell;
      const cy = y + r * cell;
      doc.rect(cx, cy, cell, cell).stroke();
      const occupants = planets
        .filter((p) => p.house === house && p.body !== "Ascendant")
        .map((p) => abbreviate(p.body) + (p.retrograde ? "·R" : ""));
      write(doc, String(house), cx + 3, cy + 3, BODY, 6, MUTED);
      write(doc, occupants.join(" "), cx + 3, cy + 14, BODY_MED, 7, CHARCOAL, {
        width: cell - 6,
      });
    }),
  );
  doc.restore();
}

const ABBREVIATIONS: Record<string, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Ascendant: "As",
};
const abbreviate = (body: string) => ABBREVIATIONS[body] ?? body.slice(0, 2);
