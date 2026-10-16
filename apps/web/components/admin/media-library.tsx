"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import type { Media } from "@repo/contract";
import { adminApi, uploadImage } from "@/lib/api/admin-client";
import { toast } from "@/components/admin/toast";
import { FieldShell, TextInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * Media URLs are stored root-relative and proxied by the rewrite in
 * next.config.ts, so they resolve on this origin as-is. R2 URLs are already
 * absolute and pass straight through.
 */
const absolute = (url: string) => url;

/** Upload, rename alt text, delete. Alt text saves on blur. */
export function MediaLibrary({ initial }: { initial: Media[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);

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
    const result = await uploadImage(file, "");
    setBusy(false);
    event.target.value = "";

    if (!result.ok) {
      toast.error("Upload failed", { description: result.error });
      return;
    }
    await refresh();
    toast.success("Image uploaded.", {
      description: "Add a description so pages using it can go live.",
    });
  }

  async function saveAlt(id: string, next: string) {
    const current = items.find((item) => item.id === id);
    if (current && current.alt === next) return; // nothing changed on blur

    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, alt: next } : item)),
    );
    const response = await adminApi.updateMedia({ params: { id }, body: { alt: next } });
    if (response.status === 200) toast.success("Description saved.");
    else toast.error("Couldn't save the description", { description: "Please try again." });
  }

  async function remove(id: string) {
    const response = await adminApi.removeMedia({ params: { id } });
    if (response.status === 200) {
      setItems((previous) => previous.filter((item) => item.id !== id));
      toast.success("Image deleted.");
    } else {
      toast.error("Couldn't delete that image", { description: "Please try again." });
    }
  }

  return (
    <div>
      <div className="border border-border bg-card p-5">
        <label
          className={cn(
            "inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 border border-border bg-background px-4 py-2.5 text-sm font-medium hover:border-brand-600",
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

        <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr]">
          <dt className="font-medium text-charcoal/80">Recommended size</dt>
          <dd>1600px or wider on the longest edge — sharp on large screens.</dd>
          <dt className="font-medium text-charcoal/80">File type</dt>
          <dd>JPEG, PNG or WebP, up to 10 MB.</dd>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Each image is resized to 1600px, converted to WebP, and stripped of
          camera location data on upload.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 border border-border bg-ivory/80 p-8 text-center text-sm text-muted-foreground">
          No images yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border border-border bg-card p-3"
            >
              <div className="relative aspect-video overflow-hidden border border-border/60 bg-sage/30">
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
