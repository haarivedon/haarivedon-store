import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Form", "Schedule", "Pay"] as const;

/** Three-step progress bar shared across the booking form and continue pages. */
export function BookingProgress({ current }: { current: number }) {
  return (
    <ol className="mx-auto mb-8 flex max-w-md items-center">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li
            key={label}
            className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2 text-xs font-semibold transition-colors",
                  done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : active
                      ? "border-forest bg-forest text-ivory"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : step}
              </span>
              <span
                className={cn(
                  "text-[0.65rem] font-medium uppercase tracking-wide",
                  active ? "text-forest" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors",
                  done ? "bg-brand-600" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
