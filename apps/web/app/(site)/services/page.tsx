import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/section";
import { PageIntro, HowItWorks } from "@/components/page-intro";
import { Icon } from "@/components/icon";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Price } from "@/components/price";
import { getServices } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Consultations, readings and guidance sessions at Haarivedon — what each one covers, what it costs, and how to book.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {services.length > 0 && <ServiceJsonLd services={services} />}

      <PageIntro
        eyebrow="Services"
        title="Ways we can work together"
        lead="Every session is one-to-one and shaped around the question you bring. Sessions are held over a call, and nothing is scripted — what we look at depends on what you are actually deciding."
        help={{
          text: "Not sure which session fits?",
          linkLabel: "Start with a personal consultation",
          href: "/book",
        }}
      />

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
          <ul className="grid gap-5 lg:grid-cols-2">
            {services.map((service) => (
              <li key={service.id} id={service.slug}>
                <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/50">
                      <Icon
                        name={service.icon}
                        className="size-5 text-brand-700"
                      />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-semibold text-forest">
                        {service.title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {service.summary}
                      </p>
                    </div>
                  </div>

                  {service.description && (
                    <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-charcoal/80">
                      {service.description.split("\n\n").map((paragraph) => (
                        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {service.highlights.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                        What it includes
                      </h3>
                      <ul className="mt-2.5 space-y-2 text-sm text-charcoal/80">
                        {service.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2.5">
                            <span aria-hidden className="mt-0.5 text-gold">
                              ✦
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
                    <p>
                      <Price
                        value={service.startingPrice}
                        currency={service.currency}
                        from
                        asButton={false}
                      />
                    </p>
                    <Link
                      href={`/book?service=${encodeURIComponent(service.slug)}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "h-11 px-5",
                      )}
                    >
                      Book this session
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section background="cream">
        <HowItWorks
          heading="What happens after you book"
          steps={[
            {
              title: "Share your details",
              body: "Name, mobile number, and when and where you were born.",
            },
            {
              title: "We prepare your chart",
              body: "Your Kundali is drawn up before we speak, so no time is spent on basics.",
            },
            {
              title: "We call to confirm",
              body: "We agree a time that suits you, then the session is yours.",
            },
          ]}
        />
      </Section>
    </>
  );
}
