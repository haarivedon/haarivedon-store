/**
 * Imports birth places from the GeoNames gazetteer.
 *
 *   pnpm db:seed:places            # India
 *   COUNTRIES=IN,NP,LK pnpm db:seed:places
 *   MIN_POPULATION=0 pnpm db:seed:places   # include every populated place
 *
 * The dataset is downloaded at run time and never committed: it is tens of
 * megabytes, it changes monthly, and it carries an attribution requirement
 * that is better met by a visible credit than by a file in the repository.
 *
 * Data © GeoNames, licensed CC BY 4.0 — https://www.geonames.org
 * Using it obliges us to credit GeoNames somewhere user-visible.
 */
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "../src/client";

const run = promisify(execFile);

const COUNTRIES = (process.env.COUNTRIES ?? "IN")
  .split(",")
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);

/**
 * Zero by default, deliberately.
 *
 * A population filter looks sensible and is actively wrong here: GeoNames
 * carries 0 for a great many Indian entries, so `>= 1000` silently dropped
 * district towns like Hoshiarpur, Barmer and Etawah while keeping smaller
 * places that happened to have a figure. Ranking by population already puts
 * the big places first; filtering by it just loses towns.
 */
const MIN_POPULATION = Number(process.env.MIN_POPULATION ?? 0);

/**
 * Administrative seats — national capital down to tehsil headquarters.
 *
 * These are kept whatever their recorded population, which is the point:
 * GeoNames carries 0 for a great many Indian entries, so filtering on
 * population alone silently dropped district towns like Hoshiarpur, Barmer
 * and Etawah while keeping smaller places that happened to have a figure.
 */
const ADMIN_SEATS = new Set([
  "PPLC", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5", "PPLG",
]);

/** Ordinary populated places, kept when GeoNames knows a population. */
const POPULATED = new Set(["PPL", "PPLS", "PPLX", "PPLL"]);

/** Lower-case and strip accents, so "Hoshiārpur" matches "hoshiarpur". */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

type Row = {
  name: string;
  search: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  population: number;
};

/** admin1 codes → readable state names, built from the admin1 file. */
async function stateNames(): Promise<Map<string, string>> {
  const response = await fetch(
    "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
  );
  const text = await response.text();
  const map = new Map<string, string>();

  for (const line of text.split("\n")) {
    const [code, name] = line.split("\t");
    if (code && name) map.set(code, name);
  }
  return map;
}

async function download(country: string, dir: string): Promise<string> {
  const url = `https://download.geonames.org/export/dump/${country}.zip`;
  console.log(`  downloading ${url}`);

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`GeoNames returned ${response.status} for ${country}`);
  }

  const zipPath = join(dir, `${country}.zip`);
  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(zipPath),
  );

  // `unzip` rather than a dependency: this script runs on a developer's
  // machine, not in the deployed app.
  await run("unzip", ["-o", "-q", zipPath, `${country}.txt`, "-d", dir]);
  return join(dir, `${country}.txt`);
}

function parse(text: string, states: Map<string, string>): Row[] {
  const rows: Row[] = [];

  for (const line of text.split("\n")) {
    // GeoNames main table, tab separated; see its readme.txt for columns.
    const f = line.split("\t");
    if (f.length < 18) continue;

    // Columns per GeoNames' readme: 1 name, 2 asciiname, 4/5 lat/lng.
    const [, name, asciiName, , lat, lng, featureClass, featureCode, country, , admin1] =
      f;
    const population = Number(f[14] ?? 0);
    const timezone = f[17];

    if (featureClass !== "P") continue;
    if (!name || !lat || !lng || !timezone) continue;

    const code = featureCode ?? "";
    const isSeat = ADMIN_SEATS.has(code);

    // An admin seat always counts. Everything else needs a population, both
    // as a relevance signal and to keep half a million hamlets out.
    if (!isSeat) {
      if (!POPULATED.has(code)) continue;
      if (population <= 0 || population < MIN_POPULATION) continue;
    }

    rows.push({
      // The ASCII spelling is the one people recognise: GeoNames' display
      // name is a strict transliteration ("Hoshiārpur", "Sītāpur").
      name: asciiName || name,
      // Search on the ASCII name, folded: the display name carries
      // diacritics ("Hoshiārpur", "Bārmer"), and nobody types those, so
      // matching on it silently hid every such town.
      search: fold(asciiName || name),
      region: states.get(`${country}.${admin1}`) ?? "",
      country: country ?? "",
      lat: Number(lat),
      lng: Number(lng),
      timezone,
      population,
    });
  }

  return rows;
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "geonames-"));
  console.log(
    `Importing places for ${COUNTRIES.join(", ")} (population >= ${MIN_POPULATION})`,
  );

  try {
    const states = await stateNames();
    const rows: Row[] = [];

    for (const country of COUNTRIES) {
      const file = await download(country, dir);
      const parsed = parse(await readFile(file, "utf8"), states);
      console.log(`  ${country}: ${parsed.length} places`);
      // Not `push(...parsed)`: spreading a six-figure array overflows the
      // call stack.
      for (const row of parsed) rows.push(row);
    }

    if (rows.length === 0) {
      console.error("Nothing matched — check COUNTRIES and MIN_POPULATION.");
      process.exit(1);
    }

    // Replace wholesale: the gazetteer is a snapshot, not an accumulation.
    await prisma.place.deleteMany({
      where: { country: { in: COUNTRIES } },
    });

    const BATCH = 2000;
    for (let i = 0; i < rows.length; i += BATCH) {
      await prisma.place.createMany({ data: rows.slice(i, i + BATCH) });
      process.stdout.write(
        `\r  inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`,
      );
    }

    console.log(`\nDone. ${rows.length} places available to the picker.`);
    console.log(
      "Data © GeoNames (CC BY 4.0) — credit it somewhere user-visible.",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
