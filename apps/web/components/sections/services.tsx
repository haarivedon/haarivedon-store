import { Globe } from "lucide-react";
import {
  serviceCategories,
  serviceCategoryLabels,
  type ServiceCategory,
} from "@repo/contract";
import { ServiceCard } from "@/components/sections/service-card";
import { Section, SectionHeader } from "@/components/section";
import { Mandala } from "@/components/decor";
import { serviceCredentials } from "@/lib/content/site";
import { getServices } from "@/lib/api/content";

/** Fold an unknown/empty category into "other" so every service has a home. */
const normalize = (category: string): ServiceCategory =>
  (serviceCategories as readonly string[]).includes(category)
    ? (category as ServiceCategory)
    : "other";

/**
 * Home services, grouped into the practice's domains. DB-backed and
 * admin-editable, rendered as proper image cards; pricing, images and order
 * stay manageable without a redeploy.
 */
export async function Services() {
  const services = await getServices();

  const groups = serviceCategories
    .map((category) => ({
      category,
      label: serviceCategoryLabels[category],
      items: services.filter((s) => normalize(s.category) === category),
    }))
    .filter((group) => group.items.length > 0);

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
        actionHref="/services"
        actionLabel="View All Services"
      />

      {/* Grouped into domains once services are categorised; until then a single
          card grid keeps the section clean. */}
      {groups.length > 1 ? (
        <div className="mt-10 space-y-12 sm:mt-12">
          {groups.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-8 shrink-0 bg-gold" />
                <h3 className="font-display text-lg font-semibold tracking-tight text-forest">
                  {group.label}
                </h3>
              </div>

              <ul className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {group.items.map((service) => (
                  <li key={service.id}>
                    <ServiceCard service={service} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        groups.length === 1 && (
          <ul className="mt-10 grid gap-3 grid-cols-2 sm:mt-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {groups[0]!.items.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        )
      )}

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
