import {
  courseCategories,
  courseCategoryLabels,
  courseFormats,
  courseFormatLabels,
  courseLevels,
  courseLevelLabels,
  productCategories,
  productFamilies,
  productFamilyLabels,
} from "@repo/contract";

/**
 * Admin field descriptors.
 *
 * One config per collection drives both the list columns and the edit form,
 * so adding a field is one entry rather than three files.
 */
export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "price"
  | "switch"
  | "select"
  | "list"
  | "image"
  | "slug";

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Full width in the two-column form grid. */
  wide?: boolean;
};

export type CollectionSpec = {
  key: "courses" | "products" | "services" | "testimonials";
  label: string;
  singular: string;
  /** Field holding the display name. */
  titleField: string;
  fields: FieldSpec[];
  /** Blank record used by the "new" form. */
  blank: Record<string, unknown>;
};

const option = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
) => values.map((value) => ({ value, label: labels[value] }));

export const collections: Record<CollectionSpec["key"], CollectionSpec> = {
  courses: {
    key: "courses",
    label: "Courses",
    singular: "course",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "slug", label: "Web address", kind: "slug", hint: "/courses/…" },
      {
        name: "category",
        label: "Category",
        kind: "select",
        options: option(courseCategories, courseCategoryLabels),
      },
      {
        name: "level",
        label: "Level",
        kind: "select",
        options: option(courseLevels, courseLevelLabels),
      },
      {
        name: "format",
        label: "Format",
        kind: "select",
        options: option(courseFormats, courseFormatLabels),
      },
      { name: "duration", label: "Duration", kind: "text", hint: "e.g. 6 weeks" },
      { name: "language", label: "Language", kind: "text" },
      {
        name: "price",
        label: "Price (₹)",
        kind: "price",
        hint: "Leave empty for “Enquire for price”",
      },
      {
        name: "summary",
        label: "Short summary",
        kind: "textarea",
        hint: "One or two lines, shown on the card",
        wide: true,
      },
      {
        name: "description",
        label: "Description",
        kind: "richtext",
        wide: true,
      },
      {
        name: "outline",
        label: "What this course covers",
        kind: "list",
        hint: "One topic per row",
        wide: true,
      },
      { name: "image", label: "Image", kind: "image", wide: true },
      { name: "certificate", label: "Certificate on completion", kind: "switch" },
      { name: "featured", label: "Show on the home page", kind: "switch" },
      { name: "order", label: "Display order", kind: "number" },
    ],
    blank: {
      title: "",
      slug: "",
      category: "numerology",
      level: "basic",
      format: "live",
      duration: "",
      language: "Hindi / English",
      price: null,
      summary: "",
      description: "",
      outline: [],
      image: "",
      relatedSlugs: [],
      certificate: false,
      featured: false,
      order: 0,
      published: false,
    },
  },

  products: {
    key: "products",
    label: "Products",
    singular: "product",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", kind: "text" },
      { name: "slug", label: "Web address", kind: "slug", hint: "/products/…" },
      {
        name: "family",
        label: "Family",
        kind: "select",
        options: option(productFamilies, productFamilyLabels),
      },
      {
        name: "category",
        label: "Sub-category",
        kind: "text",
        hint: `e.g. ${productCategories.gemstone.join(", ")}`,
      },
      {
        name: "price",
        label: "Price (₹)",
        kind: "price",
        hint: "Leave empty for “Enquire for price”",
      },
      { name: "inStock", label: "In stock", kind: "switch" },
      {
        name: "summary",
        label: "Short summary",
        kind: "textarea",
        wide: true,
      },
      { name: "description", label: "Description", kind: "richtext", wide: true },
      { name: "images", label: "Images", kind: "image", wide: true },
      { name: "featured", label: "Show on the home page", kind: "switch" },
      { name: "order", label: "Display order", kind: "number" },
    ],
    blank: {
      name: "",
      slug: "",
      family: "crystal",
      category: "general",
      price: null,
      inStock: true,
      summary: "",
      description: "",
      images: [],
      attributes: null,
      featured: false,
      order: 0,
      published: false,
    },
  },

  services: {
    key: "services",
    label: "Services",
    singular: "service",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "slug", label: "Anchor", kind: "slug", hint: "/services#…" },
      {
        name: "icon",
        label: "Icon",
        kind: "text",
        hint: "A lucide icon name, e.g. Sparkles",
      },
      {
        name: "startingPrice",
        label: "Starting price (₹)",
        kind: "price",
        hint: "Leave empty for “Enquire for price”",
      },
      { name: "summary", label: "Short summary", kind: "textarea", wide: true },
      { name: "description", label: "Description", kind: "richtext", wide: true },
      { name: "highlights", label: "What's included", kind: "list", wide: true },
      { name: "image", label: "Image", kind: "image", wide: true },
      { name: "order", label: "Display order", kind: "number" },
    ],
    blank: {
      title: "",
      slug: "",
      icon: "Sparkles",
      startingPrice: null,
      summary: "",
      description: "",
      highlights: [],
      image: "",
      order: 0,
      published: false,
    },
  },

  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", kind: "text" },
      { name: "location", label: "Location", kind: "text" },
      {
        name: "rating",
        label: "Rating (1–5)",
        kind: "number",
      },
      { name: "quote", label: "What they said", kind: "textarea", wide: true },
      { name: "order", label: "Display order", kind: "number" },
    ],
    blank: {
      name: "",
      location: "",
      rating: 5,
      quote: "",
      order: 0,
      published: false,
    },
  },
};

export const collectionKeys = Object.keys(collections) as CollectionSpec["key"][];

/** Title-to-slug, matching the server's slug rules (docs/PLAN.md §13). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
