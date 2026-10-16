"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product image gallery: one large image with a thumbnail strip beneath it.
 *
 * The detail page only ever showed `images[0]`, so a product shot from three
 * angles looked like a product with one photo. This surfaces the rest without
 * leaving the page — each thumbnail swaps the main image. With a single image
 * (or none) it quietly collapses to just the frame.
 *
 * The whole block is sticky on desktop so the picture stays in view while the
 * buy box and description scroll past it.
 */
export function ProductGallery({
  images,
  name,
  overlay,
}: {
  images: string[];
  name: string;
  /** Optional corner badge drawn over the main image (e.g. "Enquire only"). */
  overlay?: React.ReactNode;
}) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const main = gallery[active];

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-sage/30">
        {main ? (
          <Image
            // Keyed so a swap cross-fades via the browser rather than appearing
            // to mutate the same element.
            key={main}
            src={main}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Photo coming soon
          </span>
        )}
        {overlay}
      </div>

      {gallery.length > 1 && (
        <ul
          className="mt-3 flex gap-3 overflow-x-auto pb-1"
          aria-label={`${name} images`}
        >
          {gallery.map((src, index) => {
            const current = index === active;
            return (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show image ${index + 1} of ${gallery.length}`}
                  aria-pressed={current}
                  className={cn(
                    "relative block size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:size-20",
                    current
                      ? "border-brand-600"
                      : "border-border/60 hover:border-brand-600/60",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
