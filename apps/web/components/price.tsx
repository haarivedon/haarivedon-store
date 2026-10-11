import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Price display.
 *
 * A missing price used to render as plain text in the same slot, weight and
 * colour as "₹1,499", so it read as a price rather than as something to act
 * on. It is now a green button on cards.
 *
 * Deliberately a <span>, not a <button>: these sit inside the card's own
 * link, and a control nested in an anchor is invalid markup and ambiguous to
 * a screen reader. It carries the card's click — which goes to the detail
 * page, where the real enquiry form lives.
 */
export function Price({
  value,
  currency = "INR",
  size = "sm",
  /** "From ₹x" — used where the figure is a starting point. */
  from = false,
  /** Set false where a real CTA button already sits alongside. */
  asButton = true,
  className,
}: {
  value: number | null;
  currency?: string;
  size?: "sm" | "lg";
  from?: boolean;
  asButton?: boolean;
  className?: string;
}) {
  if (value === null) {
    if (!asButton) {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium text-brand-700",
            size === "lg" ? "text-base" : "text-sm",
            className,
          )}
        >
          <MessageCircle aria-hidden className="size-4" />
          Price on enquiry
        </span>
      );
    }

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 font-semibold text-white shadow-sm transition-colors group-hover:bg-brand-700",
          size === "lg" ? "h-11 px-5 text-sm" : "h-9 px-3.5 text-xs",
          className,
        )}
      >
        <MessageCircle aria-hidden className="size-3.5" />
        Ask for price
      </span>
    );
  }

  const formatted =
    value === 0
      ? "Free"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value);

  return (
    <span
      className={cn(
        "font-semibold text-forest",
        size === "lg" ? "font-display text-2xl" : "text-sm",
        className,
      )}
    >
      {from && value > 0 && (
        <span className="mr-1 text-xs font-normal text-muted-foreground">
          From
        </span>
      )}
      {formatted}
    </span>
  );
}
