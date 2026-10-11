"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import {
  slugify,
  type CollectionSpec,
  type FieldSpec,
} from "@/lib/admin/collections";
import { issuesToFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { ImagePicker } from "@/components/admin/image-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
type Missing = { field: string; message: string };

/**
 * One form for every collection, built from the field config.
 *
 * Saving is permissive and publishing is strict: the API returns the list of
 * fields that are missing, and it is rendered as a checklist rather than a
 * toast that disappears (docs/PLAN.md §3.3).
 */
export function RecordForm({
  spec,
  record,
  recordId,
}: {
  spec: CollectionSpec;
  record: Values;
  recordId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(record);
  const [published, setPublished] = useState(Boolean(record.published));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [missing, setMissing] = useState<Missing[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const slugTouched = useRef(Boolean(recordId));

  const set = (name: string, value: unknown) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
  };

  /** Slug follows the title until someone edits it by hand. */
  const setTitle = (name: string, value: string) => {
    set(name, value);
    if (!slugTouched.current && spec.fields.some((f) => f.kind === "slug")) {
      const slugField = spec.fields.find((f) => f.kind === "slug")!.name;
      set(slugField, slugify(value));
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrors({});
    setMissing([]);
    setConflict(false);

    const payload = { ...values, published };

    try {
      const response = recordId
        ? await adminApi[spec.key].update({
            params: { id: recordId },
            body: {
              ...payload,
              expectedUpdatedAt: String(record.updatedAt),
            } as never,
          })
        : await adminApi[spec.key].create({ body: payload as never });

      if (response.status === 200 || response.status === 201) {
        setSaved(true);
        const created = response.body as { id: string };
        if (!recordId) {
          router.push(`/admin/content/${spec.key}/${created.id}`);
        }
        router.refresh();
        return;
      }

      if (response.status === 409) {
        setConflict(true);
        return;
      }

      if (response.status === 422) {
        const body = response.body as {
          error?: string;
          missing?: Missing[];
          issues?: unknown;
        };
        if (body.missing?.length) {
          setMissing(body.missing);
          // The record stays as it was: the server rolls the publish back.
          setPublished(false);
        } else {
          setErrors(issuesToFieldErrors(body.issues));
          if (body.error) setErrors((e) => ({ ...e, _: body.error! }));
        }
        return;
      }

      const body = response.body as { error?: string } | undefined;
      setErrors({ _: body?.error ?? "That didn't save. Please try again." });
    } catch {
      setErrors({ _: "We couldn't reach the server. Your changes are still here." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!recordId) return;
    setSaving(true);
    const response = await adminApi[spec.key].remove({ params: { id: recordId } });
    setSaving(false);
    if (response.status === 200) router.push(`/admin/content/${spec.key}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {conflict && (
        <Banner tone="warn">
          This was changed somewhere else after you opened it — maybe in another
          tab. Reload the page to see the current version, then re-apply your
          edit.{" "}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="font-semibold underline"
          >
            Reload
          </button>
        </Banner>
      )}

      {missing.length > 0 && (
        <Banner tone="warn">
          <strong className="block">
            Not ready to publish yet — {missing.length} thing
            {missing.length === 1 ? "" : "s"} to finish:
          </strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.map((item) => (
              <li key={item.field}>{item.message}</li>
            ))}
          </ul>
          <span className="mt-2 block text-xs">
            Your other changes were saved. The page is still a draft.
          </span>
        </Banner>
      )}

      {errors._ && <Banner tone="error">{errors._}</Banner>}
      {saved && !missing.length && (
        <Banner tone="ok">
          Saved{published ? " and live on the site." : " as a draft."}
        </Banner>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {spec.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            spec={spec}
            value={values[field.name]}
            error={errors[field.name]}
            highlighted={missing.some((item) => item.field === field.name)}
            onChange={(value) =>
              field.name === spec.titleField
                ? setTitle(field.name, String(value))
                : set(field.name, value)
            }
            onSlugEdit={() => {
              slugTouched.current = true;
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-5">
        <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => {
              setPublished(event.target.checked);
              setSaved(false);
            }}
            className="size-4 accent-[var(--color-forest)]"
          />
          Published
          <span className="font-normal text-muted-foreground">
            {published ? "— visible on the site" : "— hidden from the site"}
          </span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className={cn(buttonVariants({ size: "lg" }), "ml-auto disabled:opacity-70")}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>

        {recordId && values.slug ? (
          <a
            href={`/${spec.key === "services" ? "services" : spec.key}/${
              spec.key === "services" ? "" : values.slug
            }`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2"
          >
            <ExternalLink className="size-3.5" />
            View page
          </a>
        ) : null}
      </div>

      {recordId && (
        <details className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4">
          <summary className="cursor-pointer text-sm font-medium text-terracotta">
            Delete this {spec.singular}
          </summary>
          <p className="mt-2 text-sm text-charcoal/80">
            This removes &ldquo;{String(values[spec.titleField] ?? "")}&rdquo;
            permanently. If you only want it off the site, switch Published off
            instead.
          </p>
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Trash2 className="size-4" />
            Delete permanently
          </button>
        </details>
      )}
    </form>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "error";
  children: React.ReactNode;
}) {
  const tones = {
    ok: "border-brand-600/40 bg-brand-600/10 text-forest",
    warn: "border-gold/60 bg-gold/15 text-charcoal",
    error: "border-terracotta/40 bg-terracotta/10 text-terracotta",
  } as const;

  return (
    <div
      role={tone === "ok" ? "status" : "alert"}
      className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}
    >
      {tone === "warn" && (
        <AlertTriangle aria-hidden className="mb-1.5 inline size-4" />
      )}{" "}
      {children}
    </div>
  );
}

function FormField({
  field,
  spec,
  value,
  error,
  highlighted,
  onChange,
  onSlugEdit,
}: {
  field: FieldSpec;
  spec: CollectionSpec;
  value: unknown;
  error?: string;
  highlighted?: boolean;
  onChange: (value: unknown) => void;
  onSlugEdit: () => void;
}) {
  const id = `f-${field.name}`;

  const shell = (children: React.ReactNode) => (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      error={error ?? (highlighted ? "Needed before this can be published." : undefined)}
      className={field.wide ? "sm:col-span-2" : undefined}
    >
      {children}
    </Field>
  );

  switch (field.kind) {
    case "switch":
      return (
        <div className={field.wide ? "sm:col-span-2" : undefined}>
          <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/90">
            <input
              id={id}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
              className="size-4 accent-[var(--color-forest)]"
            />
            {field.label}
          </label>
        </div>
      );

    case "select":
      return shell(
        <select
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>,
      );

    case "textarea":
    case "richtext":
      return shell(
        <textarea
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={cn(textareaClass, field.kind === "richtext" && "min-h-48")}
          placeholder={
            field.kind === "richtext"
              ? "Leave a blank line between paragraphs."
              : undefined
          }
        />,
      );

    case "number":
      return shell(
        <input
          id={id}
          type="number"
          value={Number(value ?? 0)}
          onChange={(event) => onChange(Number(event.target.value))}
          className={inputClass}
        />,
      );

    case "price":
      return shell(
        <input
          id={id}
          type="number"
          min={0}
          value={value === null || value === undefined ? "" : Number(value)}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
          placeholder="Enquire for price"
          className={inputClass}
        />,
      );

    case "list":
      return shell(<ListField value={value} onChange={onChange} />);

    case "image":
      return shell(
        <ImagePicker
          multiple={field.name === "images"}
          value={
            field.name === "images"
              ? ((value as string[] | undefined) ?? [])
              : value
                ? [String(value)]
                : []
          }
          onChange={(next) =>
            onChange(field.name === "images" ? next : (next[0] ?? ""))
          }
        />,
      );

    case "slug":
      return shell(
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            /{spec.key === "testimonials" ? "" : spec.key}/
          </span>
          <input
            id={id}
            value={String(value ?? "")}
            onChange={(event) => {
              onSlugEdit();
              onChange(event.target.value);
            }}
            className={inputClass}
          />
        </div>,
      );

    default:
      return shell(
        <input
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />,
      );
  }
}

/** Repeatable rows, stored as a string array — not rich text (PLAN.md §3.3). */
function ListField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: string[]) => void;
}) {
  const rows = (value as string[] | undefined) ?? [];

  const update = (index: number, next: string) =>
    onChange(rows.map((row, i) => (i === index ? next : row)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={row}
            onChange={(event) => update(index, event.target.value)}
            className={inputClass}
            aria-label={`Row ${index + 1}`}
          />
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => {
                if (index === 0) return;
                const next = [...rows];
                [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                onChange(next);
              }}
              disabled={index === 0}
              aria-label={`Move row ${index + 1} up`}
              className="grid size-9 place-items-center rounded-lg border border-border text-charcoal/70 disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => {
                if (index === rows.length - 1) return;
                const next = [...rows];
                [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
                onChange(next);
              }}
              disabled={index === rows.length - 1}
              aria-label={`Move row ${index + 1} down`}
              className="grid size-9 place-items-center rounded-lg border border-border text-charcoal/70 disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              aria-label={`Remove row ${index + 1}`}
              className="grid size-9 place-items-center rounded-lg border border-border text-terracotta"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-charcoal hover:border-brand-600"
      >
        <Plus className="size-4 text-brand-600" />
        Add a row
      </button>
    </div>
  );
}
