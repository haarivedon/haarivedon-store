import type { ClientInferRequest } from "@ts-rest/core";
import {
  contract,
  parseSiteContent,
  type SiteContentKey,
  type SiteContentValue,
} from "@repo/contract";
import { api } from "@/lib/api/client";

/**
 * Read helpers for the content pages.
 *
 * Pages are statically rendered on a 5-minute revalidate floor, so publishing
 * from the admin shows up without a redeploy (docs/PLAN.md §3.3). If the API
 * is unreachable these return empty instead of throwing — the page still
 * renders its copy and its empty state rather than 500-ing.
 */
const revalidate = { next: { revalidate: 300 } } as const;

type ProductQuery = ClientInferRequest<typeof contract.products.list>["query"];
type CourseQuery = ClientInferRequest<typeof contract.courses.list>["query"];

export async function getServices() {
  try {
    const res = await api.services.list({ fetchOptions: revalidate });
    return res.status === 200 ? res.body.data : [];
  } catch {
    return [];
  }
}

export async function getProducts(query: Partial<ProductQuery> = {}) {
  try {
    const res = await api.products.list({
      query: { page: 1, perPage: 100, ...query },
      fetchOptions: revalidate,
    });
    return res.status === 200 ? res.body.data : [];
  } catch {
    return [];
  }
}

export async function getCourses(query: Partial<CourseQuery> = {}) {
  try {
    const res = await api.courses.list({
      query: { page: 1, perPage: 100, ...query },
      fetchOptions: revalidate,
    });
    return res.status === 200 ? res.body.data : [];
  } catch {
    return [];
  }
}

/**
 * Every published product, across all pages.
 *
 * The list endpoint caps `perPage` at 100 (paginationQuerySchema), so a single
 * request silently drops anything past the first 100. The listing page, the
 * prerender params and the sitemap all need the whole catalogue, so walk the
 * pages until `meta.totalPages` is covered. `getProducts` stays for bounded
 * callers (related items, featured).
 */
export async function getAllProducts(query: Partial<ProductQuery> = {}) {
  try {
    const first = await api.products.list({
      query: { page: 1, perPage: 100, ...query },
      fetchOptions: revalidate,
    });
    if (first.status !== 200) return [];

    const all = [...first.body.data];
    for (let page = 2; page <= first.body.meta.totalPages; page++) {
      const res = await api.products.list({
        query: { page, perPage: 100, ...query },
        fetchOptions: revalidate,
      });
      if (res.status === 200) all.push(...res.body.data);
    }
    return all;
  } catch {
    return [];
  }
}

/** Every published course, across all pages. See `getAllProducts`. */
export async function getAllCourses(query: Partial<CourseQuery> = {}) {
  try {
    const first = await api.courses.list({
      query: { page: 1, perPage: 100, ...query },
      fetchOptions: revalidate,
    });
    if (first.status !== 200) return [];

    const all = [...first.body.data];
    for (let page = 2; page <= first.body.meta.totalPages; page++) {
      const res = await api.courses.list({
        query: { page, perPage: 100, ...query },
        fetchOptions: revalidate,
      });
      if (res.status === 200) all.push(...res.body.data);
    }
    return all;
  } catch {
    return [];
  }
}

export async function getCourse(slug: string) {
  try {
    const res = await api.courses.getBySlug({
      params: { slug },
      fetchOptions: revalidate,
    });
    return res.status === 200 ? res.body : null;
  } catch {
    return null;
  }
}

export async function getProduct(slug: string) {
  try {
    const res = await api.products.getBySlug({
      params: { slug },
      fetchOptions: revalidate,
    });
    return res.status === 200 ? res.body : null;
  } catch {
    return null;
  }
}

/**
 * Editable page copy (CR-3).
 *
 * Read through the key's schema, so an unsaved key yields its defaults and
 * the caller can fall back to the wording in code field by field — a key the
 * client has never touched must not blank a section (docs/PLAN.md §12).
 */
export async function getSiteContent<K extends SiteContentKey>(
  key: K,
): Promise<SiteContentValue<K>> {
  try {
    const response = await api.siteContent.get({
      params: { key },
      fetchOptions: revalidate,
    });
    return response.status === 200
      ? parseSiteContent(key, response.body.data)
      : parseSiteContent(key, {});
  } catch {
    return parseSiteContent(key, {});
  }
}

/** Returns `fallback` whenever the client has left a field empty. */
export const orFallback = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value : fallback;
