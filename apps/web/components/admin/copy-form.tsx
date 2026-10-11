"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { SiteContentKey } from "@repo/contract";
import { adminApi } from "@/lib/api/admin-client";
import { copyFields, readPath, writePath } from "@/lib/admin/copy-fields";
import type { FieldSpec } from "@/lib/admin/collections";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { ImagePicker } from "@/components/admin/image-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Form for one page-copy key. Field list comes from lib/admin/copy-fields. */
export function CopyForm({
  contentKey,
  initial,
}: {
  contentKey: SiteContentKey;
  initial: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = copyFields[contentKey];

  const set = (path: string, value: unknown) => {
    setValues((previous) => writePath(previous, path, value));
    setSaved(false);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      const response = await adminApi.putSiteContent({
        params: { key: contentKey },
        body: { data: values },
      });

      if (response.status === 200) {
        setSaved(true);
        return;
      }
      const body = response.body as { error?: string } | undefined;
      setError(body?.error ?? "That didn't save. Please try again.");
    } catch {
      setError("We couldn't reach the server. Your changes are still here.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {saved && (
        <p
          role="status"
          className="rounded-xl border border-brand-600/40 bg-brand-600/10 px-4 py-3 text-sm text-forest"
        >
          Saved. The site updates within a few minutes.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta"
        >
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <CopyField
            key={field.name}
            field={field}
            value={readPath(values, field.name)}
            onChange={(value) => set(field.name, value)}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className={cn(buttonVariants({ size: "lg" }), "self-start disabled:opacity-70")}
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
    </form>
  );
}

function CopyField({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `c-${field.name.replace(/\./g, "-")}`;
  const rows = (value as string[] | undefined) ?? [];

  const shell = (children: React.ReactNode) => (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      className={field.wide ? "sm:col-span-2" : undefined}
    >
      {children}
    </Field>
  );

  if (field.kind === "image") {
    return shell(
      <ImagePicker
        value={value ? [String(value)] : []}
        onChange={(next) => onChange(next[0] ?? "")}
      />,
    );
  }

  if (field.kind === "list") {
    return shell(
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={row}
              aria-label={`${field.label} row ${index + 1}`}
              onChange={(event) =>
                onChange(rows.map((r, i) => (i === index ? event.target.value : r)))
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="shrink-0 rounded-lg border border-border px-3 text-sm text-terracotta"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...rows, ""])}
          className="w-fit rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-brand-600"
        >
          Add a row
        </button>
      </div>,
    );
  }

  if (field.kind === "textarea" || field.kind === "richtext") {
    return shell(
      <textarea
        id={id}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className={cn(textareaClass, field.kind === "richtext" && "min-h-48")}
      />,
    );
  }

  return shell(
    <input
      id={id}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />,
  );
}
