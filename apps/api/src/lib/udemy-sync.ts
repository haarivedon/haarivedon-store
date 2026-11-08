import { prisma } from "@repo/db";
import { env } from "../env";
import { logger } from "./logger";
import { searchUdemyCourses, udemyConfigured, type UdemyCourse } from "./udemy";

export type UdemySyncResult = {
  configured: boolean;
  found: number;
  imported: number;
  skipped: number;
  error?: string;
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "course"
  );
}

/**
 * Import courses from Udemy. New courses land as **drafts** so the admin picks
 * which to publish; a course that already exists (matched on `udemyId`) is left
 * untouched, so manual edits are never clobbered. Re-running only brings in
 * courses that are new to the catalogue.
 */
export async function syncUdemyCourses(): Promise<UdemySyncResult> {
  if (!udemyConfigured()) {
    return { configured: false, found: 0, imported: 0, skipped: 0 };
  }

  const query = env.UDEMY_SEARCH.trim();
  if (!query) {
    return {
      configured: true,
      found: 0,
      imported: 0,
      skipped: 0,
      error: "Set UDEMY_SEARCH to the instructor/brand name to import.",
    };
  }

  let found: UdemyCourse[];
  try {
    found = await searchUdemyCourses(query, 100);
  } catch (error) {
    return {
      configured: true,
      found: 0,
      imported: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let imported = 0;
  let skipped = 0;

  for (const course of found) {
    const existing = await prisma.course.findFirst({
      where: { udemyId: course.udemyId },
      select: { id: true },
    });
    if (existing) {
      skipped += 1; // never overwrite an existing (admin-owned) course
      continue;
    }

    let slug = slugify(course.title);
    const clash = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (clash) slug = `${slug}-${course.udemyId}`;

    await prisma.course.create({
      data: {
        title: course.title.slice(0, 140) || "Untitled course",
        slug,
        category: "numerology", // sensible default — admin re-categorises
        level: "basic",
        format: "recorded",
        summary: course.headline.slice(0, 400),
        price: course.price,
        currency: course.currency,
        image: course.image,
        udemyUrl: course.url,
        udemyId: course.udemyId,
        source: "udemy",
        published: false, // draft — admin chooses what to show
      },
    });
    imported += 1;
  }

  logger.info("udemy sync", { found: found.length, imported, skipped });
  return { configured: true, found: found.length, imported, skipped };
}
