"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import {
  allFields,
  collections,
  slugify,
  writeSchemas,
  type CollectionSpec,
  type FieldSpec,
} from "@/lib/admin/collections";
import { issuesToFieldErrors, requiredKeys } from "@/lib/forms";
import { ImagePicker } from "@/components/admin/image-picker";
import {
  Banner,
  FieldShell,
  FormSection,
  RequirementLegend,
  type Requirement,
  PriceInput,
  Repeater,
  Select,
  SlugInput,
  StickyActions,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
type Missing = { field: string; message: string };

/**
 * One form for every collection, built from the section config.
 *
 * Validation runs react-hook-form against the *same* zod schema the API
 * validates with (`writeSchemas`), so the messages a user sees on the client
 * are the messages the server would have sent. Required markers come from
 * that schema too, rather than being repeated in the field config where they
 * could drift (docs/PLAN.md §2 "validation flow").
 *
 * Saving stays permissive and publishing strict: the checklist at the top
 * shows what publishing still needs before the attempt, and the server
 * remains the authority.
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
  // Imported rather than passed in: `publishChecks` holds functions, and
  // functions cannot cross the server/client boundary.
  const spec = collections[collectionKey];
  const schema = writeSchemas[collectionKey];
  const router = useRouter();

  const [missing, setMissing] = useState<Missing[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflict, setConflict] = useState(false);
  const slugTouched = useRef(Boolean(recordId));

  const required = useMemo(() => requiredKeys(schema), [schema]);
  const publishFields = useMemo(
    () => new Set(spec.publishChecks.map((check) => check.field)),
    [spec],
  );

  const requirementFor = (name: string): Requirement | undefined =>
    required.has(name)
      ? "required"
      : publishFields.has(name)
        ? "publish"
        : undefined;

  // React Compiler skips memoizing this component: react-hook-form returns
  // functions it cannot safely memoize. That is expected and harmless here —
  // the form is small and re-renders are cheap.
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    // The schema is a union across four collections, so its inferred output
    // cannot match the generic record type; the resolver still validates
    // against whichever schema this collection uses.
    resolver: standardSchemaResolver(schema as never) as Resolver<Values>,
    defaultValues: { ...spec.blank, ...record },
    // Validate as soon as a field has been touched and corrected, so an
    // error clears the moment it stops being true.
    mode: "onTouched",
  });

  const values = watch();
  const published = Boolean(values.published);

  const checks = useMemo(
    () => spec.publishChecks.map((check) => ({ ...check, done: check.done(values) })),
    [spec, values],
  );
  const outstanding = checks.filter((check) => !check.done);

  /** The slug follows the title until someone edits it by hand. */
  const onTitleChange = (value: string) => {
    const slugField = allFields(spec).find((field) => field.kind === "slug");
    if (!slugTouched.current && slugField) {
      setValue(slugField.name, slugify(value), { shouldDirty: true });
    }
  };

  const onSubmit = handleSubmit(async (payload) => {
    setMissing([]);
    setFormError(null);
    setConflict(false);

    try {
      const response = recordId
        ? await adminApi[collectionKey].update({
            params: { id: recordId },
            body: {
              ...payload,
              expectedUpdatedAt: String(record.updatedAt),
            } as never,
          })
        : await adminApi[collectionKey].create({ body: payload as never });

      if (response.status === 200 || response.status === 201) {
        setSaved(true);
        const created = response.body as { id: string };
        if (!recordId) router.push(`/admin/content/${collectionKey}/${created.id}`);
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
          setValue("published", false);
          return;
        }

        // Anything the client schema let through lands on its own field.
        const fieldErrors = issuesToFieldErrors(body.issues);
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (field === "_") setFormError(message);
          else setError(field, { type: "server", message });
        }
        if (!Object.keys(fieldErrors).length) {
          setFormError(body.error ?? "That didn't save.");
        }
        return;
      }

      const body = response.body as { error?: string } | undefined;
      setFormError(body?.error ?? "That didn't save. Please try again.");
    } catch {
      setFormError(
        "We couldn't reach the server. Your changes are still on screen.",
      );
    }
  });

  async function onDelete() {
    if (!recordId) return;
    const response = await adminApi[collectionKey].remove({
      params: { id: recordId },
    });
    if (response.status === 200) router.push(`/admin/content/${collectionKey}`);
  }

  const title = String(values[spec.titleField] ?? "");
  const slug = typeof values.slug === "string" ? values.slug : "";
  const viewHref =
    collectionKey === "services"
      ? "/services"
      : collectionKey === "testimonials"
        ? "/"
        : `/${collectionKey}/${slug}`;

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {conflict && (
        <Banner tone="warn">
          <strong className="block">Someone else changed this</strong>
          This record was edited elsewhere — maybe in another tab — after you
          opened it. Reload to see the current version, then re-apply your
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

      {errorCount > 0 && (
        <Banner tone="error">
          {errorCount === 1
            ? "One field needs attention — it is marked below."
            : `${errorCount} fields need attention — they are marked below.`}
        </Banner>
      )}

      {formError && <Banner tone="error">{formError}</Banner>}

      {/*
        Publish state leads the form rather than closing it: it is the thing
        an editor checks first, and the checklist says what stands between a
        draft and the live page.
      */}
      <section
        className={cn(
          "rounded-xl border p-4",
          published
            ? "border-brand-600/40 bg-brand-600/5"
            : "border-border bg-[#faf9f3]",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <Toggle
                checked={Boolean(field.value)}
                onChange={(next) => {
                  field.onChange(next);
                  setSaved(false);
                }}
                label={published ? "Published" : "Draft"}
                description={
                  published
                    ? "Live on the site once you save."
                    : "Hidden from the site — only you can see it."
                }
              />
            )}
          />

          {recordId && published && slug && (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2"
            >
              <ExternalLink className="size-3.5" />
              View on the site
            </a>
          )}
        </div>

        {outstanding.length > 0 && (
          <div className="mt-4 border-t border-border/60 pt-3.5">
            <p className="text-sm font-medium text-charcoal/90">
              {published
                ? "Still needed before this can go live"
                : "Before this can be published"}
            </p>
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
              {checks.map((check) => (
                <li key={check.field} className="flex items-center gap-2 text-sm">
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
      </section>

      <RequirementLegend />

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
              control={control}
              register={register}
              errors={errors}
              requirement={requirementFor(field.name)}
              recordTitle={title}
              highlighted={missing.some((item) => item.field === field.name)}
              onTitleChange={
                field.name === spec.titleField ? onTitleChange : undefined
              }
              onSlugEdit={() => {
                slugTouched.current = true;
              }}
            />
          ))}
        </FormSection>
      ))}

      <StickyActions
        status={
          saved ? (
            <span className="font-medium text-forest">
              Saved{published ? " and live on the site." : " as a draft."}
            </span>
          ) : isDirty ? (
            <span className="text-muted-foreground">Unsaved changes</span>
          ) : null
        }
      >
        <Link
          href={`/admin/content/${collectionKey}`}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:border-brand-600"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-11 px-5 disabled:opacity-70",
          )}
        >
          {isSubmitting ? (
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
            site, switch it back to Draft instead.
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-terracotta px-4 text-sm font-semibold text-white"
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
  control,
  register,
  errors,
  requirement,
  recordTitle,
  highlighted,
  onTitleChange,
  onSlugEdit,
}: {
  field: FieldSpec;
  spec: CollectionSpec;
  control: Control<Values>;
  register: ReturnType<typeof useForm<Values>>["register"];
  errors: FieldErrors<Values>;
  requirement?: Requirement;
  recordTitle: string;
  highlighted?: boolean;
  onTitleChange?: (value: string) => void;
  onSlugEdit: () => void;
}) {
  const id = `f-${field.name}`;
  const error = errors[field.name]?.message as string | undefined;

  const shell = (children: React.ReactNode, counter?: number) => (
    <FieldShell
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      wide={field.wide}
      requirement={requirement}
      error={
        error ??
        (highlighted ? "Needed before this can be published." : undefined)
      }
      counter={
        field.max !== undefined && counter !== undefined
          ? { value: counter, max: field.max }
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
          <Controller
            control={control}
            name={field.name}
            render={({ field: controlled }) => (
              <Toggle
                checked={Boolean(controlled.value)}
                onChange={controlled.onChange}
                label={field.label}
                description={field.hint}
              />
            )}
          />
        </div>
      );

    case "select":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <Select
                id={id}
                options={field.options ?? []}
                value={String(controlled.value ?? "")}
                onValueChange={controlled.onChange}
                invalid={Boolean(error)}
              />,
            )
          }
        />
      );

    case "textarea":
    case "richtext":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <TextArea
                id={id}
                rows={field.kind === "richtext" ? 10 : 3}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                value={String(controlled.value ?? "")}
                onChange={controlled.onChange}
                onBlur={controlled.onBlur}
              />,
              String(controlled.value ?? "").length,
            )
          }
        />
      );

    case "number":
      return shell(
        <TextInput
          id={id}
          inputMode="numeric"
          aria-invalid={Boolean(error)}
          {...register(field.name, { valueAsNumber: true })}
        />,
      );

    case "price":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <PriceInput
                id={id}
                value={
                  typeof controlled.value === "number" ? controlled.value : null
                }
                onChange={controlled.onChange}
              />,
            )
          }
        />
      );

    case "list":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <Repeater
                rows={(controlled.value as string[] | undefined) ?? []}
                onChange={controlled.onChange}
                placeholder={field.placeholder}
                emptyHint={field.emptyHint}
              />,
            )
          }
        />
      );

    case "image":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <ImagePicker
                multiple={field.name === "images"}
                suggestedAlt={recordTitle}
                value={
                  field.name === "images"
                    ? ((controlled.value as string[] | undefined) ?? [])
                    : controlled.value
                      ? [String(controlled.value)]
                      : []
                }
                onChange={(next) =>
                  controlled.onChange(
                    field.name === "images" ? next : (next[0] ?? ""),
                  )
                }
              />,
            )
          }
        />
      );

    case "slug":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <SlugInput
                id={id}
                prefix={spec.slugPrefix ?? "/"}
                value={String(controlled.value ?? "")}
                onChange={(next) => {
                  onSlugEdit();
                  controlled.onChange(next);
                }}
              />,
            )
          }
        />
      );

    default:
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: controlled }) =>
            shell(
              <TextInput
                id={id}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                value={String(controlled.value ?? "")}
                onBlur={controlled.onBlur}
                onChange={(event) => {
                  controlled.onChange(event.target.value);
                  onTitleChange?.(event.target.value);
                }}
              />,
              String(controlled.value ?? "").length,
            )
          }
        />
      );
  }
}
