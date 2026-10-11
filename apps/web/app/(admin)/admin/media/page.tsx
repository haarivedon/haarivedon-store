import type { Metadata } from "next";
import type { Media } from "@repo/contract";
import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin/page-header";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Images" };

export default async function MediaPage() {
  await requireAdminUser("/admin/media");
  const result = await adminFetch<{ data: Media[] }>("/media?perPage=60");

  return (
    <div>
      <PageHeader
        title="Images"
        description="Every image needs a description before it can appear on a published page — it is what screen readers read out."
      />
      <MediaLibrary initial={result?.data ?? []} />
    </div>
  );
}
