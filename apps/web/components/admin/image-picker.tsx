"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
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

/**
 * Image picker: upload, pick from recent uploads, and describe the picture.
 *
 * The description is what a screen reader announces and what shows if the
 * image fails to load. It is NOT required to upload — being stopped by a
 * field you don't recognise is a bad first experience — but a published page
 * does need one, so the prompt follows the image around until it has one and
 * the record's own title is offered as a one-tap answer.
 */
export function ImagePicker({
  value,
  onChange,
  multiple = false,
  /** Usually the record's title: almost always a correct description. */
  suggestedAlt,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  suggestedAlt?: string;
}) {
  const [library, setLibrary] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Two-step delete: the trash icon arms it, a second tap confirms. */
  const [confirming, setConfirming] = useState<string | null>(null);

  async function refresh() {
    const response = await adminApi.listMedia({ query: { page: 1, perPage: 24 } });
    if (response.status === 200) setLibrary(response.body.data);
  }

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

    setBusy(true);
    setError(null);
    // Start from the record's title; it can be edited on the image after.
    const result = await uploadImage(file, (suggestedAlt ?? "").trim());
    setBusy(false);
    event.target.value = "";

    if (!result.ok) {
      setError(result.error);
      toast.error("Upload failed", { description: result.error });
      return;
    }

    await refresh();
    onChange(multiple ? [...value, result.media.url] : [result.media.url]);
    toast.success("Image uploaded.");
  }

  /** Deletes from the library for good, and detaches it here if in use. */
  async function deleteMedia(media: Media) {
    setConfirming(null);
    setError(null);

    const response = await adminApi.removeMedia({ params: { id: media.id } });
    if (response.status !== 200) {
      setError("That image could not be deleted.");
      toast.error("Couldn't delete that image", { description: "Please try again." });
      return;
    }

    setLibrary((previous) => previous.filter((item) => item.id !== media.id));
    onChange(value.filter((url) => url !== media.url));
    toast.success("Image deleted.");
  }

  async function saveAlt(id: string, alt: string) {
    setLibrary((previous) =>
      previous.map((item) => (item.id === id ? { ...item, alt } : item)),
    );
    await adminApi.updateMedia({ params: { id }, body: { alt } });
  }

  const selected = value.filter(Boolean);

  return (
    <div className="flex flex-col gap-4 border border-border bg-[#faf9f3] p-4">
      {selected.length > 0 && (
        <ul className="flex flex-col gap-3">
          {selected.map((url) => {
            const media = library.find((item) => item.url === url);
            return (
              <li
                key={url}
                className="flex flex-col gap-3 border border-border/70 bg-white p-3 sm:flex-row"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden border border-border/60 bg-sage/30 sm:aspect-square sm:w-28">
                  <Image
                    src={absolute(url)}
                    alt={media?.alt ?? ""}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {media ? (
                    <AltField
                      media={media}
                      suggestion={suggestedAlt}
                      onSave={(alt) => saveAlt(media.id, alt)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Loading image details…
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => onChange(value.filter((item) => item !== url))}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-terracotta hover:underline"
                  >
                    <Trash2 className="size-3" />
                    Remove from this {multiple ? "list" : "record"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <label
        className={cn(
          "inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 border border-border bg-white px-4 text-sm font-medium text-charcoal transition-colors hover:border-brand-600",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4 text-brand-600" />
        )}
        {busy ? "Uploading…" : selected.length ? "Upload another" : "Upload an image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onFile}
          disabled={busy}
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Recommended: 1600px or wider on the longest edge, up to 10 MB. JPEG, PNG
        or WebP.
      </p>

      {error && (
        <p role="alert" className="text-sm font-medium text-terracotta">
          {error}
        </p>
      )}

      {library.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-brand-700">
            Or choose from {library.length} uploaded images
          </summary>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {library.map((item) => {
              const inUse = value.includes(item.url);
              return (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      onChange(multiple ? [...value, item.url] : [item.url])
                    }
                    className={cn(
                      "relative block aspect-square w-full overflow-hidden border",
                      inUse
                        ? "border-brand-600 ring-2 ring-brand-600/30"
                        : "border-border hover:border-brand-600",
                    )}
                    title={item.alt || "No description yet"}
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

                  {confirming === item.id ? (
                    <div className="absolute inset-0 grid place-items-center gap-1 bg-charcoal/80 p-1 text-center">
                      <p className="text-[0.6rem] font-semibold leading-tight text-white">
                        Delete for good?
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => void deleteMedia(item)}
                          aria-label={`Confirm deleting ${item.alt || "this image"}`}
                          className="grid size-7 place-items-center bg-terracotta text-white"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          aria-label="Cancel"
                          className="grid size-7 place-items-center bg-white text-charcoal"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(item.id)}
                      aria-label={`Delete ${item.alt || "this image"} from the library`}
                      className="absolute right-1 top-1 grid size-7 place-items-center bg-white/90 text-terracotta shadow-sm transition-colors hover:bg-white"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-2 text-xs text-muted-foreground">
            Deleting removes the image everywhere it is used, not just here.
          </p>
        </details>
      )}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP up to 10 MB. Photos are resized and stripped of
        location data automatically.
      </p>
    </div>
  );
}

/**
 * The description field, attached to the image rather than to the upload
 * button — it only makes sense once you can see the picture it describes.
 */
function AltField({
  media,
  suggestion,
  onSave,
}: {
  media: Media;
  suggestion?: string;
  onSave: (alt: string) => void;
}) {
  const [alt, setAlt] = useState(media.alt);
  const missing = !alt.trim();

  return (
    <div>
      <FieldShell
        label="What's in this picture?"
        htmlFor={`alt-${media.id}`}
        hint={
          missing
            ? "Read aloud to visitors who can't see images. Needed before this page goes live."
            : "Saved."
        }
        wide
      >
        <TextInput
          id={`alt-${media.id}`}
          value={alt}
          placeholder="e.g. Rudraksha beads on a linen cloth"
          onChange={(event) => setAlt(event.target.value)}
          onBlur={() => alt !== media.alt && onSave(alt)}
        />
      </FieldShell>

      {missing && suggestion?.trim() && (
        <button
          type="button"
          onClick={() => {
            setAlt(suggestion);
            onSave(suggestion);
          }}
          className="mt-1.5 text-xs font-medium text-brand-700 underline underline-offset-2"
        >
          Use “{suggestion}”
        </button>
      )}
    </div>
  );
}
