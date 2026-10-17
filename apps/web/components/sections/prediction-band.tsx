import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/section-heading";
import { Mandala } from "@/components/decor";
import { cn } from "@/lib/utils";

export function PredictionBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo via-indigo to-indigo-700 text-ivory">
      {/* Zodiac wheel — the client's celestial motif; transparent PNG so only
          the gold linework shows on the indigo night-sky band. */}
      <Image
        src="/images/zodiac-wheel.webp"
        alt=""
        aria-hidden="true"
        width={800}
        height={799}
        className="pointer-events-none absolute -right-24 top-1/2 hidden size-[30rem] -translate-y-1/2 opacity-60 sm:block"
      />
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-1/2 size-72 -translate-y-1/2 text-gold/25"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20 lg:py-24">
        <Eyebrow tone="light">Your Questions Have Meaning</Eyebrow>
        <h2 className="mt-4 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl">
          Explore a Personalized
          <br className="hidden sm:block" /> Prediction Experience
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/70">
          Gain insight, find clarity, and move forward with confidence.
        </p>
        <Link
          href="/predictions"
          className={cn(
            buttonVariants({ size: "lg" }),
            // On the forest band the default hover (bg-forest) would blend the
            // button into the section — fill gold instead (the CTA colour).
            "mt-8 h-12 px-7 text-sm font-semibold shadow-sm hover:bg-gold hover:text-forest",
          )}
        >
          Get Your Prediction
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
