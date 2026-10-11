"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import {
  allFields,
  collections,
  slugify,
  type CollectionSpec,
  type FieldSpec,
} from "@/lib/admin/collections";
import { issuesToFieldErrors, type FieldErrors } from "@/lib/forms";
import { ImagePicker } from "@/components/admin/image-picker";
import {
  Banner,
  FieldShell,
  FormSection,
  PriceInput,
  Repeater,
  Select,
  SlugInput,
  StickyActions,
  TextArea,
  TextInput,
  Toggle,
  controlClass,
} from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
type Missing = { field: string; message: string };

/**
 * One form for every collection, built from the section config.
 *
 * Saving is permissive and publishing is strict. The checklist shows what
 * publishing still needs *before* the attempt, so the editor is not told off
 * after the fact — the server stays the authority and returns the same list
 * if something slips through (docs/PLAN.md §3.3).
 */
export function RecordForm({
  collectionKey,
  record,
  recordId,
}: {
  collectionKey: CollectionSpec["key"];
  record: Values;
  recordId?: string;
}) {
  // The config is imported here rather than passed in: `publishChecks` holds
  // functions, and functions cannot cross the server/client boundary.
  const spec = collections[collectionKey];
  const router = useRouter();
  const [values, setValues] = useState<Values>(record);
  const [published, setPublished] = useState(Boolean(record.published));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [missing, setMissing] = useState<Missing[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [dirty, setDirty] = useState(false);
  const slugTouched = useRef(Boolean(recordId));

  const set = (name: string, value: unknown) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
    setDirty(true);
  };

  /** The slug follows the title until someone edits it by hand. */
  const setTitle = (name: string, value: string) => {
    set(name, value);
    const slugField = allFields(spec).find((field) => field.kind === "slug");
    if (!slugTouched.current && slugField) set(slugField.name, slugify(value));
  };

  const checks = useMemo(
    () => spec.publishChecks.map((check) => ({ ...check, done: check.done(values) })),
    [spec, values],
  );
  const outstanding = checks.filter((check) => !check.done);

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
        setDirty(false);
        const created = response.body as { id: string };
        if (!recordId) router.push(`/admin/content/${spec.key}/${created.id}`);
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
          // The server rolled the publish back; reflect that here.
          setPublished(false);
        } else {
          const fieldErrors = issuesToFieldErrors(body.issues);
          setErrors(
            body.error ? { ...fieldErrors, _: body.error } : fieldErrors,
          );
        }
        return;
      }

      const body = response.body as { error?: string } | undefined;
      setErrors({ _: body?.error ?? "That didn't save. Please try again." });
    } catch {
      setErrors({
        _: "We couldn't reach the server. Your changes are still on screen.",
      });
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

  const title = String(values[spec.titleField] ?? "");
  const slug = typeof values.slug === "string" ? values.slug : "";
  const viewHref =
    spec.key === "services"
      ? "/services"
      : spec.key === "testimonials"
        ? "/"
        : `/${spec.key}/${slug}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {conflict && (
        <Banner tone="warn">
          <strong className="block">Someone else changed this</strong>
          This record was edited elsewhere — maybe in another tab — after you
          opened it. Reload to see the current version, then re-apply your edit.{" "}
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
            Saved as a draft — {missing.length} thing
            {missing.length === 1 ? "" : "s"} still needed before publishing:
          </strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.map((item) => (
              <li key={item.field}>{item.message}</li>
            ))}
          </ul>
        </Banner>
      )}

      {errors._ && <Banner tone="error">{errors._}</Banner>}

      {spec.sections.map((section) => (
        <FormSection
          key={section.title}
          title={section.title}
          description={section.description}
        >
          {section.fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              spec={spec}
              recordTitle={title}
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
        </FormSection>
      ))}

      <FormSection
        title="Visibility"
        description="Nothing is visible on the site until you publish it."
      >
        <div className="sm:col-span-2">
          <Toggle
            checked={published}
            onChange={(next) => {
              setPublished(next);
              setSaved(false);
              setDirty(true);
            }}
            label="Published"
            description={
              published
                ? "Live on the site."
                : "Hidden — only you can see it."
            }
          />

          {outstanding.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-[#faf9f3] p-4">
              <p className="text-sm font-medium text-charcoal/90">
                Before this can be published
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {checks.map((check) => (
                  <li
                    key={check.field}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-full border",
                        check.done
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-charcoal/30",
                      )}
                    >
                      {check.done && <Check className="size-3" />}
                    </span>
                    <span
                      className={
                        check.done
                          ? "text-muted-foreground line-through"
                          : "text-charcoal/85"
                      }
                    >
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </FormSection>

      <StickyActions
        status={
          saved ? (
            <span className="font-medium text-forest">
              Saved{published ? " and live on the site." : " as a draft."}
            </span>
          ) : dirty ? (
            <span className="text-muted-foreground">Unsaved changes</span>
          ) : recordId && published && slug ? (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-brand-700 underline underline-offset-2"
            >
              <ExternalLink className="size-3.5" />
              View on the site
            </a>
          ) : null
        }
      >
        <Link
          href={`/admin/content/${spec.key}`}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:border-brand-600"
        >
          Cancel
        </Link>
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
            `Save ${spec.singular}`
          )}
        </button>
      </StickyActions>

      {recordId && (
        <details className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4">
          <summary className="cursor-pointer text-sm font-medium text-terracotta">
            Delete this {spec.singular}
          </summary>
          <p className="mt-2 text-sm text-charcoal/80">
            This removes “{title}” permanently. If you only want it off the
            site, switch Published off instead.
          </p>
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-terracotta px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Delete permanently
          </button>
        </details>
      )}
    </form>
  );
}

function FormField({
  field,
  spec,
  recordTitle,
  value,
  error,
  highlighted,
  onChange,
  onSlugEdit,
}: {
  field: FieldSpec;
  spec: CollectionSpec;
  recordTitle: string;
  value: unknown;
  error?: string;
  highlighted?: boolean;
  onChange: (value: unknown) => void;
  onSlugEdit: () => void;
}) {
  const id = `f-${field.name}`;
  const text = typeof value === "string" ? value : "";

  const shell = (children: React.ReactNode) => (
    <FieldShell
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      wide={field.wide}
      error={
        error ?? (highlighted ? "Needed before this can be published." : undefined)
      }
      counter={
        field.max && (field.kind === "text" || field.kind === "textarea" || field.kind === "richtext")
          ? { value: text.length, max: field.max }
          : undefined
      }
    >
      {children}
    </FieldShell>
  );

  switch (field.kind) {
    case "switch":
      return (
        <div className={field.wide ? "sm:col-span-2" : undefined}>
          <Toggle
            checked={Boolean(value)}
            onChange={onChange}
            label={field.label}
            description={field.hint}
          />
        </div>
      );

    case "select":
      return shell(
        <Select
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          options={field.options ?? []}
        />,
      );

    case "textarea":
    case "richtext":
      return shell(
        <TextArea
          id={id}
          rows={field.kind === "richtext" ? 10 : 3}
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />,
      );

    case "number":
      return shell(
        <TextInput
          id={id}
          inputMode="numeric"
          value={String(value ?? 0)}
          onChange={(event) =>
            onChange(Number(event.target.value.replace(/[^\d]/g, "") || 0))
          }
        />,
      );

    case "price":
      return shell(
        <PriceInput
          id={id}
          value={typeof value === "number" ? value : null}
          onChange={onChange}
        />,
      );

    case "list":
      return shell(
        <Repeater
          rows={(value as string[] | undefined) ?? []}
          onChange={onChange}
          placeholder={field.placeholder}
          emptyHint={field.emptyHint}
          addLabel="Add a row"
        />,
      );

    case "image":
      return shell(
        <ImagePicker
          multiple={field.name === "images"}
          suggestedAlt={recordTitle}
          value={
            field.name === "images"
              ? ((value as string[] | undefined) ?? [])
              : text
                ? [text]
                : []
          }
          onChange={(next) =>
            onChange(field.name === "images" ? next : (next[0] ?? ""))
          }
        />,
      );

    case "slug":
      return shell(
        <SlugInput
          id={id}
          prefix={spec.slugPrefix ?? "/"}
          value={text}
          onChange={(next) => {
            onSlugEdit();
            onChange(next);
          }}
        />,
      );

    default:
      return shell(
        <input
          id={id}
          value={text}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={controlClass}
        />,
      );
  }
}
