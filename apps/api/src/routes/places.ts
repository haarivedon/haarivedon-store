import { contract, type Place } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { fallbackPlaces } from "../lib/fallback-places";

const label = (name: string, region: string) =>
  region ? `${name}, ${region}` : name;

/**
 * Same folding the importer applies: lower-case and strip accents, so a
 * search for "hoshiarpur" reaches the row stored for "Hoshiārpur".
 */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Birth-place search.
 *
 * Prefix matches rank above substring ones ("kan" should offer Kanpur before
 * Kanchipuram), and within each group the larger place comes first — someone
 * typing "kanpur" almost always means the city, not Kanpur Dehat.
 *
 * Falls back to a small built-in list when the `places` collection is empty,
 * so a fresh checkout works before anyone has run `pnpm db:seed:places`.
 */
export const placesRouter = tsr.router(contract.places, {
  search: async ({ query }) => {
    const q = fold(query.q);

    const imported = await prisma.place.count();
    if (imported === 0) {
      const matches = fallbackPlaces
        .filter((place) => place.search.includes(q))
        .sort((a, b) => {
          const aStarts = a.search.startsWith(q) ? 0 : 1;
          const bStarts = b.search.startsWith(q) ? 0 : 1;
          return aStarts - bStarts || a.name.localeCompare(b.name);
        })
        .slice(0, query.limit)
        .map(
          (place): Place => ({
            name: place.name,
            region: place.region,
            country: "IN",
            lat: place.lat,
            lng: place.lng,
            timezone: "Asia/Kolkata",
            label: label(place.name, place.region),
          }),
        );

      return { status: 200 as const, body: { data: matches } };
    }

    // Two passes rather than one `contains`: a prefix hit is almost always
    // what was meant, and Mongo can serve it from the index.
    const starts = await prisma.place.findMany({
      where: { search: { startsWith: q } },
      orderBy: [{ population: "desc" }, { name: "asc" }],
      take: query.limit,
    });

    const rest =
      starts.length >= query.limit
        ? []
        : await prisma.place.findMany({
            where: {
              search: { contains: q },
              NOT: { search: { startsWith: q } },
            },
            orderBy: [{ population: "desc" }, { name: "asc" }],
            take: query.limit - starts.length,
          });

    return {
      status: 200 as const,
      body: {
        data: [...starts, ...rest].map(
          (place): Place => ({
            name: place.name,
            region: place.region,
            country: place.country,
            lat: place.lat,
            lng: place.lng,
            timezone: place.timezone,
            label: label(place.name, place.region),
          }),
        ),
      },
    };
  },
});
