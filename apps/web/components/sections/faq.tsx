import { Plus } from "lucide-react";
import { Section, SectionHeader } from "@/components/section";
import { getSiteContent } from "@/lib/api/content";

/**
 * Home-page FAQ accordion, editable in Admin → Pages → Home — FAQ (its own
 * list, separate from the About page). Renders nothing when no questions set.
 */
export async function Faq({
  background = "ivory",
}: {
  background?: "ivory" | "cream";
}) {
  const copy = await getSiteContent("home.faq");
  const faqs = copy.faqs.filter((faq) => faq.question.trim());
  if (faqs.length === 0) return null;

  return (
    <Section background={background}>
      <SectionHeader
        eyebrow="FAQ"
        title="Questions people often ask"
        align="center"
      />
      <div className="mx-auto mt-8 max-w-2xl divide-y divide-border/60 border-y border-border/60">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-forest">
              {faq.question}
              <Plus
                aria-hidden
                className="size-4 shrink-0 text-brand-700 transition-transform group-open:rotate-45"
              />
            </summary>
            {faq.answer && (
              <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
                {faq.answer}
              </p>
            )}
          </details>
        ))}
      </div>
    </Section>
  );
}
