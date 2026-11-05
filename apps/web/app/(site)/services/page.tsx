import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/section";
import { PageIntro, HowItWorks } from "@/components/page-intro";
import { ServiceJsonLd } from "@/components/seo/json-ld";
import { ServiceCard } from "@/components/sections/service-card";
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
          <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
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
