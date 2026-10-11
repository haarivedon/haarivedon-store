/**
 * Idempotent catalogue seed.
 *
 * Re-running this is safe after the client has started editing: rows are
 * matched on `slug`, and an update only touches the structural fields the
 * client cannot change in the admin (family, category). Copy, price, imagery
 * and the published flag are never overwritten — see docs/PLAN.md §13.
 */
import { prisma } from "../src/client";
import { seedCourses } from "./seed-courses";
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

  let createdCourses = 0;

  for (const course of seedCourses) {
    const result = await prisma.course.upsert({
      where: { slug: course.slug },
      // Structural only: category, level, cross-links and display order.
      update: {
        category: course.category,
        level: course.level,
        relatedSlugs: course.relatedSlugs ?? [],
        order: course.order,
      },
      create: {
        title: course.title,
        slug: course.slug,
        category: course.category,
        level: course.level,
        relatedSlugs: course.relatedSlugs ?? [],
        order: course.order,
        outline: [],
        published: false,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      createdCourses += 1;
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
    `Seeded ${seedProducts.length} products (${createdProducts} new), ` +
      `${seedCourses.length} courses (${createdCourses} new) and ` +
      `${seedServices.length} services.`,
  );
  console.log(
    "Courses and products seed unpublished — the client publishes each from the admin.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
