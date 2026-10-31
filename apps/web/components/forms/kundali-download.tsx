"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Polls for the Kundali PDF (generated after the booking is paid) and offers
 * the download once it is ready. Token-gated — the same one-time token that
 * gates the confirmation page.
 */
export function KundaliDownload({ id, token }: { id: string; token: string }) {
  const [status, setStatus] = useState<"pending" | "ready" | "failed">("pending");
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const response = await api.kundali.status({
          params: { id },
          query: { token },
        });
        if (!active) return;
        if (response.status === 200) {
          setStatus(response.body.status);
          setDownloadPath(response.body.downloadPath);
          if (response.body.status !== "pending") return;
        }
      } catch {
        // Keep polling; a transient network blip is not a failure.
      }
      if (active && attempts < 20) setTimeout(poll, 3000);
    };

    void poll();
    return () => {
      active = false;
    };
  }, [id, token]);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  return (
    <div className="rounded-2xl bg-cream/70 p-4">
      {status === "pending" && (
        <p className="flex items-center gap-2 text-sm text-charcoal/80">
          <Loader2 className="size-4 animate-spin text-brand-600" />
          Preparing your Kundali…
        </p>
      )}
      {status === "ready" && downloadPath && (
        <a
          href={`${base}${downloadPath}`}
          className={cn(buttonVariants({ size: "sm" }), "h-10")}
        >
          <Download className="size-4" />
          Download your Kundali (PDF)
        </a>
      )}
      {status === "failed" && (
        <p className="text-sm text-charcoal/80">
          Your Kundali needs a quick manual check — we will send it across
          shortly.
        </p>
      )}
    </div>
  );
}
