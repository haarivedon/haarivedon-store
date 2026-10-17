"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

/**
 * Cart link with a live item-count badge (store CR). Lives in the site header.
 * `tone` matches the two header tiers: the dark brand bar and the light nav.
 */
export function CartButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart${count > 0 ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className={cn(
        "relative grid size-10 place-items-center rounded-full transition-colors",
        tone === "light"
          ? "text-ivory/80 hover:text-gold"
          : "text-charcoal/70 hover:text-forest",
      )}
    >
      <ShoppingCart className="size-5" />
      {hydrated && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[0.65rem] font-bold text-forest">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
