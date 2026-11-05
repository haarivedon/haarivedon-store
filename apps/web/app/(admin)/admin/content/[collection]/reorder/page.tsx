import { notFound } from "next/navigation";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { ReorderList } from "@/components/admin/reorder-list";

type Row = Record<string, unknown> & { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  return { title: spec ? `Reorder ${spec.label}` : "Reorder" };
}

export default async function ReorderPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  if (!spec) notFound();

  await requireAdminUser(`/admin/content/${collection}/reorder`);

  // Reordering spans the whole collection, so pull everything (not a page).
  const result = await adminFetch<{ data: Row[] }>(
    `/${spec.key}?page=1&perPage=500`,
  );
  const items = (result?.data ?? []).map((row) => ({
    id: row.id,
    title: String(row[spec.titleField] ?? "(untitled)"),
    slug: typeof row.slug === "string" ? row.slug : undefined,
  }));

  return (
    <div>
      <PageHeader
        title={`Reorder ${spec.label}`}
        description="Drag to arrange, then save. This is the order visitors see on the site."
        back={{ href: `/admin/content/${spec.key}`, label: spec.label }}
      />

      {items.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing to reorder yet.
          </p>
        </Panel>
      ) : (
        <ReorderList collection={spec.key} items={items} />
      )}
    </div>
  );
}
