import type { Metadata } from "next";
import { CalendarCheck, FileText, MessageCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/section";
import { BookingForm } from "@/components/forms/booking-form";
import { getSiteContent, orFallback } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Share your birth details and the question you're carrying. We'll prepare your Kundali and reach out to confirm your session.",
};

/** Used until the client fills this page in through the admin. */
const defaults = {
  heading: "Let's start with your chart",
  intro:
    "Your birth details let us prepare your Kundali before we even speak — so the conversation starts with your actual chart, not with questions about it.",
};

const steps = [
  {
    icon: CalendarCheck,
    title: "Share your details",
    body: "Your name, mobile number, and exactly when and where you were born.",
  },
  {
    icon: FileText,
    title: "Get your Kundali",
    body: "We prepare your birth chart as a PDF — yours to keep, whatever you decide next.",
  },
  {
    icon: MessageCircle,
    title: "We reach out",
    body: "We call to confirm a time that suits you, and the session happens one-to-one.",
  },
];

export default async function BookPage() {
  const copy = await getSiteContent("book.page");

  return (
    <>
      <Section background="cream" containerClassName="pb-8 sm:pb-10">
        <SectionHeader
          eyebrow="Book a Session"
          as="h1"
          title={orFallback(copy.heading, defaults.heading)}
          description={orFallback(copy.intro, defaults.intro)}
          align="center"
        />
        <ol className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border/60 bg-ivory/70 p-5"
            >
              <step.icon className="size-6 text-brand-600" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-brand-700">
                Step {index + 1}
              </p>
              <h2 className="mt-1 font-display text-base font-semibold text-forest">
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section background="ivory">
        <div className="mx-auto max-w-2xl">
          {copy.kundaliNote && (
            <p className="mb-6 rounded-2xl bg-cream/70 p-4 text-sm leading-relaxed text-charcoal/80">
              {copy.kundaliNote}
            </p>
          )}
          <BookingForm fee={copy.fee} />
        </div>
      </Section>
    </>
  );
}
