import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Package, ShieldCheck, Sparkles } from "lucide-react";
import { productFamilyLabels } from "@repo/contract";
import { Section } from "@/components/section";
import { BuyNow } from "@/components/products/buy-now";
import { EnquiryForm } from "@/components/enquiry-form";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductCard } from "@/components/products/product-card";
import { attributeRows } from "@/lib/format";
import { Price } from "@/components/price";
import { getAllProducts, getProduct, getProducts } from "@/lib/api/content";
import { ProductJsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Prerender the published catalogue at build time. `dynamicParams` stays on
 * (the default), so a product published later still renders on demand and
 * then sticks to the 5-minute revalidate like the listing pages.
 */
export async function generateStaticParams() {
  const products = await getAllProducts();
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

/** A calm status line next to the price, so stock is never a surprise later. */
function StockPill({ inStock, priced }: { inStock: boolean; priced: boolean }) {
  if (inStock && priced) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/12 px-3 py-1 text-xs font-semibold text-brand-700">
        <span aria-hidden className="size-1.5 rounded-full bg-brand-600" />
        In stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/12 px-3 py-1 text-xs font-semibold text-terracotta">
      <span aria-hidden className="size-1.5 rounded-full bg-terracotta" />
      Enquire for availability
    </span>
  );
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

  const familyLabel = productFamilyLabels[product.family];
  const itemNoun = familyLabel.toLowerCase().replace(/s$/, "");

  // Buyable = priced and in stock. Everything else routes to the enquiry form.
  const buyable = product.price !== null && product.inStock;

  const assurances = buyable
    ? [
        {
          icon: ShieldCheck,
          title: "Secure checkout",
          note: "Payment protected by Razorpay.",
        },
        {
          icon: Package,
          title: "Packed with care",
          note: "Wrapped to arrive safely.",
        },
        {
          icon: MessageCircle,
          title: "Guidance on hand",
          note: "Ask us anything about it.",
        },
      ]
    : [
        {
          icon: Sparkles,
          title: "Chosen with care",
          note: "Sourced for authenticity.",
        },
        {
          icon: MessageCircle,
          title: "We reply personally",
          note: "A real answer, not a bot.",
        },
      ];

  return (
    <>
      <ProductJsonLd product={product} />

      <Section background="ivory" containerClassName="py-8 sm:py-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-charcoal/60">
            <li>
              <Link href="/products" className="transition-colors hover:text-forest">
                Energy tools
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              /
            </li>
            <li>
              <Link
                href={`/products#${product.family}`}
                className="transition-colors hover:text-forest"
              >
                {familyLabel}
              </Link>
            </li>
            <li aria-hidden className="text-charcoal/30">
              /
            </li>
            <li className="max-w-[12rem] truncate font-medium text-charcoal/80">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery
            images={product.images}
            name={product.name}
            overlay={
              !product.inStock ? (
                <span className="absolute left-4 top-4 rounded-full bg-ivory/95 px-3 py-1 text-xs font-semibold text-terracotta shadow-sm">
                  Enquire for availability
                </span>
              ) : null
            }
          />

          <div className="flex flex-col">
            <Link
              href={`/products#${product.family}`}
              className="text-xs font-semibold uppercase tracking-widest text-brand-700 transition-colors hover:text-forest"
            >
              {familyLabel}
            </Link>
            <h1 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              {product.name}
            </h1>
            {product.summary && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {product.summary}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Price
                value={product.price}
                currency={product.currency}
                size="lg"
                asButton={false}
              />
              <StockPill inStock={product.inStock} priced={product.price !== null} />
            </div>

            {buyable ? (
              <div className="mt-6">
                <BuyNow
                  kind="product"
                  itemSlug={product.slug}
                  itemTitle={product.name}
                  price={product.price!}
                  currency={product.currency}
                />
              </div>
            ) : (
              <a
                href="#enquire"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-6 h-12 w-full rounded-full px-6 text-sm font-semibold sm:w-auto",
                )}
              >
                <MessageCircle className="size-4" />
                Ask about this {itemNoun}
              </a>
            )}

            <ul className="mt-7 grid gap-x-4 gap-y-4 border-t border-border/60 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {assurances.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <item.icon
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-brand-700"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-forest">
                      {item.title}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {item.note}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs leading-relaxed text-charcoal/55">
              Carries traditional and spiritual significance; not a substitute
              for medical, legal or financial advice.
            </p>
          </div>
        </div>
      </Section>

      {(product.description || specs.length > 0) && (
        <Section background="cream" containerClassName="py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            {product.description && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest">
                  About this {itemNoun}
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/80 sm:text-base">
                  {product.description.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {specs.length > 0 && (
              <div className={product.description ? undefined : "max-w-lg"}>
                <h2 className="font-display text-xl font-semibold text-forest">
                  Details
                </h2>
                <dl className="mt-4 divide-y divide-border/60 border-y border-border/60 text-sm">
                  {specs.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between gap-4 py-3"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium text-charcoal">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </Section>
      )}

      {/*
        The action for this page. For a buyable item it is a secondary "any
        questions?" note below the buy box; for a display-only item (SRS §3.5)
        it is the primary way to act, so the buy box links down to it.
      */}
      <Section id="enquire" background="ivory" containerClassName="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-forest">
            {buyable
              ? "Questions before you buy?"
              : `Enquire about this ${itemNoun}`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {buyable ? (
              <>
                Sizing, sourcing, or which one suits you — ask and we will reply
                personally about{" "}
                <strong className="font-medium text-charcoal">
                  {product.name}
                </strong>
                .
              </>
            ) : (
              <>
                Price, availability, or which one suits you — leave your details
                and we will come back to you about{" "}
                <strong className="font-medium text-charcoal">
                  {product.name}
                </strong>
                .
              </>
            )}
          </p>
          <div className="mt-5">
            <EnquiryForm
              kind="product"
              itemSlug={product.slug}
              itemTitle={product.name}
              submitLabel="Send my question"
            />
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section background="cream">
          <h2 className="font-display text-xl font-semibold text-forest">
            More from {familyLabel}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} compact />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
