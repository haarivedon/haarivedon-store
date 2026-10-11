import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Eyebrow } from "@/components/section-heading";
import { LeafSprig } from "@/components/decor";
import { Diya } from "@/components/diya";
import { HeroPortrait } from "@/components/sections/hero-portrait";
import { cn } from "@/lib/utils";
import { heroHighlights } from "@/lib/content/site";
import { getSiteContent, orFallback } from "@/lib/api/content";

/** Used until the client edits the hero through the admin. */
const defaults = {
  eyebrow: "Welcome to Haarivedon",
  heading: "Find Clarity.\nDiscover Your Path.",
  subheading:
    "Ancient wisdom and personalized guidance for life\u2019s important decisions. Let\u2019s explore your journey together.",
};

export async function Hero() {
  const copy = await getSiteContent("home.hero");
  const heading = orFallback(copy.heading, defaults.heading);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_65%_25%,#2a5638_0%,#183626_42%,#0d1911_100%)] text-ivory">
      {/* Corner foliage, kept faint on the dark ground */}
      <LeafSprig
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 w-44 -scale-x-100 opacity-90 drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] sm:w-56"
      />
      <LeafSprig
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 w-44 opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] sm:w-56"
      />

      {/* Glowing diya with rising smoke — bottom-left accent on the dark ground */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-3 z-0 hidden w-[9rem] lg:block xl:left-6 xl:w-[10.5rem]"
      >
        <Diya priority />
      </div>

      <div className="relative z-10 mx-auto grid max-w-screen-2xl items-center gap-x-8 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-0">
        {/* Copy column — on mobile its children flow straight into the grid
            (display:contents) so the portrait can sit between the heading and
            the CTAs; on lg it collapses back into a normal left column. */}
        <div className="contents lg:block lg:self-center lg:pb-24">
          {/* Heading */}
          <div className="order-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 lg:order-none">
            <Eyebrow tone="light">
              {orFallback(copy.eyebrow, defaults.eyebrow)}
            </Eyebrow>

            {/* A newline in the heading is a deliberate line break. */}
            <h1 className="mt-3 font-display text-[2.15rem] leading-[1.1] font-semibold tracking-tight text-ivory sm:mt-5 sm:text-6xl lg:text-[4.25rem]">
              {heading.split("\n").map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ivory/75 sm:mt-5 sm:text-lg">
              {orFallback(copy.subheading, defaults.subheading)}
            </p>
          </div>

          {/* CTAs + trust badges — below the portrait on mobile */}
          <div className="order-3 mt-8 lg:order-none lg:mt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/book"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 w-full justify-center px-6 text-sm font-semibold shadow-sm sm:w-auto",
                )}
              >
                Book a Session
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/services"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full justify-center px-6 text-sm font-semibold border-ivory/40 text-ivory hover:bg-ivory hover:text-forest sm:w-auto",
                )}
              >
                Explore Services
              </Link>
            </div>

            <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
              {heroHighlights.map((h) => (
                <li
                  key={h.label}
                  className="flex items-center gap-2 text-sm font-medium text-ivory/85"
                >
                  <Icon name={h.icon} className="size-4 text-gold" />
                  {h.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Founder slideshow + zodiac */}
        <div className="relative order-2 mt-8 self-end lg:order-none lg:mt-0">
          <HeroPortrait />

          {/* Signature */}
          <div className="absolute top-2 right-0 z-20 hidden rotate-3 flex-col items-end sm:flex">
            <span className="font-script text-4xl leading-none text-gold">
              Neelam Niranjan
            </span>
            <span className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-ivory/60 uppercase">
              Founder &amp; Guide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
