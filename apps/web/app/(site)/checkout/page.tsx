"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShoppingBag } from "lucide-react";
import { checkoutInputSchema } from "@repo/contract";
import { api } from "@/lib/api/client";
import { useCart } from "@/lib/cart/cart-context";
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

export default function CheckoutPage() {
  const { items, subtotal, clear, hydrated } = useCart();
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (hydrated && items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage/40">
          <ShoppingBag className="size-7 text-forest" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-forest">
          Nothing to check out
        </h1>
        <p className="mt-2 text-muted-foreground">Your cart is empty.</p>
        <Link
          href="/products"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-7 h-12 rounded-full px-6 text-sm font-semibold",
          )}
        >
          Explore products
        </Link>
      </section>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      items: items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      shippingAddress: {
        line1: String(form.get("line1") ?? ""),
        line2: String(form.get("line2") ?? ""),
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? ""),
        pincode: String(form.get("pincode") ?? ""),
        country: "India",
      },
    };

    const parsed = checkoutInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const created = await api.checkout.createOrder({ body: parsed.data });

      if (created.status === 422) {
        setErrors(issuesToFieldErrors(created.body.issues));
        setBusy(false);
        return;
      }
      if (created.status !== 200) {
        const body = created.body as { error?: string } | undefined;
        setErrors({ _: body?.error ?? "Could not start checkout. Please try again." });
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
        description: `Order ${session.orderNumber}`,
        prefill: {
          name: session.name,
          email: session.email,
          contact: session.phone,
        },
        theme: { color: "#16235F" },
        modal: {
          // Buyer closed the modal without paying — let them try again.
          ondismiss: () => {
            setErrors({ _: "Payment was not completed. Your cart is saved — you can try again." });
            setBusy(false);
          },
        },
        handler: async (response: RazorpayResponse) => {
          const verified = await api.checkout.verifyPayment({
            body: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          });

          if (verified.status === 200) {
            clear();
            router.push(
              `/orders/${verified.body.orderId}?token=${verified.body.accessToken}`,
            );
            return;
          }

          setErrors({
            _: `Payment went through but we could not confirm it automatically. Please contact us quoting order ${session.orderNumber}.`,
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
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-forest">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Shipping is arranged after your order — we will confirm any charge before
        dispatch.
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]"
      >
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-display text-lg font-semibold text-forest">
              Contact
            </legend>
            <Field label="Full name" htmlFor="co-name" error={errors.name}>
              <input id="co-name" name="name" autoComplete="name" className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="co-email" error={errors.email}>
                <input id="co-email" name="email" type="email" autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Mobile number" htmlFor="co-phone" error={errors.phone}>
                <input id="co-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="+91 98765 43210" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-display text-lg font-semibold text-forest">
              Shipping address
            </legend>
            <Field label="Address" htmlFor="co-line1" error={errors["shippingAddress.line1"]}>
              <input id="co-line1" name="line1" autoComplete="address-line1" className={inputClass} placeholder="House / flat, street" />
            </Field>
            <Field label="Address line 2" htmlFor="co-line2" optional error={errors["shippingAddress.line2"]}>
              <input id="co-line2" name="line2" autoComplete="address-line2" className={inputClass} placeholder="Area, landmark" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" htmlFor="co-city" error={errors["shippingAddress.city"]}>
                <input id="co-city" name="city" autoComplete="address-level2" className={inputClass} />
              </Field>
              <Field label="State" htmlFor="co-state" error={errors["shippingAddress.state"]}>
                <input id="co-state" name="state" autoComplete="address-level1" className={inputClass} />
              </Field>
              <Field label="PIN code" htmlFor="co-pincode" error={errors["shippingAddress.pincode"]}>
                <input id="co-pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" className={inputClass} placeholder="560001" />
              </Field>
            </div>
          </fieldset>

          {errors._ && (
            <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
              {errors._}
            </p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border/60 bg-cream/40 p-6">
          <h2 className="font-display text-lg font-semibold text-forest">
            Order summary
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.slug} className="flex justify-between gap-3">
                <span className="text-charcoal/80">
                  {item.name}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium text-charcoal">
                  {inr(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border/60 pt-4">
            <span className="font-semibold text-forest">Total</span>
            <span className="font-display text-xl font-semibold text-forest">
              {inr(subtotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 w-full rounded-full text-sm font-semibold shadow-sm disabled:opacity-70",
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
                Pay {inr(subtotal)}
              </>
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Secured by Razorpay
          </p>
        </aside>
      </form>
    </section>
  );
}
