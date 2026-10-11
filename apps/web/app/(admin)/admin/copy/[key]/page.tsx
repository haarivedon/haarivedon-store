import { notFound } from "next/navigation";
import {
  siteContentKeys,
  siteContentLabels,
  type SiteContentKey,
} from "@repo/contract";
import { CopyForm } from "@/components/admin/copy-form";
import { PageHeader, Panel } from "@/components/admin/page-header";
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
    <div>
      <PageHeader
        title={siteContentLabels[contentKey]}
        description="Anything left empty keeps the wording already on the site."
      />
      <Panel className="p-5 sm:p-6">
        <CopyForm contentKey={contentKey} initial={result?.data ?? {}} />
      </Panel>
    </div>
  );
}
