import { Icon } from "@/components/icon";
import { Section, SectionHeader } from "@/components/section";
import { IconCard } from "@/components/cards";
import { Mandala } from "@/components/decor";
import { whyPoints } from "@/lib/content/site";

export function WhyUs() {
  return (
    <Section background="indigo" className="overflow-hidden">
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-72 text-gold/20"
      />
      <SectionHeader
        eyebrow="Why Haarivedon"
        title="A Path Rooted in Trust"
        align="center"
        tone="light"
      />

      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
        {whyPoints.map((point) => (
          <IconCard
            key={point.title}
            align="center"
            icon={<Icon name={point.icon} className="size-6" />}
            title={point.title}
            description={point.description}
          />
        ))}
      </div>
    </Section>
  );
}
