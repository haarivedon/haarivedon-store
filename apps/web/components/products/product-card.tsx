import Image from "next/image";
import Link from "next/link";
import type { Product } from "@repo/contract";
import { Price } from "@/components/price";

/**
 * One product in a grid — used by the catalogue listing and the "more like
 * this" strip on a detail page, so both read the same way.
 *
 * An unpriced item deep-links straight to its enquiry form; a priced one opens
 * the detail page to buy. `compact` drops the summary for tighter strips.
 */
export function ProductCard({
  product,
  sizes = "(max-width: 640px) 50vw, 25vw",
  compact = false,
}: {
  product: Product;
  sizes?: string;
  compact?: boolean;
}) {
  const href =
    product.price === null
      ? `/products/${product.slug}#enquire`
      : `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative aspect-square bg-sage/30">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-muted-foreground">
            Photo coming soon
          </span>
        )}
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-ivory/95 px-2 py-0.5 text-[0.65rem] font-semibold text-terracotta">
            Enquire
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-display text-sm font-semibold leading-snug text-forest sm:text-base">
          {product.name}
        </h3>
        {!compact && product.summary && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {product.summary}
          </p>
        )}
        <p className="mt-auto pt-3">
          <Price value={product.price} currency={product.currency} />
        </p>
      </div>
    </Link>
  );
}
