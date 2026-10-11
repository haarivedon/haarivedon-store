"use client";

import { useId } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin form primitives.
 *
 * The record form was one flat column of sixteen inputs, which gives a
 * non-technical editor no sense of what belongs together or how much is
 * left. These pieces group it, label it, and keep every control the same
 * height and shape.
 */

export const controlClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-charcoal shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/20 disabled:opacity-60 aria-[invalid=true]:border-terracotta";

/** A titled group of fields. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <h2 className="font-display text-base font-semibold text-forest">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  wide,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", wide && "sm:col-span-2")}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-charcoal/90">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-terracotta">
              *
            </span>
          )}
        </label>
        {counter && (
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              counter.value > counter.max
                ? "font-semibold text-terracotta"
                : "text-muted-foreground",
            )}
          >
            {counter.value}/{counter.max}
          </span>
        )}
      </div>

      {children}

      {error ? (
        <p role="alert" className="text-xs font-medium text-terracotta">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea({
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={cn(
        controlClass,
        "h-auto resize-y py-2.5 leading-relaxed",
        props.className,
      )}
    />
  );
}

/** Native select with our own chevron, so it matches the inputs. */
export function Select({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(controlClass, "appearance-none pr-10", props.className)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

/**
 * Money input. `type="number"` gave a spinner that makes no sense for a
 * price, so this is a text input that filters to digits and shows the
 * currency inline. Empty is a real value — it means "enquire".
 */
export function PriceInput({
  value,
  onChange,
  id,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  id: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <input
        id={id}
        inputMode="numeric"
        value={value === null ? "" : String(value)}
        placeholder="Enquire for price"
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
        className={cn(controlClass, "pl-7")}
      />
    </div>
  );
}

/**
 * Slug input with the path prefix inside the control rather than beside it —
 * as a sibling it wrapped onto two lines on narrow columns.
 */
export function SlugInput({
  id,
  prefix,
  value,
  onChange,
}: {
  id: string;
  prefix: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex h-11 w-full items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-sm focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <span className="grid shrink-0 place-items-center whitespace-nowrap border-r border-border/70 bg-[#faf9f3] px-3 text-xs text-muted-foreground">
        {prefix}
      </span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-charcoal outline-none"
      />
    </div>
  );
}

/** A real switch rather than a checkbox: it reads as on/off at a glance. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
          checked ? "bg-brand-600" : "bg-charcoal/25",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium text-charcoal/90">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

/** Repeatable rows with reordering and a real empty state. */
export function Repeater({
  rows,
  onChange,
  addLabel = "Add a row",
  placeholder,
  emptyHint,
}: {
  rows: string[];
  onChange: (next: string[]) => void;
  addLabel?: string;
  placeholder?: string;
  emptyHint?: string;
}) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 && emptyHint && (
        <p className="rounded-xl border border-dashed border-border bg-[#faf9f3] px-4 py-3 text-xs text-muted-foreground">
          {emptyHint}
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <input
            value={row}
            placeholder={placeholder}
            aria-label={`Row ${index + 1}`}
            onChange={(event) =>
              onChange(rows.map((r, i) => (i === index ? event.target.value : r)))
            }
            className={controlClass}
          />
          <div className="flex shrink-0 gap-1">
            <RowButton
              label={`Move row ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </RowButton>
            <RowButton
              label={`Move row ${index + 1} down`}
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </RowButton>
            <RowButton
              label={`Remove row ${index + 1}`}
              tone="danger"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </RowButton>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-sm font-medium text-charcoal shadow-sm transition-colors hover:border-brand-600"
      >
        <Plus className="size-4 text-brand-600" />
        {addLabel}
      </button>
    </div>
  );
}

function RowButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-lg border border-border bg-white text-charcoal/70 transition-colors disabled:opacity-40 sm:size-9",
        tone === "danger" ? "text-terracotta hover:border-terracotta" : "hover:border-brand-600",
      )}
    >
      {children}
    </button>
  );
}

/** Save bar pinned to the bottom of the viewport while editing. */
export function StickyActions({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-2 border-t border-border/70 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm">{status}</div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error";
  children: React.ReactNode;
}) {
  const tones = {
    ok: "border-brand-600/40 bg-brand-600/10 text-forest",
    warn: "border-gold/70 bg-[#fffbe8] text-charcoal",
    error: "border-terracotta/40 bg-terracotta/10 text-terracotta",
  } as const;

  return (
    <div
      role={tone === "ok" ? "status" : "alert"}
      className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}
    >
      {children}
    </div>
  );
}
