/**
 * The 70-course catalogue from docs/PLAN.md §10.
 *
 * Structure only — title, slug, category, level and the basic/advanced
 * cross-links. Copy, price, duration, format and imagery are the client's to
 * fill in through the admin, so every row seeds unpublished.
 */

type SeedCourse = {
  title: string;
  slug: string;
  category: string;
  level: "basic" | "advanced" | "premium";
  order: number;
  relatedSlugs?: string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// [title, category, level]
const ROWS: [string, string, "basic" | "advanced" | "premium"][] = [
  // Numerology (11)
  ["Numeru Yantra", "numerology", "basic"],
  ["Vedic Numerology", "numerology", "basic"],
  ["Name Numerology Mastery", "numerology", "advanced"],
  ["Mobile Numerology", "numerology", "basic"],
  ["Business Mobile Numerology", "numerology", "advanced"],
  ["Instant Mobile Miracle Method", "numerology", "basic"],
  ["Special Mobile PIN Research", "numerology", "advanced"],
  ["Special Mobile Wallpaper Research", "numerology", "advanced"],
  ["Loshu Grid Mastery", "numerology", "basic"],
  ["Vedic Grid Mastery", "numerology", "advanced"],
  ["Pythagorean Course", "numerology", "basic"],
  // Pronology (3)
  ["Pronology", "pronology", "basic"],
  ["Medical Pronology", "pronology", "advanced"],
  ["Advanced Professional Pronology", "pronology", "advanced"],
  // Astrology (10)
  ["Astro Basics", "astrology", "basic"],
  ["Vedic Kundali", "astrology", "basic"],
  ["Child Astrology", "astrology", "advanced"],
  ["Blank Chart Prediction", "astrology", "advanced"],
  ["Nadi Astrology", "astrology", "advanced"],
  ["Lal Kitab", "astrology", "advanced"],
  ["Ramal Vigyan", "astrology", "advanced"],
  ["Marriage Research & Clothes Prediction", "astrology", "advanced"],
  ["Event & Relationship Mastery", "astrology", "advanced"],
  ["My Destiny in 2027", "astrology", "basic"],
  // Panchang (2)
  ["Panchang Course", "panchang", "basic"],
  ["Panchang Premium Workshop", "panchang", "premium"],
  // Reading & analysis (6)
  ["Vedic Samudrik Shastra", "reading", "basic"],
  ["Vedic Samudrik Shastra (Advanced)", "reading", "advanced"],
  ["Mysteries of Face Reading", "reading", "basic"],
  ["Graphology", "reading", "basic"],
  ["Astro Signature", "reading", "basic"],
  ["Signature Analysis (Advanced)", "reading", "advanced"],
  // Watch analysis (2)
  ["Wrist Watch Analysis", "watch", "basic"],
  ["Watch Analysis (Advanced)", "watch", "advanced"],
  // Logo & brand (5)
  ["Science of Logo Designing", "logo", "basic"],
  ["Logo Symbology", "logo", "basic"],
  ["Logo Silver Level", "logo", "advanced"],
  ["Advanced Logo Astrology", "logo", "advanced"],
  ["Business Card Mastery", "logo", "basic"],
  // Remedies & rituals (13)
  ["Pitra Dosh", "remedies", "basic"],
  ["Yantra Premium", "remedies", "premium"],
  ["Vedic Mantra", "remedies", "basic"],
  ["Vedic Special Rituals", "remedies", "advanced"],
  ["Spice Remedies", "remedies", "basic"],
  ["Money Magnet Ritual Course", "remedies", "advanced"],
  ["Sugar Jar & Lemon Spell Workshop", "remedies", "basic"],
  ["Crystal Exclusive Spell", "remedies", "advanced"],
  ["Knot Magical Course", "remedies", "basic"],
  ["Rudraksha Premium Course", "remedies", "premium"],
  ["Navratri Classes", "remedies", "basic"],
  ["Navratri Premium Course", "remedies", "premium"],
  ["Diwali Special Course", "remedies", "basic"],
  // Switchwords (4)
  ["Western Switchwords", "switchwords", "basic"],
  ["21 Exclusive Vedic Switchwords", "switchwords", "basic"],
  ["Advanced Vedic Switchwords", "switchwords", "advanced"],
  ["Sequence", "switchwords", "advanced"],
  // Energy healing (5)
  ["Reiki Course", "energy-healing", "basic"],
  ["Reiki Premium Course", "energy-healing", "premium"],
  ["Angels Course (Basic)", "energy-healing", "basic"],
  ["Angels Course (Advanced)", "energy-healing", "advanced"],
  ["Angel Invoking", "energy-healing", "advanced"],
  // Vastu & Fengshui (2)
  ["Smart Vastu", "vastu", "basic"],
  ["Fengshui", "vastu", "basic"],
  // Tarot (2)
  ["Tarot Course", "tarot", "basic"],
  ["Tarot Professional (Advanced)", "tarot", "advanced"],
  // Wealth (2)
  ["Wealth Mastery", "wealth", "basic"],
  ["Advanced Wealth Mastery", "wealth", "advanced"],
  // Other (3)
  ["Past Life Regression", "other", "advanced"],
  ["Swar Vigyan", "other", "advanced"],
  ["Self Love", "other", "basic"],
];

/**
 * Basic/advanced families, by slug. Each member cross-links to the others on
 * its detail page, and a link whose target is missing or unpublished is
 * dropped at render time rather than shown dead (docs/PLAN.md §13).
 */
const FAMILIES: string[][] = [
  ["vedic-samudrik-shastra", "vedic-samudrik-shastra-advanced"],
  ["wrist-watch-analysis", "watch-analysis-advanced"],
  ["angels-course-basic", "angels-course-advanced", "angel-invoking"],
  ["tarot-course", "tarot-professional-advanced"],
  ["wealth-mastery", "advanced-wealth-mastery"],
  ["panchang-course", "panchang-premium-workshop"],
  ["astro-signature", "signature-analysis-advanced"],
  ["pronology", "medical-pronology", "advanced-professional-pronology"],
  ["21-exclusive-vedic-switchwords", "advanced-vedic-switchwords", "sequence"],
  ["navratri-classes", "navratri-premium-course"],
  [
    "science-of-logo-designing",
    "logo-symbology",
    "logo-silver-level",
    "advanced-logo-astrology",
  ],
  ["loshu-grid-mastery", "vedic-grid-mastery"],
  ["mobile-numerology", "business-mobile-numerology"],
  ["reiki-course", "reiki-premium-course"],
  ["vedic-numerology", "name-numerology-mastery"],
];

const relatedFor = (slug: string) =>
  FAMILIES.find((family) => family.includes(slug))?.filter((s) => s !== slug) ??
  [];

export const seedCourses: SeedCourse[] = ROWS.map(
  ([title, category, level], index) => {
    const slug = slugify(title);
    return {
      title,
      slug,
      category,
      level,
      order: index + 1,
      relatedSlugs: relatedFor(slug),
    };
  },
);

/** Display order and labels for the category sections on /courses. */
export const courseCategories = [
  ["numerology", "Numerology"],
  ["pronology", "Pronology"],
  ["astrology", "Astrology"],
  ["panchang", "Panchang"],
  ["reading", "Reading & Analysis"],
  ["watch", "Watch Analysis"],
  ["logo", "Logo & Brand"],
  ["remedies", "Remedies & Rituals"],
  ["switchwords", "Switchwords"],
  ["energy-healing", "Energy Healing"],
  ["vastu", "Vastu & Fengshui"],
  ["tarot", "Tarot"],
  ["wealth", "Wealth"],
  ["other", "Other Practices"],
] as const;
