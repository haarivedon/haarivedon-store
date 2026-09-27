import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Eyebrow } from "@/components/section-heading";
import { LeafSprig } from "@/components/decor";
import { HeroPortrait } from "@/components/sections/hero-portrait";
import { cn } from "@/lib/utils";
import { heroHighlights } from "@/lib/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_65%_25%,#2a5638_0%,#183626_42%,#0d1911_100%)] text-ivory">
      {/* Corner foliage, kept faint on the dark ground */}
      <LeafSprig
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -left-8 w-44 -scale-x-100 opacity-90 drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] sm:w-64"
      />
      <LeafSprig
        aria-hidden="true"
        className="pointer-events-none absolute right-2 bottom-0 w-40 rotate-[200deg] opacity-80 sm:w-56"
      />

      <div className="relative mx-auto grid max-w-screen-2xl items-center gap-8 px-4 pt-14 pb-0 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        {/* Copy */}
        <div className="pb-16 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 lg:pb-24">
          <Eyebrow tone="light">Welcome to Haarivedon</Eyebrow>

          <h1 className="mt-5 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-ivory sm:text-6xl lg:text-[4.25rem]">
            Find Clarity.
            <br />
            Discover Your Path.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ivory/75">
            Ancient wisdom and personalized guidance for life&rsquo;s important
            decisions. Let&rsquo;s explore your journey together.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/book"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-6 text-sm font-semibold shadow-sm hover:bg-gold-600",
              )}
            >
              Book a Session
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/services"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-ivory/30 bg-transparent px-6 text-sm font-semibold text-ivory hover:bg-ivory/10 hover:text-ivory",
              )}
            >
              Explore Services
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
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
