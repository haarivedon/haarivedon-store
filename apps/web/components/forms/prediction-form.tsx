"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createPredictionSchema, focusAreas } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const focusLabels: Record<(typeof focusAreas)[number], string> = {
  career: "Career & work",
  relationships: "Relationships & family",
  health: "Health & well-being",
  finance: "Money & finance",
  general: "General guidance",
};

export function PredictionForm() {
  const [focusArea, setFocusArea] =
    useState<(typeof focusAreas)[number]>("general");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const parsed = createPredictionSchema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      timeOfBirth: String(form.get("timeOfBirth") ?? ""),
      placeOfBirth: String(form.get("placeOfBirth") ?? ""),
      focusArea,
      question: String(form.get("question") ?? ""),
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await api.predictions.create({ body: parsed.data });

      if (response.status === 201) {
        setDone(response.body.message);
        return;
      }
      if (response.status === 422) {
        setErrors(issuesToFieldErrors(response.body.issues));
        return;
      }
      // Any other status (429, 500, or an unknown one) surfaces as one
      // form-level message rather than a silent no-op.
      const body = response.body as { error?: string } | undefined;
      setErrors({
        _: body?.error ?? "Something went wrong. Please try again.",
      });
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
      <div className="rounded-3xl border border-brand-600/30 bg-ivory p-6 sm:p-8">
        <CheckCircle2 className="size-9 text-brand-600" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
          Your request is with us
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {done}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-brand-700 underline underline-offset-2"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="p-name" required error={errors.name}>
          <input
            id="p-name"
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Mobile number"
          htmlFor="p-phone"
          required
          error={errors.phone}
        >
          <input
            id="p-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            className={inputClass}
            placeholder="+91 98765 43210"
          />
        </Field>
      </div>

      <Field
        label="Email"
        htmlFor="p-email"
        required
        error={errors.email}
        hint="Your reading is sent here"
      >
        <input
          id="p-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Date of birth"
          htmlFor="p-dob"
          required
          error={errors.dateOfBirth}
        >
          <input
            id="p-dob"
            name="dateOfBirth"
            type="date"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(errors.dateOfBirth)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Time of birth"
          htmlFor="p-tob"
          error={errors.timeOfBirth}
          hint="If you know it"
        >
          <input id="p-tob" name="timeOfBirth" type="time" className={inputClass} />
        </Field>
        <Field
          label="Place of birth"
          htmlFor="p-pob"
          required
          error={errors.placeOfBirth}
        >
          <input
            id="p-pob"
            name="placeOfBirth"
            aria-invalid={Boolean(errors.placeOfBirth)}
            className={inputClass}
            placeholder="City"
          />
        </Field>
      </div>

      <Field label="What is this about?" htmlFor="p-focus">
        <Select
          id="p-focus"
          name="focusArea"
          value={focusArea}
          onValueChange={(next) =>
            setFocusArea(next as (typeof focusAreas)[number])
          }
          options={focusAreas.map((area) => ({
            value: area,
            label: focusLabels[area],
          }))}
        />
      </Field>

      <Field
        label="Your question"
        htmlFor="p-question"
        error={errors.question}
        hint="The more specific the question, the more useful the reading"
      >
        <textarea id="p-question" name="question" className={textareaClass} />
      </Field>

      {errors._ && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(buttonVariants({ size: "lg" }), "self-start disabled:opacity-70")}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Request my reading
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
