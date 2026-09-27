import { Icon } from "@/components/icon";
import { Section, SectionHeader } from "@/components/section";
import { IconCard } from "@/components/cards";
import { Mandala } from "@/components/decor";
import { whyPoints } from "@/lib/content/site";

export function WhyUs() {
  return (
    <Section background="sage" className="overflow-hidden">
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-72 text-forest/10"
      />
      <SectionHeader
        eyebrow="Why Haarivedon"
        title="A Path Rooted in Trust"
        align="center"
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
