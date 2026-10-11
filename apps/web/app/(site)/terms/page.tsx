import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/section";
import { getSiteContent, orFallback } from "@/lib/api/content";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms on which Haarivedon's sessions, courses and products are offered.",
};

export default async function TermsPage() {
  const contact = await getSiteContent("site.contact");
  const email = orFallback(contact.email, site.email);

  return (
    <Section background="ivory">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-forest">
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          What this site offers, and on what basis.
        </p>

        <div className="mt-8 space-y-7 text-sm leading-relaxed text-charcoal/85">
          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Nature of what is offered
            </h2>
            <p className="mt-2">
              Haarivedon offers guidance drawn from traditional practices —
              astrology, numerology, vastu and related disciplines. It is
              offered in that spirit and carries traditional and spiritual
              significance.
            </p>
            <p className="mt-2">
              It is <strong>not</strong> medical, legal, financial or
              psychological advice, and it is not a substitute for a qualified
              professional in any of those fields. Decisions you take remain
              your own.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Bookings and enquiries
            </h2>
            <p className="mt-2">
              Submitting a form on this site is a request, not a confirmed
              appointment or order. We will contact you to confirm timing,
              availability and cost before anything is fixed. Nothing is
              charged through this website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Courses
            </h2>
            <p className="mt-2">
              Course listings describe what is taught, not a guaranteed
              outcome. Schedules, fees and joining details are confirmed
              directly with you after you enquire.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Products
            </h2>
            <p className="mt-2">
              Items shown here are listed for reference. There is no checkout
              on this site — availability, price and delivery are arranged
              directly with us after you ask about an item. Natural materials
              such as gemstones, rudraksha and crystals vary in colour, size
              and marking from the photographs shown.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Your details
            </h2>
            <p className="mt-2">
              How we handle what you share is set out in our{" "}
              <Link
                href="/privacy"
                className="font-medium text-forest underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Contact
            </h2>
            <p className="mt-2">Questions about these terms: {email}.</p>
          </section>
        </div>
      </article>
    </Section>
  );
}
