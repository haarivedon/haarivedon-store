import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@repo/contract";
import { Icon } from "@/components/icon";
import { ServicePrice } from "@/components/price";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A service as a compact, square-cornered image card. Intentionally minimal —
 * short image, title and price only — so a long list stays scannable without
 * much scrolling. The image header falls back to a branded icon panel, and a
 * discount sets a gold "% off" tag over the image.
 */
export function ServiceCard({ service }: { service: Service }) {
  const off =
    service.startingPrice &&
    service.discountedPrice &&
    service.discountedPrice < service.startingPrice
      ? Math.round((1 - service.discountedPrice / service.startingPrice) * 100)
      : 0;

  return (
    <article
      id={service.slug}
      className="group flex h-full scroll-mt-28 flex-col border border-sage/80 bg-cream transition-all hover:border-brand-600 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-sage/60 to-cream">
        {service.image ? (
          <Image
            src={service.image}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full place-items-center">
            <Icon name={service.icon} className="size-8 text-brand-700/70" />
          </span>
        )}
        {off > 0 && (
          <span className="absolute left-0 top-0 bg-gold px-1.5 py-0.5 text-[0.65rem] font-semibold text-forest">
            {off}% off
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <h3 className="line-clamp-2 font-display text-[0.8rem] font-semibold leading-snug text-forest">
          {service.title}
        </h3>

        <div className="mt-auto space-y-2">
          <ServicePrice
            rate={service.startingPrice}
            discounted={service.discountedPrice}
            currency={service.currency}
            showChip={false}
          />
          <Link
            href={`/book?service=${encodeURIComponent(service.slug)}`}
            aria-label={`Book ${service.title}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-8 w-full justify-center rounded-none text-xs",
            )}
          >
            Book
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
