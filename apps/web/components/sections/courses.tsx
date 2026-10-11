import Link from "next/link";
import Image from "next/image";
import { Clock, GraduationCap } from "lucide-react";
import { courseFormatLabels, courseLevelLabels } from "@repo/contract";
import { Section, SectionHeader } from "@/components/section";
import { formatPrice } from "@/lib/format";
import { getCourses } from "@/lib/api/content";

/**
 * Home-page course strip.
 *
 * Reads the featured courses from the API rather than a hardcoded array, so
 * the client controls what appears here from the admin (docs/PLAN.md §3.1).
 * Falls back to the newest published courses if nothing is flagged featured,
 * and renders nothing at all if the catalogue is empty — better an absent
 * section than an empty one (§13).
 */
export async function Courses() {
  // `featured` is a stringbool in the contract: the wire value is a string.
  const featured = await getCourses({ featured: "true", perPage: 3 });
  const courses = featured.length
    ? featured.slice(0, 3)
    : (await getCourses({ perPage: 3 })).slice(0, 3);

  if (courses.length === 0) return null;

  return (
    <Section id="courses" background="ivory">
      <SectionHeader
        eyebrow="Learn With Us"
        title="Courses &amp; Mentorship"
        description="Go beyond a single session — learn the practices for yourself, at your own pace, with guidance every step."
        actionHref="/courses"
        actionLabel="View All Courses"
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <div className="relative aspect-video bg-sage/30">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-4 text-center font-display text-lg text-forest/70">
                  {course.title}
                </span>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-ivory/90 px-2.5 py-1 text-[0.7rem] font-semibold text-forest">
                {courseLevelLabels[course.level]}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg font-semibold text-forest">
                {course.title}
              </h3>
              {course.summary && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {course.summary}
                </p>
              )}

              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-charcoal/70">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-brand-600" />
                  <dd>{courseFormatLabels[course.format]}</dd>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-brand-600" />
                    <dd>{course.duration}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-auto pt-4 text-sm font-semibold text-forest">
                {formatPrice(course.price, course.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
