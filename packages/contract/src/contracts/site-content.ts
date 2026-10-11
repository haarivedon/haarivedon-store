import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { siteContentKeySchema } from "../schemas/site-content";

const c = initContract();

/**
 * Public read of editable page copy (CR-3). Writes are admin-only and live in
 * the admin contract; this is what the public pages render from.
 */
export const siteContentContract = c.router({
  get: {
    method: "GET",
    path: "/site-content/:key",
    pathParams: z.object({ key: siteContentKeySchema }),
    responses: {
      200: z.object({ key: siteContentKeySchema, data: z.unknown() }),
    },
    summary: "Read one page-copy key.",
  },
});
