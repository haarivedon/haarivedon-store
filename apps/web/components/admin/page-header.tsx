import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Consistent page heading: title, one line of context, optional back link
 * and action. Keeps every admin screen framed the same way.
 */
export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-charcoal/60 transition-colors hover:text-forest"
        >
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[1.65rem] font-semibold leading-tight text-forest">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

/** White panel framing forms and tables against the admin ground. */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-white shadow-[0_1px_2px_rgba(32,38,31,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
