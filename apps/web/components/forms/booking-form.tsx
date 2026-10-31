"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createBookingSchema, sessionTypes } from "@repo/contract";
import { api } from "@/lib/api/client";
import { issuesToFieldErrors, toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass, textareaClass } from "@/components/forms/field";

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

/** Razorpay Checkout, loaded on demand so it never ships on other pages. */
type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadRazorpay(): Promise<RazorpayConstructor | null> {
  return new Promise((resolve) => {
    const existing = (window as { Razorpay?: RazorpayConstructor }).Razorpay;
    if (existing) return resolve(existing);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () =>
      resolve((window as { Razorpay?: RazorpayConstructor }).Razorpay ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}
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

export function BookingForm({
  fee,
  selectedService = "",
}: {
  fee: number;
  selectedService?: string;
}) {
  const router = useRouter();
  const [place, setPlace] = useState<BirthPlace>(emptyBirthPlace);
  const [sessionType, setSessionType] =
    useState<(typeof sessionTypes)[number]>("personal-consultation");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? "") || undefined,
      sessionType,
      service: selectedService,
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
      // Open a Razorpay order for the session fee and hold the booking.
      const reserved = await api.bookings.reserve({ body: parsed.data });

      if (reserved.status === 422) {
        setErrors(issuesToFieldErrors(reserved.body.issues));
        setSubmitting(false);
        return;
      }
      if (reserved.status !== 200) {
        const body = reserved.body as { error?: string } | undefined;
        setErrors({ _: body?.error ?? "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }

      const session = reserved.body;
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        setErrors({ _: "Could not reach the payment gateway. Check your connection and retry." });
        setSubmitting(false);
        return;
      }

      const instance = new Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        order_id: session.razorpayOrderId,
        name: "Haarivedon",
        description: `Session fee · ${session.reference}`,
        prefill: {
          name: session.name,
          email: session.email,
          contact: session.phone,
        },
        theme: { color: "#000142" },
        modal: {
          ondismiss: () => {
            setErrors({ _: "Payment was not completed. You can try again." });
            setSubmitting(false);
          },
        },
        handler: async (response: RazorpayResponse) => {
          const verified = await api.bookings.verifyReserve({
            body: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          });

          if (verified.status === 200) {
            // Go to the shareable, bookmarkable confirmation page.
            router.push(
              `/book/${verified.body.id}?token=${verified.body.kundaliToken}`,
            );
            return;
          }
          setErrors({
            _: `Payment went through but we could not confirm it automatically. Please contact us quoting ${session.reference}.`,
          });
          setSubmitting(false);
        },
      });

      instance.open();
    } catch {
      setErrors({
        _: "We couldn't reach the server. Please check your connection and try again.",
      });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {selectedService && (
        <p className="rounded-2xl border border-brand-600/30 bg-brand-600/5 px-4 py-3 text-sm text-charcoal/80">
          You&rsquo;re booking{" "}
          <span className="font-semibold text-forest">{selectedService}</span>.
        </p>
      )}
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
            Processing…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Pay {inr(fee)} &amp; book
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
