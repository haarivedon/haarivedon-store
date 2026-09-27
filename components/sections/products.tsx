import { Section, SectionHeader } from "@/components/section";
import { MediaCard, CardCta } from "@/components/cards";
import { products } from "@/lib/content/site";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function Products() {
  return (
    <Section id="products" background="ivory">
      <SectionHeader
        eyebrow="Our Products"
        title="Sacred Objects for Your Journey"
        actionHref="/products"
        actionLabel="View All Products"
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <MediaCard
            key={product.name}
            href="/products"
            image={product.image}
            alt={product.alt}
            ariaLabel={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          >
            <h3 className="font-display text-lg font-semibold text-forest">
              {product.name}
            </h3>
            <p className="mt-1 text-base font-semibold text-brand-700">
              {inr.format(product.price)}
            </p>
            <span className="mt-4">
              <CardCta label="Add to Cart" />
            </span>
          </MediaCard>
        ))}
      </div>
    </Section>
  );
}
