"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Styled select, built on Base UI (the shadcn style this project uses is
 * base-rhea, so Base UI rather than Radix — see AGENTS.md).
 *
 * A native <select> renders the operating system's own dropdown, which
 * ignores the site's type and colour entirely. This keeps the control and
 * its menu inside the design, and keeps the keyboard behaviour Base UI
 * already implements.
 */
export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Choose…",
  id,
  name,
  disabled,
  invalid,
  className,
}: {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      disabled={disabled}
      name={name}
    >
      <BaseSelect.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-3.5 text-left text-sm text-charcoal shadow-sm outline-none transition-colors select-none",
          "hover:not-data-disabled:border-brand-600 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/20",
          "data-disabled:opacity-60 aria-[invalid=true]:border-terracotta",
          className,
        )}
      >
        <BaseSelect.Value
          className="truncate data-placeholder:text-muted-foreground/70"
          placeholder={placeholder}
        />
        <BaseSelect.Icon>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-50 outline-none select-none" sideOffset={6}>
          <BaseSelect.Popup
            className={cn(
              "max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-lg outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out",
              "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
              "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            )}
          >
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2.5 text-sm text-charcoal outline-none select-none data-highlighted:bg-sage/50 data-highlighted:text-forest sm:py-2"
                >
                  <BaseSelect.ItemIndicator className="col-start-1">
                    <Check className="size-3.5 text-brand-600" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2">
                    {option.label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
