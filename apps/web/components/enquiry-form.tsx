"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createEnquirySchema, type EnquiryKind } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "Ask about this" for a course or a product.
 *
 * Neither has a checkout (PLAN.md §3.1, SRS §3.5), and sending someone to
 * the generic booking form instead — which asks for birth details — answers
 * a different question entirely. The form sits on the item's own page and
 * says which item it is about.
 */
export function EnquiryForm({
  kind,
  itemSlug,
  itemTitle,
  submitLabel,
}: {
  kind: EnquiryKind;
  itemSlug: string;
  itemTitle: string;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const parsed = createEnquirySchema.safeParse({
      kind,
      itemSlug,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      message: String(form.get("message") ?? ""),
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await api.enquiries.create({ body: parsed.data });

      if (response.status === 201) {
        setDone(response.body.message);
        return;
      }
      if (response.status === 422) {
        setErrors(issuesToFieldErrors(response.body.issues));
        return;
      }
      const body = response.body as { error?: string } | undefined;
      setErrors({ _: body?.error ?? "Something went wrong. Please try again." });
    } catch {
      setErrors({
        _: "We couldn't reach the server. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-600/30 bg-ivory p-5">
        <CheckCircle2 className="size-7 text-brand-600" />
        <p className="mt-3 text-sm leading-relaxed text-charcoal/85">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="ce-name" error={errors.name}>
        <input
          id="ce-name"
          name="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
      </Field>
      <Field label="Email" htmlFor="ce-email" error={errors.email}>
        <input
          id="ce-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
        />
      </Field>
      <Field label="Mobile number" htmlFor="ce-phone" error={errors.phone}>
        <input
          id="ce-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          className={inputClass}
          placeholder="+91 98765 43210"
        />
      </Field>
      <Field
        label="Anything you'd like to ask?"
        htmlFor="ce-message"
        optional
        error={errors.message}
      >
        <textarea
          id="ce-message"
          name="message"
          className={cn(textareaClass, "min-h-20")}
          placeholder={`Your question about ${itemTitle}`}
        />
      </Field>

      {errors._ && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(buttonVariants({ size: "lg" }), "disabled:opacity-70")}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            {submitLabel ?? `Ask about this ${kind}`}
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
