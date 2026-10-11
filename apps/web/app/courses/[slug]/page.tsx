import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock, Globe, GraduationCap } from "lucide-react";
import {
  courseCategoryLabels,
  courseFormatLabels,
  courseLevelLabels,
} from "@repo/contract";
import { Section } from "@/components/section";
import { CourseEnquiryForm } from "@/components/courses/enquiry-form";
import { formatPrice } from "@/lib/format";
import { getCourse, getCourses } from "@/lib/api/content";

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course not found" };

  return {
    title: course.title,
    description:
      course.summary ||
      `${course.title} — a ${courseLevelLabels[course.level].toLowerCase()} course at Haarivedon.`,
  };
}

export default async function CoursePage({
  params,
}: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  // Cross-linked basic/advanced siblings. A sibling that is missing or
  // unpublished is dropped rather than rendered as a dead link (PLAN.md §13).
  const siblings = course.relatedSlugs.length
    ? (await Promise.all(course.relatedSlugs.map((related) => getCourse(related))))
        .filter((related): related is NonNullable<typeof related> =>
          Boolean(related),
        )
    : [];

  const facts = [
    { icon: GraduationCap, label: courseFormatLabels[course.format] },
    ...(course.duration ? [{ icon: Clock, label: course.duration }] : []),
    { icon: Globe, label: course.language },
    ...(course.certificate
      ? [{ icon: BadgeCheck, label: "Certificate on completion" }]
      : []),
  ];

  return (
    <>
      <Section background="ivory" containerClassName="py-8 sm:py-12">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/70 transition-colors hover:text-forest"
        >
          <ArrowLeft className="size-4" />
          All courses
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              {courseCategoryLabels[course.category]} ·{" "}
              {courseLevelLabels[course.level]}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-forest sm:text-4xl">
              {course.title}
            </h1>
            {course.summary && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {course.summary}
              </p>
            )}

            {course.image && (
              <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-border/60">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
            )}

            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal/75">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-2">
                  <fact.icon className="size-4 text-brand-600" />
                  <dd>{fact.label}</dd>
                </div>
              ))}
            </dl>

            {course.description && (
              <div className="mt-8 space-y-3 text-sm leading-relaxed text-charcoal/80">
                {course.description.split("\n\n").map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            )}

            {course.outline.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-semibold text-forest">
                  What this course covers
                </h2>
                {/*
                  Long outlines are allowed; the first eight show and the rest
                  sit behind a disclosure (PLAN.md §13).
                */}
                <ul className="mt-4 space-y-2.5 text-sm text-charcoal/80">
                  {course.outline.slice(0, 8).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span aria-hidden className="mt-0.5 text-gold">
                        ✦
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                {course.outline.length > 8 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-brand-700 underline underline-offset-2">
                      Show all {course.outline.length} topics
                    </summary>
                    <ul className="mt-3 space-y-2.5 text-sm text-charcoal/80">
                      {course.outline.slice(8).map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span aria-hidden className="mt-0.5 text-gold">
                            ✦
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {siblings.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold text-forest">
                  Related levels
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {siblings.map((sibling) => (
                    <li key={sibling.id}>
                      <Link
                        href={`/courses/${sibling.slug}`}
                        className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                          {courseLevelLabels[sibling.level]}
                        </span>
                        <span className="mt-1 font-display text-base font-semibold text-forest">
                          {sibling.title}
                        </span>
                        <span className="mt-2 text-sm font-medium text-charcoal/70">
                          {formatPrice(sibling.price, sibling.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="font-display text-2xl font-semibold text-forest">
                {formatPrice(course.price, course.currency)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Leave your details and we will send you the schedule and how to
                join.
              </p>
              <div className="mt-5">
                <CourseEnquiryForm
                  courseSlug={course.slug}
                  courseTitle={course.title}
                />
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Courses teach traditional practices and carry spiritual
              significance. They are not a substitute for medical, legal or
              financial advice.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
