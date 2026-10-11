import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { RecordForm } from "@/components/admin/record-form";

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
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/admin/content/${spec.key}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        {spec.label}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-forest">
        {String(record[spec.titleField] ?? `Edit ${spec.singular}`)}
      </h1>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <RecordForm spec={spec} record={record} recordId={id} />
      </div>
    </div>
  );
}
