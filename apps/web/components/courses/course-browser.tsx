"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, GraduationCap, Search } from "lucide-react";
import {
  courseCategories,
  courseCategoryLabels,
  courseFormatLabels,
  courseLevelLabels,
  courseLevels,
  type Course,
} from "@repo/contract";
import { formatPrice } from "@/lib/format";
import { inputClass } from "@/components/forms/field";
import { cn } from "@/lib/utils";

/**
 * Catalogue browser.
 *
 * The whole published index is loaded once by the server component and
 * filtered in the browser — with ~70 courses that is a few KB, and it means
 * no request per filter click (docs/PLAN.md §3.1).
 */
export function CourseBrowser({ courses }: { courses: Course[] }) {
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [query, setQuery] = useState("");

  const available = useMemo(() => {
    const present = new Set(courses.map((course) => course.category));
    return courseCategories.filter((key) => present.has(key));
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (category !== "all" && course.category !== category) return false;
      if (level !== "all" && course.level !== level) return false;
      if (q && !`${course.title} ${course.summary}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [courses, category, level, query]);

  // Grouped by category; a category with nothing in it is not rendered.
  const grouped = useMemo(
    () =>
      available
        .map((key) => ({
          key,
          label: courseCategoryLabels[key],
          items: filtered.filter((course) => course.category === key),
        }))
        .filter((group) => group.items.length > 0),
    [available, filtered],
  );

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-ivory/80 p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses"
            aria-label="Search courses"
            className={cn(inputClass, "pl-9")}
          />
        </div>

        <Filter
          legend="Category"
          options={[
            { value: "all", label: "All" },
            ...available.map((key) => ({
              value: key,
              label: courseCategoryLabels[key],
            })),
          ]}
          value={category}
          onChange={setCategory}
        />

        <Filter
          legend="Level"
          options={[
            { value: "all", label: "All levels" },
            ...courseLevels.map((key) => ({
              value: key,
              label: courseLevelLabels[key],
            })),
          ]}
          value={level}
          onChange={setLevel}
        />
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "course" : "courses"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-cream/60 p-6 text-center text-sm text-muted-foreground">
          Nothing matches that. Try a different search, or{" "}
          <Link href="/book" className="font-medium text-forest underline">
            ask us
          </Link>{" "}
          which course fits what you want to learn.
        </p>
      ) : (
        <div className="mt-6 space-y-12">
          {grouped.map((group) => (
            <section key={group.key} aria-labelledby={`cat-${group.key}`}>
              <h2
                id={`cat-${group.key}`}
                className="font-display text-xl font-semibold text-forest"
              >
                {group.label}
              </h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((course) => (
                  <li key={course.id}>
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Filter({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      <span
        aria-hidden
        className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {legend}
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-9 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "border-forest bg-forest text-ivory"
              : "border-border bg-background text-charcoal/80 hover:border-brand-600 hover:text-forest",
          )}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative aspect-video bg-sage/30">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-base text-forest/70">
            {course.title}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ivory/90 px-2.5 py-1 text-[0.7rem] font-semibold text-forest">
          {courseLevelLabels[course.level]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-forest">
          {course.title}
        </h3>
        {course.summary && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {course.summary}
          </p>
        )}

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-charcoal/70">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-brand-600" />
            <dd>{courseFormatLabels[course.format]}</dd>
          </div>
          {course.duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand-600" />
              <dd>{course.duration}</dd>
            </div>
          )}
        </dl>

        <p className="mt-auto pt-4 text-sm font-semibold text-forest">
          {formatPrice(course.price, course.currency)}
        </p>
      </div>
    </Link>
  );
}
