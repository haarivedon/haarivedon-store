"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { createBookingSchema } from "@repo/contract";
import { api } from "@/lib/api/client";
import { toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";
import { Select } from "@/components/ui/select";
import {
  CitySelect,
  emptyBirthPlace,
  type BirthPlace,
} from "@/components/forms/city-select";
import { BookingProgress } from "@/components/forms/booking-progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The service dropdown is built from the live services + a catch-all. */
const OTHER = "__other__";
type ServiceOption = { slug: string; title: string };

/**
 * Step 1 of the booking flow: the details form. On submit it saves a draft and
 * hands off to /book/[id]?token=…&step=schedule for the schedule + pay steps.
 *
 * The service list is passed in from the page (fetched from the admin-managed
 * services), so the dropdown always matches what the site actually offers.
 */
export function BookingWizard({
  selectedSlug = "",
  services = [],
}: {
  selectedSlug?: string;
  services?: ServiceOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [place, setPlace] = useState<BirthPlace>(emptyBirthPlace);
  // Preselect the clicked service; otherwise start on "Something else".
  const [serviceValue, setServiceValue] = useState<string>(
    services.some((s) => s.slug === selectedSlug) ? selectedSlug : OTHER,
  );

  const serviceOptions = [
    ...services.map((s) => ({ value: s.slug, label: s.title })),
    { value: OTHER, label: "Something else" },
  ];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const picked = services.find((s) => s.slug === serviceValue);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? "") || undefined,
      // The specific service lives in `service`; sessionType stays a broad tag.
      sessionType: "other" as const,
      service: picked ? picked.title : "",
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      timeOfBirth: String(form.get("timeOfBirth") ?? ""),
      birthPlace: place.place,
      birthLat: place.lat,
      birthLng: place.lng,
      birthTz: place.tz,
      message: String(form.get("message") ?? ""),
    };

    const parsed = createBookingSchema.safeParse(payload);
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
    setBusy(true);
    try {
      const res = await api.bookings.draft({ body: parsed.data });
      if (res.status === 200) {
        router.push(`/book/${res.body.id}?token=${res.body.token}&step=schedule`);
        return;
      }
      const body = res.body as { error?: string } | undefined;
      setErrors({ _: body?.error ?? "Something went wrong. Please try again." });
      setBusy(false);
    } catch {
      setErrors({ _: "We couldn't reach the server. Please try again." });
      setBusy(false);
    }
  }

  return (
    <div>
      <BookingProgress current={1} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-display text-lg font-semibold text-forest">
            About you
          </legend>
          <Field label="What would you like guidance on?" htmlFor="service">
            <Select
              id="service"
              name="service"
              value={serviceValue}
              onValueChange={setServiceValue}
              options={serviceOptions}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name}>
              <input id="name" name="name" autoComplete="name" className={inputClass} placeholder="Your name" />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="We'll reach you on this number">
              <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+91 98765 43210" />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" optional error={errors.email} hint="Optional — for your Kundali and the Calendly invite">
            <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-1 font-display text-lg font-semibold text-forest">
            Birth details
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth}>
              <input id="dateOfBirth" name="dateOfBirth" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </Field>
            <Field label="Time of birth" htmlFor="timeOfBirth" error={errors.timeOfBirth} hint="As exact as you can — the chart depends on it">
              <input id="timeOfBirth" name="timeOfBirth" type="time" defaultValue="12:00" className={inputClass} />
            </Field>
          </div>
          <CitySelect value={place} onChange={setPlace} errors={errors} />
          <Field label="Anything you'd like us to know?" htmlFor="message" optional error={errors.message}>
            <textarea id="message" name="message" className={textareaClass} placeholder="Share the question you're carrying, if you'd like." />
          </Field>
        </fieldset>

        {errors._ && (
          <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            {errors._}
          </p>
        )}

        <button type="submit" disabled={busy} className={cn(buttonVariants({ size: "lg" }), "h-12 self-start px-6 text-sm font-semibold disabled:opacity-70")}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Continue to scheduling
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
