import Image from "next/image";
import { IncenseSmoke } from "@/components/sections/incense-smoke";
import { cn } from "@/lib/utils";

/**
 * IncenseBurner — a reusable decorative brass lotus incense holder with three
 * sticks and live smoke rising from their tips (via {@link IncenseSmoke}).
 *
 * The artwork has a transparent background, so it drops onto any surface. The
 * default smoke tint is near-white and reads best on dark/mid grounds; pass a
 * darker `smokeColor` when placing it on a light (ivory/cream) section.
 *
 * The box reserves headroom above the artwork for the smoke to climb into, so
 * size it by width (e.g. `className="w-[22rem]"`).
 */

// Stable references — a fresh array/object each render would restart the sim.
// Positions are fractions of the *box* (artwork sits in the bottom ~62%, the
// rest is smoke headroom); x/y land on each burning tip.
const EMITTERS = [
  { x: 0.563, y: 0.443, spread: 0.05, weight: 1 },
  { x: 0.651, y: 0.395, spread: 0.055, weight: 1.15 },
  { x: 0.742, y: 0.435, spread: 0.05, weight: 1 },
];
const LIGHT_SMOKE = { r: 240, g: 239, b: 235 };

export function IncenseBurner({
  className,
  smokeColor = LIGHT_SMOKE,
  intensity = 1.4,
  priority = false,
  alt = "Brass lotus incense holder with three smoking incense sticks",
}: {
  className?: string;
  smokeColor?: { r: number; g: number; b: number };
  intensity?: number;
  priority?: boolean;
  alt?: string;
}) {
  return (
    // aspectRatio 1536 / 1254 = artwork (1536×784) + 60% smoke headroom above.
    <div className={cn("relative aspect-[1536/1254]", className)}>
      <Image
        src="/images/incense-holder.webp"
        alt={alt}
        width={1536}
        height={784}
        priority={priority}
        sizes="(max-width: 640px) 80vw, 24rem"
        className="absolute inset-x-0 bottom-0 h-auto w-full select-none"
      />
      <IncenseSmoke
        className="absolute inset-0"
        emitters={EMITTERS}
        intensity={intensity}
        puffScale={0.5}
        smokeColor={smokeColor}
      />
    </div>
  );
}
