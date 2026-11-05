"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2, Save, Shuffle } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import { toast } from "@/components/admin/toast";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; slug?: string };

/** ts-rest unions the per-collection reorder; narrow to the shared shape. */
type Reorderable = {
  reorder: (args: {
    body: { ids: string[] };
  }) => Promise<{ status: number }>;
};

/**
 * Drag-to-reorder for a content collection. Reorders locally, then persists the
 * full id order to `/admin/<collection>/reorder` (sets `order = index + 1`).
 */
export function ReorderList({
  collection,
  items: initial,
}: {
  collection: string;
  items: Item[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const shuffle = () => {
    setItems((current) => {
      const out = [...current];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    });
    setDirty(true);
  };

  const move = (overId: string) => {
    if (!dragId || dragId === overId) return;
    setItems((current) => {
      const from = current.findIndex((i) => i.id === dragId);
      const to = current.findIndex((i) => i.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    try {
      const client = (adminApi as unknown as Record<string, Reorderable>)[
        collection
      ];
      const response = await client.reorder({
        body: { ids: items.map((i) => i.id) },
      });
      if (response.status === 200) {
        toast.success("Order saved.");
        setDirty(false);
        router.refresh();
      } else {
        toast.error("Could not save the order.");
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(event) => {
              event.preventDefault();
              move(item.id);
            }}
            className={cn(
              "flex items-center gap-3 border border-border bg-white px-4 py-3",
              dragId === item.id && "opacity-40",
            )}
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
            <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-forest">
              {item.title}
            </span>
            {item.slug && (
              <span className="shrink-0 truncate text-xs text-muted-foreground">
                /{item.slug}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className={cn(buttonVariants({ size: "sm" }), "h-10 disabled:opacity-60")}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save order
        </button>
        <button
          type="button"
          onClick={shuffle}
          disabled={saving || items.length < 2}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 disabled:opacity-60",
          )}
        >
          <Shuffle className="size-4" />
          Shuffle
        </button>
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
