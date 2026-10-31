import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One consistent card look for the whole site: sharp (zero-radius) corners,
 * a hairline border, and a subtle lift on hover. Built on the shadcn <Card>
 * primitive with its default rounding / ring / padding reset.
 */
const cardShell =
  "group h-full gap-0 rounded-none border border-border py-0 shadow-none ring-0 transition-all hover:-translate-y-1 hover:shadow-[0_24px_45px_-28px_rgba(0,1,66,0.5)]";

const aspects = {
  video: "aspect-video",
  photo: "aspect-[4/3]",
  square: "aspect-square",
} as const;

/** Small square-cornered chip used on media tiles. */
export function CardChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "rounded-none border-transparent bg-ivory/90 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.15em] text-forest uppercase backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

/** The recurring "Explore →" affordance. */
export function CardCta({ label = "Explore" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
      {label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </span>
  );
}

/**
 * Image-led card (products, energy tools, blog, courses).
 * Pass `footer` for a bottom bar separated by a divider; otherwise use
 * `children` for the body content under the image.
 */
export function MediaCard({
  href,
  image,
  alt,
  aspect = "photo",
  chip,
  priority,
  sizes = "(max-width: 768px) 100vw, 33vw",
  children,
  footer,
  ariaLabel,
}: {
  href?: string;
  image: string;
  alt: string;
  aspect?: keyof typeof aspects;
  chip?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
}) {
  const inner = (
    <Card className={cn(cardShell, "flex flex-col")}>
      <div className={cn("relative overflow-hidden", aspects[aspect])}>
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {chip ? <div className="absolute top-3 left-3">{chip}</div> : null}
      </div>
      {children ? (
        <div className="flex flex-1 flex-col p-4 sm:p-5">{children}</div>
      ) : null}
      {footer ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border p-4 sm:p-5">
          {footer}
        </div>
      ) : null}
    </Card>
  );

  return href ? (
    <Link href={href} aria-label={ariaLabel} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/**
 * Icon-led card (services, why-us). `align="center"` centres content for
 * value-prop grids.
 */
export function IconCard({
  href,
  icon,
  title,
  description,
  cta,
  align = "left",
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta?: string;
  align?: "left" | "center";
}) {
  const inner = (
    <Card className={cn(cardShell)}>
      <div
        className={cn(
          "flex h-full flex-col p-4 sm:p-6",
          align === "center" && "items-center text-center",
        )}
      >
        <div className="grid size-10 place-items-center rounded-lg bg-gold text-forest transition-colors group-hover:bg-forest group-hover:text-gold sm:size-12">
          {icon}
        </div>
        <h3 className="mt-4 font-display text-base font-semibold text-forest sm:mt-5 sm:text-lg">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-[0.8rem] leading-relaxed text-muted-foreground sm:text-sm">
          {description}
        </p>
        {cta ? (
          <span className="mt-5">
            <CardCta label={cta} />
          </span>
        ) : null}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} aria-label={title} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
