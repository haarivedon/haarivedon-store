import { prisma } from "@repo/db";

/**
 * One-off: put a placeholder image on services that have none, so the cards
 * show real imagery for review. Admin replaces these with final art later.
 */
const images = [
  "/images/services/test-1.jpg",
  "/images/services/test-2.jpg",
  "/images/services/test-3.jpg",
  "/images/services/test-4.jpg",
];

async function main() {
  const services = await prisma.service.findMany({
    where: { image: "" },
    orderBy: { order: "asc" },
    select: { id: true, slug: true },
  });

  for (let i = 0; i < services.length; i += 1) {
    const image = images[i % images.length]!;
    await prisma.service.update({
      where: { id: services[i]!.id },
      data: { image },
    });
    console.log(`${services[i]!.slug} -> ${image}`);
  }
  console.log(`updated ${services.length} services`);
  await prisma.$disconnect();
}

void main();
