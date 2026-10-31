import Link from "next/link";
import type { Metadata } from "next";
import type { AdminStats } from "@repo/contract";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { ActivityChart, BreakdownBars } from "@/components/admin/stat-charts";

export const metadata: Metadata = { title: "Overview" };

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const paymentStyle: Record<string, string> = {
  paid: "bg-brand-600/15 text-brand-700",
  pending: "bg-gold/20 text-charcoal",
  none: "bg-border/60 text-muted-foreground",
  failed: "bg-terracotta/15 text-terracotta",
};

export default async function AdminHome() {
  const user = await requireAdminUser("/admin");
  const stats = await adminFetch<AdminStats>("/stats");

  if (!stats) {
    return (
      <div>
        <PageHeader title={`Welcome back${user.name ? `, ${user.name}` : ""}`} />
        <Panel className="p-5">
          <p className="text-sm text-muted-foreground">
            We couldn&rsquo;t load the dashboard metrics just now. Refresh the
            page, and if it keeps happening the API may be waking up.
          </p>
        </Panel>
      </div>
    );
  }

  const tiles = [
    { label: "Revenue (paid)", value: inr(stats.revenue.total), href: "/admin/inbox/bookings" },
    { label: "Paid bookings & orders", value: stats.revenue.paidCount, href: "/admin/inbox/bookings" },
    { label: "New bookings", value: stats.pending.bookings, href: "/admin/inbox/bookings" },
    { label: "New enquiries", value: stats.pending.enquiries, href: "/admin/inbox/enquiries" },
    { label: "New predictions", value: stats.pending.predictions, href: "/admin/inbox/predictions" },
    { label: "Published products", value: stats.totals.products, href: "/admin/content/products" },
    { label: "Published courses", value: stats.totals.courses, href: "/admin/content/courses" },
    { label: "Blog posts", value: stats.totals.blog, href: "/admin/content/blog" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name}` : ""}`}
        description="A snapshot of the practice — revenue, what's new in the inbox, and activity over the last two weeks."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className="flex h-full flex-col border border-l-2 border-border border-l-gold bg-white p-5 transition-colors hover:border-brand-600 hover:border-l-gold"
            >
              <span className="font-display text-2xl font-semibold text-forest">
                {tile.value}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {tile.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Panel className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-forest">
            Recent bookings
          </h2>
          <Link
            href="/admin/inbox/bookings"
            className="text-sm font-medium text-brand-700 hover:text-forest"
          >
            View all
          </Link>
        </div>
        {stats.recentBookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Service</th>
                  <th className="pb-2 pr-3 font-medium">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-charcoal">
                      {b.name}
                    </td>
                    <td className="py-2.5 pr-3 text-charcoal/75">
                      {b.service || "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-charcoal/75">
                      {b.amount ? inr(b.amount) : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium capitalize ${paymentStyle[b.paymentStatus] ?? ""}`}
                      >
                        {b.paymentStatus === "none" ? "draft" : b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {shortDate(b.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="mt-6 p-5">
        <h2 className="font-display text-lg font-semibold text-forest">
          Activity — last 14 days
        </h2>
        <div className="mt-4">
          <ActivityChart data={stats.activity} />
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-display text-lg font-semibold text-forest">
            Enquiries by status
          </h2>
          <div className="mt-4">
            <BreakdownBars items={stats.enquiryStatuses} />
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-display text-lg font-semibold text-forest">
            Bookings by payment
          </h2>
          <div className="mt-4">
            <BreakdownBars items={stats.bookingPayments} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
