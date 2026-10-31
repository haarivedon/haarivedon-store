import { siteContentKeys, type SiteContentKey } from "@repo/contract";
import type { FieldSpec } from "@/lib/admin/collections";

/**
 * Field descriptors for the six page-copy keys (docs/PLAN.md §12).
 *
 * Nested paths use dots, so `primaryCta.label` maps onto the zod shape in
 * @repo/contract without a second schema to keep in sync.
 */
export const copyFields: Record<SiteContentKey, FieldSpec[]> = {
  "home.hero": [
    { name: "eyebrow", label: "Eyebrow", kind: "text", hint: "Small line above the heading" },
    { name: "heading", label: "Heading", kind: "text", wide: true },
    { name: "subheading", label: "Sub-heading", kind: "textarea", wide: true },
    { name: "primaryCta.label", label: "Main button text", kind: "text" },
    { name: "primaryCta.href", label: "Main button link", kind: "text" },
    { name: "secondaryCta.label", label: "Second button text", kind: "text" },
    { name: "secondaryCta.href", label: "Second button link", kind: "text" },
    { name: "portrait", label: "Portrait image", kind: "image", wide: true },
  ],
  "home.featured": [
    {
      name: "courseSlugs",
      label: "Featured courses",
      kind: "list",
      hint: "Course web addresses, in order — e.g. vedic-kundali",
      wide: true,
    },
    {
      name: "productSlugs",
      label: "Featured products",
      kind: "list",
      hint: "Product web addresses, in order",
      wide: true,
    },
  ],
  "about.page": [
    { name: "heading", label: "Heading", kind: "text", wide: true },
    { name: "intro", label: "Intro", kind: "textarea", wide: true },
    { name: "story", label: "Your story", kind: "richtext", wide: true },
    { name: "mission", label: "Mission", kind: "textarea", wide: true },
    { name: "philosophy", label: "Philosophy", kind: "textarea", wide: true },
    { name: "expertise", label: "Areas of expertise", kind: "list", wide: true },
    { name: "portrait", label: "Portrait image", kind: "image", wide: true },
    {
      name: "faqs",
      label: "FAQs",
      kind: "faq",
      hint: "Questions and answers shown at the bottom of the About page",
      wide: true,
    },
  ],
  "predictions.page": [
    { name: "heading", label: "Heading", kind: "text", wide: true },
    { name: "intro", label: "Intro", kind: "textarea", wide: true },
    { name: "receive", label: "What you receive", kind: "list", wide: true },
    {
      name: "turnaround",
      label: "How long it takes",
      kind: "textarea",
      hint: "Be honest here — it sets the expectation",
      wide: true,
    },
  ],
  "book.page": [
    { name: "heading", label: "Heading", kind: "text", wide: true },
    { name: "intro", label: "Intro", kind: "textarea", wide: true },
    {
      name: "kundaliNote",
      label: "About the Kundali",
      kind: "textarea",
      hint: "Explains what they receive after booking",
      wide: true,
    },
    {
      name: "confirmation",
      label: "Confirmation message",
      kind: "textarea",
      hint: "Shown after the form is sent",
      wide: true,
    },
    {
      name: "fee",
      label: "Session fee (₹)",
      kind: "number",
      hint: "Charged via Razorpay before a booking is confirmed",
    },
    {
      name: "calendlyUrl",
      label: "Calendly scheduling link",
      kind: "text",
      hint: "e.g. https://calendly.com/you/consult — shown after payment to pick a slot",
      wide: true,
    },
  ],
  "site.contact": [
    { name: "phone", label: "Phone", kind: "text" },
    { name: "whatsapp", label: "WhatsApp", kind: "text" },
    { name: "email", label: "Email", kind: "text" },
    { name: "hours", label: "Hours", kind: "text" },
    { name: "address", label: "Address", kind: "textarea", wide: true },
    { name: "instagram", label: "Instagram URL", kind: "text" },
    { name: "youtube", label: "YouTube URL", kind: "text" },
  ],
};

export { siteContentKeys };

/** Reads a dotted path out of a nested object. */
export function readPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

/** Writes a dotted path, cloning as it goes. */
export function writePath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [head, ...rest] = path.split(".");
  if (!head) return source;

  if (rest.length === 0) return { ...source, [head]: value };

  const child = source[head];
  return {
    ...source,
    [head]: writePath(
      child && typeof child === "object" ? { ...(child as Record<string, unknown>) } : {},
      rest.join("."),
      value,
    ),
  };
}
