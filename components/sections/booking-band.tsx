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
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden w-[14rem] opacity-95 md:block lg:left-6 lg:w-[17rem]"
      >
        <IncenseBurner smokeColor={SMOKE_ON_LIGHT} intensity={1.2} />
      </div>

      {/* Content aligned to the page container */}
      <div className="relative z-10 mx-auto grid min-h-[380px] max-w-screen-2xl items-center gap-6 px-6 sm:min-h-[440px] sm:px-12 md:grid-cols-2 lg:min-h-[500px] lg:px-16">
        <div className="max-w-md py-10">
          <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.75rem]">
            Sometimes, clarity begins with a conversation.
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-charcoal/80">
            Book your session today and take the first step toward a more
            balanced and fulfilling life.
          </p>
          <Link
            href="/book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 px-7 text-sm font-semibold shadow-sm",
            )}
          >
            Book Your Session
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Founder cutout with a faint mandala behind, standing at the bottom */}
        <div className="relative flex h-full min-h-[280px] items-end justify-center md:justify-end">
          <Mandala
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 hidden size-80 -translate-x-1/2 -translate-y-1/2 text-forest/12 lg:block"
          />
          <Image
            src="/images/founder-reading.png"
            alt="Neelam Niranjan reading, offering personalized guidance"
            width={1236}
            height={1500}
            sizes="(max-width: 768px) 70vw, 460px"
            className="relative h-auto max-h-[300px] w-auto object-contain sm:max-h-[380px] lg:max-h-[470px]"
          />
        </div>
      </div>
    </section>
  );
}
