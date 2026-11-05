import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/section";
import { BookingWizard } from "@/components/forms/booking-wizard";
import { getSiteContent, getServices, orFallback } from "@/lib/api/content";

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

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const [copy, params, services] = await Promise.all([
    getSiteContent("book.page"),
    searchParams,
    getServices(),
  ]);

  // A booking can start from the Services page — carry the chosen service in.
  const serviceSlug = typeof params.service === "string" ? params.service : "";
  // The dropdown mirrors the live, admin-managed services.
  const serviceOptions = services.map((s) => ({ slug: s.slug, title: s.title }));

  return (
    <Section background="cream" containerClassName="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <SectionHeader
          eyebrow="Book a Session"
          as="h1"
          title={orFallback(copy.heading, defaults.heading)}
          description={orFallback(copy.intro, defaults.intro)}
        />

        {copy.kundaliNote && (
          <p className="mt-6 rounded-2xl bg-ivory/70 p-4 text-sm leading-relaxed text-charcoal/80">
            {copy.kundaliNote}
          </p>
        )}

        {/* The form itself is the first thing in view — the wizard carries its
            own Form → Schedule → Pay progress, so no separate steps block. */}
        <div className="mt-8 rounded-3xl border border-border/60 bg-ivory p-5 shadow-sm sm:p-7">
          <BookingWizard selectedSlug={serviceSlug} services={serviceOptions} />
        </div>
      </div>
    </Section>
  );
}
