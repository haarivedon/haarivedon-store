import { notFound } from "next/navigation";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { requireAdminUser } from "@/lib/admin/session";
import { RecordForm } from "@/components/admin/record-form";
import { PageHeader, Panel } from "@/components/admin/page-header";

export default async function NewRecordPage({
  params,
}: PageProps<"/admin/content/[collection]/new">) {
  const { collection } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  if (!spec) notFound();

  await requireAdminUser(`/admin/content/${collection}/new`);

  return (
    <div>
      <PageHeader
        back={{ href: `/admin/content/${spec.key}`, label: spec.label }}
        title={`New ${spec.singular}`}
        description="Save it as a draft now and fill in the rest whenever you like."
      />
      <Panel className="p-5 sm:p-6">
        <RecordForm spec={spec} record={spec.blank} />
      </Panel>
    </div>
  );
}
