"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Lock, Minus, Plus } from "lucide-react";
import { reserveEnquirySchema, type EnquiryKind } from "@repo/contract";
import { api } from "@/lib/api/client";
import {
  issuesToFieldErrors,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/forms";
import { Field, inputClass } from "@/components/forms/field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

/**
 * "Reserve & Pay" for a single catalogue item (no cart).
 *
 * Pays through Razorpay, then records a paid enquiry the admin fulfils by hand
 * — there is no order tracking. Collects name/email/phone inline; the server
 * re-prices the item, so the amount here is only for display.
 */
export function BuyNow({
  kind = "product",
  itemSlug,
  itemTitle,
  price,
  currency = "INR",
}: {
  kind?: EnquiryKind;
  itemSlug: string;
  itemTitle: string;
  price: number;
  currency?: string;
}) {
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const total = price * qty;

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-700" />
        <div>
          <p className="font-semibold text-forest">Payment received</p>
          <p className="mt-1 text-sm text-charcoal/75">
            Thank you — we have your reservation for {itemTitle} and will be in
            touch about dispatch. Quote{" "}
            <span className="font-semibold text-charcoal">{done.reference}</span>{" "}
            if you need to reach us.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      kind,
      itemSlug,
      quantity: qty,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      message: "",
    };

    const parsed = reserveEnquirySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const created = await api.enquiries.reserve({ body: parsed.data });

      if (created.status === 422) {
        setErrors(issuesToFieldErrors(created.body.issues));
        setBusy(false);
        return;
      }
      if (created.status !== 200) {
        const body = created.body as { error?: string } | undefined;
        setErrors({ _: body?.error ?? "Could not start payment. Please try again." });
        setBusy(false);
        return;
      }

      const session = created.body;
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        setErrors({ _: "Could not reach the payment gateway. Check your connection and retry." });
        setBusy(false);
        return;
      }

      const instance = new Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        order_id: session.razorpayOrderId,
        name: "Haarivedon",
        description: `${session.itemTitle} · ${session.reference}`,
        prefill: {
          name: session.name,
          email: session.email,
          contact: session.phone,
        },
        theme: { color: "#000142" },
        modal: {
          ondismiss: () => {
            setErrors({ _: "Payment was not completed. You can try again." });
            setBusy(false);
          },
        },
        handler: async (response: RazorpayResponse) => {
          const verified = await api.enquiries.verifyReserve({
            body: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          });

          if (verified.status === 200) {
            setDone({ reference: verified.body.reference });
            return;
          }

          setErrors({
            _: `Payment went through but we could not confirm it automatically. Please contact us quoting ${session.reference}.`,
          });
          setBusy(false);
        },
      });

      instance.open();
    } catch {
      setErrors({ _: "Something went wrong. Please try again." });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-charcoal/70">Quantity</span>
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-10 place-items-center text-charcoal/70 transition-colors hover:text-forest disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-forest" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="grid size-10 place-items-center text-charcoal/70 transition-colors hover:text-forest disabled:opacity-40"
            disabled={qty >= 99}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" htmlFor="bn-name" error={errors.name}>
          <input id="bn-name" name="name" autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Mobile number" htmlFor="bn-phone" error={errors.phone}>
          <input id="bn-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+91 98765 43210" />
        </Field>
      </div>
      <Field label="Email" htmlFor="bn-email" error={errors.email}>
        <input id="bn-email" name="email" type="email" autoComplete="email" className={inputClass} />
      </Field>

      {errors._ && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 w-full rounded-full px-6 text-sm font-semibold shadow-sm disabled:opacity-70 sm:w-auto",
        )}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Reserve &amp; pay {inr(total)}
          </>
        )}
      </button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Secured by Razorpay · dispatch arranged after payment
      </p>
    </form>
  );
}
