import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/section";
import { PredictionForm } from "@/components/forms/prediction-form";
import { getSiteContent, orFallback } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Predictions & Readings",
  description:
    "Request a personal reading based on your birth details — a considered answer to the question you're carrying, not a generic forecast.",
};

/** Used until the client fills this page in through the admin. */
const defaults = {
  heading: "A reading of your own chart",
  intro:
    "Bring one real question. A reading is most useful when it is specific — about a decision you are weighing, not about the whole of your life at once.",
  turnaround:
    "Readings are prepared individually, so they are not instant. We will confirm the timeline when we acknowledge your request.",
};

const receive = [
  "A reading prepared from your own birth details, not a sun-sign generality",
  "The planetary periods you are currently moving through",
  "What the chart suggests about the area you asked about",
  "Traditional remedies, where they are appropriate",
  "A written response you can return to",
];

export default async function PredictionsPage() {
  const copy = await getSiteContent("predictions.page");
  const items = copy.receive.length ? copy.receive : receive;

  return (
    <>
      <Section background="cream" containerClassName="pb-8 sm:pb-10">
        <SectionHeader
          eyebrow="Predictions"
          as="h1"
          title={orFallback(copy.heading, defaults.heading)}
          description={orFallback(copy.intro, defaults.intro)}
          align="center"
        />
      </Section>

      <Section background="ivory">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest">
              What you receive
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-charcoal/80">
              {items.map((item) => (
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
                How long it takes
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {orFallback(copy.turnaround, defaults.turnaround)}
              </p>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Readings carry traditional and spiritual significance and are
              offered as guidance. They are not a substitute for medical, legal
              or financial advice.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold text-forest">
              Request a reading
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The more precise your birth details, the more precise the reading.
            </p>
            <div className="mt-6">
              <PredictionForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
