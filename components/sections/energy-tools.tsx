import { Section, SectionHeader } from "@/components/section";
import { MediaCard, CardChip, CardCta } from "@/components/cards";
import { energyTools } from "@/lib/content/site";

export function EnergyTools() {
  return (
    <Section id="energy-tools" background="cream">
      <SectionHeader
        eyebrow="Energy Tools"
        title="Sacred Tools for Spiritual Balance"
        description="Chosen with intention — to wear, to place, or to hold. Each tool is a quiet companion on your journey toward clarity."
        actionHref="/products"
        actionLabel="Shop All Tools"
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4">
        {energyTools.map((tool) => (
          <MediaCard
            key={tool.name}
            href={tool.href}
            image={tool.image}
            alt={tool.alt}
            ariaLabel={tool.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 360px"
            chip={<CardChip>{tool.tagline}</CardChip>}
          >
            <h3 className="font-display text-sm font-semibold text-forest sm:text-lg">
              {tool.name}
            </h3>
            <p className="mt-1.5 flex-1 text-[0.8rem] leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
              {tool.description}
            </p>
            <span className="mt-3 sm:mt-4">
              <CardCta />
            </span>
          </MediaCard>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Crystals and gemstones carry traditional &amp; spiritual significance and
        are not a substitute for medical advice.
      </p>
    </Section>
  );
}
