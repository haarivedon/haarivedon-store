"use client";

import { useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { INDIA_TZ, searchCities, type City } from "@/lib/content/cities";
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
  tz: INDIA_TZ,
};

/**
 * Birth-place picker over the bundled city list, with a manual override for
 * anywhere not in it.
 *
 * The chosen coordinates are always shown back to the person filling the form
 * — a silently wrong city produces a silently wrong chart (PLAN.md §13).
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
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => (open ? searchCities(query) : []), [open, query]);
  const resolved = value.lat !== null && value.lng !== null;

  const pick = (city: City) => {
    setQuery(city.label);
    setOpen(false);
    onChange({ place: city.label, lat: city.lat, lng: city.lng, tz: INDIA_TZ });
  };

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Place of birth"
        htmlFor={`${id}-place`}
        error={errors.birthPlace}
        hint={
          resolved && !manual
            ? `Using ${value.lat?.toFixed(4)}, ${value.lng?.toFixed(4)} · ${value.tz}`
            : "Start typing a city name"
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
            className={cn(inputClass, "pl-9")}
            value={query}
            placeholder="e.g. Kanpur"
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              // Typing after a pick invalidates the coordinates: never submit
              // a place name with somebody else's latitude attached.
              onChange({ ...emptyBirthPlace, place: next, tz: value.tz });
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
          />

          {open && matches.length > 0 && (
            <ul
              id={`${id}-listbox`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
              }}
            >
              {matches.map((city) => (
                <li key={city.label} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => pick(city)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-charcoal hover:bg-sage/40"
                  >
                    <span>{city.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {city.state}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>

      <button
        type="button"
        onClick={() => setManual((previous) => !previous)}
        className="self-start text-xs font-medium text-brand-700 underline underline-offset-2"
      >
        {manual ? "Use the city list instead" : "Can't find your city?"}
      </button>

      {manual && (
        <div className="grid gap-3 rounded-xl border border-border/70 bg-cream/50 p-4 sm:grid-cols-3">
          <Field
            label="Latitude"
            htmlFor={`${id}-lat`}
            error={errors.birthLat}
          >
            <input
              id={`${id}-lat`}
              className={inputClass}
              inputMode="decimal"
              placeholder="26.4499"
              value={value.lat ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  lat: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field
            label="Longitude"
            htmlFor={`${id}-lng`}
            error={errors.birthLng}
          >
            <input
              id={`${id}-lng`}
              className={inputClass}
              inputMode="decimal"
              placeholder="80.3319"
              value={value.lng ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  lng: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Timezone" htmlFor={`${id}-tz`} error={errors.birthTz}>
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
