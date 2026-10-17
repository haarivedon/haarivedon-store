/**
 * Dev-only smoke test / PDF design harness.
 *
 *   pnpm --filter api exec tsx scripts/kundali-test.ts
 *
 * Fetches a chart once via KUNDALI_PROVIDER and caches the ChartData JSON to
 * /tmp/kundali-chart.json, so re-runs render the PDF instantly (no VedAstro
 * round-trip). Delete that file to refetch. Output: /tmp/kundali-test.pdf.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { renderKundaliPdf } from "../src/lib/kundali/pdf";
import { chartProvider } from "../src/lib/kundali/providers";
import type { BirthInput, ChartData } from "../src/lib/kundali/types";

const CACHE = "/tmp/kundali-chart.json";

const input: BirthInput = {
  name: "Neelam Niranjan",
  bornAt: new Date("1992-10-25T09:00:00Z"), // 14:30 Asia/Kolkata
  localDate: "1992-10-25",
  localTime: "14:30",
  place: "Mumbai, Maharashtra, India",
  lat: 18.969,
  lng: 72.821,
  tz: "Asia/Kolkata",
};

let chart: ChartData;
if (existsSync(CACHE)) {
  chart = JSON.parse(readFileSync(CACHE, "utf8")) as ChartData;
  console.log("using cached chart");
} else {
  const provider = chartProvider();
  console.log(`fetching via ${provider.name}…`);
  chart = await provider.getChart(input);
  writeFileSync(CACHE, JSON.stringify(chart));
  console.log("cached chart to", CACHE);
}

const pdf = await renderKundaliPdf(input, chart);
writeFileSync("/tmp/kundali-test.pdf", pdf);
console.log(`PDF ${pdf.byteLength} bytes → /tmp/kundali-test.pdf`);
