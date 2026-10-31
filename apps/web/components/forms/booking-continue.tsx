"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Lock } from "lucide-react";
import type { PublicBooking } from "@repo/contract";
import { api } from "@/lib/api/client";
import { BookingProgress } from "@/components/forms/booking-progress";
import { CalendlyScheduler } from "@/components/forms/calendly-scheduler";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

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
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () =>
      resolve((window as { Razorpay?: RazorpayConstructor }).Razorpay ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

/**
 * Steps 4-5 of the booking wizard, driven by server state: schedule (Calendly)
 * then pay (Razorpay). Which step shows is decided by whether the booking has a
 * Calendly slot yet — so a reload always resumes on the right step.
 */
export function BookingContinue({
  booking,
  token,
  fee,
  calendlyUrl,
  step,
}: {
  booking: PublicBooking;
  token: string;
  fee: number;
  calendlyUrl: string;
  step: "schedule" | "pay";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/book/${booking.id}?token=${token}`;
  const goPay = () => router.push(`${base}&step=pay`);
  const goSchedule = () => router.push(`${base}&step=schedule`);

  async function onScheduled(ev: { eventUri: string; inviteeUri: string }) {
    if (!ev.eventUri) return;
    try {
      await api.bookings.schedule({
        params: { id: booking.id },
        body: {
          token,
          calendlyEventUri: ev.eventUri,
          calendlyInviteeUri: ev.inviteeUri,
        },
      });
    } catch {
      // Non-fatal: the slot is booked in Calendly regardless; move on to pay.
    }
    goPay();
  }

  async function pay() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const created = await api.bookings.pay({
        params: { id: booking.id },
        body: { token },
      });
      if (created.status !== 200) {
        const b = created.body as { error?: string } | undefined;
        setError(b?.error ?? "Could not start payment. Please try again.");
        setBusy(false);
        return;
      }
      const session = created.body;
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        setError("Could not reach the payment gateway. Please retry.");
        setBusy(false);
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
            setError("Payment was not completed. You can try again.");
            setBusy(false);
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
            // Drop the step param; the paid state renders the confirmation.
            router.replace(base);
            router.refresh();
            return;
          }
          setError(
            `Payment went through but we could not confirm it. Please contact us quoting ${session.reference}.`,
          );
          setBusy(false);
        },
      });
      instance.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <BookingProgress current={step === "schedule" ? 2 : 3} />

      {step === "schedule" ? (
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-forest">
            <CalendarClock className="size-5 text-brand-700" />
            Pick your session time
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a slot below. Your booking is{" "}
            <strong className="font-medium text-charcoal">
              not confirmed until payment
            </strong>{" "}
            on the next step.
          </p>
          <div className="mt-5">
            {calendlyUrl ? (
              <CalendlyScheduler
                url={calendlyUrl}
                name={booking.name}
                onScheduled={onScheduled}
              />
            ) : (
              <div className="rounded-2xl border border-border/60 bg-cream/40 p-5 text-sm text-charcoal/80">
                <p>Scheduling is being set up. You can pay now and we&rsquo;ll confirm a time with you.</p>
                <button
                  type="button"
                  onClick={goPay}
                  className={cn(buttonVariants({ size: "sm" }), "mt-4 h-10")}
                >
                  Continue to payment
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <h2 className="font-display text-xl font-semibold text-forest">
            Review &amp; pay
          </h2>
          <dl className="mt-5 space-y-2 rounded-2xl border border-border/60 bg-cream/30 p-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-charcoal">{booking.name}</dd>
            </div>
            {booking.service && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service</dt>
                <dd className="font-medium text-charcoal">{booking.service}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Slot</dt>
              <dd className="font-medium text-charcoal">
                {booking.scheduled ? "Picked — see your email" : "Not scheduled"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2">
              <dt className="font-semibold text-forest">Session fee</dt>
              <dd className="font-display text-lg font-semibold text-forest">
                {inr(fee)}
              </dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className={cn(buttonVariants({ size: "lg" }), "mt-6 h-12 w-full rounded-full text-sm font-semibold disabled:opacity-70")}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Pay {inr(fee)} &amp; confirm
              </>
            )}
          </button>
          {!booking.scheduled && (
            <button
              type="button"
              onClick={goSchedule}
              className="mt-3 w-full text-center text-sm font-medium text-charcoal/60 hover:text-forest"
            >
              ← Back to scheduling
            </button>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Secured by Razorpay
          </p>
        </div>
      )}
    </div>
  );
}
