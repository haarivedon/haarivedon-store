import { notFound } from "next/navigation";
import {
  siteContentKeys,
  siteContentLabels,
  type SiteContentKey,
} from "@repo/contract";
import { CopyForm } from "@/components/admin/copy-form";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";

export async function generateMetadata({ params }: PageProps<"/admin/copy/[key]">) {
  const { key } = await params;
  return { title: siteContentLabels[key as SiteContentKey] ?? "Page copy" };
}

export default async function CopyPage({ params }: PageProps<"/admin/copy/[key]">) {
  const { key } = await params;
  if (!siteContentKeys.includes(key as SiteContentKey)) notFound();
  const contentKey = key as SiteContentKey;

  await requireAdminUser(`/admin/copy/${key}`);

  const result = await adminFetch<{ data: Record<string, unknown> }>(
    `/site-content/${contentKey}`,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-forest">
        {siteContentLabels[contentKey]}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Anything left empty keeps the wording already on the site.
      </p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <CopyForm contentKey={contentKey} initial={result?.data ?? {}} />
      </div>
    </div>
  );
}
