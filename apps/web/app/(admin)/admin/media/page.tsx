import type { Metadata } from "next";
import type { Media } from "@repo/contract";
import { MediaLibrary } from "@/components/admin/media-library";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Images" };

export default async function MediaPage() {
  await requireAdminUser("/admin/media");
  const result = await adminFetch<{ data: Media[] }>("/media?perPage=60");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">Images</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Every image needs a description before it can appear on a published
        page — it is what screen readers read out.
      </p>
      <div className="mt-6">
        <MediaLibrary initial={result?.data ?? []} />
      </div>
    </div>
  );
}
