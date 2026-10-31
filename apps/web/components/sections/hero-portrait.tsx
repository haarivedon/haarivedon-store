"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const slides = [
  {
    src: "/images/founder-cutout.png",
    alt: "Neelam A. Singh holding her book on healing methods",
    width: 1285,
    height: 1600,
  },
  {
    src: "/images/founder-cutout-2.png",
    alt: "Neelam A. Singh reading a rose quartz crystal sphere",
    width: 1067,
    height: 1600,
  },
];

const INTERVAL = 5000;

export function HeroPortrait() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-[24rem] items-end justify-center sm:min-h-[33rem]">
      {/* Gold aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[18rem] -translate-x-1/2 -translate-y-[52%] rounded-full bg-gold/25 blur-3xl sm:size-[30rem]"
      />
      {/* Zodiac wheel — centred on the figure so it sits inside the ring, and
          pulled in a touch so the right-hand signs clear the signature. */}
      <Image
        src="/images/zodiac-wheel.webp"
        alt=""
        aria-hidden="true"
        width={800}
        height={799}
        className="pointer-events-none absolute top-1/2 left-1/2 size-[17rem] -translate-x-1/2 -translate-y-[52%] opacity-80 motion-safe:animate-[spin_80s_linear_infinite] sm:size-[28rem]"
      />

      {/* Slides — cross-fade, all anchored to a common baseline */}
      <div className="relative z-10 h-[23rem] w-full sm:h-[32rem]">
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            width={slide.width}
            height={slide.height}
            priority={i === 0}
            sizes="(max-width: 1024px) 80vw, 440px"
            aria-hidden={i !== active}
            className={cn(
              "absolute bottom-0 left-1/2 h-full w-auto -translate-x-1/2 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition-opacity duration-1000 ease-in-out motion-reduce:transition-none",
              i === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === active}
            className={cn(
              "h-2 rounded-full transition-all",
              i === active
                ? "w-6 bg-gold"
                : "w-2 bg-ivory/40 hover:bg-ivory/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}
