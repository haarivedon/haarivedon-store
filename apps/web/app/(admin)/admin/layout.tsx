import type { Metadata } from "next";
import { AdminShell, type PendingCounts } from "@/components/admin/admin-shell";
import { adminFetch, getAdminUser } from "@/lib/admin/session";

/** The admin is never indexed, and never statically rendered. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Haarivedon Admin" },
  // Override the marketing description and keywords the root layout sets —
  // they are invisible here but they are not what this page is.
  description: "Content administration.",
  keywords: [],
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Pending-work badges in the sidebar. A failed call shows no badge. */
async function pendingCounts(): Promise<PendingCounts> {
  const [bookings, predictions, enquiries] = await Promise.all([
    adminFetch<{ meta: { total: number } }>("/bookings?status=pending&perPage=1"),
    adminFetch<{ meta: { total: number } }>(
      "/predictions?status=pending&perPage=1",
    ),
    adminFetch<{ meta: { total: number } }>("/enquiries?status=pending&perPage=1"),
  ]);

  return {
    bookings: bookings?.meta.total ?? 0,
    predictions: predictions?.meta.total ?? 0,
    enquiries: enquiries?.meta.total ?? 0,
  };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Runs for the login page too, where both calls simply come back empty.
  const [user, counts] = await Promise.all([getAdminUser(), pendingCounts()]);

  return (
    <AdminShell user={user} counts={counts}>
      {children}
    </AdminShell>
  );
}
