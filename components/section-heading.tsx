import { LeafMark } from "@/components/decor";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase",
        tone === "light" ? "text-gold" : "text-brand-700",
        className,
      )}
    >
      <LeafMark className="size-3.5" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl",
          tone === "light" ? "text-ivory" : "text-forest",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed",
            tone === "light" ? "text-ivory/70" : "text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
