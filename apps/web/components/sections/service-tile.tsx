import Image from "next/image";
import Link from "next/link";
import type { Service } from "@repo/contract";
import { Icon } from "@/components/icon";

/**
 * Home-page service tile — image-forward with the title over a dark gradient,
 * and a small badge (featured or discount) in the corner. Clicking opens the
 * service on the full Services page.
 */
export function ServiceTile({ service }: { service: Service }) {
  const off =
    service.startingPrice &&
    service.discountedPrice &&
    service.discountedPrice < service.startingPrice
      ? Math.round((1 - service.discountedPrice / service.startingPrice) * 100)
      : 0;
  // Admin-set badge wins; otherwise fall back to the discount.
  const badge = service.badge || (off > 0 ? `${off}% off` : null);

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-sage/60 to-forest/20"
    >
      {service.image ? (
        <Image
          src={service.image}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="grid h-full place-items-center">
          <Icon name={service.icon} className="size-16 text-forest/40" />
        </span>
      )}

      {/* Dark gradient so the title stays legible over any image. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/35 to-transparent"
      />

      {badge && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-terracotta px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-white shadow-sm">
          {badge}
        </span>
      )}

      <h3 className="absolute inset-x-0 bottom-0 p-3 text-center font-display text-sm font-semibold leading-tight text-white">
        {service.title}
      </h3>
    </Link>
  );
}
