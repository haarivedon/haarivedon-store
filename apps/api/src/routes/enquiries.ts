import { contract, type EnquiryKind } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";
import { clientIp, rateLimit } from "../lib/rate-limit";

/**
 * "Ask about this" for a course or a product.
 *
 * Neither has a checkout, so this is the action both detail pages offer.
 * The enquiry is only accepted for an item that is actually published, so a
 * crafted payload cannot create a record pointing at nothing.
 */
async function findItem(kind: EnquiryKind, slug: string) {
  if (kind === "course") {
    const course = await prisma.course.findFirst({
      where: { published: true, slug },
      select: { title: true },
    });
    return course?.title ?? null;
  }

  const product = await prisma.product.findFirst({
    where: { published: true, slug },
    select: { name: true },
  });
  return product?.name ?? null;
}

export const enquiriesRouter = tsr.router(contract.enquiries, {
  create: async ({ body }, { request }) => {
    const limit = rateLimit(`enquiries:${clientIp(request.headers)}`);
    if (!limit.allowed) {
      return {
        status: 429 as const,
        body: {
          error: `Too many requests. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
        },
      };
    }

    const title = await findItem(body.kind, body.itemSlug);
    if (!title) {
      return { status: 404 as const, body: { error: "Not found." } };
    }

    const record = await prisma.enquiry.create({
      data: { ...body, itemTitle: title },
    });

    return {
      status: 201 as const,
      body: {
        id: record.id,
        message: `Thank you — we've noted your interest in ${title} and will be in touch.`,
      },
    };
  },
});
