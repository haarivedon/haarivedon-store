import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { collections, type CollectionSpec } from "@/lib/admin/collections";
import { requireAdminUser } from "@/lib/admin/session";
import { RecordForm } from "@/components/admin/record-form";

export default async function NewRecordPage({
  params,
}: PageProps<"/admin/content/[collection]/new">) {
  const { collection } = await params;
  const spec = collections[collection as CollectionSpec["key"]];
  if (!spec) notFound();

  await requireAdminUser(`/admin/content/${collection}/new`);

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
        New {spec.singular}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save it as a draft now and fill in the rest whenever you like.
      </p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <RecordForm spec={spec} record={spec.blank} />
      </div>
    </div>
  );
}
