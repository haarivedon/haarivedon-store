import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/section-heading";
import { Mandala } from "@/components/decor";
import { cn } from "@/lib/utils";

export function PredictionBand() {
  return (
    <section className="relative overflow-hidden bg-forest text-ivory">
      {/* Zodiac wheel — the client's celestial motif; screen blend drops the
          black background so only the gold linework glows on the forest band. */}
      <Image
        src="/images/zodiac-wheel.jpg"
        alt=""
        aria-hidden="true"
        width={800}
        height={799}
        className="pointer-events-none absolute -right-24 top-1/2 hidden size-[30rem] -translate-y-1/2 mix-blend-screen opacity-50 sm:block"
      />
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-1/2 size-72 -translate-y-1/2 text-brand/25"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-24">
        <Eyebrow tone="light">Your Questions Have Meaning</Eyebrow>
        <h2 className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
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
            "mt-8 h-12 px-7 text-sm font-semibold shadow-sm",
          )}
        >
          Get Your Prediction
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
