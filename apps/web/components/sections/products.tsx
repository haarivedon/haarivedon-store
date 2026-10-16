import Link from "next/link";
import { Section, SectionHeader } from "@/components/section";
import { MediaCard } from "@/components/cards";
import { Price } from "@/components/price";
import { getProducts } from "@/lib/api/content";

/**
 * Home-page product strip.
 *
 * Reads featured published products from the API (store CR) rather than a
 * hardcoded array, so the client controls what appears here from the admin.
 * Falls back to the newest published products if nothing is flagged featured,
 * and renders nothing when the catalogue is empty — an absent section beats an
 * empty one (docs/PLAN.md §13).
 */
export async function Products() {
  const featured = await getProducts({ featured: "true", perPage: 4 });
  const items = featured.length
    ? featured.slice(0, 4)
    : (await getProducts({ perPage: 4 })).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <Section id="products" background="ivory">
      <SectionHeader
        eyebrow="Our Products"
        title="Sacred Objects for Your Journey"
        actionHref="/products"
        actionLabel="View All Products"
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
        {items.map((product) => (
          <MediaCard
            key={product.id}
            image={product.images[0] ?? ""}
            alt={product.name}
            aspect="square"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 300px"
          >
            <h3 className="font-display text-sm font-semibold text-forest sm:text-lg">
              <Link
                href={`/products/${product.slug}`}
                className="transition-colors hover:text-brand-700"
              >
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 flex-1">
              <Price value={product.price} currency={product.currency} />
            </p>

            <Link
              href={`/products/${product.slug}`}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-none border border-forest/30 px-2 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-ivory sm:mt-4 sm:h-11 sm:text-sm"
            >
              View details
            </Link>
          </MediaCard>
        ))}
      </div>
    </Section>
  );
}
