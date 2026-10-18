"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { SiteContentKey } from "@repo/contract";
import { adminApi } from "@/lib/api/admin-client";
import { copyFields, readPath, writePath } from "@/lib/admin/copy-fields";
import type { FieldSpec } from "@/lib/admin/collections";
import { ImagePicker } from "@/components/admin/image-picker";
import { toast } from "@/components/admin/toast";
import {
  FieldShell,
  Repeater,
  StickyActions,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
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

  const fields = copyFields[contentKey];

  const set = (path: string, value: unknown) => {
    setValues((previous) => writePath(previous, path, value));
    setSaved(false);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const response = await adminApi.putSiteContent({
        params: { key: contentKey },
        body: { data: values },
      });

      if (response.status === 200) {
        setSaved(true);
        toast.success("Page copy saved.", {
          description: "The site updates within a minute.",
        });
        return;
      }
      const body = response.body as { error?: string } | undefined;
      toast.error("That didn't save", {
        description: body?.error ?? "Please try again.",
      });
    } catch {
      toast.error("We couldn't reach the server", {
        description: "Your changes are still here. Try saving again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
        {fields.map((field) => (
          <CopyField
            key={field.name}
            field={field}
            value={readPath(values, field.name)}
            onChange={(value) => set(field.name, value)}
          />
        ))}
      </div>

      <StickyActions
        status={
          saved ? (
            <span className="font-medium text-forest">Saved</span>
          ) : (
            <span className="text-muted-foreground">
              Empty fields keep the wording already on the site
            </span>
          )
        }
      >
        <button
          type="submit"
          disabled={saving}
          className={cn(buttonVariants({ size: "sm" }), "h-11 px-5 disabled:opacity-70")}
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
      </StickyActions>
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
  const text = typeof value === "string" ? value : "";

  const shell = (children: React.ReactNode) => (
    <FieldShell
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      wide={field.wide}
    >
      {children}
    </FieldShell>
  );

  if (field.kind === "image") {
    return shell(
      <ImagePicker
        value={text ? [text] : []}
        onChange={(next) => onChange(next[0] ?? "")}
      />,
    );
  }

  if (field.kind === "list") {
    return shell(
      <Repeater
        rows={(value as string[] | undefined) ?? []}
        onChange={onChange}
        placeholder={field.placeholder}
        emptyHint={field.emptyHint}
      />,
    );
  }

  if (field.kind === "textarea" || field.kind === "richtext") {
    return shell(
      <TextArea
        id={id}
        rows={field.kind === "richtext" ? 10 : 3}
        value={text}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />,
    );
  }

  if (field.kind === "number" || field.kind === "price") {
    const num = typeof value === "number" ? String(value) : text;
    return shell(
      <TextInput
        id={id}
        value={num}
        inputMode="numeric"
        placeholder={field.placeholder}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "");
          onChange(digits === "" ? 0 : Number(digits));
        }}
      />,
    );
  }

  return shell(
    <TextInput
      id={id}
      value={text}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />,
  );
}
