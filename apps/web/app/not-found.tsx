import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Branded 404 (docs/PLAN.md §13).
 *
 * Reached by an unpublished or deleted record as well as a mistyped URL, so
 * it offers the parent listings rather than only a link home — the thing
 * someone was looking for usually has a neighbour.
 */
export default function NotFound() {
  const destinations = [
    { href: "/courses", label: "Courses" },
    { href: "/products", label: "Energy tools" },
    { href: "/services", label: "Services" },
    { href: "/predictions", label: "Predictions" },
  ];

  return (
    <main className="flex min-h-[70vh] items-center bg-ivory px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-display text-5xl font-semibold text-forest/30">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-forest sm:text-3xl">
          We couldn&rsquo;t find that page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          It may have moved, or it may not be published yet. Here is where
          most people are heading:
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {destinations.map((destination) => (
            <li key={destination.href}>
              <Link
                href={destination.href}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-charcoal/85 transition-colors hover:border-brand-600 hover:text-forest"
              >
                {destination.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
          Book a session
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </main>
  );
}
