import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { productFamilies, productFamilyLabels } from "@repo/contract";
import { Section, SectionHeader } from "@/components/section";
import { formatPrice } from "@/lib/format";
import { getProducts } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Energy Tools & Products",
  description:
    "Yantras, gemstones, rudraksha, malas and crystals — chosen with intention, to wear, to place, or to hold.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  // Families render in a fixed order; a family with nothing published in it
  // is skipped entirely rather than showing an empty heading (PLAN.md §13).
  const grouped = productFamilies
    .map((family) => ({
      family,
      label: productFamilyLabels[family],
      items: products.filter((product) => product.family === family),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <Section background="cream">
        <SectionHeader
          eyebrow="Energy Tools"
          title="Sacred tools for spiritual balance"
          description="Each tool is a quiet companion on your journey toward clarity. If you are unsure what suits you, ask us before you buy."
          align="center"
        />
        {grouped.length > 1 && (
          <nav
            aria-label="Product families"
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {grouped.map((group) => (
              <a
                key={group.family}
                href={`#${group.family}`}
                className="rounded-full border border-border/70 bg-ivory/80 px-4 py-2 text-sm font-medium text-charcoal/80 transition-colors hover:border-brand-600 hover:text-forest"
              >
                {group.label}
              </a>
            ))}
          </nav>
        )}
      </Section>

      {grouped.length === 0 ? (
        <Section background="ivory">
          <p className="mx-auto max-w-prose text-center text-muted-foreground">
            Our catalogue is being prepared. Please{" "}
            <Link href="/book" className="font-medium text-forest underline">
              get in touch
            </Link>{" "}
            for what is currently available.
          </p>
        </Section>
      ) : (
        grouped.map((group, index) => (
          <Section
            key={group.family}
            id={group.family}
            background={index % 2 === 0 ? "ivory" : "cream"}
          >
            <SectionHeader eyebrow="Collection" title={group.label} />
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {group.items.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <div className="relative aspect-square bg-sage/30">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                          Photo coming soon
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="font-display text-sm font-semibold text-forest sm:text-base">
                        {product.name}
                      </h3>
                      {product.summary && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                          {product.summary}
                        </p>
                      )}
                      <p className="mt-auto pt-3 text-sm font-semibold text-forest">
                        {formatPrice(product.price, product.currency)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}

      <Section background="sage" containerClassName="py-10 sm:py-12">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-charcoal/70">
          Crystals, gemstones and rudraksha carry traditional and spiritual
          significance. They are not a substitute for medical, legal or
          financial advice.
        </p>
      </Section>
    </>
  );
}
