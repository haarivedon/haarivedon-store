import { prisma } from "@repo/db";

/**
 * One-off demo: mark the first services to show on the home page and give a
 * couple of them a sample badge, so the new admin controls are visible.
 * Admin tunes these per service afterwards.
 */
const badges: Record<string, string> = {
  "personal-consultation": "Bestseller",
  "tarot-reading": "New",
  "astrology-nadi": "Popular",
};

async function main() {
  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true },
  });

  for (let i = 0; i < services.length; i += 1) {
    const slug = services[i]!.slug;
    await prisma.service.update({
      where: { id: services[i]!.id },
      data: {
        showOnHome: i < 8,
        ...(badges[slug] ? { badge: badges[slug] } : {}),
      },
    });
  }
  console.log(`marked ${Math.min(8, services.length)} for home; badges on`, Object.keys(badges));
  await prisma.$disconnect();
}

void main();
