import { z } from "zod";

/** Server -> client representation of a service. Dates are ISO strings. */
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  description: z.string(),
  /** lucide-react icon name, resolved by the component that renders it. */
  icon: z.string(),
  /** `null` renders as "Enquire for price", never as zero. */
  startingPrice: z.number().int().nullable(),
  currency: z.string(),
  highlights: z.array(z.string()),
  image: z.string(),
  order: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Service = z.infer<typeof serviceSchema>;
