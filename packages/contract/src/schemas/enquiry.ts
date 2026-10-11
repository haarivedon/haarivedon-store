import { z } from "zod";
import { phoneSchema } from "./booking";

/**
 * Enquiries about a specific catalogue item.
 *
 * Neither courses nor products have a checkout, so "ask about this" is the
 * action both pages offer — and it is the same act either way, which is why
 * there is one shape rather than one per kind.
 */
export const enquiryKinds = ["course", "product"] as const;
export type EnquiryKind = (typeof enquiryKinds)[number];

export const enquiryStatuses = [
  "pending",
  "contacted",
  "enrolled",
  "closed",
] as const;

/** Client -> server payload, shared by the form and the API. */
export const createEnquirySchema = z.object({
  kind: z.enum(enquiryKinds),
  itemSlug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: phoneSchema,
  message: z.string().trim().max(1000).optional().default(""),
});
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

/** Server -> client representation. Dates are ISO strings over the wire. */
export const enquirySchema = z.object({
  id: z.string(),
  kind: z.enum(enquiryKinds),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  itemSlug: z.string(),
  itemTitle: z.string(),
  message: z.string(),
  status: z.enum(enquiryStatuses),
  internalNote: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Enquiry = z.infer<typeof enquirySchema>;
