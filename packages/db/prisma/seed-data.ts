/**
 * Catalogue structure, from docs/PLAN.md §11.
 *
 * Structure only: name, slug, family, category and the family's attribute
 * keys. Copy, price and imagery are the client's to fill in through the admin,
 * so every row seeds unpublished and invisible.
 */

type SeedProduct = {
  name: string;
  slug: string;
  family: string;
  category: string;
  attributes: Record<string, unknown>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const yantras: SeedProduct[] = [
  ["Lakshmi Yantra", "Wealth and abundance"],
  ["Kuber Yantra", "Prosperity"],
].map(([name, purpose]) => ({
  name,
  slug: slugify(name),
  family: "yantra",
  category: "general",
  attributes: { family: "yantra", deity: "", purpose, metal: "", size: "" },
}));

// [name, mineral, colour, Mohs hardness]
const gemstoneRows: [string, string, string, string, number | null][] = [
  ["Diamond", "precious", "carbon", "colourless", 10],
  ["Ruby", "precious", "corundum", "pink to blood red", 9],
  ["Sapphire", "precious", "corundum", "blue (all but red)", 9],
  ["Emerald", "precious", "beryl", "green", 7.5],
  ["Amethyst", "semi-precious", "quartz", "purple", 7],
  ["Aquamarine", "semi-precious", "beryl", "pale blue to cyan", 7.5],
  ["Citrine", "semi-precious", "quartz", "yellow to orange", 7],
  ["Garnet", "semi-precious", "silicate", "deep red, green, orange", 7],
  ["Opal", "semi-precious", "hydrated silica", "play of colour", 5.5],
  ["Peridot", "semi-precious", "olivine", "green", 6.5],
  ["Topaz", "semi-precious", "silicate", "blue, pink, yellow, colourless", 8],
  ["Tourmaline", "semi-precious", "crystal silicate", "multi-colour", 7.5],
  ["Zircon", "semi-precious", "zirconium silicate", "colourless to brown", 7.5],
  ["Amber", "organic", "fossilised tree resin", "golden", 2.5],
  ["Pearl", "organic", "nacre", "white to cream", 2.5],
  ["Coral", "organic", "marine skeleton", "red to pink", 3.5],
  ["Jade", "organic", "nephrite / jadeite", "green", 6.5],
  ["Lapis Lazuli", "organic", "rock", "deep blue", 5.5],
  ["Turquoise", "organic", "hydrous phosphate", "blue to green", 5.5],
];

const gemstones: SeedProduct[] = gemstoneRows.map(
  ([name, category, mineral, colour, hardness]) => ({
    name,
    slug: slugify(name),
    family: "gemstone",
    category,
    attributes: {
      family: "gemstone",
      mineral,
      colour,
      hardness,
      rulingPlanet: "",
      pricedPerCarat: category === "precious",
      certified: false,
    },
  }),
);

// [mukhi, deity, ruling planet, traditional benefit]
const mukhiRows: [number, string, string, string][] = [
  [1, "Shiva", "Sun", "supreme awareness and liberation"],
  [2, "Ardhanarishvara", "Moon", "emotional harmony and relationships"],
  [3, "Agni Dev", "Mars", "self-confidence, releasing past karma"],
  [4, "Brahma", "Mercury / Jupiter", "creativity, learning and focus"],
  [5, "Kalagni Rudra", "Jupiter", "inner peace and general well-being"],
  [6, "Kartikeya", "Mars / Venus", "willpower and grounding"],
  [7, "Mahalakshmi", "Venus / Saturn", "abundance and wealth attraction"],
  [8, "Ganesha", "Ketu / Rahu", "removing obstacles"],
  [9, "Durga", "Rahu / Ketu", "courage and fearlessness"],
  [10, "Vishnu", "all planets", "protection from negative energies"],
  [11, "Hanuman", "—", "concentration, discipline and strength"],
  [12, "Surya Dev", "Sun", "leadership and personal radiance"],
  [13, "Indra and Kamadeva", "Venus", "charisma and magnetism"],
  [14, "Shiva and Hanuman", "Saturn", "intuition and mental clarity"],
  [15, "Pashupatinath", "—", "specialised spiritual goals"],
  [16, "Mahamrityunjaya", "—", "specialised spiritual goals"],
  [17, "Vishwakarma", "—", "specialised material goals"],
  [18, "Bhumi Devi", "—", "specialised material goals"],
  [19, "Narayan", "—", "specialised material goals"],
  [20, "Brahma", "—", "specialised spiritual goals"],
  [21, "Kubera", "—", "specialised leadership and wealth goals"],
];

const rudrakshaMukhi: SeedProduct[] = mukhiRows.map(
  ([mukhi, deity, rulingPlanet, benefit]) => ({
    name: `${mukhi} Mukhi Rudraksha`,
    slug: `${mukhi}-mukhi-rudraksha`,
    family: "rudraksha",
    category: "mukhi",
    attributes: {
      family: "rudraksha",
      mukhi,
      deity,
      rulingPlanet,
      benefit,
      origins: ["nepali", "indonesian"],
      beadSize: "",
      certified: false,
    },
  }),
);

const rudrakshaConjoined: SeedProduct[] = [
  ["Gauri Shankar Rudraksha", "Shiva and Parvati", "family harmony"],
  ["Ganesh Rudraksha", "Ganesha", "removing obstacles"],
  ["Savar Rudraksha", "—", "paired blessings"],
  ["Trijuti Rudraksha", "Brahma, Vishnu, Mahesh", "the Tridev together"],
].map(([name, deity, benefit]) => ({
  name,
  slug: slugify(name),
  family: "rudraksha",
  category: "conjoined",
  attributes: {
    family: "rudraksha",
    mukhi: null,
    deity,
    rulingPlanet: "",
    benefit,
    origins: ["nepali"],
    beadSize: "",
    certified: false,
  },
}));

const malas: SeedProduct[] = [
  ["Haldi Mala", "turmeric root"],
  ["Kamal Gatte Ki Mala", "lotus seed"],
  ["Vaijyanti Mala", "vaijyanti seed"],
  ["Tulsi Mala", "tulsi wood"],
  ["Chandan Mala", "sandalwood"],
  ["Red Gunja Mala", "red gunja seed"],
  ["White Gunja Mala", "white gunja seed"],
  ["Black Gunja Mala", "black gunja seed"],
  ["Crystal Mala", "crystal"],
].map(([name, material]) => ({
  name,
  slug: slugify(name),
  family: "mala",
  category: "general",
  attributes: { family: "mala", material, beadCount: 108, size: "" },
}));

const crystals: SeedProduct[] = [
  ["Crystal Tree", "mixed", "tree"],
  ["Pyrite", "pyrite", "raw"],
  ["Rose Quartz", "rose quartz", "tumbled"],
  ["Amethyst Crystal", "amethyst", "cluster"],
  ["Mixed Crystal Set", "mixed", "set"],
].map(([name, stone, form]) => ({
  name,
  slug: slugify(name),
  family: "crystal",
  category: "general",
  attributes: { family: "crystal", stone, form, intent: "", weight: "" },
}));

const idols: SeedProduct[] = [
  {
    name: "Brass Idol",
    slug: "brass-idol",
    family: "idol",
    category: "general",
    attributes: {
      family: "idol",
      deity: "",
      metal: "brass",
      height: "",
      weight: "",
    },
  },
];

export const seedProducts: SeedProduct[] = [
  ...yantras,
  ...gemstones,
  ...rudrakshaMukhi,
  ...rudrakshaConjoined,
  ...malas,
  ...crystals,
  ...idols,
];

/**
 * Services carry the copy that is already live on the home page, so these
 * seed published — unlike products, nothing here is a blank row.
 */
export const seedServices = [
  {
    title: "Personal Consultation",
    slug: "personal-consultation",
    icon: "MessageCircleHeart",
    summary:
      "Bring your questions and explore clear, personalized guidance for the decisions ahead.",
    order: 1,
  },
  {
    title: "Prediction & Reading",
    slug: "prediction-reading",
    icon: "Sparkles",
    summary:
      "A dedicated reading based on your details, offering insight into what lies ahead.",
    order: 2,
  },
  {
    title: "Guidance Sessions",
    slug: "guidance-sessions",
    icon: "Compass",
    summary:
      "Focused support for specific areas of life — relationships, career, and beyond.",
    order: 3,
  },
  {
    title: "Spiritual Products",
    slug: "spiritual-products",
    icon: "Flower2",
    summary:
      "Curated sacred objects chosen to support and steady your everyday practice.",
    order: 4,
  },
];
