import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { productFamilyLabels } from "@repo/contract";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { attributeRows } from "@/lib/format";
import { Price } from "@/components/price";
import { getProduct, getProducts } from "@/lib/api/content";
import { ProductJsonLd } from "@/components/seo/json-ld";

/**
 * Prerender the published catalogue at build time. `dynamicParams` stays on
 * (the default), so a product published later still renders on demand and
 * then sticks to the 5-minute revalidate like the listing pages.
 */
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description:
      product.summary ||
      `${product.name} — ${productFamilyLabels[product.family]} from Haarivedon.`,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const specs = attributeRows(
    product.attributes as Record<string, unknown> | null,
  );
  const related = (await getProducts({ family: product.family, perPage: 5 }))
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <ProductJsonLd product={product} />
      <Section background="ivory" containerClassName="py-8 sm:py-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition-colors hover:text-forest"
        >
          <ArrowLeft className="size-4" />
          All energy tools
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-sage/30">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                Photo coming soon
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              {productFamilyLabels[product.family]}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              {product.name}
            </h1>
            {product.summary && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {product.summary}
              </p>
            )}

            <p className="mt-6">
              <Price
                value={product.price}
                currency={product.currency}
                size="lg"
                asButton={false}
              />
            </p>
            {!product.inStock && (
              <p className="mt-1 text-sm text-terracotta">
                Currently unavailable — enquire for the next batch.
              </p>
            )}

            {/*
              Display-only catalogue (SRS §3.5): no cart, no checkout. The CTA
              routes the enquiry to the booking form.
            */}
            <Link
              href="/book"
              className={cn(buttonVariants({ size: "lg" }), "mt-6")}
            >
              Enquire about this
              <ArrowRight className="size-4" />
            </Link>

            {product.description && (
              <div className="mt-8 space-y-3 text-sm leading-relaxed text-charcoal/80">
                {product.description.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            )}

            {specs.length > 0 && (
              <dl className="mt-8 divide-y divide-border/60 border-y border-border/60 text-sm">
                {specs.map((row) => (
                  <div
                    key={row.label}
                    className="flex gap-4 py-2.5 sm:justify-between"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium text-charcoal">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-6 text-xs leading-relaxed text-charcoal/60">
              Carries traditional and spiritual significance; not a substitute
              for medical, legal or financial advice.
            </p>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section background="cream">
          <h2 className="font-display text-xl font-semibold text-forest">
            More from {productFamilyLabels[product.family]}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/products/${item.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-sage/30">
                    {item.images[0] && (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-display text-sm font-semibold text-forest">
                      {item.name}
                    </h3>
                    <p className="mt-1">
                      <Price value={item.price} currency={item.currency} />
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
