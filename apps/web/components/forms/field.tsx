import { cn } from "@/lib/utils";

/**
 * Form field shell: label, optional hint, and the field-level error the API
 * returns in its 422 `issues`. A form never fails silently (PLAN.md §13).
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const describedBy =
    [error ? `${htmlFor}-error` : null, hint ? `${htmlFor}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-charcoal/90"
      >
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-terracotta">
            *
          </span>
        )}
      </label>

      <div data-described-by={describedBy}>{children}</div>

      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-terracotta"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-charcoal shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25 aria-[invalid=true]:border-terracotta";

export const textareaClass =
  "min-h-28 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-charcoal shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25";
