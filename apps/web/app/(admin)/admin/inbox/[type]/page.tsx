import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { InboxTable, type InboxKind } from "@/components/admin/inbox-table";
import { PageHeader } from "@/components/admin/page-header";
import { SearchField, Toolbar } from "@/components/admin/ui";
import { API_BASE } from "@/lib/api/admin-client";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

const tabs: { key: InboxKind; label: string; path: string }[] = [
  { key: "bookings", label: "Bookings", path: "/bookings" },
  { key: "predictions", label: "Prediction requests", path: "/predictions" },
  { key: "enquiries", label: "Course & product enquiries", path: "/enquiries" },
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

      <nav aria-label="Inbox sections" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((candidate) => (
          <Link
            key={candidate.key}
            href={`/admin/inbox/${candidate.key}`}
            aria-current={candidate.key === tab.key ? "page" : undefined}
            className={cn(
              "border px-4 py-2 text-sm font-medium transition-colors",
              candidate.key === tab.key
                ? "border-forest bg-forest text-ivory"
                : "border-border bg-white text-charcoal/80 hover:border-brand-600",
            )}
          >
            {candidate.label}
          </Link>
        ))}
      </nav>

      <Toolbar
        action={
          result && result.meta.total > 0 ? (
            <a
              href={`${API_BASE}/api/admin/export/${tab.key}`}
              className="inline-flex h-10 items-center gap-2 border border-border bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:border-brand-600"
            >
              <Download className="size-4 text-brand-600" />
              Export CSV
            </a>
          ) : null
        }
      >
        <SearchField
          defaultValue={search}
          placeholder="Name, mobile or email"
          label="Search submissions"
        />
      </Toolbar>

      <InboxTable kind={tab.key} rows={result?.data ?? []} />

      {result && result.meta.totalPages > 1 && (
        <nav className="mt-5 flex items-center gap-3 text-sm" aria-label="Pages">
          {current > 1 && (
            <Link
              href={`?page=${current - 1}${search ? `&q=${search}` : ""}`}
              className="border border-border bg-white px-3 py-1.5 hover:border-brand-600"
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
              className="border border-border bg-white px-3 py-1.5 hover:border-brand-600"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
