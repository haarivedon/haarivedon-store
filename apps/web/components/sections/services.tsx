import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";
import { Icon } from "@/components/icon";
import { Section, SectionHeader } from "@/components/section";
import { Mandala } from "@/components/decor";
import { services, serviceCredentials } from "@/lib/content/site";

/**
 * Home services, grouped into the practice's three domains rather than a flat
 * tile grid — the structure itself tells you the shape of the work. The
 * `services` array is authored in these three ordered groups of four, so a
 * slice keeps the content file as the single source of order and copy.
 */
const pillars = [
  { name: "Coaching & Therapy", items: services.slice(0, 4) },
  { name: "Readings & Prediction", items: services.slice(4, 8) },
  { name: "Energy Healing", items: services.slice(8, 12) },
] as const;

export function Services() {
  return (
    <Section id="services" background="cream" className="overflow-hidden">
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-24 size-80 text-forest/[0.06]"
      />

      <SectionHeader
        eyebrow="Our Services"
        title="Healing, Guidance &amp; Transformation"
        description="Twelve ways to work together, across three domains of the practice. Every session is one-to-one and shaped around what you bring."
        actionHref="/services"
        actionLabel="View All Services"
      />

      <div className="mt-10 grid gap-x-10 gap-y-12 sm:mt-12 lg:grid-cols-3 lg:gap-x-0 lg:divide-x lg:divide-gold/30">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="lg:px-9 lg:first:pl-0 lg:last:pr-0">
            {/* Domain heading — a short gold rule marks each pillar. */}
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 shrink-0 bg-gold" />
              <h3 className="font-display text-lg font-semibold tracking-tight text-forest">
                {pillar.name}
              </h3>
            </div>

            <ul className="mt-5 divide-y divide-border/60 border-t border-border/60">
              {pillar.items.map((service) => (
                <li key={service.title}>
                  <Link
                    href={service.href}
                    className="group flex items-start gap-3.5 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-sage/50 text-brand-700 transition-colors group-hover:bg-gold group-hover:text-forest">
                      <Icon name={service.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 font-display text-base font-semibold text-forest transition-colors group-hover:text-brand-700">
                        {service.title}
                        <ArrowUpRight
                          aria-hidden
                          className="size-4 -translate-x-1 text-gold opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
