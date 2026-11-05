import { prisma } from "@repo/db";

/**
 * One-off: assign a category to services that have none, so the site groups
 * them. Already-categorised services are left untouched.
 */
const bySlug: Record<string, string> = {
  "life-coaching": "coaching",
  "relationship-coaching": "coaching",
  "nlp-therapy": "coaching",
  "hypnotherapy": "coaching",
  "tarot-reading": "readings",
  "prediction-analysis": "readings",
  "astrology-nadi": "readings",
  numerology: "readings",
  "reiki-grandmaster": "energy",
  "lama-fera-grandmaster": "energy",
  "angel-therapy-grandmaster": "energy",
  "past-life-regression": "energy",
  "spiritual-products": "other",
};

async function main() {
  for (const [slug, category] of Object.entries(bySlug)) {
    const result = await prisma.service.updateMany({
      where: { slug },
      data: { category },
    });
    console.log(`${slug} -> ${category} (${result.count})`);
  }
  await prisma.$disconnect();
}

void main();
