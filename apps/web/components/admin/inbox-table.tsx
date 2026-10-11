"use client";

import { useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { adminApi, API_BASE } from "@/lib/api/admin-client";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type InboxKind = "bookings" | "predictions" | "enquiries";

type Row = Record<string, unknown> & { id: string; createdAt: string };

/** Plain-language labels for the stored status values. */
const statusLabels: Record<string, string> = {
  pending: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "in-progress": "In progress",
  delivered: "Delivered",
  contacted: "Contacted",
  enrolled: "Enrolled",
  closed: "Closed",
};

const statusOptions: Record<InboxKind, string[]> = {
  bookings: ["pending", "confirmed", "completed", "cancelled"],
  predictions: ["pending", "in-progress", "delivered"],
  enquiries: ["pending", "contacted", "enrolled", "closed"],
};

/**
 * Submissions inbox: read and triage, never author. Status and the internal
 * note save immediately; the note is admin-only and never rendered publicly
 * (docs/PLAN.md §3.3).
 */
export function InboxTable({ kind, rows }: { kind: InboxKind; rows: Row[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="mt-8 rounded-2xl bg-ivory/80 p-8 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-border/60 bg-card shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(open === row.id ? null : row.id)}
            aria-expanded={open === row.id}
            className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 text-left"
          >
            <span className="font-medium text-forest">{String(row.name)}</span>
            <span className="text-sm text-muted-foreground">
              {String(row.phone ?? row.email ?? "")}
            </span>
            {kind === "enquiries" && (
              <span className="text-sm text-charcoal/70">
                {String(row.courseTitle ?? row.courseSlug ?? "")}
              </span>
            )}
            <span className="ml-auto flex items-center gap-3">
              {kind === "bookings" && (
                <KundaliBadge status={String(row.kundaliStatus ?? "")} />
              )}
              <span className="rounded-full bg-charcoal/10 px-2.5 py-1 text-xs font-semibold text-charcoal/75">
                {statusLabels[String(row.status)] ?? String(row.status)}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(row.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </span>
          </button>

          {open === row.id && <Detail kind={kind} row={row} />}
        </li>
      ))}
    </ul>
  );
}

function KundaliBadge({ status }: { status: string }) {
  if (!status) return null;
  const tones: Record<string, string> = {
    ready: "bg-brand-600/15 text-forest",
    pending: "bg-gold/25 text-charcoal",
    failed: "bg-terracotta/15 text-terracotta",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[status] ?? "bg-charcoal/10",
      )}
    >
      Kundali: {status}
    </span>
  );
}

function Detail({ kind, row }: { kind: InboxKind; row: Row }) {
  const [status, setStatus] = useState(String(row.status));
  const [note, setNote] = useState(String(row.internalNote ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kundali, setKundali] = useState(String(row.kundaliStatus ?? ""));

  const fields: [string, string][] = [
    ["Name", String(row.name)],
    ["Mobile", String(row.phone ?? "—")],
    ["Email", String(row.email ?? "—")],
    ...(kind === "bookings"
      ? ([
          ["Date of birth", new Date(String(row.dateOfBirth)).toLocaleDateString("en-IN")],
          ["Time of birth", String(row.timeOfBirth)],
          ["Place of birth", String(row.birthPlace)],
          ["Coordinates", `${row.birthLat}, ${row.birthLng}`],
          ["Session type", String(row.sessionType)],
          ["Message", String(row.message || "—")],
        ] as [string, string][])
      : []),
    ...(kind === "predictions"
      ? ([
          ["Date of birth", new Date(String(row.dateOfBirth)).toLocaleDateString("en-IN")],
          ["Time of birth", String(row.timeOfBirth || "—")],
          ["Place of birth", String(row.placeOfBirth)],
          ["Focus", String(row.focusArea)],
          ["Question", String(row.question || "—")],
        ] as [string, string][])
      : []),
    ...(kind === "enquiries"
      ? ([
          ["Course", String(row.courseTitle || row.courseSlug)],
          ["Message", String(row.message || "—")],
        ] as [string, string][])
      : []),
  ];

  async function save() {
    setSaving(true);
    setSaved(false);
    const body = { status, internalNote: note } as never;
    const response =
      kind === "bookings"
        ? await adminApi.updateBooking({ params: { id: row.id }, body })
        : kind === "predictions"
          ? await adminApi.updatePrediction({ params: { id: row.id }, body })
          : await adminApi.updateEnquiry({ params: { id: row.id }, body });
    setSaving(false);
    if (response.status === 200) setSaved(true);
  }

  async function regenerate() {
    setKundali("pending");
    await adminApi.regenerateKundali({ params: { id: row.id }, body: {} });
  }

  return (
    <div className="border-t border-border/60 px-4 py-4">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{label}:</dt>
            <dd className="text-charcoal">{value}</dd>
          </div>
        ))}
      </dl>

      {kind === "bookings" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {row.hasKundali ? (
            <a
              href={`${API_BASE}/api/kundali/${row.id}/download?token=`}
              onClick={(event) => {
                // The download needs the submitter's token, which the admin
                // does not hold; re-generate instead of guessing a URL.
                event.preventDefault();
                void regenerate();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline"
            >
              <Download className="size-4" />
              Re-issue Kundali
            </a>
          ) : (
            <button
              type="button"
              onClick={regenerate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-brand-600"
            >
              <RefreshCw className="size-4 text-brand-600" />
              Generate Kundali
            </button>
          )}
          <KundaliBadge status={kundali} />
          {row.kundaliError ? (
            <span className="text-xs text-terracotta">
              {String(row.kundaliError)}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">Status</span>
          <Select
            value={status}
            onValueChange={setStatus}
            options={statusOptions[kind].map((option) => ({
              value: option,
              label: statusLabels[option] ?? option,
            }))}
          />
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-charcoal/90">
            Internal note{" "}
            <span className="font-normal text-muted-foreground">
              — only visible here
            </span>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-ivory disabled:opacity-70"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save
        </button>
        {saved && (
          <span role="status" className="text-sm text-forest">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
