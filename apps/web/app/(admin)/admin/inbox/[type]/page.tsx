import Link from "next/link";
import { notFound } from "next/navigation";
import { InboxTable, type InboxKind } from "@/components/admin/inbox-table";
import { PageHeader } from "@/components/admin/page-header";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

const tabs: { key: InboxKind; label: string; path: string }[] = [
  { key: "bookings", label: "Bookings", path: "/bookings" },
  { key: "predictions", label: "Prediction requests", path: "/predictions" },
  { key: "enquiries", label: "Course enquiries", path: "/course-enquiries" },
];

export async function generateMetadata({ params }: PageProps<"/admin/inbox/[type]">) {
  const { type } = await params;
  return { title: tabs.find((tab) => tab.key === type)?.label ?? "Inbox" };
}

export default async function InboxPage({
  params,
  searchParams,
}: PageProps<"/admin/inbox/[type]">) {
  const { type } = await params;
  const tab = tabs.find((candidate) => candidate.key === type);
  if (!tab) notFound();

  await requireAdminUser(`/admin/inbox/${type}`);

  const { q, page } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const current = Number(typeof page === "string" ? page : 1) || 1;

  const query = new URLSearchParams({ page: String(current), perPage: "25" });
  if (search) query.set("search", search);

  const result = await adminFetch<{
    data: (Record<string, unknown> & { id: string; createdAt: string })[];
    meta: { total: number; totalPages: number; page: number };
  }>(`${tab.path}?${query}`);

  return (
    <div>
      <PageHeader
        title={tab.label}
        description={
          result
            ? `${result.meta.total} in total. Nothing here is editable — this is what people sent you.`
            : "Could not load the inbox — is the API running?"
        }
      />

      <nav aria-label="Inbox sections" className="flex flex-wrap gap-2">
        {tabs.map((candidate) => (
          <Link
            key={candidate.key}
            href={`/admin/inbox/${candidate.key}`}
            aria-current={candidate.key === tab.key ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              candidate.key === tab.key
                ? "border-forest bg-forest text-ivory"
                : "border-border bg-white text-charcoal/80 hover:border-brand-600",
            )}
          >
            {candidate.label}
          </Link>
        ))}
      </nav>

      <form className="mt-5 flex items-end gap-3" action="">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">Search</span>
          <input
            name="q"
            defaultValue={search}
            placeholder="Name, mobile or email"
            className="h-10 w-64 rounded-xl border border-border bg-white px-3 text-sm shadow-sm"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-medium shadow-sm hover:border-brand-600"
        >
          Search
        </button>
      </form>

      <InboxTable kind={tab.key} rows={result?.data ?? []} />

      {result && result.meta.totalPages > 1 && (
        <nav className="mt-5 flex items-center gap-3 text-sm" aria-label="Pages">
          {current > 1 && (
            <Link
              href={`?page=${current - 1}${search ? `&q=${search}` : ""}`}
              className="rounded-lg border border-border px-3 py-1.5"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {result.meta.page} of {result.meta.totalPages}
          </span>
          {current < result.meta.totalPages && (
            <Link
              href={`?page=${current + 1}${search ? `&q=${search}` : ""}`}
              className="rounded-lg border border-border px-3 py-1.5"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
