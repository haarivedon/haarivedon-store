import PDFDocument from "pdfkit";
import { env } from "../../env";
import { signName } from "./providers";
import type { BirthInput, ChartData, PlanetPosition } from "./types";

/**
 * Renders the Kundali PDF with pdfkit.
 *
 * The chart grids are lines and text, which pdfkit draws directly — that
 * avoids adding React to the API just for layout. Brand colours mirror the
 * tokens in apps/web/app/globals.css.
 */
const FOREST = "#214A2E";
const GOLD = "#F3D85B";
const CHARCOAL = "#20261F";
const MUTED = "#6B7265";
const IVORY = "#FFFDF4";

type Doc = typeof PDFDocument.prototype;

/** House numbers at each cell of a 4×4 South Indian square chart. */
const SOUTH_CELLS: (number | null)[][] = [
  [12, 1, 2, 3],
  [11, null, null, 4],
  [10, null, null, 5],
  [9, 8, 7, 6],
];

export function renderKundaliPdf(
  input: BirthInput,
  chart: ChartData,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: `Kundali — ${input.name}`, Author: "Haarivedon" },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  cover(doc, input, chart);
  doc.addPage();
  charts(doc, chart);
  doc.addPage();
  positions(doc, chart);
  doc.addPage();
  dashas(doc, chart);

  doc.end();
  return done;
}

function heading(doc: Doc, text: string, sub?: string) {
  doc.fillColor(FOREST).fontSize(18).text(text);
  if (sub) {
    doc.moveDown(0.2).fillColor(MUTED).fontSize(9).text(sub);
  }
  doc.moveDown(0.8);
}

function watermark(doc: Doc) {
  doc.save();
  doc
    .rotate(-30, { origin: [300, 420] })
    .fillColor("#B8654A")
    .fillOpacity(0.12)
    .fontSize(56)
    .text("SAMPLE CHART", 60, 380, { align: "center", width: 480 });
  doc.restore().fillOpacity(1);
}

function cover(doc: Doc, input: BirthInput, chart: ChartData) {
  doc.rect(0, 0, doc.page.width, 190).fill(FOREST);
  doc
    .fillColor(IVORY)
    .fontSize(30)
    .text("Haarivedon", 48, 60)
    .fontSize(11)
    .fillColor(GOLD)
    .text("Wisdom · Guidance · Transformation", 48, 100)
    .fillColor(IVORY)
    .fontSize(15)
    .text("Vedic Kundali", 48, 134);

  doc.moveDown(4);
  doc.fillColor(CHARCOAL).fontSize(22).text(input.name, 48, 230);

  const rows: [string, string][] = [
    ["Date of birth", input.localDate],
    ["Time of birth", input.localTime],
    ["Place of birth", input.place],
    ["Coordinates", `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}`],
    ["Timezone", input.tz],
    ["Ascendant (Lagna)", signName(chart.ascendantSign)],
    ["Moon sign (Rashi)", signName(chart.moonSign)],
    ["Birth nakshatra", chart.nakshatra],
  ];

  let y = 272;
  for (const [label, value] of rows) {
    doc.fillColor(MUTED).fontSize(10).text(label, 48, y);
    doc.fillColor(CHARCOAL).fontSize(11).text(value, 200, y);
    y += 22;
  }

  doc
    .fillColor(MUTED)
    .fontSize(8)
    .text(
      `Chart data: ${chart.source}. Prepared on ${new Date().toISOString().slice(0, 10)}.`,
      48,
      doc.page.height - 110,
      { width: 500 },
    )
    .moveDown(0.4)
    .text(
      "This Kundali is prepared from the birth details supplied and carries traditional and spiritual significance. It is not a substitute for medical, legal or financial advice.",
      { width: 500 },
    );

  if (chart.sample) watermark(doc);
}

/** Diamond (North Indian) chart: a square with its diagonals and midpoints. */
function northChart(
  doc: Doc,
  planets: PlanetPosition[],
  x: number,
  y: number,
  size: number,
) {
  const m = size / 2;
  doc.lineWidth(0.8).strokeColor(FOREST);
  doc.rect(x, y, size, size).stroke();
  doc
    .moveTo(x, y)
    .lineTo(x + size, y + size)
    .moveTo(x + size, y)
    .lineTo(x, y + size)
    .stroke();
  doc
    .moveTo(x + m, y)
    .lineTo(x, y + m)
    .lineTo(x + m, y + size)
    .lineTo(x + size, y + m)
    .lineTo(x + m, y)
    .stroke();

  // House label anchors, in house order 1..12.
  const q = size / 4;
  const anchors: [number, number][] = [
    [m, q * 0.6],
    [q * 0.6, q * 0.35],
    [q * 0.35, q * 0.6],
    [q, m],
    [q * 0.35, size - q * 0.6],
    [q * 0.6, size - q * 0.35],
    [m, size - q * 0.6],
    [size - q * 0.6, size - q * 0.35],
    [size - q * 0.35, size - q * 0.6],
    [size - q, m],
    [size - q * 0.35, q * 0.6],
    [size - q * 0.6, q * 0.35],
  ];

  anchors.forEach(([ax, ay], index) => {
    const house = index + 1;
    const occupants = planets
      .filter((planet) => planet.house === house && planet.body !== "Ascendant")
      .map((planet) => abbreviate(planet.body) + (planet.retrograde ? "ᴿ" : ""));

    doc
      .fillColor(MUTED)
      .fontSize(6)
      .text(String(house), x + ax - 14, y + ay - 12, { width: 28, align: "center" });
    doc
      .fillColor(CHARCOAL)
      .fontSize(7)
      .text(occupants.join(" "), x + ax - 28, y + ay - 3, {
        width: 56,
        align: "center",
      });
  });
}

/** Square (South Indian) chart: fixed 4×4 grid. */
function southChart(
  doc: Doc,
  planets: PlanetPosition[],
  x: number,
  y: number,
  size: number,
) {
  const cell = size / 4;
  doc.lineWidth(0.8).strokeColor(FOREST).rect(x, y, size, size).stroke();

  SOUTH_CELLS.forEach((row, r) =>
    row.forEach((house, c) => {
      if (house === null) return;
      const cx = x + c * cell;
      const cy = y + r * cell;
      doc.rect(cx, cy, cell, cell).stroke();

      const occupants = planets
        .filter((p) => p.house === house && p.body !== "Ascendant")
        .map((p) => abbreviate(p.body) + (p.retrograde ? "ᴿ" : ""));

      doc
        .fillColor(MUTED)
        .fontSize(6)
        .text(String(house), cx + 3, cy + 3);
      doc
        .fillColor(CHARCOAL)
        .fontSize(7)
        .text(occupants.join(" "), cx + 3, cy + 14, { width: cell - 6 });
    }),
  );
}

function charts(doc: Doc, chart: ChartData) {
  const draw = env.KUNDALI_CHART_STYLE === "south" ? southChart : northChart;
  const style =
    env.KUNDALI_CHART_STYLE === "south" ? "South Indian" : "North Indian";

  heading(
    doc,
    "Birth charts",
    `${style} layout · Ascendant in ${signName(chart.ascendantSign)}`,
  );

  // Both charts on one row at fixed coordinates. pdfkit adds a page whenever
  // the text cursor runs past the bottom margin, so the drawing code never
  // relies on `doc.y` advancing for it.
  const size = 210;
  const top = 130;
  const rightX = 48 + size + 40;

  doc.fillColor(FOREST).fontSize(11).text("Lagna (D1)", 48, top - 18);
  draw(doc, chart.planets, 48, top, size);

  doc.fillColor(FOREST).fontSize(11).text("Navamsa (D9)", rightX, top - 18);
  draw(doc, chart.navamsa, rightX, top, size);

  const legendY = top + size + 24;
  doc
    .fillColor(MUTED)
    .fontSize(7.5)
    .text(
      "Su Sun · Mo Moon · Ma Mars · Me Mercury · Ju Jupiter · Ve Venus · Sa Saturn · Ra Rahu · Ke Ketu · ᴿ retrograde",
      48,
      legendY,
      { width: 499 },
    );

  doc.y = legendY + 28;
  heading(doc, "Panchang at birth");
  const p = chart.panchang;
  const rows: [string, string][] = [
    ["Weekday", p.weekday],
    ["Tithi", p.tithi],
    ["Nakshatra", p.nakshatra],
    ["Yoga", p.yoga],
    ["Karana", p.karana],
  ];
  let y = doc.y;
  for (const [label, value] of rows) {
    doc.fillColor(MUTED).fontSize(9).text(label, 48, y);
    doc.fillColor(CHARCOAL).fontSize(10).text(value, 170, y);
    y += 18;
  }
  doc.y = y;

  if (chart.sample) watermark(doc);
}

function positions(doc: Doc, chart: ChartData) {
  heading(doc, "Planetary positions");

  const columns = [48, 150, 230, 290, 350, 460];
  const header = ["Body", "Sign", "Degree", "House", "Nakshatra", "Pada"];
  const headerY = doc.y;
  doc.fillColor(MUTED).fontSize(9);
  header.forEach((label, i) => doc.text(label, columns[i]!, headerY));

  doc.y = headerY + 14;
  doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#DDE8B8").stroke();
  doc.y += 8;

  for (const planet of chart.planets) {
    const y = doc.y;
    const values = [
      planet.body + (planet.retrograde ? " (R)" : ""),
      signName(planet.sign),
      `${planet.degree.toFixed(2)}°`,
      String(planet.house),
      planet.nakshatra,
      String(planet.pada),
    ];
    doc.fillColor(CHARCOAL).fontSize(9);
    values.forEach((value, i) => doc.text(value, columns[i]!, y));
    doc.y = y + 16;
  }

  doc.moveDown(1.2);
  heading(doc, "Traditional flags", "Points of assessment, not predictions");
  for (const flag of chart.flags) {
    doc
      .fillColor(flag.present ? "#B8654A" : MUTED)
      .fontSize(10)
      .text(`${flag.present ? "Present" : "Not indicated"} — ${flag.label}`);
    doc.fillColor(MUTED).fontSize(8).text(flag.note).moveDown(0.4);
  }

  if (chart.sample) watermark(doc);
}

function dashas(doc: Doc, chart: ChartData) {
  heading(doc, "Vimshottari Mahadasha", "Planetary periods from the birth moment");

  for (const period of chart.mahadashas) {
    const y = doc.y;
    doc.fillColor(CHARCOAL).fontSize(10).text(period.lord, 48, y);
    doc.fillColor(MUTED).fontSize(9).text(`${period.start} → ${period.end}`, 170, y);
    doc.y = y + 18;
  }

  doc.moveDown(2);
  doc
    .fillColor(MUTED)
    .fontSize(9)
    .text(
      "Prepared by Haarivedon. For a reading of this chart, book a session at haarivedon.com/book.",
      { width: 460 },
    );

  if (chart.sample) watermark(doc);
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
