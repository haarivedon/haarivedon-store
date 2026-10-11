import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeader } from "@/components/section";
import { CourseBrowser } from "@/components/courses/course-browser";
import { getCourses } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Learn the practices for yourself — numerology, astrology, remedies, energy healing and more, taught step by step.",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <>
      <Section background="cream" containerClassName="pb-8 sm:pb-10">
        <SectionHeader
          eyebrow="Learn With Us"
          title="Courses & mentorship"
          description="Go beyond a single session — learn the practices for yourself, at your own pace, with guidance at every step."
          align="center"
        />

        {/*
          The client's "onboarding and roadmap" item reads as a funnel, not a
          catalogue row, so it lives here as an intro block (PLAN.md §10).
        */}
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border/60 bg-ivory/80 p-5 text-center sm:p-6">
          <h2 className="font-display text-lg font-semibold text-forest">
            Not sure where to start?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Most people begin with a foundation course in the practice that
            drew them here, then go deeper. Tell us what you want to learn and
            we will map a path through it with you.
          </p>
          <Link
            href="/book"
            className="mt-3 inline-flex text-sm font-medium text-brand-700 underline underline-offset-2"
          >
            Ask which course suits you
          </Link>
        </div>
      </Section>

      <Section background="ivory">
        {courses.length === 0 ? (
          <p className="mx-auto max-w-prose text-center text-muted-foreground">
            Our course list is being prepared. Please{" "}
            <Link href="/book" className="font-medium text-forest underline">
              get in touch
            </Link>{" "}
            to hear what is running next.
          </p>
        ) : (
          <CourseBrowser courses={courses} />
        )}
      </Section>
    </>
  );
}
