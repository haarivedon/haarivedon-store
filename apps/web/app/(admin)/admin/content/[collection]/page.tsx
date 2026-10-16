import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { RowActions } from "@/components/admin/row-actions";
import { SearchField, SegmentedFilter, Toolbar } from "@/components/admin/ui";
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
        published ? "bg-brand-600/15 text-forest" : "bg-charcoal/10 text-charcoal/70",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5",
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
      />

      <Toolbar
        action={
          <Link
            href={`/admin/content/${spec.key}/new`}
            className={cn(buttonVariants({ size: "sm" }), "h-10")}
          >
            <Plus className="size-4" />
            New {spec.singular}
          </Link>
        }
      >
        <SearchField
          defaultValue={search}
          placeholder={`Search ${spec.label.toLowerCase()}`}
          label={`Search ${spec.label}`}
          hidden={statusFilter ? { status: statusFilter } : undefined}
        />
        <SegmentedFilter
          label="Filter by status"
          active={statusFilter}
          options={filters.map((filter) => ({
            value: filter.value,
            label: filter.label,
            href: `?${keep(filter.value ? { status: filter.value } : {})}`,
          }))}
        />
      </Toolbar>

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
                className="border border-border bg-white p-4"
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
              className="border border-border bg-white px-3 py-1.5 hover:border-brand-600"
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
