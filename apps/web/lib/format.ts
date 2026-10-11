/**
 * Money is stored as whole rupees. `null` means the client has not set a
 * price — it reads as an enquiry, never as zero (docs/PLAN.md §13).
 */
export function formatPrice(
  price: number | null,
  currency = "INR",
  { enquireLabel = "Enquire for price" } = {},
) {
  if (price === null) return enquireLabel;
  if (price === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/** "starting-price" variant used on listing cards. */
export function formatFromPrice(price: number | null, currency = "INR") {
  if (price === null) return "Enquire for price";
  if (price === 0) return "Free";
  return `From ${formatPrice(price, currency)}`;
}

const attributeLabels: Record<string, string> = {
  deity: "Deity",
  purpose: "Purpose",
  metal: "Metal",
  size: "Size",
  mineral: "Mineral",
  colour: "Colour",
  hardness: "Hardness (Mohs)",
  rulingPlanet: "Ruling planet",
  pricedPerCarat: "Priced per carat",
  certified: "Certified",
  mukhi: "Mukhi",
  benefit: "Traditionally worn for",
  origins: "Origin",
  beadSize: "Bead size",
  material: "Material",
  beadCount: "Beads",
  stone: "Stone",
  form: "Form",
  intent: "Traditionally used for",
  weight: "Weight",
  height: "Height",
};

/**
 * Flattens a product's family-specific attributes into label/value rows for
 * the spec table, dropping the discriminator and anything the client has left
 * blank so a half-filled record still renders cleanly.
 */
export function attributeRows(attributes: Record<string, unknown> | null) {
  if (!attributes) return [];

  return Object.entries(attributes)
    .filter(([key]) => key !== "family")
    .flatMap(([key, value]) => {
      const label = attributeLabels[key] ?? key;

      if (value === null || value === undefined || value === "") return [];
      if (Array.isArray(value)) {
        if (value.length === 0) return [];
        return [{ label, value: value.map(titleCase).join(" · ") }];
      }
      if (typeof value === "boolean") {
        return value ? [{ label, value: "Yes" }] : [];
      }
      return [{ label, value: String(value) }];
    });
}

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
