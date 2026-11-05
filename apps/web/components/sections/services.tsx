import Link from "next/link";
import { Globe } from "lucide-react";
import { ServiceTile } from "@/components/sections/service-tile";
import { Section, SectionHeader } from "@/components/section";
import { Mandala } from "@/components/decor";
import { buttonVariants } from "@/components/ui/button";
import { serviceCredentials } from "@/lib/content/site";
import { getServices } from "@/lib/api/content";
import { cn } from "@/lib/utils";

/** The home is a teaser — a flat preview grid. The full, categorised list lives
 *  on the Services page, so this never grows unbounded. */
const HOME_LIMIT = 8;

export async function Services() {
  const services = await getServices();
  // Admin picks what shows here via "Show on home page"; until any are picked,
  // fall back to the first few so the section is never empty.
  const picked = services.filter((s) => s.showOnHome);
  const items = (picked.length ? picked : services).slice(0, HOME_LIMIT);

  return (
    <Section id="services" background="white" className="overflow-hidden">
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-24 size-80 text-forest/[0.06]"
      />

      <SectionHeader
        eyebrow="Our Services"
        title="Healing, Guidance &amp; Transformation"
        description="Ways to work together, across the domains of the practice. Every session is one-to-one and shaped around what you bring."
      />

      {items.length > 0 && (
        <ul className="mt-10 grid gap-4 grid-cols-2 sm:mt-12 lg:grid-cols-4">
          {items.map((service) => (
            <li key={service.id}>
              <ServiceTile service={service} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href="/services"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
        >
          View all services
        </Link>
      </div>

      {/* Credentials strip — mirrors the brand asset. */}
      <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/60 pt-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm font-medium text-forest">
          {serviceCredentials.map((credential, index) => (
            <li key={credential} className="flex items-center gap-3">
              {index > 0 && (
                <span aria-hidden className="text-gold">
                  ✦
                </span>
              )}
              {credential}
            </li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-forest">
          <Globe className="size-3.5" />
          Online Sessions Worldwide
        </span>
      </div>
    </Section>
  );
}
