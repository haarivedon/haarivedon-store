/**
 * Featured home-page content (store CR).
 *
 * The landing page used to render a hardcoded product array; now those cards
 * read from the database. This seeds the same items — published, featured, with
 * images — so the home strip has real, buyable products, and promotes a few
 * courses to featured so the courses strip fills too.
 *
 * Idempotent: products upsert on slug; courses are matched and only their
 * display fields touched. Safe to re-run. Run with `pnpm db:seed:featured`.
 */
import { prisma } from "../src/client";

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

const featuredProducts = [
  {
    slug: "rudraksha-bracelet",
    name: "Rudraksha Bracelet",
    family: "mala",
    category: "bracelet",
    price: 1499,
    summary: "Hand-knotted rudraksha beads, worn for calm and focus.",
    image: UNSPLASH("photo-1611591437281-460bfbe1220a"),
  },
  {
    slug: "shree-yantra",
    name: "Shree Yantra",
    family: "yantra",
    category: "yantra",
    price: 2499,
    summary: "Brass Shree Yantra for the home or workplace altar.",
    image: UNSPLASH("photo-1604608672516-f1b9b1d37076"),
  },
  {
    slug: "herbal-healing-tea",
    name: "Herbal Healing Tea",
    family: "crystal",
    category: "wellness",
    price: 789,
    summary: "A calming blend of herbs for everyday balance.",
    image: UNSPLASH("photo-1597481499750-3e6b22637e12"),
  },
  {
    slug: "aroma-incense-set",
    name: "Aroma Incense Set",
    family: "crystal",
    category: "wellness",
    price: 999,
    summary: "Incense and diffuser oils to cleanse and settle a space.",
    image: UNSPLASH("photo-1602928321679-560bb453f190"),
  },
];

/**
 * The course images already committed under apps/web/public/images/courses,
 * matched to a relevant course so the home strip uses the real local artwork
 * rather than a placeholder.
 */
const featuredCourses: { where: object; image: string }[] = [
  { where: { category: "astrology" }, image: "/images/courses/vedic-astrology.jpg" },
  { where: { slug: { contains: "reiki" } }, image: "/images/courses/reiki.jpg" },
  { where: { category: "numerology" }, image: "/images/courses/numerology-vastu.jpg" },
];

async function main() {
  // Only the home-strip products should be featured, so the four slots are
  // predictable rather than sharing space with anything flagged earlier.
  await prisma.product.updateMany({
    where: { slug: { notIn: featuredProducts.map((p) => p.slug) } },
    data: { featured: false },
  });

  for (const p of featuredProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        published: true,
        featured: true,
        inStock: true,
        price: p.price,
        images: [p.image],
        summary: p.summary,
        family: p.family,
        category: p.category,
      },
      create: {
        name: p.name,
        slug: p.slug,
        family: p.family,
        category: p.category,
        summary: p.summary,
        description: p.summary,
        price: p.price,
        currency: "INR",
        images: [p.image],
        inStock: true,
        featured: true,
        published: true,
      },
    });
  }

  // Keep the featured set predictable, then promote one course per committed
  // image so the home strip fills with the real local course artwork.
  await prisma.course.updateMany({
    where: { featured: true },
    data: { featured: false },
  });

  let promoted = 0;
  for (const fc of featuredCourses) {
    const course = await prisma.course.findFirst({
      where: fc.where,
      orderBy: { order: "asc" },
    });
    if (!course) continue;
    await prisma.course.update({
      where: { id: course.id },
      data: {
        published: true,
        featured: true,
        image: fc.image,
        summary:
          course.summary ||
          "A guided course to learn the practice at your own pace.",
        price: course.price ?? 4999,
      },
    });
    promoted += 1;
  }

  console.log(
    `Featured: ${featuredProducts.length} products published, ${promoted} courses promoted.`,
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
