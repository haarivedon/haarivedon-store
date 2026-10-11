import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { serviceSchema } from "../schemas/service";
import { errorSchema } from "../schemas/common";

const c = initContract();

/**
 * Public, read-only. Services are short enough that /services renders the
 * whole list in one request, so there is no pagination here.
 */
export const servicesContract = c.router({
  list: {
    method: "GET",
    path: "/services",
    responses: {
      200: z.object({ data: z.array(serviceSchema) }),
    },
    summary: "List published services, in display order.",
  },
  getBySlug: {
    method: "GET",
    path: "/services/:slug",
    pathParams: z.object({ slug: z.string() }),
    responses: {
      200: serviceSchema,
      404: errorSchema,
    },
    summary: "Fetch one published service by slug.",
  },
});
