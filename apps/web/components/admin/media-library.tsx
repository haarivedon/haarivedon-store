"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import type { Media } from "@repo/contract";
import { adminApi, API_BASE, uploadImage } from "@/lib/api/admin-client";
import { inputClass } from "@/components/forms/field";
import { cn } from "@/lib/utils";

const absolute = (url: string) => (url.startsWith("/") ? `${API_BASE}${url}` : url);

/** Upload, rename alt text, delete. Alt text saves on blur. */
export function MediaLibrary({ initial }: { initial: Media[] }) {
  const [items, setItems] = useState(initial);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await adminApi.listMedia({ query: { page: 1, perPage: 60 } });
    if (response.status === 200) setItems(response.body.data);
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!alt.trim()) {
      setError("Describe the image first — it is required before publishing.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    setError(null);
    const result = await uploadImage(file, alt.trim());
    setBusy(false);
    event.target.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAlt("");
    await refresh();
  }

  async function saveAlt(id: string, next: string) {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, alt: next } : item)),
    );
    await adminApi.updateMedia({ params: { id }, body: { alt: next } });
  }

  async function remove(id: string) {
    const response = await adminApi.removeMedia({ params: { id } });
    if (response.status === 200) {
      setItems((previous) => previous.filter((item) => item.id !== id));
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">Describe the image</span>
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="e.g. Rudraksha beads on a linen cloth"
            className={inputClass}
          />
        </label>

        <label
          className={cn(
            "mt-3 inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:border-brand-600",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Uploading…" : "Upload an image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onFile}
            disabled={busy}
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-terracotta">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          JPEG, PNG or WebP up to 10 MB. Images are resized to 1600px, converted
          to WebP, and stripped of camera location data.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-ivory/80 p-8 text-center text-sm text-muted-foreground">
          No images yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-sage/30">
                <Image
                  src={absolute(item.url)}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <label className="mt-3 flex flex-col gap-1 text-xs">
                <span className="font-medium text-charcoal/80">Alt text</span>
                <input
                  defaultValue={item.alt}
                  onBlur={(event) => void saveAlt(item.id, event.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
                />
              </label>

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {item.width}×{item.height} · {Math.round(item.bytes / 1024)} KB
                </span>
                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  className="inline-flex items-center gap-1 font-medium text-terracotta hover:underline"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
