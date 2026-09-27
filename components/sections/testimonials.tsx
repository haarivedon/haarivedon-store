"use client";

import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Eyebrow } from "@/components/section-heading";
import { testimonials } from "@/lib/content/site";

export function Testimonials() {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="flex flex-col items-center text-center">
          <Eyebrow>Testimonials</Eyebrow>
          <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight font-medium tracking-tight text-forest italic sm:text-4xl">
            &ldquo;A journey toward clarity begins with understanding
            yourself.&rdquo;
          </h2>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          className="mt-12"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((t) => (
              <CarouselItem
                key={t.name}
                className="pl-4 sm:basis-1/2 lg:basis-1/3"
              >
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-gold text-gold"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-charcoal/85">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 font-display text-base font-semibold text-forest">
                    {t.name}
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-8 flex items-center justify-center gap-3">
            <CarouselPrevious className="static translate-y-0 rounded-full border-forest/20 text-forest hover:bg-sage/50" />
            <CarouselNext className="static translate-y-0 rounded-full border-forest/20 text-forest hover:bg-sage/50" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
