import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import type { FulfillmentStatus } from "@repo/contract";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

/** The four fulfillment milestones the buyer sees, in order. */
const STEPS: { key: FulfillmentStatus; label: string; icon: typeof Package }[] = [
  { key: "pending", label: "Confirmed", icon: PackageCheck },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) notFound();

  const response = await api.checkout.getOrder({
    params: { id },
    query: { token },
  });
  if (response.status !== 200) notFound();

  const order = response.body;
  const cancelled = order.fulfillmentStatus === "cancelled";
  const currentStep = STEPS.findIndex((s) => s.key === order.fulfillmentStatus);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
        Order {order.orderNumber}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-forest">
        Thank you, {order.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {order.paymentStatus === "paid"
          ? "Your payment is confirmed. Here is where your order stands."
          : order.paymentStatus === "refunded"
            ? "This order has been refunded."
            : "We are confirming your payment."}
      </p>

      {/* Refund / cancellation banner takes over the tracker. */}
      {cancelled || order.paymentStatus === "refunded" ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-5">
          <XCircle className="mt-0.5 size-5 shrink-0 text-terracotta" />
          <div>
            <p className="font-semibold text-terracotta">
              {order.paymentStatus === "refunded"
                ? "Order refunded"
                : "Order cancelled"}
            </p>
            <p className="mt-1 text-sm text-charcoal/75">
              If you have any questions, reply to your confirmation or contact us
              quoting {order.orderNumber}.
            </p>
          </div>
        </div>
      ) : (
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {STEPS.map((step, index) => {
            const done = index <= currentStep;
            const Icon = done ? step.icon : Circle;
            return (
              <li key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "grid size-11 place-items-center rounded-full border-2 transition-colors",
                    done
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-border bg-white text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    done ? "text-forest" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.fulfillmentStatus === "shipped" && order.trackingNumber && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-cream/40 p-5 text-sm">
          <p className="font-medium text-forest">On its way</p>
          <p className="mt-1 text-charcoal/75">
            {order.courier ? `${order.courier} · ` : ""}Tracking{" "}
            <span className="font-semibold text-charcoal">
              {order.trackingNumber}
            </span>
          </p>
        </div>
      )}

      {/* Items */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-forest">Items</h2>
        <ul className="mt-4 divide-y divide-border/60 border-y border-border/60 text-sm">
          {order.items.map((item) => (
            <li key={item.slug} className="flex justify-between gap-3 py-3">
              <span className="text-charcoal/80">
                {item.name}
                <span className="text-muted-foreground"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-charcoal">
                {inr(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-charcoal">{inr(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="text-charcoal">
              {order.shippingFee === 0 ? "Free" : inr(order.shippingFee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-2 font-semibold text-forest">
            <dt>Total</dt>
            <dd>{inr(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Shipping to */}
      <div className="mt-8 rounded-2xl border border-border/60 bg-white p-5 text-sm">
        <h2 className="font-medium text-forest">Shipping to</h2>
        <address className="mt-2 not-italic text-charcoal/75">
          {order.name}
          <br />
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.pincode}
          <br />
          {order.shippingAddress.country}
        </address>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Keep this page bookmarked to check your order anytime.{" "}
        <Link href="/products" className="font-medium text-forest underline">
          Continue shopping
        </Link>
      </p>
    </section>
  );
}
