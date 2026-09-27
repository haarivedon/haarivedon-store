import Image from "next/image";
import { IncenseSmoke } from "@/components/sections/incense-smoke";
import { cn } from "@/lib/utils";

/**
 * Diya — a reusable decorative brass oil lamp with a lit flame, a soft gold
 * glow, and a thin wisp of smoke rising from the flame tip (via
 * {@link IncenseSmoke}).
 *
 * Transparent artwork, so it drops onto any surface. The default smoke tint is
 * near-white (best on dark/mid grounds); pass a darker `smokeColor` on light
 * sections. Size it by width, e.g. `className="w-[20rem]"`; the box reserves
 * headroom above the lamp for the smoke to climb into.
 */

// Stable references — a fresh array/object each render would restart the sim.
// One emitter sitting on the flame tip (fractions of the whole box).
const EMITTERS = [{ x: 0.846, y: 0.418, spread: 0.045, weight: 1 }];
const LIGHT_SMOKE = { r: 240, g: 239, b: 235 };

export function Diya({
  className,
  smokeColor = LIGHT_SMOKE,
  intensity = 0.9,
  glow = true,
  priority = false,
  alt = "Lit brass diya oil lamp",
}: {
  className?: string;
  smokeColor?: { r: number; g: number; b: number };
  intensity?: number;
  /** Soft, gently pulsing gold glow behind the flame. */
  glow?: boolean;
  priority?: boolean;
  alt?: string;
}) {
  return (
    // aspectRatio 1536 / 1638 = artwork (1536×1024) + 60% smoke headroom above.
    <div className={cn("relative aspect-[1536/1638]", className)}>
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/45 blur-2xl motion-safe:animate-pulse"
          style={{ left: "84.6%", top: "50%" }}
        />
      )}
      <Image
        src="/images/diya-lamp.webp"
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        sizes="(max-width: 640px) 70vw, 22rem"
        className="absolute inset-x-0 bottom-0 h-auto w-full select-none"
      />
      <IncenseSmoke
        className="absolute inset-0"
        emitters={EMITTERS}
        intensity={intensity}
        puffScale={0.45}
        smokeColor={smokeColor}
      />
    </div>
  );
}
