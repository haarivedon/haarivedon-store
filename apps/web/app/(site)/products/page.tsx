import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { productFamilies, productFamilyLabels } from "@repo/contract";
import { Section } from "@/components/section";
import { PageIntro } from "@/components/page-intro";
import { Price } from "@/components/price";
import { getProducts } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Energy Tools & Products",
  description:
    "Yantras, gemstones, rudraksha, malas and crystals — what each one is, and what it is traditionally used for.",
};

/**
 * A one-line explanation per family. "Rudraksha" and "Yantra" mean nothing to
 * a first-time visitor, and a grid of unexplained names is the main reason
 * this page was hard to read.
 */
const familyIntros: Record<(typeof productFamilies)[number], string> = {
  yantra:
    "Engraved geometric plates, each associated with a deity and kept in the home or workplace.",
  gemstone:
    "Precious and semi-precious stones, each traditionally linked to a ruling planet and worn set in a ring or pendant.",
  rudraksha:
    "Seeds of the rudraksha tree, classified by the number of natural faces (mukhi) they carry. Each mukhi is associated with a deity and planet.",
  mala: "Strings of beads used for counting mantras, usually 108 beads, made from seeds, wood or crystal.",
  crystal:
    "Natural stones kept as clusters, trees or tumbled pieces, chosen for the quality traditionally associated with each.",
  idol: "Cast brass figures of deities, for a home altar or workspace.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  // Families render in a fixed order; a family with nothing published in it
  // is skipped entirely rather than showing an empty heading (PLAN.md §13).
  const grouped = productFamilies
    .map((family) => ({
      family,
      label: productFamilyLabels[family],
      intro: familyIntros[family],
      items: products.filter((product) => product.family === family),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <PageIntro
        eyebrow="Energy Tools"
        title="Sacred tools, explained"
        lead="Tools to wear, to place, or to hold. Each listing says what the object is and what it is traditionally used for, so you can choose knowingly rather than by name alone."
        help={{
          text: "Unsure what suits you?",
          linkLabel: "Ask before you buy",
          href: "/book",
        }}
      />

      {grouped.length > 1 && (
        <Section background="ivory" containerClassName="py-6 sm:py-8">
          <nav aria-label="Product families">
            <ul className="flex flex-wrap justify-center gap-2">
              {grouped.map((group) => (
                <li key={group.family}>
                  <a
                    href={`#${group.family}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-charcoal/80 transition-colors hover:border-brand-600 hover:text-forest"
                  >
                    {group.label}
                    <span className="text-xs text-muted-foreground">
                      {group.items.length}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Section>
      )}

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
            background={index % 2 === 0 ? "cream" : "ivory"}
          >
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-semibold text-forest">
                {group.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
                {group.intro}
              </p>
            </div>

            <ul className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
                      {product.summary && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {product.summary}
                        </p>
                      )}
                      <p className="mt-auto pt-3">
                        <Price
                          value={product.price}
                          currency={product.currency}
                        />
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
          These objects carry traditional and spiritual significance. Nothing
          here is a substitute for medical, legal or financial advice, and no
          outcome is promised.
        </p>
      </Section>
    </>
  );
}
