import { env } from "../env";

/** True when Affiliate API credentials are present, so the sync can run. */
export function udemyConfigured(): boolean {
  return Boolean(env.UDEMY_CLIENT_ID && env.UDEMY_CLIENT_SECRET);
}

/** Normalised Udemy course — the subset the catalogue needs. */
export type UdemyCourse = {
  udemyId: number;
  title: string;
  headline: string;
  url: string;
  image: string;
  price: number | null;
  currency: string;
  rating: number;
};

const WEB = "https://www.udemy.com";

function authHeader(): string {
  const token = Buffer.from(
    `${env.UDEMY_CLIENT_ID}:${env.UDEMY_CLIENT_SECRET}`,
  ).toString("base64");
  return `Basic ${token}`;
}

type UdemyRaw = {
  id: number;
  title?: string;
  headline?: string;
  url?: string;
  image_480x270?: string;
  image_750x422?: string;
  price_detail?: { amount?: number; currency?: string } | null;
  avg_rating?: number;
};

function normalise(r: UdemyRaw): UdemyCourse {
  const rel = r.url ?? "";
  return {
    udemyId: r.id,
    title: r.title ?? "",
    headline: r.headline ?? "",
    url: rel.startsWith("http") ? rel : `${WEB}${rel}`,
    image: r.image_750x422 || r.image_480x270 || "",
    price:
      typeof r.price_detail?.amount === "number"
        ? Math.round(r.price_detail.amount)
        : null,
    currency: r.price_detail?.currency ?? "INR",
    rating: typeof r.avg_rating === "number" ? r.avg_rating : 0,
  };
}

/**
 * Search the Udemy Affiliate catalogue. Used by the sync to find the courses
 * to import — typically by the instructor/brand name (UDEMY_SEARCH).
 */
export async function searchUdemyCourses(
  query: string,
  limit = 50,
): Promise<UdemyCourse[]> {
  if (!udemyConfigured()) return [];

  const fields =
    "title,headline,url,image_480x270,image_750x422,price_detail,avg_rating";
  const url =
    `${env.UDEMY_BASE_URL}/courses/?page=1&page_size=${Math.min(limit, 100)}` +
    `&search=${encodeURIComponent(query)}` +
    `&fields[course]=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`Udemy API responded ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { results?: UdemyRaw[] };
  return (body.results ?? []).filter((r) => r && r.id).map(normalise);
}
