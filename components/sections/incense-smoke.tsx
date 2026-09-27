"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * IncenseSmoke — a GSAP-driven canvas plume of rising, curling incense smoke.
 *
 * Puffs are emitted near the bottom of the host box; each one's life is a
 * `gsap.to` tween, and `gsap.ticker` runs the draw loop. Warm, token-derived
 * colours are blended additively so the smoke glows against a dark ground.
 *
 * Respects `prefers-reduced-motion` (renders one static wisp, no animation)
 * and pauses when scrolled out of view or the tab is hidden.
 */

type Emitter = {
  /** Horizontal origin as a fraction of width (0 = left, 1 = right). */
  x: number;
  /** Vertical origin as a fraction of height (1 = bottom). Defaults to 1. */
  y?: number;
  /** How wide the plume can wander, in fractions of width. */
  spread: number;
  /** Relative density of this emitter (higher = more puffs). */
  weight: number;
};

type Particle = {
  t: number; // normalised life 0 → 1 (tweened by gsap)
  ox: number; // origin x in css px
  oy: number; // origin y in css px
  rise: number; // total vertical travel in css px
  drift: number; // net horizontal drift in css px
  curlAmp: number; // sideways wobble amplitude
  curlFreq: number; // wobble frequency over the life
  phase: number; // wobble phase offset
  r0: number; // start radius
  r1: number; // end radius (expands as it diffuses)
  maxAlpha: number;
  seed: number; // per-puff turbulence seed
  tween: gsap.core.Tween;
};

type RGB = { r: number; g: number; b: number };

const FALLBACK = {
  ivory: { r: 255, g: 253, b: 244 },
  gold: { r: 243, g: 216, b: 91 },
};

const MAX_PARTICLES = 64;

function readToken(name: string, fallback: RGB): RGB {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const hex = raw.replace("#", "");
  if (hex.length !== 6) return fallback;
  const n = Number.parseInt(hex, 16);
  if (Number.isNaN(n)) return fallback;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function IncenseSmoke({
  className,
  emitters = [{ x: 0.5, spread: 0.34, weight: 1 }],
  intensity = 1,
  puffScale = 1,
  smokeColor,
}: {
  className?: string;
  emitters?: Emitter[];
  intensity?: number;
  /** Multiplier on puff radius — smaller = thinner, wispier trails. */
  puffScale?: number;
  /** Override the smoke tint (defaults to a warm, token-derived grey). */
  smokeColor?: RGB;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sr = smokeColor?.r;
  const sg = smokeColor?.g;
  const sb = smokeColor?.b;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Default smoke: warm, light-grey nudged toward the brand tokens — kept a
    // touch darker than pure ivory so it reads over dark grounds with a plain
    // (source-over) blend. Callers can override via `smokeColor`.
    const ivory = readToken("--color-ivory", FALLBACK.ivory);
    const gold = readToken("--color-gold", FALLBACK.gold);
    const core: RGB =
      sr !== undefined && sg !== undefined && sb !== undefined
        ? { r: sr, g: sg, b: sb }
        : {
            r: Math.round((ivory.r * 0.75 + gold.r * 0.25) * 0.86),
            g: Math.round((ivory.g * 0.78 + gold.g * 0.22) * 0.86),
            b: Math.round((ivory.b * 0.82 + gold.b * 0.18) * 0.84),
          };

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Soft puff sprite baked once, then stamped — cheaper than per-frame gradients.
    const drawPuff = (x: number, y: number, r: number, alpha: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${core.r},${core.g},${core.b},${alpha})`);
      g.addColorStop(
        0.5,
        `rgba(${core.r},${core.g},${core.b},${alpha * 0.35})`,
      );
      g.addColorStop(1, `rgba(${core.r},${core.g},${core.b},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // ---- Reduced motion: a single soft static wisp, no animation. ----
    if (reduceMotion) {
      ctx.globalCompositeOperation = "source-over";
      const e0 = emitters[0];
      const cx = width * (e0?.x ?? 0.5);
      const cy = height * (e0?.y ?? 1);
      for (let i = 0; i < 6; i++) {
        const p = i / 5;
        drawPuff(
          cx + Math.sin(p * 3) * width * 0.04,
          cy - cy * p * 0.9,
          width * (0.05 + p * 0.08),
          0.12 * (1 - p * 0.6),
        );
      }
      return;
    }

    const particles: Particle[] = [];
    const totalWeight = emitters.reduce((s, e) => s + e.weight, 0) || 1;

    const pickEmitter = () => {
      let r = Math.random() * totalWeight;
      for (const e of emitters) {
        if ((r -= e.weight) <= 0) return e;
      }
      return emitters[0];
    };

    const spawn = () => {
      if (particles.length >= MAX_PARTICLES) return;
      const e = pickEmitter();
      const life = rand(4.2, 7.2);
      const oy = height * ((e.y ?? 1) + rand(-0.01, 0.02));
      const p: Particle = {
        t: 0,
        ox: width * e.x + rand(-1, 1) * width * 0.02,
        oy,
        rise: oy * rand(0.9, 1.12),
        drift: rand(-1, 1) * width * e.spread,
        curlAmp: width * rand(0.035, 0.08),
        curlFreq: rand(1.4, 2.8),
        phase: rand(0, Math.PI * 2),
        r0: width * rand(0.014, 0.028) * puffScale,
        r1: width * rand(0.13, 0.21) * puffScale,
        maxAlpha: rand(0.12, 0.22) * intensity,
        seed: rand(0, 1000),
        tween: null as unknown as gsap.core.Tween,
      };
      p.tween = gsap.to(p, {
        t: 1,
        duration: life,
        ease: "none",
        onComplete: () => {
          const idx = particles.indexOf(p);
          if (idx !== -1) particles.splice(idx, 1);
        },
      });
      particles.push(p);
    };

    // Ease helpers shaping each puff from its normalised life `t`.
    const alphaAt = (t: number) => {
      const fadeIn = Math.min(1, t / 0.16);
      const fadeOut = 1 - Math.max(0, (t - 0.45) / 0.55);
      return fadeIn * fadeOut * fadeOut;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      for (const p of particles) {
        const t = p.t;
        // Rise decelerates slightly as the smoke cools (easeOut on height).
        const y = p.oy - p.rise * (1 - Math.pow(1 - t, 1.7));
        // Curl widens as it rises; layered sines keep it from looking periodic.
        const wobble =
          Math.sin(t * p.curlFreq * Math.PI * 2 + p.phase) +
          0.5 * Math.sin(t * p.curlFreq * 1.9 * Math.PI * 2 + p.seed);
        const x = p.ox + p.drift * t + wobble * p.curlAmp * t;
        const r = p.r0 + (p.r1 - p.r0) * t;
        const alpha = alphaAt(t) * p.maxAlpha;
        if (alpha <= 0.001) continue;
        drawPuff(x, y, r, alpha);
      }
    };

    // Emission cadence, accumulated against ticker delta.
    const spawnEvery = 0.16 / intensity;
    let acc = spawnEvery; // seed one immediately
    let running = false;

    const tick = () => {
      const dt = gsap.ticker.deltaRatio() / 60; // seconds since last frame
      acc += dt;
      while (acc >= spawnEvery) {
        spawn();
        acc -= spawnEvery;
      }
      render();
    };

    const start = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
      particles.forEach((p) => p.tween.play());
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
      particles.forEach((p) => p.tween.pause());
    };

    // Fade the whole layer in on first reveal.
    gsap.fromTo(
      canvas,
      { opacity: 0 },
      { opacity: 1, duration: 2.2, ease: "power1.out" },
    );

    // Only run while visible on screen and the tab is focused.
    let onScreen = true;
    const syncRunning = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        syncRunning();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => syncRunning();
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    syncRunning();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      particles.forEach((p) => p.tween.kill());
      particles.length = 0;
      gsap.killTweensOf(canvas);
    };
    // `emitters` must be a stable reference (define it outside render or
    // memoize it) — a fresh array each render would restart the simulation.
  }, [emitters, intensity, puffScale, sr, sg, sb]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
