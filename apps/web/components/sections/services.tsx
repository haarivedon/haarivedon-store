import Link from "next/link";
import { Globe } from "lucide-react";
import { Icon } from "@/components/icon";
import { Section, SectionHeader } from "@/components/section";
import { services, serviceCredentials } from "@/lib/content/site";

/**
 * Home services grid.
 *
 * A compact icon tile per offering — the whole practice at a glance — echoing
 * the brand's own services wheel, with the healer credentials and the
 * "worldwide" note beneath. Content lives in lib/content/site.ts.
 */
export function Services() {
  return (
    <Section id="services" background="cream">
      <SectionHeader
        eyebrow="Our Services"
        title="Healing, Guidance &amp; Transformation"
        description="Twelve ways to work together — from coaching and therapy to energy healing and readings. Every session is one-to-one and shaped around what you bring."
        actionHref="/services"
        actionLabel="View All Services"
      />

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {services.map((service) => (
          <li key={service.title}>
            <Link
              href={service.href}
              className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand-600/40 hover:shadow-[0_18px_40px_-24px_rgba(33,74,46,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-sage/50 text-brand-700 transition-colors group-hover:bg-gold group-hover:text-forest">
                <Icon name={service.icon} className="size-6" />
              </span>
              <h3 className="font-display text-sm font-semibold text-forest sm:text-base">
                {service.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Credentials strip — mirrors the brand asset. */}
      <div className="mt-10 flex flex-col items-center gap-4">
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
