import { contract, parseSiteContent } from "@repo/contract";
import { prisma } from "@repo/db";
import { tsr } from "@ts-rest/serverless/fetch";

/**
 * Public page copy. Never 404s: an unsaved key returns its schema defaults so
 * a page renders the wording in code rather than an empty section (§12).
 */
export const siteContentRouter = tsr.router(contract.siteContent, {
  get: async ({ params }) => {
    const row = await prisma.siteContent.findUnique({
      where: { key: params.key },
    });

    return {
      status: 200 as const,
      body: { key: params.key, data: parseSiteContent(params.key, row?.data) },
    };
  },
});
