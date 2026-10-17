"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CartPage() {
  const { items, subtotal, setQuantity, remove, hydrated } = useCart();

  if (hydrated && items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage/40">
          <ShoppingBag className="size-7 text-forest" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-forest">
          Your cart is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse the energy tools and add something you would like to bring home.
        </p>
        <Link
          href="/products"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-7 h-12 rounded-full px-6 text-sm font-semibold",
          )}
        >
          Explore products
          <ArrowRight className="size-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-forest">
        Your cart
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {items.map((item) => (
            <li key={item.slug} className="flex gap-4 py-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sage/30">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-display text-base font-semibold text-forest hover:underline"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {inr(item.price)} each
                </p>

                <div className="mt-auto flex items-center gap-4 pt-2">
                  <div className="inline-flex items-stretch rounded-full border border-border bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      className="grid w-9 place-items-center text-charcoal/70 hover:text-forest"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="grid w-9 place-items-center text-sm font-semibold text-forest">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      className="grid w-9 place-items-center text-charcoal/70 hover:text-forest"
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 transition-colors hover:text-terracotta"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-semibold text-forest">
                {inr(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border/60 bg-cream/40 p-6">
          <h2 className="font-display text-lg font-semibold text-forest">
            Summary
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-charcoal">{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium text-charcoal">
                Calculated after order
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border/60 pt-4">
            <span className="font-semibold text-forest">Total</span>
            <span className="font-display text-xl font-semibold text-forest">
              {inr(subtotal)}
            </span>
          </div>

          <Link
            href="/checkout"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 w-full rounded-full text-sm font-semibold shadow-sm",
            )}
          >
            Proceed to checkout
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm text-charcoal/70 hover:text-forest"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
