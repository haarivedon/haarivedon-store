"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, Loader2 } from "lucide-react";
import { createPredictionSchema, focusAreas } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { Select } from "@/components/ui/select";
import {
  CitySelect,
  emptyBirthPlace,
  type BirthPlace,
} from "@/components/forms/city-select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const focusLabels: Record<(typeof focusAreas)[number], string> = {
  career: "Career & work",
  relationships: "Relationships & family",
  health: "Health & well-being",
  finance: "Money & finance",
  general: "General guidance",
};

type Submitted = { id: string; message: string; kundaliToken: string };

/** Values carried over from the free Kundli so the reader need not retype them. */
export type PredictionPrefill = {
  name?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  birthLat?: number;
  birthLng?: number;
  birthTz?: string;
};

export function PredictionForm({ prefill }: { prefill?: PredictionPrefill }) {
  const [place, setPlace] = useState<BirthPlace>(() =>
    prefill?.birthLat != null && prefill?.birthLng != null
      ? {
          place: prefill.placeOfBirth ?? "",
          lat: prefill.birthLat,
          lng: prefill.birthLng,
          tz: prefill.birthTz ?? emptyBirthPlace.tz,
        }
      : prefill?.placeOfBirth
        ? {
            ...emptyBirthPlace,
            place: prefill.placeOfBirth,
            tz: prefill.birthTz ?? emptyBirthPlace.tz,
          }
        : emptyBirthPlace,
  );
  const [focusArea, setFocusArea] =
    useState<(typeof focusAreas)[number]>("general");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      timeOfBirth: String(form.get("timeOfBirth") ?? ""),
      placeOfBirth: place.place,
      birthLat: place.lat,
      birthLng: place.lng,
      birthTz: place.tz,
      focusArea,
      question: String(form.get("question") ?? ""),
    };

    // Same schema the API uses, so the shapes cannot drift (PLAN.md §2).
    const parsed = createPredictionSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      if (place.lat === null || place.lng === null) {
        fieldErrors.placeOfBirth ??=
          "Pick your city from the list, or enter coordinates manually.";
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await api.predictions.create({ body: parsed.data });

      if (response.status === 201) {
        setSubmitted(response.body);
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

  if (submitted) return <Confirmation submitted={submitted} />;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="p-name" error={errors.name}>
          <input
            id="p-name"
            name="name"
            autoComplete="name"
            defaultValue={prefill?.name}
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
          />
        </Field>
        <Field label="Mobile number" htmlFor="p-phone" error={errors.phone}>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of birth" htmlFor="p-dob" error={errors.dateOfBirth}>
          <input
            id="p-dob"
            name="dateOfBirth"
            type="date"
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={prefill?.dateOfBirth}
            aria-invalid={Boolean(errors.dateOfBirth)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Time of birth"
          htmlFor="p-tob"
          error={errors.timeOfBirth}
          hint="As exact as you can — the chart depends on it"
        >
          <input
            id="p-tob"
            name="timeOfBirth"
            type="time"
            defaultValue={prefill?.timeOfBirth}
            aria-invalid={Boolean(errors.timeOfBirth)}
            className={inputClass}
          />
        </Field>
      </div>

      <CitySelect value={place} onChange={setPlace} errors={errors} />

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
        optional
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

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your birth details are used to prepare your chart and are never shared.
      </p>
    </form>
  );
}

/**
 * Confirmation state. Keyed by the returned request id, so a refresh shows the
 * same state rather than resubmitting. The chart is generated after the request
 * is saved, so this polls for it.
 */
function Confirmation({ submitted }: { submitted: Submitted }) {
  const [status, setStatus] = useState<"pending" | "ready" | "failed">("pending");
  const [downloadPath, setDownloadPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const response = await api.predictions.status({
          params: { id: submitted.id },
          query: { token: submitted.kundaliToken },
        });
        if (!active) return;

        if (response.status === 200) {
          setStatus(response.body.status);
          setDownloadPath(response.body.downloadPath);
          if (response.body.status !== "pending") return;
        }
      } catch {
        // Keep polling; a transient network blip is not a failure.
      }

      // Poll for ~3.5 min: the free VedAstro tier is throttled and a chart can
      // take a couple of minutes. The practice follows up either way.
      if (active && attempts < 70) setTimeout(poll, 3000);
    };

    void poll();
    return () => {
      active = false;
    };
  }, [submitted.id, submitted.kundaliToken]);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  return (
    <div className="rounded-3xl border border-brand-600/30 bg-ivory p-6 sm:p-8">
      <CheckCircle2 className="size-9 text-brand-600" />
      <h2 className="mt-4 font-display text-2xl font-semibold text-forest">
        Your request is with us
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {submitted.message}
      </p>

      <div className="mt-6 rounded-2xl bg-cream/70 p-4">
        {status === "pending" && (
          <p className="flex items-center gap-2 text-sm text-charcoal/80">
            <Loader2 className="size-4 animate-spin text-brand-600" />
            Preparing your chart…
          </p>
        )}

        {status === "ready" && downloadPath && (
          <a
            href={`${base}${downloadPath}`}
            className={cn(buttonVariants({ size: "sm" }), "h-10")}
          >
            <Download className="size-4" />
            Download your chart (PDF)
          </a>
        )}

        {status === "failed" && (
          <p className="text-sm text-charcoal/80">
            Your request is saved. Your chart needs a quick manual check — we
            will send it across shortly.
          </p>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex text-sm font-medium text-brand-700 underline underline-offset-2"
      >
        Back to home
      </Link>
    </div>
  );
}
