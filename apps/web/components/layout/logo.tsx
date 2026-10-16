import Link from "next/link";
import Image from "next/image";
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
      <Image
        src="/images/logo.png"
        alt=""
        width={44}
        height={44}
        priority
        className="size-10 shrink-0"
      />
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
