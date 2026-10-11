import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { RowActions } from "@/components/admin/row-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & {
  id: string;
  published: boolean;
  updatedAt: string;
};

export async function generateMetadata({
  params,
}: PageProps<"/admin/content/[collection]">) {
  const { collection } = await params;
  return { title: collections[collection as CollectionSpec["key"]]?.label ?? "Content" };
}

function StatusChip({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        published ? "bg-brand-600/15 text-forest" : "bg-charcoal/10 text-charcoal/70",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          published ? "bg-brand-600" : "bg-charcoal/40",
        )}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default async function CollectionListPage({
  params,
  searchParams,
}: PageProps<"/admin/content/[collection]">) {
  const { collection } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  if (!spec) notFound();

  await requireAdminUser(`/admin/content/${collection}`);

  const { q, status, page } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const statusFilter = typeof status === "string" ? status : "";
  const current = Number(typeof page === "string" ? page : 1) || 1;

  const query = new URLSearchParams({ page: String(current), perPage: "25" });
  if (search) query.set("search", search);
  if (statusFilter === "live") query.set("published", "true");
  if (statusFilter === "draft") query.set("published", "false");

  const result = await adminFetch<{
    data: Row[];
    meta: { total: number; totalPages: number; page: number };
  }>(`/${spec.key}?${query}`);

  const rows = result?.data ?? [];
  const meta = result?.meta;
  const keep = (extra: Record<string, string>) =>
    new URLSearchParams({
      ...(search ? { q: search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...extra,
    }).toString();

  const filters = [
    { value: "", label: "All" },
    { value: "live", label: "Published" },
    { value: "draft", label: "Drafts" },
  ];

  return (
    <div>
      <PageHeader
        title={spec.label}
        description={
          meta
            ? `${meta.total} in total. Drafts stay hidden from the site until you publish them.`
            : "Could not load the list — is the API running?"
        }
        action={
          <Link
            href={`/admin/content/${spec.key}/new`}
            className={cn(buttonVariants({ size: "sm" }), "h-10")}
          >
            <Plus className="size-4" />
            New {spec.singular}
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form action="" className="flex items-center gap-2">
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            name="q"
            defaultValue={search}
            placeholder={`Search ${spec.label.toLowerCase()}`}
            aria-label={`Search ${spec.label}`}
            className="h-10 w-56 rounded-xl border border-border bg-white px-3.5 text-sm shadow-sm outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25"
          />
          <button
            type="submit"
            className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-medium shadow-sm hover:border-brand-600"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={`?${keep(filter.value ? { status: filter.value } : {})}`}
              aria-current={statusFilter === filter.value ? "true" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                statusFilter === filter.value
                  ? "border-forest bg-forest text-ivory"
                  : "border-border bg-white text-charcoal/75 hover:border-brand-600",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {search || statusFilter
              ? "Nothing matches those filters."
              : `No ${spec.label.toLowerCase()} yet.`}
          </p>
        </Panel>
      ) : (
        <>
          {/*
            Phones get stacked cards. The table needs ~38rem to stay legible,
            which means sideways scrolling on a 390px screen — fine for a
            spreadsheet, wrong for the main list someone works from.
          */}
          <ul className="space-y-3 sm:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-border/70 bg-white p-4 shadow-[0_1px_2px_rgba(32,38,31,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/content/${spec.key}/${row.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="block font-medium text-forest">
                      {String(row[spec.titleField] ?? "(untitled)")}
                    </span>
                    {typeof row.slug === "string" && row.slug && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        /{row.slug}
                      </span>
                    )}
                  </Link>
                  <RowActions
                    spec={spec.key}
                    id={row.id}
                    title={String(row[spec.titleField] ?? "this record")}
                    slug={typeof row.slug === "string" ? row.slug : undefined}
                    published={row.published}
                    updatedAt={row.updatedAt}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <StatusChip published={row.published} />
                  <span className="text-muted-foreground">
                    edited{" "}
                    {new Date(row.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <Panel className="hidden overflow-hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-sm">
                <caption className="sr-only">{spec.label}</caption>
                <thead className="border-b border-border/70 bg-[#faf9f3] text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Name
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Last edited
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#faf9f3]">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/content/${spec.key}/${row.id}`}
                          className="font-medium text-forest hover:underline"
                        >
                          {String(row[spec.titleField] ?? "(untitled)")}
                        </Link>
                        {typeof row.slug === "string" && row.slug && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            /{row.slug}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip published={row.published} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(row.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {typeof row.updatedBy === "string" && row.updatedBy && (
                          <span className="mt-0.5 block text-xs">
                            by {row.updatedBy}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <RowActions
                          spec={spec.key}
                          id={row.id}
                          title={String(row[spec.titleField] ?? "this record")}
                          slug={
                            typeof row.slug === "string" ? row.slug : undefined
                          }
                          published={row.published}
                          updatedAt={row.updatedAt}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}

      {meta && meta.totalPages > 1 && (
        <nav className="mt-5 flex items-center gap-3 text-sm" aria-label="Pages">
          {current > 1 && (
            <Link
              href={`?${keep({ page: String(current - 1) })}`}
              className="rounded-lg border border-border bg-white px-3 py-1.5"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          {current < meta.totalPages && (
            <Link
              href={`?${keep({ page: String(current + 1) })}`}
              className="rounded-lg border border-border bg-white px-3 py-1.5"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
