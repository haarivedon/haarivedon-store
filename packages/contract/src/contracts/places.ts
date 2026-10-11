import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const placeSchema = z.object({
  name: z.string(),
  region: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  timezone: z.string(),
  /** "Kanpur, Uttar Pradesh" — what gets stored as the birth place. */
  label: z.string(),
});
export type Place = z.infer<typeof placeSchema>;

/**
 * Birth-place search. Public and read-only: it is needed before someone has
 * submitted anything, and the data is a published gazetteer.
 */
export const placesContract = c.router({
  search: {
    method: "GET",
    path: "/places",
    query: z.object({
      q: z.string().min(2).max(80),
      limit: z.coerce.number().int().min(1).max(20).default(8),
    }),
    responses: { 200: z.object({ data: z.array(placeSchema) }) },
    summary: "Search birth places by name.",
  },
});
