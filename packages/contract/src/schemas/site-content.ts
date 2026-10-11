import { z } from "zod";

/**
 * Editable page copy (CR-3). Six keys — the copy that actually changes
 * (docs/PLAN.md §12). Each key's schema drives both the admin form and the
 * render, so a missing field is a type error rather than a blank section.
 */
const imageRef = z.string().trim().max(500).default("");
const cta = z.object({
  label: z.string().trim().max(60).default(""),
  href: z.string().trim().max(200).default(""),
});

export const siteContentSchemas = {
  "home.hero": z.object({
    eyebrow: z.string().trim().max(80).default(""),
    heading: z.string().trim().max(140).default(""),
    subheading: z.string().trim().max(400).default(""),
    primaryCta: cta.default({ label: "", href: "" }),
    secondaryCta: cta.default({ label: "", href: "" }),
    portrait: imageRef,
  }),

  "home.featured": z.object({
    /** Slugs, in display order. Unpublished entries are skipped on render. */
    courseSlugs: z.array(z.string().trim()).max(6).default([]),
    productSlugs: z.array(z.string().trim()).max(8).default([]),
  }),

  "about.page": z.object({
    heading: z.string().trim().max(140).default(""),
    intro: z.string().trim().max(600).default(""),
    story: z.string().trim().max(8000).default(""),
    mission: z.string().trim().max(2000).default(""),
    philosophy: z.string().trim().max(2000).default(""),
    expertise: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
    portrait: imageRef,
  }),

  "predictions.page": z.object({
    heading: z.string().trim().max(140).default(""),
    intro: z.string().trim().max(600).default(""),
    receive: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
    turnaround: z.string().trim().max(400).default(""),
  }),

  "book.page": z.object({
    heading: z.string().trim().max(140).default(""),
    intro: z.string().trim().max(600).default(""),
    kundaliNote: z.string().trim().max(600).default(""),
    confirmation: z.string().trim().max(600).default(""),
  }),

  "site.contact": z.object({
    phone: z.string().trim().max(40).default(""),
    whatsapp: z.string().trim().max(40).default(""),
    email: z.string().trim().max(120).default(""),
    address: z.string().trim().max(300).default(""),
    hours: z.string().trim().max(200).default(""),
    instagram: z.string().trim().max(200).default(""),
    youtube: z.string().trim().max(200).default(""),
  }),
} as const;

export const siteContentKeys = Object.keys(
  siteContentSchemas,
) as (keyof typeof siteContentSchemas)[];

export type SiteContentKey = (typeof siteContentKeys)[number];

export type SiteContentValue<K extends SiteContentKey> = z.infer<
  (typeof siteContentSchemas)[K]
>;

export const siteContentKeySchema = z.enum(
  siteContentKeys as [SiteContentKey, ...SiteContentKey[]],
);

/** Human labels for the admin navigation. */
export const siteContentLabels: Record<SiteContentKey, string> = {
  "home.hero": "Home — hero",
  "home.featured": "Home — featured picks",
  "about.page": "About page",
  "predictions.page": "Predictions page",
  "book.page": "Book a Session page",
  "site.contact": "Contact details",
};

/**
 * Parses a stored row, falling back to the schema's defaults so a key that
 * has never been saved renders defaults rather than crashing (PLAN.md §12).
 */
export function parseSiteContent<K extends SiteContentKey>(
  key: K,
  data: unknown,
): SiteContentValue<K> {
  const schema = siteContentSchemas[key];
  const result = schema.safeParse(data ?? {});
  return (result.success ? result.data : schema.parse({})) as SiteContentValue<K>;
}
