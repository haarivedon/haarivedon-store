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

export function Hero() {
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

      <div className="relative z-10 mx-auto grid max-w-screen-2xl items-center gap-8 px-4 pt-14 pb-0 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        {/* Copy */}
        <div className="pb-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 lg:pb-24">
          <Eyebrow tone="light">Welcome to Haarivedon</Eyebrow>

          <h1 className="mt-4 font-display text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-ivory sm:mt-5 sm:text-6xl lg:text-[4.25rem]">
            Find Clarity.
            <br />
            Discover Your Path.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-ivory/75 sm:text-lg">
            Ancient wisdom and personalized guidance for life&rsquo;s important
            decisions. Let&rsquo;s explore your journey together.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
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

        {/* Founder slideshow + zodiac */}
        <div className="relative self-end">
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
