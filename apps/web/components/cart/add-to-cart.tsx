"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

/**
 * Buy controls for a priced, in-stock product (store CR). Rendered only when
 * the product is actually buyable — enquiry-only items keep the enquiry form.
 */
export function AddToCart({
  slug,
  name,
  price,
  image,
}: {
  slug: string;
  name: string;
  price: number;
  image: string;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const line = { slug, name, price, image };

  function addToCart() {
    add(line, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    add(line, quantity);
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex h-12 items-stretch rounded-full border border-border bg-white">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="grid w-11 place-items-center text-charcoal/70 hover:text-forest disabled:opacity-40"
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span
          className="grid w-10 place-items-center text-sm font-semibold text-forest"
          aria-live="polite"
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          className="grid w-11 place-items-center text-charcoal/70 hover:text-forest disabled:opacity-40"
          disabled={quantity >= 99}
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 gap-3">
        <button
          type="button"
          onClick={addToCart}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 flex-1 rounded-full px-5 text-sm font-semibold",
          )}
        >
          {added ? (
            <>
              <Check className="size-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              Add to cart
            </>
          )}
        </button>
        <button
          type="button"
          onClick={buyNow}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 flex-1 rounded-full px-5 text-sm font-semibold shadow-sm",
          )}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
