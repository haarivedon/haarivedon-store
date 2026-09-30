import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/section";
import { MediaCard } from "@/components/cards";
import { cn } from "@/lib/utils";
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

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <MediaCard
            key={product.name}
            image={product.image}
            alt={product.alt}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 300px"
          >
            <h3 className="font-display text-sm font-semibold text-forest sm:text-lg">
              {product.name}
            </h3>
            <p className="mt-1 flex-1 text-sm font-semibold text-brand-700 sm:text-base">
              {inr.format(product.price)}
            </p>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-3 h-10 w-full gap-1.5 px-2 text-xs font-semibold sm:mt-4 sm:h-11 sm:text-sm",
              )}
            >
              <ShoppingBag className="size-3.5 sm:size-4" />
              Add to Cart
            </Link>
          </MediaCard>
        ))}
      </div>
    </Section>
  );
}
