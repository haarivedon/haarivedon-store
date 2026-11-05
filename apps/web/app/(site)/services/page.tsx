import type { Metadata } from "next";
import Link from "next/link";
import {
  serviceCategories,
  serviceCategoryLabels,
  type ServiceCategory,
} from "@repo/contract";
import { Section } from "@/components/section";
import { PageIntro, HowItWorks } from "@/components/page-intro";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { ServiceCard } from "@/components/sections/service-card";
import { getServices } from "@/lib/api/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Consultations, readings and guidance sessions at Haarivedon — what each one covers, what it costs, and how to book.",
};

/** Fold an unknown/empty category into "other" so every service is covered. */
const normalize = (category: string): ServiceCategory =>
  (serviceCategories as readonly string[]).includes(category)
    ? (category as ServiceCategory)
    : "other";

export default async function ServicesPage({
  searchParams,
}: PageProps<"/services">) {
  const [services, params] = await Promise.all([getServices(), searchParams]);

  // Active tab lives in the URL (?category=…) so it is shareable and survives
  // Back/Forward (AGENTS.md — URL-driven state).
  const raw = typeof params.category === "string" ? params.category : "";
  const active = (serviceCategories as readonly string[]).includes(raw)
    ? (raw as ServiceCategory)
    : "";

  // Only show tabs for categories that actually have services, in canonical order.
  const present = serviceCategories.filter((category) =>
    services.some((s) => normalize(s.category) === category),
  );
  const visible = active
    ? services.filter((s) => normalize(s.category) === active)
    : services;

  const tabClass = (isActive: boolean) =>
    cn(
      "whitespace-nowrap border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors",
      isActive
        ? "border-gold text-forest"
        : "border-transparent text-muted-foreground hover:text-forest",
    );

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

      <Section background="white">
        {services.length === 0 ? (
          <p className="mx-auto max-w-prose text-center text-muted-foreground">
            Our services are being updated. Please{" "}
            <Link href="/book" className="font-medium text-forest underline">
              get in touch
            </Link>{" "}
            and we will guide you to the right session.
          </p>
        ) : (
          <>
            {present.length > 1 && (
              <div className="mb-8 flex gap-6 overflow-x-auto border-b border-border/60">
                <Link href="/services" className={tabClass(!active)}>
                  All
                </Link>
                {present.map((category) => (
                  <Link
                    key={category}
                    href={`/services?category=${category}`}
                    className={tabClass(active === category)}
                  >
                    {serviceCategoryLabels[category]}
                  </Link>
                ))}
              </div>
            )}

            <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
          </>
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
