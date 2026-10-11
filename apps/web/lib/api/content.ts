import type { ClientInferRequest } from "@ts-rest/core";
import { contract } from "@repo/contract";
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
