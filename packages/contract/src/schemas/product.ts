import { z } from "zod";

/**
 * Top-level grouping of the energy-tool catalogue (docs/PLAN.md §2, §11).
 * The families do not share one shape, so family-specific facts live in
 * `attributes` and are validated per family by `productAttributesSchema`.
 */
export const productFamilies = [
  "yantra",
  "gemstone",
  "rudraksha",
  "mala",
  "crystal",
  "idol",
] as const;
export type ProductFamily = (typeof productFamilies)[number];

/** Human labels for the family tabs on /products. */
export const productFamilyLabels: Record<ProductFamily, string> = {
  yantra: "Yantras",
  gemstone: "Gemstones",
  rudraksha: "Rudraksha",
  mala: "Malas",
  crystal: "Crystals",
  idol: "Idols",
};

/** Sub-tier within a family. Empty where a family is flat. */
export const productCategories = {
  yantra: [],
  gemstone: ["precious", "semi-precious", "organic"],
  rudraksha: ["mukhi", "conjoined"],
  mala: [],
  crystal: [],
  idol: [],
} as const satisfies Record<ProductFamily, readonly string[]>;

const yantraAttributes = z.object({
  family: z.literal("yantra"),
  deity: z.string().default(""),
  purpose: z.string().default(""),
  metal: z.string().default(""),
  size: z.string().default(""),
});

const gemstoneAttributes = z.object({
  family: z.literal("gemstone"),
  mineral: z.string().default(""),
  colour: z.string().default(""),
  /** Mohs scale, 1–10. */
  hardness: z.number().min(1).max(10).nullable().default(null),
  rulingPlanet: z.string().default(""),
  /** Gemstones are commonly priced per carat rather than per piece. */
  pricedPerCarat: z.boolean().default(false),
  certified: z.boolean().default(false),
});

const rudrakshaAttributes = z.object({
  family: z.literal("rudraksha"),
  /** 1–21, or null for the conjoined forms (Gauri Shankar, Trijuti…). */
  mukhi: z.number().int().min(1).max(21).nullable().default(null),
  deity: z.string().default(""),
  rulingPlanet: z.string().default(""),
  benefit: z.string().default(""),
  /** nepali | indonesian, or both where a bead is sold in either origin. */
  origins: z.array(z.enum(["nepali", "indonesian"])).default([]),
  beadSize: z.string().default(""),
  certified: z.boolean().default(false),
});

const malaAttributes = z.object({
  family: z.literal("mala"),
  material: z.string().default(""),
  beadCount: z.number().int().nullable().default(null),
  size: z.string().default(""),
});

const crystalAttributes = z.object({
  family: z.literal("crystal"),
  stone: z.string().default(""),
  /** tree | raw | tumbled | cluster | set */
  form: z.string().default(""),
  intent: z.string().default(""),
  weight: z.string().default(""),
});

const idolAttributes = z.object({
  family: z.literal("idol"),
  deity: z.string().default(""),
  metal: z.string().default(""),
  height: z.string().default(""),
  weight: z.string().default(""),
});

/** Family-specific facts, rendered as the spec table on the detail page. */
export const productAttributesSchema = z.discriminatedUnion("family", [
  yantraAttributes,
  gemstoneAttributes,
  rudrakshaAttributes,
  malaAttributes,
  crystalAttributes,
  idolAttributes,
]);
export type ProductAttributes = z.infer<typeof productAttributesSchema>;

/** Server -> client representation of a product. Dates are ISO strings. */
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  family: z.enum(productFamilies),
  category: z.string(),
  summary: z.string(),
  description: z.string(),
  /** `null` renders as "Enquire for price"; `0` renders as "Free". */
  price: z.number().int().nullable(),
  currency: z.string(),
  images: z.array(z.string()),
  /** Absent while the client has not filled the family's fields in yet. */
  attributes: productAttributesSchema.nullable(),
  inStock: z.boolean(),
  featured: z.boolean(),
  order: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Product = z.infer<typeof productSchema>;
