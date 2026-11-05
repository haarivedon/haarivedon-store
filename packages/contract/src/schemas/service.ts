import { z } from "zod";

/** Groups the services section renders under; also used for Vastu. */
export const serviceCategories = [
  "coaching",
  "readings",
  "energy",
  "vastu",
  "other",
] as const;
export type ServiceCategory = (typeof serviceCategories)[number];

/** Human labels for the grouped headings on the services section. */
export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  coaching: "Coaching & Therapy",
  readings: "Readings & Prediction",
  energy: "Energy Healing",
  vastu: "Vastu",
  other: "More Services",
};

/** Server -> client representation of a service. Dates are ISO strings. */
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  description: z.string(),
  /** lucide-react icon name, resolved by the component that renders it. */
  icon: z.string(),
  /** The "Rate". `null` renders as "Enquire for price", never as zero. */
  startingPrice: z.number().int().nullable(),
  /** The "Discounted rate". `null` means no discount is shown. */
  discountedPrice: z.number().int().nullable(),
  currency: z.string(),
  highlights: z.array(z.string()),
  image: z.string(),
  /** One of serviceCategories; "" until the admin assigns one. */
  category: z.string(),
  /** Highlighted at the top of the section (the Vastu offerings). */
  featured: z.boolean(),
  order: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Service = z.infer<typeof serviceSchema>;
