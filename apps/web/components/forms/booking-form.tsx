"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, Loader2 } from "lucide-react";
import { createBookingSchema, sessionTypes } from "@repo/contract";
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

const sessionLabels: Record<(typeof sessionTypes)[number], string> = {
  "personal-consultation": "Personal consultation",
  "prediction-reading": "Prediction & reading",
  "guidance-session": "Guidance session",
  other: "Something else",
};

type Submitted = { id: string; message: string; kundaliToken: string };

export function BookingForm() {
  const [place, setPlace] = useState<BirthPlace>(emptyBirthPlace);
  const [sessionType, setSessionType] =
    useState<(typeof sessionTypes)[number]>("personal-consultation");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? "") || undefined,
      sessionType,
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      timeOfBirth: String(form.get("timeOfBirth") ?? ""),
      birthPlace: place.place,
      birthLat: place.lat,
      birthLng: place.lng,
      birthTz: place.tz,
      message: String(form.get("message") ?? ""),
    };

    // Validate against the same schema the API uses, so the shapes cannot
    // drift (PLAN.md §2 "validation flow").
    const parsed = createBookingSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      if (place.lat === null || place.lng === null) {
        fieldErrors.birthPlace ??=
          "Pick your city from the list, or enter coordinates manually.";
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await api.bookings.create({ body: parsed.data });

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
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
            placeholder="Your name"
          />
        </Field>

        <Field
          label="Mobile number"
          htmlFor="phone"
          error={errors.phone}
          hint="We'll reach you on this number"
        >
          <input
            id="phone"
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
        htmlFor="email"
        optional
        error={errors.email}
        hint="Optional — add it if you'd like your Kundali emailed as well"
      >
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          placeholder="you@example.com"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Date of birth"
          htmlFor="dateOfBirth"
          error={errors.dateOfBirth}
        >
          <input
            id="dateOfBirth"
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
          htmlFor="timeOfBirth"
          error={errors.timeOfBirth}
          hint="As exact as you can — the chart depends on it"
        >
          <input
            id="timeOfBirth"
            name="timeOfBirth"
            type="time"
            aria-invalid={Boolean(errors.timeOfBirth)}
            className={inputClass}
          />
        </Field>
      </div>

      <CitySelect value={place} onChange={setPlace} errors={errors} />

      <Field label="What would you like guidance on?" htmlFor="sessionType">
        <Select
          id="sessionType"
          name="sessionType"
          value={sessionType}
          onValueChange={(next) =>
            setSessionType(next as (typeof sessionTypes)[number])
          }
          options={sessionTypes.map((type) => ({
            value: type,
            label: sessionLabels[type],
          }))}
        />
      </Field>

      <Field
        label="Anything you'd like us to know?"
        htmlFor="message"
        optional
        error={errors.message}
      >
        <textarea
          id="message"
          name="message"
          className={textareaClass}
          placeholder="Share the question you're carrying, if you'd like."
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
        className={cn(buttonVariants({ size: "lg" }), "self-start disabled:opacity-70")}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Request my session
            <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your birth details are used to prepare your Kundali and are never
        shared. Guidance offered here carries traditional and spiritual
        significance and is not a substitute for medical, legal or financial
        advice.
      </p>
    </form>
  );
}

/**
 * Confirmation state. Keyed by the returned booking id, so a refresh shows
 * the same state rather than resubmitting (PLAN.md §13). The Kundali is
 * generated after the booking is saved, so this polls for it.
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
        const response = await api.kundali.status({
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

      // Give up quietly after ~1 minute: the practice follows up either way.
      if (active && attempts < 20) setTimeout(poll, 3000);
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
        Thank you — we have your details
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {submitted.message}
      </p>

      <div className="mt-6 rounded-2xl bg-cream/70 p-4">
        {status === "pending" && (
          <p className="flex items-center gap-2 text-sm text-charcoal/80">
            <Loader2 className="size-4 animate-spin text-brand-600" />
            Preparing your Kundali…
          </p>
        )}

        {status === "ready" && downloadPath && (
          <a
            href={`${base}${downloadPath}`}
            className={cn(buttonVariants({ size: "sm" }), "h-10")}
          >
            <Download className="size-4" />
            Download your Kundali (PDF)
          </a>
        )}

        {status === "failed" && (
          <p className="text-sm text-charcoal/80">
            Your request is saved. Your Kundali needs a quick manual check — we
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
