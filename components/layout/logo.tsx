import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/content/site";

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${site.name} — home`}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full transition-colors",
          tone === "light"
            ? "bg-white/10 text-gold"
            : "bg-forest text-gold",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M12 2 C6 7 6 16 12 22 C18 16 18 7 12 2 Z"
            fill="currentColor"
          />
          <path
            d="M12 5 L12 20"
            stroke="var(--color-forest)"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-wide",
            tone === "light" ? "text-ivory" : "text-forest",
          )}
        >
          HAARIVEDON
        </span>
        <span
          className={cn(
            "text-[0.6rem] tracking-[0.18em] uppercase",
            tone === "light" ? "text-ivory/60" : "text-muted-foreground",
          )}
        >
          {site.tagline}
        </span>
      </span>
    </Link>
  );
}
