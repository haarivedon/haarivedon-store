import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Moon, Sparkles, Star, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/section-heading";
import { Mandala } from "@/components/decor";
import { cn } from "@/lib/utils";

/** The headline facts a reader sees in the free summary. */
const points = [
  { icon: Sun, title: "Lagna & Sun sign", note: "Your ascendant and solar sign" },
  { icon: Moon, title: "Moon sign & Nakshatra", note: "Your Rashi and birth star" },
  { icon: Star, title: "Dasha, yogas & doshas", note: "The periods shaping your path" },
];

export function FreeKundliBand() {
  return (
    <section className="relative overflow-hidden bg-forest text-ivory">
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-16 size-80 text-gold/15"
      />
      {/* Celestial motif — transparent PNG so only the gold linework shows. */}
      <Image
        src="/images/zodiac-wheel.webp"
        alt=""
        aria-hidden="true"
        width={800}
        height={799}
        className="pointer-events-none absolute -left-28 bottom-0 hidden size-[26rem] translate-y-1/3 opacity-50 sm:block"
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Eyebrow tone="light">Free Kundli</Eyebrow>
          <h2 className="mt-4 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
            See your Vedic chart,
            <br className="hidden sm:block" /> free
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ivory/70">
            Share your birth details and get a free summary of your chart in
            moments — then take it further with a detailed Kundli PDF or a
            one-to-one consultation.
          </p>
          <Link
            href="/kundli"
            className={cn(
              buttonVariants({ size: "lg" }),
              // Fill gold on the forest band so the CTA never blends in.
              "mt-8 h-12 px-7 text-sm font-semibold shadow-sm hover:bg-gold hover:text-forest",
            )}
          >
            <Sparkles className="size-4" />
            Get a Free Kundli
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {points.map((point) => (
            <li
              key={point.title}
              className="flex items-start gap-3 rounded-2xl border border-ivory/15 bg-ivory/5 p-4 sm:flex-col sm:items-start lg:flex-row lg:items-center"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <point.icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-base font-semibold text-ivory">
                  {point.title}
                </p>
                <p className="text-sm text-ivory/65">{point.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
