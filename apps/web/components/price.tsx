import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Currency formatter shared by the price components. 0 reads as "Free". */
function formatMoney(value: number, currency = "INR") {
  return value === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
}

/**
 * Service pricing — the "Rate" and optional "Discounted rate" (CR, services).
 * When a discount is set, the Rate is struck through next to the discounted
 * figure with a "% off" chip; otherwise a single figure shows. Both null falls
 * back to "Price on enquiry".
 */
export function ServicePrice({
  rate,
  discounted,
  currency = "INR",
  size = "sm",
  /** Hide the "% off" chip where a discount badge already shows (e.g. cards). */
  showChip = true,
  className,
}: {
  rate: number | null;
  discounted: number | null;
  currency?: string;
  size?: "sm" | "lg";
  showChip?: boolean;
  className?: string;
}) {
  if (rate === null && discounted === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium text-brand-700",
          size === "lg" ? "text-base" : "text-xs",
          className,
        )}
      >
        <MessageCircle aria-hidden className="size-3.5" />
        On enquiry
      </span>
    );
  }

  const hasDiscount =
    rate !== null && discounted !== null && discounted < rate;
  const headline = size === "lg" ? "font-display text-2xl" : "text-sm";

  if (hasDiscount) {
    const off = Math.round((1 - discounted! / rate!) * 100);
    return (
      <span className={cn("inline-flex flex-wrap items-baseline gap-1.5", className)}>
        <span className={cn("font-semibold text-forest", headline)}>
          {formatMoney(discounted!, currency)}
        </span>
        <span
          className={cn(
            "font-normal text-muted-foreground line-through",
            size === "lg" ? "text-base" : "text-[0.7rem]",
          )}
        >
          {formatMoney(rate!, currency)}
        </span>
        {showChip && off > 0 && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-forest">
            {off}% off
          </span>
        )}
      </span>
    );
  }

  // No discount (or discount not lower than rate): a single figure.
  const value = (discounted ?? rate)!;
  return (
    <span
      className={cn("font-semibold text-forest", headline, className)}
    >
      {formatMoney(value, currency)}
    </span>
  );
}

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
