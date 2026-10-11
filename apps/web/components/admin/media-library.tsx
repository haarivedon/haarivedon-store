"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import type { Media } from "@repo/contract";
import { adminApi, API_BASE, uploadImage } from "@/lib/api/admin-client";
import { FieldShell, TextInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const absolute = (url: string) => (url.startsWith("/") ? `${API_BASE}${url}` : url);

/** Upload, rename alt text, delete. Alt text saves on blur. */
export function MediaLibrary({ initial }: { initial: Media[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await adminApi.listMedia({ query: { page: 1, perPage: 60 } });
    if (response.status === 200) setItems(response.body.data);
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // No description needed to upload — it is asked for on the image itself,
    // where you can see what you are describing.
    setBusy(true);
    setError(null);
    const result = await uploadImage(file, "");
    setBusy(false);
    event.target.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }
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
        <label
          className={cn(
            "inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:border-brand-600",
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

              <div className="mt-3">
                <FieldShell
                  label="What's in this picture?"
                  htmlFor={`alt-${item.id}`}
                  hint={
                    item.alt
                      ? undefined
                      : "Needed before a page using it can go live"
                  }
                  wide
                >
                  <TextInput
                    id={`alt-${item.id}`}
                    defaultValue={item.alt}
                    placeholder="e.g. Rudraksha beads on a linen cloth"
                    onBlur={(event) => void saveAlt(item.id, event.target.value)}
                  />
                </FieldShell>
              </div>

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
