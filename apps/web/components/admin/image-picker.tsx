"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { Media } from "@repo/contract";
import { adminApi, API_BASE, uploadImage } from "@/lib/api/admin-client";
import { FieldShell, TextInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const absolute = (url: string) => (url.startsWith("/") ? `${API_BASE}${url}` : url);

/**
 * Image picker: upload, pick from recent uploads, and edit alt text inline.
 * Never a bare URL input — and alt text is required before a record can be
 * published, so it is collected at the point of upload (docs/PLAN.md §3.3).
 */
export function ImagePicker({
  value,
  onChange,
  multiple = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  const [library, setLibrary] = useState<Media[]>([]);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await adminApi.listMedia({ query: { page: 1, perPage: 24 } });
    if (response.status === 200) setLibrary(response.body.data);
  }

  // Loaded after mount rather than during it: setting state synchronously in
  // an effect cascades renders, which the lint rule catches.
  useEffect(() => {
    let active = true;
    void adminApi
      .listMedia({ query: { page: 1, perPage: 24 } })
      .then((response) => {
        if (active && response.status === 200) setLibrary(response.body.data);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!alt.trim()) {
      setError(
        "Describe the image first — a short sentence. It is read aloud to people using screen readers, and it is required before publishing.",
      );
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
    onChange(multiple ? [...value, result.media.url] : [result.media.url]);
  }

  const selected = value.filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-ivory/60 p-4">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {selected.map((url) => {
            const media = library.find((item) => item.url === url);
            return (
              <li key={url} className="w-32">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-sage/30">
                  <Image
                    src={absolute(url)}
                    alt={media?.alt ?? ""}
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 line-clamp-2 text-[0.7rem]",
                    media && !media.alt
                      ? "font-medium text-terracotta"
                      : "text-muted-foreground",
                  )}
                >
                  {media?.alt || "No alt text — add it below"}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== url))}
                  className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-medium text-terracotta hover:underline"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <FieldShell
        label="Describe the new image"
        htmlFor="media-alt"
        hint="Needed before upload, e.g. “Rudraksha beads on a linen cloth”"
        wide
      >
        <TextInput
          id="media-alt"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
        />
      </FieldShell>

      <label
        className={cn(
          "inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-medium text-charcoal shadow-sm transition-colors hover:border-brand-600",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4 text-brand-600" />
        )}
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
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      )}

      {library.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-brand-700">
            Choose from {library.length} uploaded images
          </summary>
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {library.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange(multiple ? [...value, item.url] : [item.url])
                  }
                  className="relative block aspect-square w-full overflow-hidden rounded-lg border border-border hover:border-brand-600"
                  title={item.alt || "No alt text"}
                >
                  <Image
                    src={absolute(item.url)}
                    alt={item.alt}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP, up to 10 MB. Photos are resized and stripped of
        location data automatically.
      </p>
    </div>
  );
}
