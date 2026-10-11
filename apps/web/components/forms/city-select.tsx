"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { Place } from "@repo/contract";
import { api } from "@/lib/api/client";
import { Field, inputClass } from "@/components/forms/field";
import { cn } from "@/lib/utils";

export type BirthPlace = {
  place: string;
  lat: number | null;
  lng: number | null;
  tz: string;
};

export const emptyBirthPlace: BirthPlace = {
  place: "",
  lat: null,
  lng: null,
  tz: "Asia/Kolkata",
};

/**
 * Birth-place picker.
 *
 * Searches the API rather than a list bundled with the page: the bundled
 * version had to stay small enough to download, which capped it at a couple
 * of hundred cities and left most people typing their own coordinates. The
 * server-side gazetteer covers every town of any size (`pnpm db:seed:places`).
 *
 * The chosen coordinates are always shown back — a silently wrong city
 * produces a silently wrong chart (docs/PLAN.md §13).
 */
export function CitySelect({
  value,
  onChange,
  errors,
}: {
  value: BirthPlace;
  onChange: (next: BirthPlace) => void;
  errors: Record<string, string>;
}) {
  const id = useId();
  const [query, setQuery] = useState(value.place);
  const [matches, setMatches] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);

  // Cleared on unmount so a late response cannot set state afterwards.
  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
      latest.current += 1;
    },
    [],
  );

  const search = (text: string) => {
    if (debounce.current) clearTimeout(debounce.current);

    if (text.trim().length < 2) {
      setMatches([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounce.current = setTimeout(async () => {
      const token = ++latest.current;
      try {
        const response = await api.places.search({
          query: { q: text.trim(), limit: 8 },
        });
        // Ignore a response that a newer keystroke has already superseded.
        if (token !== latest.current) return;
        setMatches(response.status === 200 ? response.body.data : []);
      } catch {
        if (token === latest.current) setMatches([]);
      } finally {
        if (token === latest.current) setSearching(false);
      }
    }, 250);
  };

  const pick = (place: Place) => {
    setQuery(place.label);
    setOpen(false);
    onChange({
      place: place.label,
      lat: place.lat,
      lng: place.lng,
      tz: place.timezone,
    });
  };

  const resolved = value.lat !== null && value.lng !== null;

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Place of birth"
        htmlFor={`${id}-place`}
        error={errors.birthPlace}
        hint={
          resolved && !manual
            ? `Using ${value.lat?.toFixed(4)}, ${value.lng?.toFixed(4)} · ${value.tz}`
            : "Start typing a town or city"
        }
      >
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={`${id}-place`}
            name="birthPlace"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && matches.length > 0}
            aria-controls={`${id}-listbox`}
            aria-invalid={Boolean(errors.birthPlace)}
            className={cn(inputClass, "pl-9 pr-9")}
            value={query}
            placeholder="e.g. Kanpur"
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              search(next);
              // Typing after a pick invalidates the coordinates: never submit
              // a place name with somebody else's latitude attached.
              onChange({ ...emptyBirthPlace, place: next, tz: value.tz });
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 150);
            }}
          />

          {searching && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {open && matches.length > 0 && (
            <ul
              id={`${id}-listbox`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
              }}
            >
              {matches.map((place) => (
                <li key={`${place.label}-${place.lat}`} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => pick(place)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 text-left text-sm text-charcoal hover:bg-sage/40"
                  >
                    <span className="truncate">{place.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {place.region || place.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {open && !searching && query.trim().length >= 2 && matches.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-popover px-3.5 py-3 text-sm text-muted-foreground shadow-lg">
              No match. Try a nearby larger town, or enter the coordinates
              below.
            </div>
          )}
        </div>
      </Field>

      <button
        type="button"
        onClick={() => setManual((previous) => !previous)}
        className="self-start text-xs font-medium text-brand-700 underline underline-offset-2"
      >
        {manual ? "Use the search instead" : "Can't find your place?"}
      </button>

      {manual && (
        <div className="grid gap-3 rounded-xl border border-border/70 bg-cream/50 p-4 sm:grid-cols-3">
          <Field label="Latitude" htmlFor={`${id}-lat`} error={errors.birthLat}>
            <input
              id={`${id}-lat`}
              className={inputClass}
              inputMode="decimal"
              placeholder="26.4499"
              value={value.lat ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  lat:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Longitude" htmlFor={`${id}-lng`} error={errors.birthLng}>
            <input
              id={`${id}-lng`}
              className={inputClass}
              inputMode="decimal"
              placeholder="80.3319"
              value={value.lng ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  lng:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field
            label="Timezone"
            htmlFor={`${id}-tz`}
            error={errors.birthTz}
            hint="e.g. Asia/Kolkata"
          >
            <input
              id={`${id}-tz`}
              className={inputClass}
              value={value.tz}
              onChange={(event) => onChange({ ...value, tz: event.target.value })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
