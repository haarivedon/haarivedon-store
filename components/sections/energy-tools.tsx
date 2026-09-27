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

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {energyTools.map((tool) => (
          <MediaCard
            key={tool.name}
            href={tool.href}
            image={tool.image}
            alt={tool.alt}
            ariaLabel={tool.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            chip={<CardChip>{tool.tagline}</CardChip>}
          >
            <h3 className="font-display text-lg font-semibold text-forest">
              {tool.name}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {tool.description}
            </p>
            <span className="mt-4">
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
