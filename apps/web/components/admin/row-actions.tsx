"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  EllipsisVertical,
  ExternalLink,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import type { CollectionSpec } from "@/lib/admin/collections";
import { cn } from "@/lib/utils";

type Missing = { field: string; message: string };

/**
 * Per-row actions: publish or unpublish without opening the record, plus
 * edit, view and delete.
 *
 * Publishing from here runs the same server-side validation as the form, so
 * a row that is not ready comes back with the field checklist instead of
 * going live half-finished — it is rendered inline rather than swallowed
 * (docs/PLAN.md §3.3).
 */
export function RowActions({
  spec,
  id,
  title,
  slug,
  published,
  updatedAt,
}: {
  spec: CollectionSpec["key"];
  id: string;
  title: string;
  slug?: string;
  published: boolean;
  updatedAt: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<Missing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, like any menu.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function togglePublished() {
    setBusy(true);
    setMissing(null);
    setError(null);

    try {
      const response = await adminApi[spec].update({
        params: { id },
        body: {
          published: !published,
          expectedUpdatedAt: updatedAt,
        } as never,
      });

      if (response.status === 200) {
        setOpen(false);
        router.refresh();
        return;
      }

      if (response.status === 422) {
        const body = response.body as { missing?: Missing[]; error?: string };
        if (body.missing?.length) setMissing(body.missing);
        else setError(body.error ?? "That didn't work.");
        return;
      }

      if (response.status === 409) {
        setError("This changed somewhere else. Reload and try again.");
        return;
      }

      const body = response.body as { error?: string } | undefined;
      setError(body?.error ?? "That didn't work. Please try again.");
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const response = await adminApi[spec].remove({ params: { id } });
    setBusy(false);
    if (response.status === 200) {
      setOpen(false);
      router.refresh();
    } else {
      setError("Could not delete that.");
    }
  }

  const publicHref =
    spec === "services"
      ? "/services"
      : spec === "testimonials"
        ? "/"
        : `/${spec}/${slug ?? ""}`;

  return (
    <div ref={wrapper} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${title}`}
        className="grid size-9 place-items-center rounded-lg text-charcoal/60 transition-colors hover:bg-sage/40 hover:text-forest"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <EllipsisVertical className="size-4" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={togglePublished}
            disabled={busy}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-charcoal hover:bg-sage/30 disabled:opacity-60"
          >
            {published ? (
              <>
                <EyeOff className="size-4 text-charcoal/60" />
                Unpublish
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-brand-600" />
                Publish
              </>
            )}
          </button>

          <Link
            role="menuitem"
            href={`/admin/content/${spec}/${id}`}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-charcoal hover:bg-sage/30"
          >
            <Pencil className="size-4 text-charcoal/60" />
            Edit
          </Link>

          {published && (
            <a
              role="menuitem"
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-charcoal hover:bg-sage/30"
            >
              <ExternalLink className="size-4 text-charcoal/60" />
              View on the site
            </a>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={remove}
            disabled={busy}
            className="flex w-full items-center gap-2.5 border-t border-border/60 px-3.5 py-2.5 text-left text-sm text-terracotta hover:bg-terracotta/10 disabled:opacity-60"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      )}

      {/* Validation feedback stays on screen until dismissed. */}
      {(missing || error) && (
        <div
          role="alert"
          className={cn(
            "absolute right-0 top-10 z-40 w-72 rounded-xl border p-3 text-left text-xs shadow-lg",
            missing
              ? "border-gold/70 bg-[#fffbe8] text-charcoal"
              : "border-terracotta/40 bg-terracotta/10 text-terracotta",
          )}
        >
          {missing ? (
            <>
              <strong className="block text-sm">Not ready to publish</strong>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {missing.map((item) => (
                  <li key={item.field}>{item.message}</li>
                ))}
              </ul>
              <Link
                href={`/admin/content/${spec}/${id}`}
                className="mt-2 inline-block font-semibold underline"
              >
                Open and finish it
              </Link>
            </>
          ) : (
            error
          )}
          <button
            type="button"
            onClick={() => {
              setMissing(null);
              setError(null);
            }}
            className="mt-2 block text-[0.7rem] font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
