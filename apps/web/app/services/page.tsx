import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/section";
import { Icon } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFromPrice } from "@/lib/format";
import { getServices } from "@/lib/api/content";
import { ServiceJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Consultations, readings and guidance sessions at Haarivedon — what each one covers, and how to book.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {services.length > 0 && <ServiceJsonLd services={services} />}
      <Section background="cream">
        <SectionHeader
          eyebrow="Services"
          title="Ways we can work together"
          description="Each session is one-to-one and shaped around the question you bring. If you are not sure which fits, book a personal consultation and we will find it together."
          align="center"
        />
      </Section>

      <Section background="ivory">
        {services.length === 0 ? (
          <p className="mx-auto max-w-prose text-center text-muted-foreground">
            Our services are being updated. Please{" "}
            <Link href="/book" className="font-medium text-forest underline">
              get in touch
            </Link>{" "}
            and we will guide you to the right session.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                id={service.slug}
                className="flex flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
              >
                <Icon name={service.icon} className="size-8 text-brand-600" />
                <h2 className="mt-4 font-display text-xl font-semibold text-forest">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.summary}
                </p>

                {service.description && (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
                    {service.description}
                  </p>
                )}

                {service.highlights.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-charcoal/80">
                    {service.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span aria-hidden className="mt-0.5 text-gold">
                          ✦
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
                  <p className="font-display text-base font-semibold text-forest">
                    {formatFromPrice(service.startingPrice, service.currency)}
                  </p>
                  <Link
                    href="/book"
                    className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}
                  >
                    Book this session
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
