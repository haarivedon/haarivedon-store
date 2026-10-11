import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/section";
import { Icon, type IconName } from "@/components/icon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aboutPillars, site } from "@/lib/content/site";
import { getSiteContent, orFallback } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "About Neelam Niranjan",
  description:
    "The story, mission and areas of expertise behind Haarivedon — ancient wisdom offered with compassion, for the questions you carry today.",
};

/** Used until the client fills the About page in through the admin. */
const defaults = {
  heading: "Guidance rooted in tradition, offered with care",
  intro: `${site.name} is the practice of Neelam Niranjan — a space for people who are carrying a question and want a considered answer, not a quick one.`,
  story:
    "Every consultation begins by listening. The traditional sciences — astrology, numerology, vastu, energy work — are tools, and which one serves you depends entirely on what you bring to the conversation.\n\nThe intent is never to hand you a verdict. It is to show you the pattern you are standing in, and the choices that are genuinely yours to make.",
  expertise: [
    "Vedic astrology and kundali reading",
    "Numerology and name correction",
    "Vastu and space harmonisation",
    "Energy healing and Reiki",
    "Remedial rituals and yantras",
    "Personal and relationship guidance",
  ],
  portrait: "/images/founder-about.jpg",
};

export default async function AboutPage() {
  const copy = await getSiteContent("about.page");
  const expertise = copy.expertise.length ? copy.expertise : defaults.expertise;
  const story = orFallback(copy.story, defaults.story);
  const portrait = orFallback(copy.portrait, defaults.portrait);

  return (
    <>
      <Section background="cream">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="About"
              as="h1"
              title={orFallback(copy.heading, defaults.heading)}
              description={orFallback(copy.intro, defaults.intro)}
            />
            <div className="mt-6 space-y-4 text-charcoal/80">
              {story.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <Link
              href="/book"
              className={cn(buttonVariants({ size: "lg" }), "mt-8")}
            >
              Book a Session
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border/60 shadow-sm">
            <Image
              src={portrait}
              alt="Neelam Niranjan, founder of Haarivedon"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <Section background="ivory">
        <SectionHeader
          eyebrow="How We Work"
          title="The principles behind every session"
          align="center"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {aboutPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <Icon
                name={pillar.icon as IconName}
                className="size-7 text-brand-600"
              />
              <h3 className="mt-4 font-display text-lg font-semibold text-forest">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {(copy.mission || copy.philosophy) && (
        <Section background="ivory">
          <div className="grid gap-8 md:grid-cols-2">
            {copy.mission && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest">
                  Our mission
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                  {copy.mission}
                </p>
              </div>
            )}
            {copy.philosophy && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest">
                  Our philosophy
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                  {copy.philosophy}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section background="sage">
        <SectionHeader
          eyebrow="Areas of Expertise"
          title="What we can help you with"
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expertise.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl bg-ivory/80 p-4 text-sm text-charcoal/85"
            >
              <span aria-hidden className="mt-0.5 text-gold">
                ✦
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
