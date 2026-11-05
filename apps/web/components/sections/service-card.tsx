import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@repo/contract";
import { Icon } from "@/components/icon";
import { ServicePrice } from "@/components/price";
import { cn } from "@/lib/utils";

/**
 * Services-page card — a product-showcase card: the whole card links to the
 * service's detail page. A warm "report card" with an image header, title,
 * one-line summary, the Rate struck against the Discounted rate, and a Book
 * call-to-action.
 *
 * Transparent product shots (PNG) are centred and float on the card's gradient;
 * photos that carry their own background (jpg/webp) fill the frame edge to edge.
 */
export function ServiceCard({ service }: { service: Service }) {
  const off =
    service.startingPrice &&
    service.discountedPrice &&
    service.discountedPrice < service.startingPrice
      ? Math.round((1 - service.discountedPrice / service.startingPrice) * 100)
      : 0;
  // Admin-set badge wins; otherwise fall back to the discount.
  const badge = service.badge || (off > 0 ? `${off}% off` : null);
  const contain = /\.png(\?|$)/i.test(service.image);

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-cream to-soft-yellow/50 text-center shadow-sm ring-1 ring-gold/10 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {service.image ? (
          <Image
            src={service.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className={cn(
              "transition-transform duration-500",
              contain
                ? "object-contain p-4 drop-shadow-md group-hover:scale-[1.03]"
                : "object-cover group-hover:scale-105",
            )}
          />
        ) : (
          <span className="grid h-full place-items-center">
            <Icon name={service.icon} className="size-14 text-brand-700/70" />
          </span>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-terracotta px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-white shadow-sm">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-sm font-semibold leading-snug text-forest">
          {service.title}
        </h3>
        {service.summary && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-charcoal/70">
            {service.summary}
          </p>
        )}

        <div className="mt-auto pt-3">
          {(service.startingPrice !== null ||
            service.discountedPrice !== null) && (
            <div className="flex items-center justify-center">
              <ServicePrice
                rate={service.startingPrice}
                discounted={service.discountedPrice}
                currency={service.currency}
                showChip={false}
              />
            </div>
          )}
          <span className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-gold py-2 text-xs font-bold uppercase tracking-wide text-forest shadow-sm transition-colors group-hover:bg-gold/85">
            Book Now
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
