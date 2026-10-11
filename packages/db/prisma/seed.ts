/**
 * Idempotent catalogue seed.
 *
 * Re-running this is safe after the client has started editing: rows are
 * matched on `slug`, and an update only touches the structural fields the
 * client cannot change in the admin (family, category). Copy, price, imagery
 * and the published flag are never overwritten — see docs/PLAN.md §13.
 */
import { prisma } from "../src/client";
import { seedProducts, seedServices } from "./seed-data";

async function main() {
  let createdProducts = 0;

  for (const product of seedProducts) {
    const result = await prisma.product.upsert({
      where: { slug: product.slug },
      // Structural only. Everything else is the client's to fill in.
      update: { family: product.family, category: product.category },
      create: {
        name: product.name,
        slug: product.slug,
        family: product.family,
        category: product.category,
        attributes: product.attributes,
        images: [],
        published: false,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      createdProducts += 1;
    }
  }

  for (const service of seedServices) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: { order: service.order, icon: service.icon },
      create: { ...service, published: true },
    });
  }

  console.log(
    `Seeded ${seedProducts.length} products (${createdProducts} new) and ${seedServices.length} services.`,
  );
  console.log(
    "Products seed unpublished — the client publishes each one from the admin.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
