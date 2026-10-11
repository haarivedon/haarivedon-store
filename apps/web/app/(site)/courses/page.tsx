import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/components/section";
import { PageIntro, HowItWorks } from "@/components/page-intro";
import { CourseBrowser } from "@/components/courses/course-browser";
import { getCourses } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Learn the practices for yourself — numerology, astrology, remedies, energy healing and more, taught step by step from foundation to advanced.",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <>
      <PageIntro
        eyebrow="Learn With Us"
        title="Courses & mentorship"
        lead="Learn the practice yourself, rather than only being read for. Courses run from foundation level — no background needed — through to advanced work, and each one is taught live with guidance as you go."
        help={{
          text: "Not sure which one is right for you?",
          linkLabel: "Tell us what you want to learn",
          href: "/book",
        }}
      />

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
          /* The browser reads its filters from the query string, so it needs
             a boundary while this page is statically rendered. */
          <Suspense
            fallback={
              <div className="h-24 animate-pulse rounded-2xl bg-cream/60" />
            }
          >
            <CourseBrowser courses={courses} />
          </Suspense>
        )}
      </Section>

      <Section background="cream">
        <HowItWorks
          heading="How joining a course works"
          steps={[
            {
              title: "Send an enquiry",
              body: "Pick a course and leave your details. There is nothing to pay at this stage.",
            },
            {
              title: "We get in touch",
              body: "We confirm the schedule, what the course covers and what it costs.",
            },
            {
              title: "You join the group",
              body: "Sessions are taught live, with time for your questions throughout.",
            },
          ]}
        />
      </Section>
    </>
  );
}
