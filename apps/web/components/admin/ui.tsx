"use client";

import { useId } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
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
  "h-11 w-full border border-border bg-white px-3.5 text-sm text-charcoal outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/20 disabled:opacity-60 aria-[invalid=true]:border-terracotta";

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

/**
 * Field requirement.
 *
 * Two rules sit behind this — the schema the save validates against, and the
 * checks publishing runs — but they are shown as one word, because to the
 * person filling the form the distinction is noise: everything marked here
 * has to be filled in before the page is of any use.
 */
export type Requirement = "required" | "publish";

export function RequirementBadge() {
  return (
    <span className="shrink-0 bg-terracotta/12 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-terracotta">
      Required
    </span>
  );
}

/** One line of context, above the first section. */
export function RequirementLegend() {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-terracotta">Required</span> fields
      have to be filled in before this can go live. You can save a draft
      without them and come back.
    </p>
  );
}

export function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  requirement,
  wide,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  requirement?: Requirement;
  wide?: boolean;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", wide && "sm:col-span-2")}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-charcoal/90"
          >
            {label}
          </label>
          {requirement && <RequirementBadge />}
        </span>
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

/**
 * Re-exported so admin screens import every control from one place. The
 * styled Select lives in components/ui because the public forms want it too.
 */
export { Select } from "@/components/ui/select";

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
    <div className="flex h-11 w-full items-stretch overflow-hidden border border-border bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
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
          "relative mt-0.5 h-6 w-11 shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
          checked ? "bg-brand-600" : "bg-charcoal/25",
        )}
      >
        {/*
          Anchored with `left-0.5`, not left to its static position: a button
          centres its content, so an absolutely-positioned child with no
          `left` starts mid-track and the knob sat right of centre when off.
        */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 size-5 bg-white shadow transition-transform duration-150",
            checked ? "translate-x-5" : "translate-x-0",
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
        <p className="border border-dashed border-border bg-[#faf9f3] px-4 py-3 text-xs text-muted-foreground">
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
        className="inline-flex min-h-11 w-fit items-center gap-1.5 border border-border bg-white px-3.5 text-sm font-medium text-charcoal transition-colors hover:border-brand-600"
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
        "grid size-11 place-items-center border border-border bg-white text-charcoal/70 transition-colors disabled:opacity-40 sm:size-9",
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
      className={cn("border-l-4 border-y border-r px-4 py-3 text-sm", tones[tone])}
    >
      {children}
    </div>
  );
}

/**
 * The control band that sits under a page heading on every list screen:
 * search and filters on the left, the primary action on the right. Framed by
 * hairline rules top and bottom so the controls land in the same place on
 * every page.
 */
export function Toolbar({
  children,
  action,
}: {
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2.5 border-y border-border bg-white px-3 py-2.5 sm:px-4">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">{children}</div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Square search box with an inline submit. A plain GET form so the query
 * lands in the URL and the server renders the filtered list — no client state.
 * `hidden` carries any other active filters through the submit.
 */
export function SearchField({
  name = "q",
  defaultValue,
  placeholder,
  label,
  hidden,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action="" role="search" className="flex items-stretch">
      {hidden &&
        Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <div className="flex h-10 items-stretch border border-border bg-white transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
        <span aria-hidden className="grid shrink-0 place-items-center pl-3 text-muted-foreground">
          <Search className="size-4" />
        </span>
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={label}
          className="h-full w-40 bg-transparent px-2.5 text-sm text-charcoal outline-none placeholder:text-muted-foreground/60 sm:w-56"
        />
        <button
          type="submit"
          className="border-l border-border px-3.5 text-sm font-medium text-charcoal/80 transition-colors hover:bg-sage/40 hover:text-forest"
        >
          Search
        </button>
      </div>
    </form>
  );
}

/**
 * Square segmented control rendered as links, so each segment is a real,
 * shareable URL. Each option carries its own href — this renders inside
 * Server Components, which cannot be handed a function prop.
 */
export function SegmentedFilter({
  options,
  active,
  label,
}: {
  options: { value: string; label: string; href: string }[];
  active: string;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-stretch border border-border bg-white"
    >
      {options.map((option, index) => (
        <Link
          key={option.value}
          href={option.href}
          aria-current={active === option.value ? "true" : undefined}
          className={cn(
            "px-3.5 py-2 text-sm font-medium transition-colors",
            index > 0 && "border-l border-border",
            active === option.value
              ? "bg-forest text-ivory"
              : "text-charcoal/75 hover:bg-sage/40 hover:text-forest",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
