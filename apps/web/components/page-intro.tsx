import Link from "next/link";
import { Section } from "@/components/section";

/**
 * Standard page opening: what this page is, in plain words, and what to do
 * next. Every list page uses it so the site reads the same way throughout.
 */
export function PageIntro({
  eyebrow,
  title,
  lead,
  help,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** The "if you're not sure" line — most visitors need one. */
  help?: { text: string; linkLabel: string; href: string };
}) {
  return (
    <Section background="cream" containerClassName="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-[1.9rem] leading-tight font-semibold text-forest sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-charcoal/75 sm:text-base">
          {lead}
        </p>

        {help && (
          <p className="mt-5 text-sm text-muted-foreground">
            {help.text}{" "}
            <Link
              href={help.href}
              className="font-medium text-forest underline underline-offset-2"
            >
              {help.linkLabel}
            </Link>
          </p>
        )}
      </div>
    </Section>
  );
}

/**
 * Short numbered explainer. Used where people need to know what happens
 * after they click, not just what is on offer.
 */
export function HowItWorks({
  heading,
  steps,
}: {
  heading: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-forest">
        {heading}
      </h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-border/60 bg-ivory/80 p-4 sm:p-5"
          >
            <span className="grid size-7 place-items-center rounded-full bg-forest text-xs font-bold text-ivory">
              {index + 1}
            </span>
            <h3 className="mt-3 font-display text-base font-semibold text-forest">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
