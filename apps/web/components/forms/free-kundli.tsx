"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { kundaliPreviewInputSchema, type KundaliPreview } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass } from "@/components/forms/field";
import {
  CitySelect,
  emptyBirthPlace,
  type BirthPlace,
} from "@/components/forms/city-select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Raw values we keep so the "detailed PDF" link can prefill the full form. */
type LastInput = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  birthLat: number;
  birthLng: number;
  birthTz: string;
};

export function FreeKundli() {
  const [place, setPlace] = useState<BirthPlace>(emptyBirthPlace);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<KundaliPreview | null>(null);
  const [last, setLast] = useState<LastInput | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      timeOfBirth: String(form.get("timeOfBirth") ?? ""),
      placeOfBirth: place.place,
      birthLat: place.lat,
      birthLng: place.lng,
      birthTz: place.tz,
    };

    const parsed = kundaliPreviewInputSchema.safeParse(raw);
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
      const response = await api.kundali.preview({ body: parsed.data });

      if (response.status === 200) {
        setResult(response.body);
        setLast({
          name: parsed.data.name,
          dateOfBirth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
          timeOfBirth: parsed.data.timeOfBirth,
          placeOfBirth: parsed.data.placeOfBirth,
          birthLat: parsed.data.birthLat,
          birthLng: parsed.data.birthLng,
          birthTz: parsed.data.birthTz,
        });
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

  if (result && last) {
    return (
      <KundaliResult
        result={result}
        last={last}
        onReset={() => {
          setResult(null);
          setLast(null);
          setPlace(emptyBirthPlace);
        }}
      />
    );
  }

  if (submitting) return <CastingState />;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Full name" htmlFor="k-name" error={errors.name}>
        <input
          id="k-name"
          name="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of birth" htmlFor="k-dob" error={errors.dateOfBirth}>
          <input
            id="k-dob"
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
          htmlFor="k-tob"
          error={errors.timeOfBirth}
          hint="As exact as you can — the chart depends on it"
        >
          <input
            id="k-tob"
            name="timeOfBirth"
            type="time"
            aria-invalid={Boolean(errors.timeOfBirth)}
            className={inputClass}
          />
        </Field>
      </div>

      <CitySelect value={place} onChange={setPlace} errors={errors} />

      {errors._ && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        className={cn(buttonVariants({ size: "lg" }), "self-start")}
      >
        <Sparkles className="size-4" />
        Get a Free Kundli
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your birth details are used only to cast your chart and are never
        shared.
      </p>
    </form>
  );
}

/** Staged messages shown while the chart is being cast. */
const CASTING_STEPS = [
  "Calculating planetary positions…",
  "Finding your ascendant (Lagna)…",
  "Reading your Moon sign and Nakshatra…",
  "Tracing your planetary periods (Dasha)…",
  "Checking traditional yogas and doshas…",
  "Assembling your chart…",
];
/** Rough expectation for the free astrology tier — drives the progress bar. */
const EST_SECONDS = 60;

/**
 * Loading state for the free Kundli. A real chart is computed from planetary
 * positions, so it can take up to a minute on the free tier — this shows a
 * progress bar, an elapsed timer and a wait estimate so the wait reads as
 * "working", not "broken".
 */
function CastingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const step =
    CASTING_STEPS[Math.min(Math.floor(elapsed / 10), CASTING_STEPS.length - 1)];
  // Cap at 95% so the bar never claims "done" before the chart actually is.
  const pct = Math.min(95, Math.round((elapsed / EST_SECONDS) * 100));
  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="relative flex size-16 items-center justify-center">
        <Loader2 className="size-16 animate-spin text-gold/40" />
        <Image
          src="/images/logo.png"
          alt=""
          width={44}
          height={44}
          className="absolute size-9 motion-safe:animate-pulse"
        />
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-forest">
          Casting your Kundli…
        </h2>
        <p className="mt-1.5 text-sm text-charcoal/80" aria-live="polite">
          {step}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-cream"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Elapsed {mmss}</span>
          <span>Usually ready in 30–60s</span>
        </div>
      </div>

      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        We calculate from real planetary positions, so this takes a moment.
        Please keep this page open
        {elapsed >= EST_SECONDS ? " — almost there…" : "."}
      </p>
    </div>
  );
}

function KundaliResult({
  result,
  last,
  onReset,
}: {
  result: KundaliPreview;
  last: LastInput;
  onReset: () => void;
}) {
  const detailHref = `/predictions?${new URLSearchParams({
    name: last.name,
    dob: last.dateOfBirth,
    tob: last.timeOfBirth,
    place: last.placeOfBirth,
    lat: String(last.birthLat),
    lng: String(last.birthLng),
    tz: last.birthTz,
  }).toString()}`;

  const chips = [
    { label: "Lagna (Ascendant)", value: result.ascendant.name },
    { label: "Moon sign (Rashi)", value: result.moon.name },
    { label: "Sun sign", value: result.sun.name },
    { label: "Nakshatra", value: result.nakshatra },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          <Star className="size-4 text-gold" />
          {last.name}&apos;s Kundli at a glance
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-forest">
          Your free chart summary
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-2xl border border-border/60 bg-cream/50 p-4"
          >
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {chip.label}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-forest">
              {chip.value}
            </p>
          </div>
        ))}
      </div>

      <ul className="space-y-2.5 text-sm text-charcoal/85">
        {result.highlights.map((line) => (
          <li key={line} className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 text-gold">
              ✦
            </span>
            {line}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-2xl bg-cream/60 p-4 sm:grid-cols-5">
        {[
          ["Tithi", result.panchang.tithi],
          ["Nakshatra", result.panchang.nakshatra],
          ["Yoga", result.panchang.yoga],
          ["Karana", result.panchang.karana],
          ["Weekday", result.panchang.weekday],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-charcoal">{value}</p>
          </div>
        ))}
      </div>

      {result.sample && (
        <p className="rounded-xl bg-soft-yellow/50 px-4 py-3 text-xs leading-relaxed text-charcoal/80">
          This is an indicative preview. Your detailed PDF and consultation are
          prepared from a full astronomical calculation of your chart.
        </p>
      )}

      {/* The two next steps the client asked for. */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
        <Link
          href={detailHref}
          className={cn(buttonVariants({ size: "lg" }), "justify-center")}
        >
          <Download className="size-4" />
          Get detailed Kundli PDF
        </Link>
        <Link
          href="/book"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "justify-center",
          )}
        >
          <CalendarHeart className="size-4" />
          Book a Consultation
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 self-start text-sm font-medium text-brand-700 underline underline-offset-2"
      >
        <RotateCcw className="size-3.5" />
        Cast another chart
      </button>
    </div>
  );
}
