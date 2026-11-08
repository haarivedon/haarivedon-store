"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import { toast } from "@/components/admin/toast";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Imports courses from Udemy. New ones arrive as drafts; the admin then
 * publishes the ones to show and can edit each card. Existing courses are
 * never overwritten.
 */
export function SyncUdemyButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const res = await adminApi.coursesSync({ body: {} });
      if (res.status === 200) {
        const b = res.body;
        if (!b.configured) {
          toast.error(
            "Udemy is not connected — add the Affiliate API credentials first.",
          );
        } else if (b.error) {
          toast.error(b.error);
        } else {
          toast.success(
            `Synced: ${b.imported} new draft${b.imported === 1 ? "" : "s"}, ${b.skipped} already here (of ${b.found} found).`,
          );
          router.refresh();
        }
      } else {
        toast.error("Sync failed. Please try again.");
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={sync}
      disabled={busy}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-10 disabled:opacity-60",
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Sync from Udemy
    </button>
  );
}
