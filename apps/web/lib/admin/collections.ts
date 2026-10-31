import {
  blogPostWriteSchema,
  courseWriteSchema,
  productWriteSchema,
  serviceWriteSchema,
  testimonialWriteSchema,
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
 * One config per collection drives the list columns, the edit form and the
 * publish checklist, so adding a field is one entry rather than three files.
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
  | "faq"
  | "slug";

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Full width in the two-column form grid. */
  wide?: boolean;
  /** Soft limit, shown as a counter. */
  max?: number;
  /** Empty-state copy for a repeater. */
  emptyHint?: string;
};

/** Fields are grouped so one long form reads as a few short ones. */
export type SectionSpec = {
  title: string;
  description?: string;
  fields: FieldSpec[];
};

/** Mirrors the server's publish rules so the editor sees them before saving. */
export type PublishCheck = {
  field: string;
  label: string;
  done: (record: Record<string, unknown>) => boolean;
};

const filled = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : Boolean(value);

export type CollectionSpec = {
  key: "courses" | "products" | "services" | "testimonials" | "blog";
  label: string;
  singular: string;
  /** Field holding the display name. */
  titleField: string;
  /** URL prefix shown inside the slug control. */
  slugPrefix?: string;
  sections: SectionSpec[];
  /** What must be filled in before publishing. */
  publishChecks: PublishCheck[];
  /** Blank record used by the "new" form. */
  blank: Record<string, unknown>;
};

/** Flattens the sections — used where the form needs every field. */
export const allFields = (spec: CollectionSpec): FieldSpec[] =>
  spec.sections.flatMap((section) => section.fields);

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
    slugPrefix: "/courses/",
    sections: [
      {
        title: "Basics",
        description: "What the course is called, and where it sits.",
        fields: [
          { name: "title", label: "Title", kind: "text", max: 140 },
          { name: "slug", label: "Web address", kind: "slug" },
          {
            name: "category",
            label: "Subject",
            kind: "select",
            options: option(courseCategories, courseCategoryLabels),
          },
          {
            name: "level",
            label: "Level",
            kind: "select",
            hint: "Foundation needs no background; Advanced builds on one",
            options: option(courseLevels, courseLevelLabels),
          },
        ],
      },
      {
        title: "Practical details",
        description: "What someone needs to know before enquiring.",
        fields: [
          {
            name: "format",
            label: "Format",
            kind: "select",
            options: option(courseFormats, courseFormatLabels),
          },
          {
            name: "duration",
            label: "Duration",
            kind: "text",
            placeholder: "6 weeks",
            hint: "However you'd describe it — weeks, sessions, hours",
          },
          { name: "language", label: "Language", kind: "text" },
          {
            name: "price",
            label: "Price",
            kind: "price",
            hint: "Leave empty to show “Enquire for price”",
          },
          {
            name: "certificate",
            label: "Certificate on completion",
            kind: "switch",
            wide: true,
          },
        ],
      },
      {
        title: "Description",
        description: "The words someone reads on the course page.",
        fields: [
          {
            name: "summary",
            label: "Short summary",
            kind: "textarea",
            max: 400,
            placeholder: "One or two lines, shown on the course card.",
            hint: "Shown on the card and in search results",
            wide: true,
          },
          {
            name: "description",
            label: "Full description",
            kind: "richtext",
            max: 8000,
            placeholder: "Leave a blank line between paragraphs.",
            wide: true,
          },
          {
            name: "outline",
            label: "What this course covers",
            kind: "list",
            placeholder: "e.g. Reading a birth chart",
            emptyHint:
              "No topics yet. Add one per row — they appear as a list on the course page.",
            wide: true,
          },
        ],
      },
      {
        title: "Image",
        description:
          "Shown on the card and at the top of the page. It needs a description before the course can go live.",
        fields: [
          { name: "image", label: "Course image", kind: "image", wide: true },
        ],
      },
      {
        title: "Placement",
        fields: [
          {
            name: "featured",
            label: "Show on the home page",
            kind: "switch",
            wide: true,
          },
          {
            name: "order",
            label: "Display order",
            kind: "number",
            hint: "Lower numbers come first",
          },
        ],
      },
    ],
    publishChecks: [
      { field: "summary", label: "A short summary", done: (r) => filled(r.summary) },
      {
        field: "description",
        label: "A full description",
        done: (r) => filled(r.description),
      },
      {
        field: "duration",
        label: "How long it runs",
        done: (r) => filled(r.duration),
      },
      {
        field: "image",
        label: "An image, with a description",
        done: (r) => filled(r.image),
      },
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
    slugPrefix: "/products/",
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "name", label: "Name", kind: "text", max: 140 },
          { name: "slug", label: "Web address", kind: "slug" },
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
            hint: `Gemstones: ${productCategories.gemstone.join(", ")}`,
          },
        ],
      },
      {
        title: "Price and stock",
        fields: [
          {
            name: "price",
            label: "Price",
            kind: "price",
            hint: "Leave empty to show “Enquire for price”",
          },
          {
            name: "inStock",
            label: "In stock",
            kind: "switch",
            hint: "Off shows “Enquire” instead of a buy prompt",
          },
        ],
      },
      {
        title: "Description",
        fields: [
          {
            name: "summary",
            label: "Short summary",
            kind: "textarea",
            max: 400,
            placeholder: "One or two lines, shown on the card.",
            wide: true,
          },
          {
            name: "description",
            label: "Full description",
            kind: "richtext",
            max: 8000,
            placeholder: "Leave a blank line between paragraphs.",
            hint: "Say what it is and what it is traditionally used for — as tradition, not as a promised outcome",
            wide: true,
          },
        ],
      },
      {
        title: "Images",
        description: "The first image is the one shown on the listing.",
        fields: [
          { name: "images", label: "Product images", kind: "image", wide: true },
        ],
      },
      {
        title: "Placement",
        fields: [
          {
            name: "featured",
            label: "Show on the home page",
            kind: "switch",
            wide: true,
          },
          {
            name: "order",
            label: "Display order",
            kind: "number",
            hint: "Lower numbers come first",
          },
        ],
      },
    ],
    publishChecks: [
      { field: "summary", label: "A short summary", done: (r) => filled(r.summary) },
      {
        field: "description",
        label: "A full description",
        done: (r) => filled(r.description),
      },
      {
        field: "images",
        label: "At least one image, with a description",
        done: (r) => Array.isArray(r.images) && r.images.length > 0,
      },
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
    slugPrefix: "/services#",
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title", label: "Title", kind: "text", max: 140 },
          { name: "slug", label: "Anchor", kind: "slug" },
          {
            name: "icon",
            label: "Icon",
            kind: "text",
            hint: "A lucide icon name, e.g. Sparkles",
          },
          {
            name: "startingPrice",
            label: "Starting price",
            kind: "price",
            hint: "Leave empty to show “Enquire for price”",
          },
        ],
      },
      {
        title: "Description",
        fields: [
          {
            name: "summary",
            label: "Short summary",
            kind: "textarea",
            max: 400,
            placeholder: "One or two lines, shown on the card.",
            wide: true,
          },
          {
            name: "description",
            label: "Full description",
            kind: "richtext",
            max: 8000,
            wide: true,
          },
          {
            name: "highlights",
            label: "What it includes",
            kind: "list",
            placeholder: "e.g. A written summary afterwards",
            emptyHint:
              "No points yet. Each row becomes a bullet under “What it includes”.",
            wide: true,
          },
        ],
      },
      {
        title: "Image and placement",
        fields: [
          { name: "image", label: "Image", kind: "image", wide: true },
          {
            name: "order",
            label: "Display order",
            kind: "number",
            hint: "Lower numbers come first",
          },
        ],
      },
    ],
    publishChecks: [
      { field: "summary", label: "A short summary", done: (r) => filled(r.summary) },
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
    sections: [
      {
        title: "Who said it",
        fields: [
          { name: "name", label: "Name", kind: "text", max: 100 },
          { name: "location", label: "Location", kind: "text" },
          { name: "rating", label: "Rating out of 5", kind: "number" },
          {
            name: "order",
            label: "Display order",
            kind: "number",
            hint: "Lower numbers come first",
          },
        ],
      },
      {
        title: "The testimonial",
        description:
          "Publish only with their permission, and keep their words as they wrote them.",
        fields: [
          {
            name: "quote",
            label: "What they said",
            kind: "textarea",
            max: 1000,
            wide: true,
          },
        ],
      },
    ],
    publishChecks: [
      { field: "quote", label: "Their words", done: (r) => filled(r.quote) },
      { field: "name", label: "Their name", done: (r) => filled(r.name) },
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

  blog: {
    key: "blog",
    label: "Blog",
    singular: "post",
    titleField: "title",
    slugPrefix: "/blog/",
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title", label: "Title", kind: "text", max: 160 },
          { name: "slug", label: "Web address", kind: "slug" },
          {
            name: "excerpt",
            label: "Excerpt",
            kind: "textarea",
            max: 400,
            placeholder: "One or two lines, shown in the blog list.",
            wide: true,
          },
          {
            name: "tags",
            label: "Tags",
            kind: "list",
            placeholder: "e.g. astrology",
            emptyHint: "No tags yet. Add one per row.",
            wide: true,
          },
          {
            name: "order",
            label: "Display order",
            kind: "number",
            hint: "Lower numbers come first within the same date",
          },
        ],
      },
      {
        title: "Cover image",
        description: "Shown in the list and at the top of the article.",
        fields: [
          { name: "coverImage", label: "Cover image", kind: "image", wide: true },
        ],
      },
      {
        title: "Content",
        fields: [
          {
            name: "content",
            label: "Body",
            kind: "richtext",
            max: 50000,
            placeholder: "Leave a blank line between paragraphs.",
            wide: true,
          },
        ],
      },
    ],
    publishChecks: [
      { field: "excerpt", label: "An excerpt", done: (r) => filled(r.excerpt) },
      { field: "content", label: "The post body", done: (r) => filled(r.content) },
      {
        field: "coverImage",
        label: "A cover image",
        done: (r) => filled(r.coverImage),
      },
    ],
    blank: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tags: [],
      order: 0,
      published: false,
    },
  },
};

export const collectionKeys = Object.keys(collections) as CollectionSpec["key"][];

/**
 * The zod schema the API validates each collection against. The form uses
 * the same object as its resolver, so client and server agree on both the
 * rules and the messages.
 */
export const writeSchemas = {
  courses: courseWriteSchema,
  products: productWriteSchema,
  services: serviceWriteSchema,
  testimonials: testimonialWriteSchema,
  blog: blogPostWriteSchema,
} as const;

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
