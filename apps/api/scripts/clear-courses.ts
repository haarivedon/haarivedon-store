import { prisma } from "@repo/db";

/**
 * One-off: remove the existing (seeded/demo) courses so the catalogue starts
 * clean for the Udemy-sourced courses. Authorised by the site owner.
 */
async function main() {
  const before = await prisma.course.count();
  const result = await prisma.course.deleteMany({});
  const after = await prisma.course.count();
  console.log(`courses before: ${before} | deleted: ${result.count} | remaining: ${after}`);
  await prisma.$disconnect();
}

void main();
