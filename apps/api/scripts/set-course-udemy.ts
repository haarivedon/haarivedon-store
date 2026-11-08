import { prisma } from "@repo/db";

/**
 * One-off demo: put a placeholder Udemy URL on courses that have none, so the
 * "Enroll on Udemy" button is visible. Replace these with the real course
 * links in the admin.
 */
async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true, udemyUrl: true },
  });
  let updated = 0;
  for (const c of courses) {
    if (c.udemyUrl) continue; // keep any real link already set
    const udemyUrl = `https://www.udemy.com/course/${c.slug}/`;
    await prisma.course.update({ where: { id: c.id }, data: { udemyUrl } });
    console.log(`${c.slug} -> ${udemyUrl}`);
    updated += 1;
  }
  console.log(`updated ${updated} courses`);
  await prisma.$disconnect();
}

void main();
