import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminUser } from "@repo/contract";
import { API_BASE } from "@/lib/api/admin-client";

/**
 * Server-side session check.
 *
 * Done in the layout rather than in middleware: the session lives in the
 * API's database, so the only way to validate it is to ask the API — and the
 * API is the component that owns authorization anyway (docs/PLAN.md §3.3).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;

  try {
    const response = await fetch(`${API_BASE}/api/admin/auth/session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { user: AdminUser };
    return body.user;
  } catch {
    return null;
  }
}

/** Use in every admin page except the login screen. */
export async function requireAdminUser(returnTo?: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;

  redirect(
    returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : "/admin/login",
  );
}

/**
 * Server-side fetch of an admin endpoint, forwarding the session cookie.
 * Admin pages render on the server, so they cannot use the browser client.
 */
export async function adminFetch<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  try {
    const response = await fetch(`${API_BASE}/api/admin${path}`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
