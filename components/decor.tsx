import { cn } from "@/lib/utils";

/* Natural leaf greens for the botanical sprig (light → deep). */
const TONES = [
  { fill: "#93c056", vein: "#4f7222" },
  { fill: "#6f9a30", vein: "#3c5a1a" },
  { fill: "#4d6f22", vein: "#2c4416" },
] as const;

/**
 * A single lanceolate (pointed, veined) leaf drawn from its base at the
 * origin with the tip pointing up (0, -34).
 */
function BotanicalLeaf({ fill, vein }: { fill: string; vein: string }) {
  return (
    <g>
      <path
        d="M0 0 C -9 -10 -7 -26 0 -34 C 7 -26 9 -10 0 0 Z"
        fill={fill}
      />
      {/* midrib */}
      <path d="M0 -1 L0 -32" stroke={vein} strokeWidth="0.9" strokeLinecap="round" />
      {/* lateral veins */}
      <path
        d="M0 -7 L -5 -13 M0 -7 L 5 -13 M0 -14 L -4.5 -20 M0 -14 L 4.5 -20 M0 -21 L -3.5 -26 M0 -21 L 3.5 -26"
        stroke={vein}
        strokeWidth="0.55"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
    </g>
  );
}

// Hand-placed leaves along the branch: [x, y, rotation, scale, tone index].
const LEAVES: [number, number, number, number, number][] = [
  [31, 30, -35, 1.0, 0],
  [31, 30, 28, 0.82, 1],
  [50, 48, -52, 1.12, 2],
  [50, 48, 12, 0.9, 0],
  [69, 68, -30, 1.05, 1],
  [69, 68, 36, 0.88, 2],
  [90, 88, -56, 1.16, 0],
  [90, 88, 6, 0.94, 1],
  [112, 109, -34, 1.0, 2],
  [112, 109, 32, 0.84, 0],
  [134, 130, -20, 0.96, 1],
  [150, 145, 16, 1.06, 2],
];

/**
 * A lush, hand-arranged botanical branch — the site's core leaf motif.
 * Decorative only; control its strength with `opacity-*` at the call site.
 */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 165"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 12 Q 70 70 150 145"
        stroke="#4d6f22"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {LEAVES.map(([x, y, rot, scale, tone], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
          <BotanicalLeaf fill={TONES[tone].fill} vein={TONES[tone].vein} />
        </g>
      ))}
    </svg>
  );
}

/** Small single-leaf glyph (themeable via currentColor) for eyebrows/marks. */
export function LeafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-brand", className)}
      aria-hidden="true"
    >
      <path
        d="M12 22 C5 16 6 5 12 2 C18 5 19 16 12 22 Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      <path
        d="M12 20 L12 4 M12 9 L8.5 6.5 M12 9 L15.5 6.5 M12 13 L8.5 11 M12 13 L15.5 11"
        stroke="var(--color-forest)"
        strokeOpacity="0.28"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A single lotus petal, tip pointing up, drawn from the mandala centre. */
function Petal({
  length,
  width,
  base,
}: {
  length: number;
  width: number;
  base: number;
}) {
  // Teardrop petal: two symmetric cubic curves meeting at a pointed tip.
  return (
    <path
      d={`M100 ${base}
          C ${100 - width} ${base - length * 0.35}, ${100 - width} ${base - length * 0.8}, 100 ${base - length}
          C ${100 + width} ${base - length * 0.8}, ${100 + width} ${base - length * 0.35}, 100 ${base}
          Z`}
    />
  );
}

/**
 * A proper, symmetric sacred-geometry mandala — two staggered rings of lotus
 * petals inside concentric guides, with radial spokes and a dotted crown.
 * Decorative only; colour via `currentColor`, strength via `opacity-*`.
 */
export function Mandala({ className }: { className?: string }) {
  const count = 12;
  const steps = Array.from({ length: count });
  const step = 360 / count;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      {/* Concentric guide rings */}
      <circle cx="100" cy="100" r="96" strokeOpacity="0.18" />
      <circle cx="100" cy="100" r="78" strokeOpacity="0.3" />
      <circle cx="100" cy="100" r="46" strokeOpacity="0.35" />
      <circle cx="100" cy="100" r="16" strokeOpacity="0.5" />

      {/* Outer ring of long petals */}
      {steps.map((_, i) => (
        <g key={`o${i}`} transform={`rotate(${i * step} 100 100)`} strokeOpacity="0.45">
          <Petal length={62} width={17} base={78} />
        </g>
      ))}

      {/* Inner ring, offset by half a step, shorter petals */}
      {steps.map((_, i) => (
        <g
          key={`i${i}`}
          transform={`rotate(${i * step + step / 2} 100 100)`}
          strokeOpacity="0.55"
        >
          <Petal length={30} width={10} base={46} />
        </g>
      ))}

      {/* Radial spokes into the crown of dots */}
      {steps.map((_, i) => (
        <g key={`d${i}`} transform={`rotate(${i * step} 100 100)`}>
          <circle cx="100" cy="88" r="1.5" fill="currentColor" stroke="none" fillOpacity="0.55" />
        </g>
      ))}

      {/* Centre bloom */}
      <circle cx="100" cy="100" r="5" fill="currentColor" stroke="none" fillOpacity="0.6" />
    </svg>
  );
}
