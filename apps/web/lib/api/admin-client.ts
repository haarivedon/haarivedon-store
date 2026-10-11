import { contract } from "@repo/contract";
import { initClient } from "@ts-rest/core";

/**
 * Admin API client.
 *
 * Separate from the public client for one reason: `credentials: "include"`.
 * The session cookie is set on the shared parent domain and the admin runs on
 * a different host from the API, so every admin request has to opt in to
 * sending it (docs/PLAN.md §3.3).
 */
export const adminApi = initClient(contract.admin, {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  baseHeaders: {},
  throwOnUnknownStatus: false,
  credentials: "include",
});

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Uploads are multipart, so they bypass the contract client. */
export async function uploadImage(file: File, alt: string) {
  const body = new FormData();
  body.set("file", file);
  body.set("alt", alt);

  const response = await fetch(`${API_BASE}/api/admin/media/upload`, {
    method: "POST",
    body,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; id?: string; url?: string; alt?: string }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      error: payload?.error ?? "The upload failed. Please try again.",
    };
  }
  return { ok: true as const, media: payload as { id: string; url: string; alt: string } };
}
