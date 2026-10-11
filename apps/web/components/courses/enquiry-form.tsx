"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createCourseEnquirySchema } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** CR-1 is a catalogue plus an enquiry — there is no checkout (PLAN.md §3.1). */
export function CourseEnquiryForm({
  courseSlug,
  courseTitle,
}: {
  courseSlug: string;
  courseTitle: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const parsed = createCourseEnquirySchema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      courseSlug,
      message: String(form.get("message") ?? ""),
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await api.courses.createEnquiry({ body: parsed.data });

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
      <Field label="Full name" htmlFor="ce-name" required error={errors.name}>
        <input
          id="ce-name"
          name="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
      </Field>
      <Field label="Email" htmlFor="ce-email" required error={errors.email}>
        <input
          id="ce-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
        />
      </Field>
      <Field label="Mobile number" htmlFor="ce-phone" required error={errors.phone}>
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
        error={errors.message}
      >
        <textarea
          id="ce-message"
          name="message"
          className={cn(textareaClass, "min-h-20")}
          placeholder={`Your question about ${courseTitle}`}
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
            Enquire about this course
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
