import { notFound } from "next/navigation";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { RecordForm } from "@/components/admin/record-form";
import { PageHeader, Panel } from "@/components/admin/page-header";

export default async function EditRecordPage({
  params,
}: PageProps<"/admin/content/[collection]/[id]">) {
  const { collection, id } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  if (!spec) notFound();

  await requireAdminUser(`/admin/content/${collection}/${id}`);

  const record = await adminFetch<Record<string, unknown>>(`/${spec.key}/${id}`);
  if (!record) notFound();

  return (
    <div>
      <PageHeader
        back={{ href: `/admin/content/${spec.key}`, label: spec.label }}
        title={String(record[spec.titleField] ?? `Edit ${spec.singular}`)}
        description={
          record.published
            ? "Published — changes go live when you save."
            : "Draft — not visible on the site yet."
        }
      />
      <Panel className="p-5 sm:p-6">
        <RecordForm spec={spec} record={record} recordId={id} />
      </Panel>
    </div>
  );
}
