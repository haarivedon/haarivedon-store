import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/section";
import { FreeKundli } from "@/components/forms/free-kundli";

export const metadata: Metadata = {
  title: "Get a Free Kundli",
  description:
    "Enter your birth details to see your free Vedic chart summary — your Lagna, Rashi and Nakshatra — then get the detailed Kundli PDF or book a consultation.",
};

const receive = [
  "Your Lagna (ascendant), Moon sign and birth Nakshatra",
  "The Panchang of your birth — tithi, yoga, karana and weekday",
  "The major planetary period (Mahadasha) you are moving through",
  "Traditional factors worth reviewing in your chart",
];

export default function KundliPage() {
  return (
    <>
      <Section background="cream" containerClassName="pb-8 sm:pb-10">
        <SectionHeader
          eyebrow="Free Kundli"
          as="h1"
          title="Get a Free Kundli"
          description="Share your birth details and see a free summary of your Vedic chart in seconds — then take it further with a detailed PDF or a personal consultation."
          align="center"
        />
      </Section>

      <Section background="ivory">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest">
              What you&apos;ll see
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-charcoal/80">
              {receive.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span aria-hidden className="mt-0.5 text-gold">
                    ✦
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-cream/70 p-5">
              <h3 className="font-display text-base font-semibold text-forest">
                Then, if you&apos;d like more
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Download the full Kundli as a detailed PDF, or book a one-to-one
                consultation to talk through what your chart means for you.
              </p>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              A Kundli carries traditional and spiritual significance and is
              offered as guidance. It is not a substitute for medical, legal or
              financial advice.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <FreeKundli />
          </div>
        </div>
      </Section>
    </>
  );
}
