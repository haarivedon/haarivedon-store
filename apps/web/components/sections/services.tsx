import { Icon } from "@/components/icon";
import { Section, SectionHeader } from "@/components/section";
import { IconCard } from "@/components/cards";
import { services } from "@/lib/content/site";

export function Services() {
  return (
    <Section id="services" background="cream">
      <SectionHeader
        eyebrow="Our Services"
        title="Guidance for Every Stage of Life"
        actionHref="/services"
        actionLabel="View All Services"
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
        {services.map((service) => (
          <IconCard
            key={service.title}
            href={service.href}
            icon={<Icon name={service.icon} className="size-5 sm:size-6" />}
            title={service.title}
            description={service.description}
            cta="Learn More"
          />
        ))}
      </div>
    </Section>
  );
}
