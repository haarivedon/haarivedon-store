import { Clock, GraduationCap, Users } from "lucide-react";
import { Section, SectionHeader } from "@/components/section";
import { MediaCard, CardCta } from "@/components/cards";
import { courses } from "@/lib/content/site";

export function Courses() {
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
          <MediaCard
            key={course.title}
            href={course.href}
            image={course.image}
            alt={course.alt}
            ariaLabel={course.title}
            aspect="video"
            sizes="(max-width: 768px) 100vw, 33vw"
            footer={
              <>
                <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-charcoal/70">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-brand-600" />
                    <dd>{course.level}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-brand-600" />
                    <dd>{course.duration}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-brand-600" />
                    <dd>{course.learners}</dd>
                  </div>
                </dl>
                <CardCta label="Explore Course" />
              </>
            }
          />
        ))}
      </div>
    </Section>
  );
}
