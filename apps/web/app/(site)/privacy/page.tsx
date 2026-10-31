import type { Metadata } from "next";
import { Section } from "@/components/section";
import { getSiteContent, orFallback } from "@/lib/api/content";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Haarivedon collects, why, how long it is kept, and how to have it removed.",
};

/**
 * Written to match what the application actually does — the fields the forms
 * collect, where they are stored, and who they are shared with. It is a
 * factual description, not boilerplate, and it needs a lawyer's eye before
 * launch (see docs/BUILD.md).
 */
export default async function PrivacyPage() {
  const contact = await getSiteContent("site.contact");
  const email = orFallback(contact.email, site.email);
  const phone = orFallback(contact.phone, site.phone);

  return (
    <Section background="ivory">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-forest">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How we handle the details you share with us.
        </p>

        <div className="mt-8 space-y-7 text-sm leading-relaxed text-charcoal/85">
          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              What we collect
            </h2>
            <p className="mt-2">
              Only what you type into a form on this site:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Booking a session:</strong> your name, mobile number,
                an email address if you give one, and your date, time and place
                of birth.
              </li>
              <li>
                <strong>Requesting a reading:</strong> your name, mobile
                number, email address, birth details, and the question you ask.
              </li>
              <li>
                <strong>Asking about a course or product:</strong> your name,
                mobile number, email address and your message.
              </li>
            </ul>
            <p className="mt-2">
              We do not run advertising trackers, we do not build a profile of
              your browsing, and we never buy or sell personal data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Why we need your birth details
            </h2>
            <p className="mt-2">
              A birth chart is calculated from the exact date, time and place
              of birth — that is the only reason we ask. The place is converted
              to coordinates and a timezone so the chart can be cast
              correctly. Your chart is prepared for you and nobody else.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Who else sees it
            </h2>
            <p className="mt-2">
              Your details are stored in our database and are visible to
              Neelam A. Singh and anyone she has given access to the admin.
              Beyond that:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Your date, time and coordinates of birth are sent to the
                astrology service that calculates the chart. Your name, phone
                number and email are not.
              </li>
              <li>
                Our hosting and database providers store the data on our
                behalf.
              </li>
            </ul>
            <p className="mt-2">
              A prepared Kundali is kept in private storage and can only be
              downloaded through the single-use link given to you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              How long we keep it
            </h2>
            <p className="mt-2">
              Until you ask us to delete it. Write to{" "}
              <a
                href={`mailto:${email}`}
                className="font-medium text-forest underline underline-offset-2"
              >
                {email}
              </a>{" "}
              and we will remove your enquiry and any chart prepared from it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-forest">
              Contact
            </h2>
            <p className="mt-2">
              Questions about any of this: {email}
              {phone ? ` or ${phone}` : ""}.
            </p>
          </section>
        </div>
      </article>
    </Section>
  );
}
