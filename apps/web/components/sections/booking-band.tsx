import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LeafSprig, Mandala } from "@/components/decor";
import { IncenseBurner } from "@/components/incense-burner";
import { cn } from "@/lib/utils";

// Muted warm-grey smoke reads against the light botanical wash.
const SMOKE_ON_LIGHT = { r: 152, g: 154, b: 145 };

export function BookingBand() {
  return (
    <section className="relative overflow-hidden bg-ivory">
      {/* Layered warm botanical wash: soft-yellow glow, sage vignette, base tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_150%_at_12%_8%,var(--color-soft-yellow)_0%,transparent_55%),radial-gradient(120%_130%_at_100%_105%,color-mix(in_srgb,var(--color-sage)_85%,transparent)_0%,transparent_55%),linear-gradient(175deg,var(--color-ivory)_0%,var(--color-cream)_100%)]"
      />

      {/* Fine grain for depth */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09] mix-blend-multiply"
      >
        <filter id="bookingGrain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bookingGrain)" />
      </svg>

      {/* Soft green wave along the bottom (full-bleed) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-sage"
      >
        <path
          d="M0 60 C 200 20 380 100 600 70 C 820 40 1000 100 1200 55 L1200 120 L0 120 Z"
          fill="currentColor"
        />
        <path
          d="M0 60 C 200 20 380 100 600 70 C 820 40 1000 100 1200 55"
          fill="none"
          stroke="var(--color-gold)"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
      </svg>

      {/* Botanical + celestial motifs on the full-width canvas */}
      <LeafSprig
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 -left-6 w-40 -scale-x-100 opacity-90 sm:w-52"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-6 right-8 font-display text-6xl leading-none text-forest/15"
      >
        ॐ
      </span>

      {/* Incense burner with live smoke — decorative accent, lower-left corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-3 z-0 w-[8rem] opacity-90 sm:left-0 sm:w-[12rem] md:w-[14rem] lg:left-6 lg:w-[17rem]"
      >
        <IncenseBurner smokeColor={SMOKE_ON_LIGHT} intensity={1.2} />
      </div>

      {/* Content aligned to the page container */}
      <div className="relative z-10 mx-auto grid max-w-screen-2xl items-center gap-x-8 gap-y-4 px-4 sm:min-h-[440px] sm:px-12 md:grid-cols-2 lg:min-h-[500px] lg:px-16">
        {/* Copy + CTA — on mobile these flow into the grid (display:contents)
            so the founder image can sit between the heading and the button. */}
        <div className="contents md:block md:max-w-md md:py-10">
          <div className="order-1 pt-12 md:order-none md:pt-0">
            <h2 className="font-display text-[1.75rem] leading-[1.2] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.75rem]">
              Sometimes, clarity begins with a conversation.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-charcoal/80">
              Book your session today and take the first step toward a more
              balanced and fulfilling life.
            </p>
          </div>

          <Link
            href="/book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "order-3 mb-12 h-12 w-full justify-center px-7 text-sm font-semibold shadow-sm md:order-none md:mt-6 md:mb-0 md:w-auto",
            )}
          >
            Book Your Session
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Founder cutout with a faint mandala behind, standing at the bottom */}
        <div className="relative order-2 flex h-full min-h-[240px] items-end justify-center md:order-none md:min-h-[280px] md:justify-end">
          <Mandala
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 hidden size-80 -translate-x-1/2 -translate-y-1/2 text-forest/12 lg:block"
          />
          <Image
            src="/images/founder-reading.png"
            alt="Neelam A. Singh reading, offering personalized guidance"
            width={1236}
            height={1500}
            sizes="(max-width: 768px) 60vw, 460px"
            className="relative h-auto max-h-[280px] w-auto object-contain sm:max-h-[380px] lg:max-h-[470px]"
          />
        </div>
      </div>
    </section>
  );
}
