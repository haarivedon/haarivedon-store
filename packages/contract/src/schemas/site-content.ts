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
    eyebrow: z.string().trim().max(80).default("Welcome to Haarivedon"),
    heading: z
      .string()
      .trim()
      .max(140)
      .default("Find Clarity.\nDiscover Your Path."),
    subheading: z
      .string()
      .trim()
      .max(400)
      .default(
        "Ancient wisdom and personalized guidance for life’s important decisions. Let’s explore your journey together.",
      ),
    primaryCta: cta.default({ label: "Book a Session", href: "/book" }),
    secondaryCta: cta.default({ label: "Explore Services", href: "/services" }),
    portrait: imageRef,
  }),

  "home.featured": z.object({
    /** Slugs, in display order. Unpublished entries are skipped on render. */
    courseSlugs: z.array(z.string().trim()).max(6).default([]),
    productSlugs: z.array(z.string().trim()).max(8).default([]),
  }),

  "about.page": z.object({
    heading: z
      .string()
      .trim()
      .max(140)
      .default("Guidance rooted in tradition, offered with care"),
    intro: z
      .string()
      .trim()
      .max(600)
      .default(
        "Haarivedon is the practice of Neelam A. Singh — a space for people who are carrying a question and want a considered answer, not a quick one.",
      ),
    story: z
      .string()
      .trim()
      .max(8000)
      .default(
        "Every consultation begins by listening. The traditional sciences — astrology, numerology, vastu, energy work — are tools, and which one serves you depends entirely on what you bring to the conversation.\n\nThe intent is never to hand you a verdict. It is to show you the pattern you are standing in, and the choices that are genuinely yours to make.",
      ),
    mission: z.string().trim().max(2000).default(""),
    philosophy: z.string().trim().max(2000).default(""),
    expertise: z
      .array(z.string().trim().min(1).max(160))
      .max(20)
      .default([
        "Vedic astrology and kundali reading",
        "Numerology and name correction",
        "Vastu and space harmonisation",
        "Energy healing and Reiki",
        "Remedial rituals and yantras",
        "Personal and relationship guidance",
      ]),
    portrait: z.string().trim().max(500).default("/images/founder-about.jpg"),
  }),

  "predictions.page": z.object({
    heading: z.string().trim().max(140).default("A reading of your own chart"),
    intro: z
      .string()
      .trim()
      .max(600)
      .default(
        "Bring one real question. A reading is most useful when it is specific — about a decision you are weighing, not about the whole of your life at once.",
      ),
    receive: z
      .array(z.string().trim().min(1).max(200))
      .max(12)
      .default([
        "A reading prepared from your own birth details, not a sun-sign generality",
        "The planetary periods you are currently moving through",
        "What the chart suggests about the area you asked about",
        "Traditional remedies, where they are appropriate",
        "A written response you can return to",
      ]),
    turnaround: z
      .string()
      .trim()
      .max(400)
      .default(
        "Readings are prepared individually, so they are not instant. We will confirm the timeline when we acknowledge your request.",
      ),
  }),

  "book.page": z.object({
    heading: z.string().trim().max(140).default("Let’s start with your chart"),
    intro: z
      .string()
      .trim()
      .max(600)
      .default(
        "Your birth details let us prepare your Kundali before we even speak — so the conversation starts with your actual chart, not with questions about it.",
      ),
    kundaliNote: z.string().trim().max(600).default(""),
    confirmation: z.string().trim().max(600).default(""),
    /** Session fee charged via Razorpay before a booking is submitted. */
    fee: z.coerce.number().int().min(0).max(1_000_000).default(501),
    /** Calendly scheduling link shown after payment, e.g. https://calendly.com/you/consult */
    calendlyUrl: z.string().trim().max(300).default(""),
  }),

  "site.contact": z.object({
    phone: z.string().trim().max(40).default("+91 92509 43774"),
    whatsapp: z.string().trim().max(40).default("+91 92509 43774"),
    email: z.string().trim().max(120).default("harivedon@gmail.com"),
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
