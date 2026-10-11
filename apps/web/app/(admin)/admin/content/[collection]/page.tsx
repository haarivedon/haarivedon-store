import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
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
  const spec = collections[collection as CollectionSpec["key"]];
  return { title: spec?.label ?? "Content" };
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
  const published = status === "live" ? "true" : status === "draft" ? "false" : "";
  const current = Number(typeof page === "string" ? page : 1) || 1;

  const query = new URLSearchParams({ page: String(current), perPage: "25" });
  if (search) query.set("search", search);
  if (published) query.set("published", published);

  const result = await adminFetch<{
    data: Row[];
    meta: { total: number; totalPages: number; page: number };
  }>(`/${spec.key}?${query}`);

  const rows = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            {spec.label}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta ? `${meta.total} total` : "Could not load the list"} · drafts
            are hidden from the site until you publish them
          </p>
        </div>
        <Link
          href={`/admin/content/${spec.key}/new`}
          className={cn(buttonVariants({ size: "sm" }), "h-10")}
        >
          <Plus className="size-4" />
          New {spec.singular}
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">Search</span>
          <input
            name="q"
            defaultValue={search}
            placeholder={`Search ${spec.label.toLowerCase()}`}
            className="h-10 w-56 rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">Status</span>
          <select
            name="status"
            defaultValue={typeof status === "string" ? status : ""}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm shadow-sm"
          >
            <option value="">All</option>
            <option value="live">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-medium shadow-sm hover:border-brand-600"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-ivory/80 p-8 text-center text-sm text-muted-foreground">
          {search || published
            ? "Nothing matches those filters."
            : `No ${spec.label.toLowerCase()} yet. Create the first one.`}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">{spec.label}</caption>
            <thead className="bg-cream/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Last edited
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-sage/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/${spec.key}/${row.id}`}
                      className="font-medium text-forest hover:underline"
                    >
                      {String(row[spec.titleField] ?? "(untitled)")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        row.published
                          ? "bg-brand-600/15 text-forest"
                          : "bg-charcoal/10 text-charcoal/70",
                      )}
                    >
                      {row.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(row.updatedBy ?? "—") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
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
            Page {meta.page} of {meta.totalPages}
          </span>
          {current < meta.totalPages && (
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
