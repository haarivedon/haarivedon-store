import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/section-heading";

const backgrounds = {
  white: "bg-white",
  ivory: "bg-ivory",
  cream: "bg-cream",
  sage: "bg-sage/40",
  forest: "bg-forest text-ivory",
  indigo: "bg-indigo text-ivory",
} as const;

/** Shared section shell — consistent container width and vertical rhythm. */
export function Section({
  id,
  background = "ivory",
  className,
  containerClassName,
  children,
}: {
  id?: string;
  background?: keyof typeof backgrounds;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("relative", backgrounds[background], className)}
    >
      <div
        className={cn(
          "mx-auto max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Shared section header — eyebrow + title + description, with an optional
 * right-aligned "view all" style link (the pattern used across list sections).
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
  as,
  actionHref,
  actionLabel,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  /** "h1" where this heading is the page's title. */
  as?: "h1" | "h2";
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  const heading = (
    <SectionHeading
      eyebrow={eyebrow}
      title={title}
      description={description}
      tone={tone}
      align={align}
      as={as}
    />
  );

  if (actionHref && actionLabel && align !== "center") {
    return (
      <div
        className={cn(
          "flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
          className,
        )}
      >
        {heading}
        <Link
          href={actionHref}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
            tone === "light"
              ? "text-gold hover:text-ivory"
              : "text-brand-700 hover:text-forest",
          )}
        >
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return <div className={className}>{heading}</div>;
}
