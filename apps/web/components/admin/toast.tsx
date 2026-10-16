"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin toasts.
 *
 * A small store with an imperative API so any admin action — a form save, a
 * status change, a failed upload — can confirm itself without threading state
 * through the tree: `toast.success("Saved")` from anywhere, server round-trip
 * or not. One <Toaster /> lives in the shell and renders them.
 *
 * Deliberately not a dependency: the look has to match the rest of the admin
 * (square corners, botanical palette), and the behaviour we need is small.
 */

type Tone = "success" | "error" | "info";

export type Toast = {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
};

type Options = { description?: string; duration?: number };

let items: Toast[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(tone: Tone, title: string, options?: Options) {
  const id = (counter += 1);
  items = [...items, { id, tone, title, description: options?.description }];
  emit();

  // Errors linger a little longer — there is usually a next step to read.
  const duration = options?.duration ?? (tone === "error" ? 6000 : 4000);
  if (duration > 0 && typeof window !== "undefined") {
    window.setTimeout(() => dismiss(id), duration);
  }
  return id;
}

/** Call from anywhere: `toast.success("Saved and live on the site.")` */
export const toast = {
  success: (title: string, options?: Options) => push("success", title, options),
  error: (title: string, options?: Options) => push("error", title, options),
  info: (title: string, options?: Options) => push("info", title, options),
  dismiss,
};

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

const emptyServerSnapshot: Toast[] = [];

/** True on the client, false during SSR — without a setState-in-effect. */
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const toneStyles: Record<
  Tone,
  { accent: string; icon: typeof Check; iconClass: string }
> = {
  success: {
    accent: "border-l-brand-600",
    icon: Check,
    iconClass: "bg-brand-600/12 text-forest",
  },
  error: {
    accent: "border-l-terracotta",
    icon: TriangleAlert,
    iconClass: "bg-terracotta/12 text-terracotta",
  },
  info: {
    accent: "border-l-gold",
    icon: Info,
    iconClass: "bg-gold/25 text-charcoal",
  },
};

/** Mounted once in the admin shell. Renders the live toast stack. */
export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribe,
    () => items,
    () => emptyServerSnapshot,
  );
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>,
    document.body,
  );
}

function ToastCard({ toast: item }: { toast: Toast }) {
  const style = toneStyles[item.tone];
  const Icon = style.icon;

  // Enter animation: slide-and-fade in once, then hold. Reduced motion gets
  // the opacity only — no transform.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-border border-l-4 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(32,38,31,0.12)] transition-all duration-200 ease-out motion-reduce:transition-opacity",
        style.accent,
        shown
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 motion-reduce:translate-y-0",
      )}
    >
      <span
        aria-hidden
        className={cn("mt-0.5 grid size-6 shrink-0 place-items-center", style.iconClass)}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-charcoal">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center text-charcoal/40 transition-colors hover:text-charcoal"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
