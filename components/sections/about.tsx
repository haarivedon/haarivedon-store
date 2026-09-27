import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";
import { aboutPillars } from "@/lib/content/site";

export function About() {
  return (
    <section id="about" className="bg-ivory">
      <div className="mx-auto grid max-w-screen-2xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
        {/* Portrait */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl border border-sage shadow-[0_28px_55px_-30px_rgba(33,74,46,0.4)]">
<Image
              src="/images/founder-about.jpg"
              alt="Neelam Niranjan tending to plants in her garden"
              fill
              sizes="(max-width: 1024px) 80vw, 360px"
              className="object-cover object-top"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-4 -left-4 -z-10 size-40 rounded-full bg-soft-yellow/70 blur-lg"
          />
        </div>

        {/* Copy + pillars */}
        <div>
          <SectionHeading
            eyebrow="About Haarivedon"
            title="Meet Neelam Niranjan"
            description="With a deep-rooted connection to ancient wisdom and a compassionate approach, Neelam Niranjan helps you find clarity, balance, and direction in life. Through personalized guidance and intuitive understanding, she empowers you to make confident decisions and embrace your true path."
          />

          <Link
            href="/about"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-7 h-12 px-6 text-sm font-semibold shadow-sm",
            )}
          >
            Discover My Journey
            <ArrowRight className="size-4" />
          </Link>

          <dl className="mt-10 grid gap-5 sm:grid-cols-3">
            {aboutPillars.map((pillar) => (
              <div key={pillar.title} className="flex flex-col gap-2">
                <div className="grid size-11 place-items-center rounded-full bg-sage/60 text-forest">
                  <Icon name={pillar.icon} className="size-5" />
                </div>
                <dt className="font-display text-base font-semibold text-forest">
                  {pillar.title}
                </dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
