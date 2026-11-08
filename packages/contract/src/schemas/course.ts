import { z } from "zod";

/** The 14 categories from docs/PLAN.md §10, in display order. */
export const courseCategories = [
  "numerology",
  "pronology",
  "astrology",
  "panchang",
  "reading",
  "watch",
  "logo",
  "remedies",
  "switchwords",
  "energy-healing",
  "vastu",
  "tarot",
  "wealth",
  "other",
] as const;
export type CourseCategory = (typeof courseCategories)[number];

export const courseCategoryLabels: Record<CourseCategory, string> = {
  numerology: "Numerology",
  pronology: "Pronology",
  astrology: "Astrology",
  panchang: "Panchang",
  reading: "Reading & Analysis",
  watch: "Watch Analysis",
  logo: "Logo & Brand",
  remedies: "Remedies & Rituals",
  switchwords: "Switchwords",
  "energy-healing": "Energy Healing",
  vastu: "Vastu & Fengshui",
  tarot: "Tarot",
  wealth: "Wealth",
  other: "Other Practices",
};

export const courseLevels = ["basic", "advanced", "premium"] as const;
export type CourseLevel = (typeof courseLevels)[number];

export const courseLevelLabels: Record<CourseLevel, string> = {
  basic: "Foundation",
  advanced: "Advanced",
  premium: "Premium",
};

export const courseFormats = ["live", "recorded", "hybrid", "workshop"] as const;

export const courseFormatLabels: Record<
  (typeof courseFormats)[number],
  string
> = {
  live: "Live sessions",
  recorded: "Self-paced",
  hybrid: "Live + recorded",
  workshop: "Workshop",
};

/** Server -> client representation. Dates are ISO strings over the wire. */
export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  category: z.enum(courseCategories),
  level: z.enum(courseLevels),
  format: z.enum(courseFormats),
  summary: z.string(),
  description: z.string(),
  outline: z.array(z.string()),
  duration: z.string(),
  language: z.string(),
  /** `null` renders as "Enquire for price"; `0` renders as "Free". */
  price: z.number().int().nullable(),
  currency: z.string(),
  image: z.string(),
  /** Udemy course URL the Enroll button links to; "" means none. */
  udemyUrl: z.string(),
  /** Udemy numeric id (null unless synced from Udemy). */
  udemyId: z.number().int().nullable(),
  /** "manual" | "udemy" — how the course was added. */
  source: z.string(),
  /** Basic/advanced siblings. Unpublished targets are dropped on render. */
  relatedSlugs: z.array(z.string()),
  certificate: z.boolean(),
  featured: z.boolean(),
  order: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Course = z.infer<typeof courseSchema>;
