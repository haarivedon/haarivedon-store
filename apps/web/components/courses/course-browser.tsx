"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Search, X } from "lucide-react";
import {
  courseCategories,
  courseCategoryLabels,
  courseFormatLabels,
  courseLevelLabels,
  courseLevels,
  type Course,
} from "@repo/contract";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Catalogue browser.
 *
 * The whole published index is loaded once by the server component and
 * filtered in the browser — at ~70 courses that is a few KB, and it avoids a
 * request per filter click (docs/PLAN.md §3.1).
 *
 * The default view is a list of categories with counts, not 70 cards: the
 * first question a visitor has is "what subjects are taught here", and a
 * long flat grid answers that badly. Picking a subject, searching, or
 * choosing a level switches to results.
 */
export function CourseBrowser({ courses }: { courses: Course[] }) {
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () =>
      courseCategories
        .map((key) => ({
          key,
          label: courseCategoryLabels[key],
          count: courses.filter((course) => course.category === key).length,
        }))
        .filter((group) => group.count > 0),
    [courses],
  );

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

  const browsing = category === "all" && level === "all" && !query.trim();
  const clear = () => {
    setCategory("all");
    setLevel("all");
    setQuery("");
  };

  return (
    <div>
      {/* Search and level sit together; category is the big choice below. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name — e.g. tarot, vastu, numerology"
            aria-label="Search courses"
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3.5 text-base shadow-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25 sm:text-sm"
          />
        </div>

        {/* A native select on small screens: three pills plus fourteen
            categories is too much tapping on a phone. */}
        <label className="sm:hidden">
          <span className="sr-only">Level</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base shadow-sm"
          >
            <option value="all">Every level</option>
            {courseLevels.map((key) => (
              <option key={key} value={key}>
                {courseLevelLabels[key]}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {[{ value: "all", label: "Every level" }, ...courseLevels.map((key) => ({ value: key, label: courseLevelLabels[key] }))].map(
            (option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={level === option.value}
                onClick={() => setLevel(option.value)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                  level === option.value
                    ? "border-forest bg-forest text-ivory"
                    : "border-border bg-background text-charcoal/80 hover:border-brand-600",
                )}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      </div>

      {/* What the three levels mean — otherwise they are just labels. */}
      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <div className="flex gap-1.5">
          <dt className="font-semibold text-charcoal/80">Foundation:</dt>
          <dd>start here, no background needed</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold text-charcoal/80">Advanced:</dt>
          <dd>builds on a foundation course</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold text-charcoal/80">Premium:</dt>
          <dd>in-depth, small group</dd>
        </div>
      </dl>

      {browsing ? (
        <section className="mt-8" aria-label="Course subjects">
          <h2 className="font-display text-lg font-semibold text-forest">
            Browse by subject
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length} courses across {categories.length} subjects.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setCategory(item.key)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-5 py-4 text-left shadow-sm transition-colors hover:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span>
                    <span className="block font-display text-base font-semibold text-forest">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.count} {item.count === 1 ? "course" : "courses"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brand-600" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-8" aria-label="Matching courses">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              <span className="font-semibold text-forest">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "course" : "courses"}
              {category !== "all" &&
                ` in ${courseCategoryLabels[category as keyof typeof courseCategoryLabels]}`}
            </p>
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-700 underline underline-offset-2"
            >
              <X className="size-3.5" />
              Clear and browse all subjects
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-cream/60 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing matches that yet.
              </p>
              <Link
                href="/book"
                className="mt-2 inline-block text-sm font-medium text-forest underline underline-offset-2"
              >
                Ask us what would suit you
              </Link>
            </div>
          ) : (
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-base text-forest/70">
            {course.title}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-2.5 py-1 text-[0.7rem] font-semibold text-forest">
          {courseLevelLabels[course.level]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
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
            <dt className="sr-only">Format</dt>
            <dd>{courseFormatLabels[course.format]}</dd>
          </div>
          {course.duration && (
            <div className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5 text-brand-600" />
              <dt className="sr-only">Duration</dt>
              <dd>{course.duration}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="text-sm font-semibold text-forest">
            {formatPrice(course.price, course.currency)}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Details
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
