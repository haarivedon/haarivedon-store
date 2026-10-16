import Link from "next/link";
import { Globe } from "lucide-react";
import { announcement } from "@/lib/content/site";

/**
 * Thin promotional bar above the header. Sits in normal flow so it scrolls
 * away while the sticky header stays pinned. Gold on forest-green text, so it
 * reads as a distinct notice above the dark brand bar.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-gold text-forest">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <Globe className="size-3.5 shrink-0" aria-hidden />
        <span>{announcement.message}</span>
        <Link
          href={announcement.ctaHref}
          className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          {announcement.ctaLabel} →
        </Link>
      </div>
    </div>
  );
}
